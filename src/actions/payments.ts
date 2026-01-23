"use server";

import { z } from "zod";
import { actionClient } from "@/lib/safe-action";
import { getDB, payments } from "@/db";
import { eq } from "drizzle-orm";
import { logAction } from "@/lib/audit-service";
import { revalidatePath } from "next/cache";
import { ActionError } from "@/lib/errors";
import {
  validatePayment,
  validateAllocation,
  FiscalAllocationContext,
  FISCAL_VALIDATION_RULES,
} from "@/lib/fiscal-validation";
import { zfd } from "zod-form-data";

const updatePaymentSchema = zfd.formData({
  paymentId: zfd.numeric(),
  paymentDate: zfd.text(z.date()),
  notes: z.string().optional(),
});

export const updatePaymentAction = actionClient
  .inputSchema(updatePaymentSchema)
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
        throw new ActionError("Pago no encontrado");
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
        (e) => e.code === FISCAL_VALIDATION_RULES.PAYMENT.NO_FUTURE_DATE,
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
          (e) => e.code === FISCAL_VALIDATION_RULES.ALLOCATION.DATE_MISMATCH,
        );
        if (dateError) {
          throw new ActionError(
            `La fecha de pago no puede ser anterior a la de la factura (${
              allocation.invoice.internalFolio || allocation.invoice.folioFiscal
            }). Favor de revisar los datos registrados para asegurar la consistencia.`,
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
        action: "updated",
        entityType: "payment",
        entityId: paymentId,
        organizationId: existingPayment.organizationId,
        metadata: {
          reason: "Confirmación de fecha de pago",
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

      // 6. Revalidate path and log for linked invoices
      for (const allocation of existingPayment.allocations) {
        if (allocation.invoiceId) {
          await logAction({
            action: "updated",
            entityType: "invoice",
            entityId: allocation.invoiceId,
            organizationId: existingPayment.organizationId,
            metadata: {
              reason: "Confirmación de fecha de pago",
              source: "manual",
              paymentId,
              diff: {
                paymentDate: {
                  old: existingPayment.paymentDate,
                  new: updatedPayment.paymentDate,
                },
              },
            },
            tx,
          });
        }
        revalidatePath(`/invoices/${allocation.invoiceId}`);
      }

      return { success: true, payment: updatedPayment };
    });
  });
