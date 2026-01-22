"use server";

import { z } from "zod";
import { actionClient } from "@/lib/safe-action";
import { getDB, payments, invoices, paymentAllocations } from "@/db";
import { eq, and } from "drizzle-orm";
import { logAction } from "@/lib/audit-service";
import { revalidatePath } from "next/cache";
import { ActionError } from "@/lib/errors";
import {
  validatePayment,
  validateAllocation,
  FiscalAllocationContext,
  FISCAL_VALIDATION_RULES,
} from "@/lib/fiscal-validation";

export const updatePaymentSchema = z.object({
  paymentId: z.number(),
  paymentDate: z.date(),
  notes: z.string().optional(),
});

export const updatePaymentAction = actionClient
  .schema(updatePaymentSchema)
  .action(async ({ parsedInput: { paymentId, paymentDate, notes } }) => {
    const { db } = await getDB();

    return await db.transaction(async (tx) => {
      // 1. Fetch existing payment and linked invoice date
      const existingPayment = await tx.query.payments.findFirst({
        where: eq(payments.id, paymentId),
        with: {
          allocations: {
            with: {
              invoice: true,
            },
          },
        },
      });

      if (!existingPayment) {
        throw new ActionError("Payment not found");
      }

      // 2. Validate Payment Rules (e.g. Future Date)
      const fiscalPayment = {
        id: existingPayment.id,
        amount: existingPayment.amount,
        paymentDate: paymentDate,
        allocations: [],
      };

      const paymentValidation = validatePayment(fiscalPayment);
      const futureDateError = paymentValidation.errors.find(
        (e) => e.code === FISCAL_VALIDATION_RULES.PAYMENT.NO_FUTURE_DATE
      );
      if (futureDateError) {
        throw new ActionError(futureDateError.message);
      }

      // 3. Validate Allocation Rules (specifically Date Mismatch)
      for (const allocation of existingPayment.allocations) {
        if (!allocation.invoice) continue;

        const validationContext: FiscalAllocationContext = {
          allocation: {
            amount: allocation.amountAllocated,
            invoiceId: allocation.invoiceId,
            paymentId: existingPayment.id,
          },
          invoice: {
            id: allocation.invoice.id,
            total: allocation.invoice.total,
            amountPaid: allocation.invoice.amountPaid || 0,
            paymentStatus: allocation.invoice.paymentStatus || "pending",
            status: allocation.invoice.status || "active",
            invoiceDate: allocation.invoice.invoiceDate,
          },
          payment: fiscalPayment,
          existingAllocationsForInvoice: [], // Pass empty to skip amount checks or ignore errors
          existingAllocationsForPayment: [],
        };

        const result = validateAllocation(validationContext);
        const dateError = result.errors.find(
          (e) => e.code === FISCAL_VALIDATION_RULES.ALLOCATION.DATE_MISMATCH
        );
        if (dateError) {
          throw new ActionError(
            `Payment date cannot be earlier than invoice date (${
              allocation.invoice.internalFolio || allocation.invoice.folioFiscal
            }).`
          );
        }
      }

      // 4. Update the payment
      const [updatedPayment] = await tx
        .update(payments)
        .set({
          paymentDate,
          notes,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, paymentId))
        .returning();

      // 5. Log the action
      await logAction({
        action: "modified",
        entityType: "payment",
        entityId: paymentId,
        organizationId: existingPayment.organizationId,
        metadata: {
          reason: "Manual correction of payment details",
          source: "manual",
          diff: {
            paymentDate: {
              old: existingPayment.paymentDate,
              new: updatedPayment.paymentDate,
            },
            notes: {
              old: existingPayment.notes,
              new: updatedPayment.notes,
            },
          },
        },
        tx,
      });

      // 6. Revalidate path
      for (const allocation of existingPayment.allocations) {
        revalidatePath(`/invoices/${allocation.invoiceId}`);
      }

      return { success: true, payment: updatedPayment };
    });
  });
