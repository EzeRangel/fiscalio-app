import "server-only";

import { and, eq } from "drizzle-orm";
import { getDB, invoices, paymentAllocations, payments } from "@/db";
import { CFDIComprobante as ParsedCFDI } from "@/types/cfdi-schemas";
import { logAction } from "@/lib/audit-service";

export async function savePaymentComplement(
  tx: any,
  parsedCFDI: ParsedCFDI,
  organizationId: number,
  partnerId: number,
  paymentType: "income" | "expense"
) {
  const pagosComplement = parsedCFDI.Complemento.find((c) => c.Pagos);
  const pagosNode = pagosComplement?.Pagos;
  if (!pagosNode) return;

  const timbreComplement = parsedCFDI.Complemento.find(
    (c) => c.TimbreFiscalDigital
  );

  const cfdiPaymentUuid = timbreComplement?.TimbreFiscalDigital?.UUID;

  if (!cfdiPaymentUuid) {
    return;
  }

  const pagos = Array.isArray(pagosNode.Pago)
    ? pagosNode.Pago
    : [pagosNode.Pago];

  for (const pago of pagos) {
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

    const docs = Array.isArray(pago.DoctoRelacionado)
      ? pago.DoctoRelacionado
      : [pago.DoctoRelacionado];

    for (const doc of docs) {
      // Find the original invoice being paid
      const linkedInvoice = await tx.query.invoices.findFirst({
        where: and(
          eq(invoices.folioFiscal, doc.IdDocumento),
          eq(invoices.organizationId, organizationId)
        ),
      });

      if (linkedInvoice) {
        await tx.insert(paymentAllocations).values({
          paymentId: newPayment.id,
          invoiceId: linkedInvoice.id,
          amountAllocated: doc.ImpPagado,
          exchangeRate: doc.EquivalenciaDR || "1.0",
          installmentNumber: parseInt(doc.NumParcialidad),
        });

        // Update the linked invoice status and amount paid
        const currentPaid = parseFloat(linkedInvoice.amountPaid || "0");
        const newlyPaid = parseFloat(doc.ImpPagado);
        const totalAmount = parseFloat(linkedInvoice.total);
        const totalPaid = currentPaid + newlyPaid;

        let status = "partial";
        if (totalPaid >= totalAmount - 0.01) {
          status = "paid";
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
