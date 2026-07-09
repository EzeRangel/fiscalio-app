"use server";

import { getDB } from "@/db";
import { invoices, payments, taxAdjustments, paymentAllocations } from "@/db/schema";
import { actionClient } from "@/lib/safe-action";
import { logAction } from "@/lib/audit-service";
import { getActiveOrganizationId } from "@/lib/session";
import { cancellationRequestSchema, registerRefundSchema } from "@/types/cancellation";
import { validateCancellation } from "@/lib/fiscal-validation/cancellation-rules";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export const cancelInvoiceAction = actionClient
  .inputSchema(cancellationRequestSchema)
  .action(async ({ parsedInput: { invoiceId, reasonCode, cancellationReason, substituteInvoiceUuid } }) => {
    const { db } = await getDB();
    const organizationId = await getActiveOrganizationId();

    // 1. Fetch the invoice to cancel
    const invoice = await db.query.invoices.findFirst({
      where: and(
        eq(invoices.id, invoiceId),
        eq(invoices.organizationId, organizationId)
      ),
      with: {
        refundPayments: true,
        allocations: true,
      },
    });

    if (!invoice) {
      throw new Error("Factura no encontrada");
    }

    // 2. Validate cancellation request
    const refunds = invoice.refundPayments || [];
    const validation = validateCancellation(
      invoice as any,
      { reasonCode, substituteInvoiceUuid },
      refunds as any[]
    );

    if (!validation.isValid) {
      throw new Error(validation.errors.map((e) => e.message).join(", "));
    }

    // 3. If motive 01, look up substitute invoice
    let substituteInvoiceId: number | null = null;
    if (reasonCode === "01" && substituteInvoiceUuid) {
      const substitute = await db.query.invoices.findFirst({
        where: and(
          eq(invoices.folioFiscal, substituteInvoiceUuid),
          eq(invoices.organizationId, organizationId)
        ),
      });

      if (!substitute) {
        throw new Error("Factura sustituta no encontrada en la base de datos");
      }

      substituteInvoiceId = substitute.id;
    }

    // 4. Run database updates inside transaction
    return await db.transaction(async (tx) => {
      const reasonText = `${reasonCode} - ${cancellationReason}`;

      const updated = await tx
        .update(invoices)
        .set({
          status: "cancelled",
          cancellationReason: reasonText,
          cancellationDate: new Date(),
          substituteInvoiceId,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(invoices.id, invoiceId),
            eq(invoices.organizationId, organizationId)
          )
        )
        .returning();

      // If substitute is specified, migrate allocations
      if (substituteInvoiceId) {
        await tx
          .update(paymentAllocations)
          .set({ invoiceId: substituteInvoiceId })
          .where(eq(paymentAllocations.invoiceId, invoiceId));
      }

      // Log audit trail
      await logAction(
        tx,
        "cancelled",
        "invoice",
        String(invoiceId),
        {
          reasonCode,
          cancellationReason,
          substituteInvoiceUuid,
        }
      );

      revalidatePath(`/invoices/${invoiceId}`);
      if (substituteInvoiceId) {
        revalidatePath(`/invoices/${substituteInvoiceId}`);
      }

      return { success: true, invoice: updated[0] };
    });
  });

export const registerRefundAction = actionClient
  .inputSchema(registerRefundSchema)
  .action(async ({ parsedInput: { invoiceId, amount, paymentDate, paymentMethod, referenceNumber, bankAccountId, notes } }) => {
    const { db } = await getDB();
    const organizationId = await getActiveOrganizationId();

    // 1. Fetch original invoice
    const invoice = await db.query.invoices.findFirst({
      where: and(
        eq(invoices.id, invoiceId),
        eq(invoices.organizationId, organizationId)
      ),
    });

    if (!invoice) {
      throw new Error("Factura no encontrada");
    }

    // 2. Validate INT-CAN-03 (refund <= amountPaid)
    const refundAmount = parseFloat(amount);
    const amountPaid = parseFloat(invoice.amountPaid || "0");

    if (refundAmount > amountPaid + 0.001) {
      throw new Error(`El monto del reembolso no puede exceder el total pagado (${invoice.amountPaid}).`);
    }

    // 3. Register payment and create tax adjustment in transaction
    return await db.transaction(async (tx) => {
      const inserted = await tx
        .insert(payments)
        .values({
          organizationId,
          amount: String(refundAmount.toFixed(2)),
          currency: invoice.currency || "MXN",
          paymentDate,
          paymentMethod,
          referenceNumber: referenceNumber || null,
          bankAccountId: bankAccountId || null,
          notes: notes || null,
          paymentType: "refund", // key mapping to 'Reembolso'
          isRefund: true,
          refundedInvoiceId: invoiceId,
          partnerId: invoice.partnerId,
          exchangeRate: invoice.exchangeRate || "1.0",
        })
        .returning();

      const newPayment = inserted[0];

      // Update invoice paid sum to 0 and paymentStatus to refunded
      await tx
        .update(invoices)
        .set({
          amountPaid: "0.00",
          paymentStatus: "refunded",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(invoices.id, invoiceId),
            eq(invoices.organizationId, organizationId)
          )
        );

      // Create taxAdjustment automatically
      const period = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, "0")}`;
      await tx
        .insert(taxAdjustments)
        .values({
          organizationId,
          invoiceId,
          fiscalPeriod: period,
          adjustmentType: "cancellation_refund",
          amount: String(refundAmount.toFixed(2)),
          currency: invoice.currency || "MXN",
          requiresCompensation: true,
          notes: `Reembolso automático para factura ID ${invoiceId}`,
        });

      // Log audit
      await logAction(
        tx,
        "refunded",
        "payment",
        String(newPayment.id),
        {
          invoiceId,
          amount,
        }
      );

      revalidatePath(`/invoices/${invoiceId}`);

      return { success: true, payment: newPayment };
    });
  });
