import "server-only";

import { and, eq, notInArray } from "drizzle-orm";
import { getDB, invoices, paymentAllocations, payments } from "@/db";
import { CFDIComprobante as ParsedCFDI } from "@/types/cfdi-schemas";
import { logAction } from "@/lib/audit-service";
import {
  validatePayment,
  validateAllocation,
  validateInvoice,
  FiscalPayment,
  FiscalAllocationContext,
  FiscalInvoice,
} from "@/lib/fiscal-validation";

import { InvoiceTypes } from "@/types/utils";
import { CFDIParser } from "@/lib/cfdi-parser";

export async function savePaymentComplement(
  tx: any,
  parsedCFDI: ParsedCFDI,
  organizationId: number,
  partnerId: number,
  paymentType: InvoiceTypes,
) {
  const pagosComplement = parsedCFDI.Complemento.find((c) => c.Pagos);
  const pagosNode = pagosComplement?.Pagos;
  if (!pagosNode) return;

  const timbreComplement = parsedCFDI.Complemento.find(
    (c) => c.TimbreFiscalDigital,
  );

  const cfdiPaymentUuid = timbreComplement?.TimbreFiscalDigital?.UUID;

  if (!cfdiPaymentUuid) {
    return;
  }

  const pagos = Array.isArray(pagosNode.Pago)
    ? pagosNode.Pago
    : [pagosNode.Pago];

  for (const pago of pagos) {
    const fiscalPaymentToCheck: FiscalPayment = {
      id: 0,
      amount: pago.Monto,
      paymentDate: new Date(pago.FechaPago),
      allocations: [],
    };
    const paymentValidation = validatePayment(fiscalPaymentToCheck);
    if (!paymentValidation.isValid) {
      throw new Error(
        `Error validando pago: ${paymentValidation.errors[0].message}`,
      );
    }

    const [newPayment] = await tx
      .insert(payments)
      .values({
        organizationId,
        partnerId,
        paymentType,
        paymentDate: new Date(pago.FechaPago),
        paymentMethod: pago.FormaDePagoP,
        currency: pago.MonedaP,
        exchangeRate: pago.TipoCambioP || "1.0",
        amount: pago.Monto,
        cfdiPaymentId: cfdiPaymentUuid,
      })
      .returning();

    await logAction({
      organizationId,
      entityType: "payment",
      entityId: newPayment.id,
      action: "created",
      metadata: {
        source: "import",
        reason: "Payment Complement Import",
        cfdiUuid: cfdiPaymentUuid,
      },
      tx,
    });

    let currentPaymentAllocatedSum = 0;
    const docs = Array.isArray(pago.DoctoRelacionado)
      ? pago.DoctoRelacionado
      : pago.DoctoRelacionado
        ? [pago.DoctoRelacionado]
        : [];

    for (const doc of docs) {
      // Find the original invoice being paid
      const linkedInvoice = await tx.query.invoices.findFirst({
        where: and(
          eq(invoices.folioFiscal, doc.IdDocumento),
          eq(invoices.organizationId, organizationId),
        ),
      });

      if (linkedInvoice) {
        // Validation
        const allocationContext: FiscalAllocationContext = {
          allocation: {
            amount: doc.ImpPagado,
            invoiceId: linkedInvoice.id,
            paymentId: newPayment.id,
          },
          invoice: {
            id: linkedInvoice.id,
            total: linkedInvoice.total,
            subtotal: linkedInvoice.subtotal,
            amountPaid: linkedInvoice.amountPaid || "0",
            paymentStatus: linkedInvoice.paymentStatus || "pending",
            status: linkedInvoice.status || "active",
          },
          payment: { ...fiscalPaymentToCheck, id: newPayment.id },
          existingAllocationsForInvoice: [
            { amount: linkedInvoice.amountPaid || "0" },
          ],
          existingAllocationsForPayment: [
            { amount: currentPaymentAllocatedSum },
          ],
        };

        const allocValidation = validateAllocation(allocationContext);
        if (!allocValidation.isValid) {
          throw new Error(
            `Error validando asignación: ${allocValidation.errors[0].message}`,
          );
        }

        await tx.insert(paymentAllocations).values({
          paymentId: newPayment.id,
          invoiceId: linkedInvoice.id,
          amountAllocated: doc.ImpPagado,
          exchangeRate: doc.EquivalenciaDR || "1.0",
          installmentNumber: parseInt(doc.NumParcialidad),
        });

        currentPaymentAllocatedSum += parseFloat(doc.ImpPagado);

        // Update the linked invoice status and amount paid
        const currentPaid = parseFloat(linkedInvoice.amountPaid || "0");
        const newlyPaid = parseFloat(doc.ImpPagado);
        const totalAmount = parseFloat(linkedInvoice.total);
        const totalPaid = currentPaid + newlyPaid;

        let status = "partial";
        if (totalPaid >= totalAmount - 0.01) {
          status = "paid";
        }

        const updatedInvoiceState: FiscalInvoice = {
          id: linkedInvoice.id,
          total: linkedInvoice.total,
          subtotal: linkedInvoice.subtotal,
          amountPaid: totalPaid,
          paymentStatus: status,
          status: linkedInvoice.status || "active",
          cfdiType: linkedInvoice.cfdiType,
          allocations: [],
        };

        const invValidation = validateInvoice(updatedInvoiceState);
        if (!invValidation.isValid) {
          throw new Error(
            `Error validando factura actualizada: ${invValidation.errors[0].message}`,
          );
        }

        await tx
          .update(invoices)
          .set({
            amountPaid: totalPaid.toString(),
            paymentStatus: status,
            updatedAt: new Date(),
          })
          .where(eq(invoices.id, linkedInvoice.id));
      }
    }
  }
}

export async function getPaymentsByFolio(folio: string) {
  const { db } = await getDB();
  const relatedPayments = await db.query.payments.findMany({
    where: eq(payments.cfdiPaymentId, folio),
    with: {
      allocations: {
        with: {
          invoice: true,
        },
      },
    },
  });

  return relatedPayments;
}

export async function savePUEPayment(
  tx: any,
  amount: string,
  currency: string,
  exchangeRate: string,
  paymentDate: Date,
  paymentMethod: string,
  organizationId: number,
  partnerId: number,
  invoiceId: number,
  paymentType: InvoiceTypes,
) {
  const allocationToCreate = {
    amount,
    invoiceId,
    paymentId: 0,
  };

  const fiscalPaymentToCheck: FiscalPayment = {
    id: 0,
    amount,
    paymentDate,
    allocations: [allocationToCreate],
  };

  const paymentValidation = validatePayment(fiscalPaymentToCheck);
  if (!paymentValidation.isValid) {
    throw new Error(
      `Error validando pago PUE: ${paymentValidation.errors[0].message}`,
    );
  }

  // We also need the invoice context for validateAllocation
  // Since savePUEPayment is called from saveNewInvoice, we assume the invoice
  // was just created with 0 amountPaid and is active.
  const linkedInvoice = await tx.query.invoices.findFirst({
    where: eq(invoices.id, invoiceId),
  });

  if (!linkedInvoice) {
    throw new Error("Factura no encontrada para asignar pago PUE.");
  }

  const allocationContext: FiscalAllocationContext = {
    allocation: allocationToCreate,
    invoice: {
      id: linkedInvoice.id,
      total: linkedInvoice.total,
      subtotal: linkedInvoice.subtotal,
      amountPaid: linkedInvoice.amountPaid || "0",
      paymentStatus: linkedInvoice.paymentStatus || "pending",
      status: linkedInvoice.status || "active",
    },
    payment: fiscalPaymentToCheck,
    existingAllocationsForInvoice: [], // New invoice
    existingAllocationsForPayment: [], // New payment
  };

  const allocValidation = validateAllocation(allocationContext);
  if (!allocValidation.isValid) {
    throw new Error(
      `Error validando asignación PUE: ${allocValidation.errors[0].message}`,
    );
  }

  const [payment] = await tx
    .insert(payments)
    .values({
      organizationId,
      partnerId,
      paymentType,
      paymentDate,
      paymentMethod,
      currency,
      exchangeRate,
      amount,
      notes: "Autogenerado por el sistema. PUE.",
    })
    .returning();

  await logAction({
    organizationId,
    entityType: "payment",
    entityId: payment.id,
    action: "created",
    metadata: {
      source: "import",
      reason: "Pago autogenerado por sistema. PUE.",
    },
    tx,
  });

  await tx.insert(paymentAllocations).values({
    paymentId: payment.id,
    invoiceId,
    amountAllocated: amount,
    installmentNumber: 1,
    exchangeRate: exchangeRate,
  });

  return payment;
}

export async function processPendingAllocations(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx: any,
  paymentId: number,
  organizationId: number,
) {
  const paymentRecord = await tx.query.payments.findFirst({
    where: and(
      eq(payments.id, paymentId),
      eq(payments.organizationId, organizationId),
    ),
  });

  if (!paymentRecord) {
    throw new Error("Pago no encontrado.");
  }

  const paymentInvoice = await tx.query.invoices.findFirst({
    where: and(
      eq(invoices.folioFiscal, paymentRecord.cfdiPaymentId),
      eq(invoices.organizationId, organizationId),
    ),
  });

  if (!paymentInvoice || !paymentInvoice.xmlContent) {
    throw new Error("XML del complemento de pago no encontrado.");
  }

  const rawXml = Buffer.from(paymentInvoice.xmlContent, "base64").toString(
    "utf-8",
  );
  const parsedCFDI = await CFDIParser.parse(rawXml);

  const pagosComplement = parsedCFDI.Complemento.find((c) => c.Pagos);
  const pagosNode = pagosComplement?.Pagos;
  if (!pagosNode) return;

  const pagos = Array.isArray(pagosNode.Pago)
    ? pagosNode.Pago
    : [pagosNode.Pago];

  // Find the XML Pago block that matches this paymentRecord by date and amount
  const matchingPago = pagos.find((p) => {
    const xmlPayDate = new Date(p.FechaPago).getTime();
    const dbPayDate = new Date(paymentRecord.paymentDate).getTime();
    return (
      xmlPayDate === dbPayDate &&
      parseFloat(p.Monto) === parseFloat(paymentRecord.amount)
    );
  });

  if (!matchingPago) {
    throw new Error(
      "No se encontró el nodo de pago correspondiente en el XML.",
    );
  }

  const docs = Array.isArray(matchingPago.DoctoRelacionado)
    ? matchingPago.DoctoRelacionado
    : matchingPago.DoctoRelacionado
      ? [matchingPago.DoctoRelacionado]
      : [];

  for (const doc of docs) {
    // Find the original invoice being paid
    const linkedInvoice = await tx.query.invoices.findFirst({
      where: and(
        eq(invoices.folioFiscal, doc.IdDocumento),
        eq(invoices.organizationId, organizationId),
      ),
    });

    if (linkedInvoice) {
      // Check if allocation already exists
      const existingAlloc = await tx.query.paymentAllocations.findFirst({
        where: and(
          eq(paymentAllocations.paymentId, paymentRecord.id),
          eq(paymentAllocations.invoiceId, linkedInvoice.id),
        ),
      });

      if (existingAlloc) {
        continue;
      }

      // Query existing allocations for validation sums
      const existingPaymentAllocs = await tx.query.paymentAllocations.findMany({
        where: eq(paymentAllocations.paymentId, paymentRecord.id),
      });
      const paymentAllocatedSum = existingPaymentAllocs.reduce(
        (sum: number, a: { amountAllocated: string }) =>
          sum + parseFloat(a.amountAllocated),
        0,
      );

      // Validation context
      const fiscalPaymentToCheck: FiscalPayment = {
        id: paymentRecord.id,
        amount: paymentRecord.amount,
        paymentDate: paymentRecord.paymentDate,
        allocations: [],
      };

      const allocationContext: FiscalAllocationContext = {
        allocation: {
          amount: doc.ImpPagado,
          invoiceId: linkedInvoice.id,
          paymentId: paymentRecord.id,
        },
        invoice: {
          id: linkedInvoice.id,
          total: linkedInvoice.total,
          subtotal: linkedInvoice.subtotal,
          amountPaid: linkedInvoice.amountPaid || "0",
          paymentStatus: linkedInvoice.paymentStatus || "pending",
          status: linkedInvoice.status || "active",
          invoiceDate: linkedInvoice.invoiceDate,
        },
        payment: fiscalPaymentToCheck,
        existingAllocationsForInvoice: [
          { amount: linkedInvoice.amountPaid || "0" },
        ],
        existingAllocationsForPayment: [{ amount: paymentAllocatedSum }],
      };

      const allocValidation = validateAllocation(allocationContext);
      if (!allocValidation.isValid) {
        throw new Error(
          `Error validando asignación: ${allocValidation.errors[0].message}`,
        );
      }

      await tx.insert(paymentAllocations).values({
        paymentId: paymentRecord.id,
        invoiceId: linkedInvoice.id,
        amountAllocated: doc.ImpPagado,
        exchangeRate: doc.EquivalenciaDR || "1.0",
        installmentNumber: parseInt(doc.NumParcialidad),
      });

      // Update target invoice status
      const currentPaid = parseFloat(linkedInvoice.amountPaid || "0");
      const newlyPaid = parseFloat(doc.ImpPagado);
      const totalAmount = parseFloat(linkedInvoice.total);
      const totalPaid = currentPaid + newlyPaid;

      let status = "partial";
      if (totalPaid >= totalAmount - 0.01) {
        status = "paid";
      }

      const updatedInvoiceState: FiscalInvoice = {
        id: linkedInvoice.id,
        total: linkedInvoice.total,
        subtotal: linkedInvoice.subtotal,
        amountPaid: totalPaid,
        paymentStatus: status,
        status: linkedInvoice.status || "active",
        cfdiType: linkedInvoice.cfdiType,
        allocations: [],
      };

      const invValidation = validateInvoice(updatedInvoiceState);
      if (!invValidation.isValid) {
        throw new Error(
          `Error validando factura actualizada: ${invValidation.errors[0].message}`,
        );
      }

      await tx
        .update(invoices)
        .set({
          amountPaid: totalPaid.toString(),
          paymentStatus: status,
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, linkedInvoice.id));
    }
  }
}

export async function getUnlinkedPaymentComplements(invoiceId: number) {
  const { db } = await getDB();

  const currentInvoice = await db.query.invoices.findFirst({
    where: eq(invoices.id, invoiceId),
  });

  if (
    !currentInvoice ||
    !currentInvoice.folioFiscal ||
    !currentInvoice.partnerId
  ) {
    return [];
  }

  // Find active payment complements for the same partner and organization
  const paymentInvoices = await db.query.invoices.findMany({
    where: and(
      eq(invoices.organizationId, currentInvoice.organizationId),
      eq(invoices.partnerId, currentInvoice.partnerId),
      eq(invoices.cfdiType, "P"),
      notInArray(invoices.status, ["cancelled", "substituted"]),
    ),
    with: {
      businessPartner: true,
    },
  });

  const results: {
    paymentId: number | null;
    paymentInvoiceId: number;
    partnerName: string;
    paymentDate: Date;
    amount: string;
    uuid: string;
    targetUuid: string;
    amountAllocated: string;
    resolvedDocsCount: number;
    totalDocsCount: number;
  }[] = [];

  for (const paymentInvoice of paymentInvoices) {
    if (!paymentInvoice.xmlContent || !paymentInvoice.folioFiscal) {
      continue;
    }

    let parsedCFDI;
    try {
      const rawXml = Buffer.from(paymentInvoice.xmlContent, "base64").toString(
        "utf-8",
      );
      parsedCFDI = await CFDIParser.parse(rawXml);
    } catch {
      // If parsing fails for one, skip it
      continue;
    }

    const pagosComplement = parsedCFDI.Complemento.find((c) => c.Pagos);
    const pagosNode = pagosComplement?.Pagos;
    if (!pagosNode) continue;

    const pagos = Array.isArray(pagosNode.Pago)
      ? pagosNode.Pago
      : [pagosNode.Pago];

    const relatedPayments = await db.query.payments.findMany({
      where: eq(payments.cfdiPaymentId, paymentInvoice.folioFiscal),
    });

    if (relatedPayments.length === 0) {
      // No payments exist yet — derive data from XML directly
      for (const pago of pagos) {
        const docs = Array.isArray(pago.DoctoRelacionado)
          ? pago.DoctoRelacionado
          : pago.DoctoRelacionado
            ? [pago.DoctoRelacionado]
            : [];

        const targetDoc = docs.find(
          (doc) => doc.IdDocumento === currentInvoice.folioFiscal,
        );
        if (!targetDoc) continue;

        // No payments exist, so no allocations can be resolved yet
        const totalDocsCount = docs.length;
        const resolvedDocsCount = 0;

        results.push({
          paymentId: null,
          paymentInvoiceId: paymentInvoice.id,
          partnerName:
            paymentInvoice.businessPartner?.legalName ||
            paymentInvoice.businessPartner?.rfc ||
            "",
          paymentDate: new Date(pago.FechaPago),
          amount: pago.Monto,
          uuid: paymentInvoice.folioFiscal,
          targetUuid: targetDoc.IdDocumento,
          amountAllocated: targetDoc.ImpPagado,
          resolvedDocsCount,
          totalDocsCount,
        });
      }
    } else {
      for (const payment of relatedPayments) {
        // Find the corresponding Pago block in the XML
        const matchingPago = pagos.find((p) => {
          const xmlPayDate = new Date(p.FechaPago).getTime();
          const dbPayDate = new Date(payment.paymentDate).getTime();
          return (
            xmlPayDate === dbPayDate &&
            parseFloat(p.Monto) === parseFloat(payment.amount)
          );
        });

        if (!matchingPago) continue;

        const docs = Array.isArray(matchingPago.DoctoRelacionado)
          ? matchingPago.DoctoRelacionado
          : matchingPago.DoctoRelacionado
            ? [matchingPago.DoctoRelacionado]
            : [];

        // Check if any DoctoRelacionado references currentInvoice.folioFiscal
        const targetDoc = docs.find(
          (doc) => doc.IdDocumento === currentInvoice.folioFiscal,
        );

        if (targetDoc) {
          // Check if allocation already exists in DB
          const existingAlloc = await db.query.paymentAllocations.findFirst({
            where: and(
              eq(paymentAllocations.paymentId, payment.id),
              eq(paymentAllocations.invoiceId, currentInvoice.id),
            ),
          });

          if (!existingAlloc) {
            // Count resolved and total docs
            let resolvedDocsCount = 0;
            const totalDocsCount = docs.length;

            for (const doc of docs) {
              const linkedInv = await db.query.invoices.findFirst({
                where: and(
                  eq(invoices.folioFiscal, doc.IdDocumento),
                  eq(invoices.organizationId, currentInvoice.organizationId),
                ),
              });
              if (linkedInv) {
                const alloc = await db.query.paymentAllocations.findFirst({
                  where: and(
                    eq(paymentAllocations.paymentId, payment.id),
                    eq(paymentAllocations.invoiceId, linkedInv.id),
                  ),
                });
                if (alloc) {
                  resolvedDocsCount++;
                }
              }
            }

            results.push({
              paymentId: payment.id,
              paymentInvoiceId: paymentInvoice.id,
              partnerName:
                paymentInvoice.businessPartner?.legalName ||
                paymentInvoice.businessPartner?.rfc ||
                "",
              paymentDate: payment.paymentDate,
              amount: payment.amount,
              uuid: paymentInvoice.folioFiscal,
              targetUuid: targetDoc.IdDocumento,
              amountAllocated: targetDoc.ImpPagado,
              resolvedDocsCount,
              totalDocsCount,
            });
          }
        }
      }
    }
  }

  return results;
}
