import "server-only";

import { and, eq } from "drizzle-orm";
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
