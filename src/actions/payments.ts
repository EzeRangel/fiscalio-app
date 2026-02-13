"use server";

import { z } from "zod";
import { actionClient } from "@/lib/safe-action";
import { getDB, payments } from "@/db";
import { eq } from "drizzle-orm";
import { calculateDiff, logAction } from "@/lib/audit-service";
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
  referenceNumber: zfd.text().optional(),
  authorizationNumber: z.string().optional(),
});

export const updatePaymentAction = actionClient
  .inputSchema(updatePaymentSchema)
  .action(
    async ({
      parsedInput: {
        paymentId,
        paymentDate,
        notes,
        referenceNumber,
        authorizationNumber,
      },
    }) => {
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
          (e) => e.code === FISCAL_VALIDATION_RULES.INTEGRITY.PAYMENT_NO_FUTURE_DATE,
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
            (e) => e.code === FISCAL_VALIDATION_RULES.INTEGRITY.ALLOCATION_DATE_MISMATCH,
          );
          if (dateError) {
            throw new ActionError(
              `La fecha de pago no puede ser anterior a la de la factura (${
                allocation.invoice.internalFolio ||
                allocation.invoice.folioFiscal
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
            referenceNumber,
            authorizationNumber,
            updatedAt: new Date(),
          })
          .where(eq(payments.id, paymentId))
          .returning();

        const paymentChanges = calculateDiff(
          {
            paymentDate: existingPayment.paymentDate,
            notes: existingPayment.notes,
            referenceNumber: existingPayment.referenceNumber,
            authorizationNumber: existingPayment.authorizationNumber,
          },
          {
            paymentDate: updatedPayment.paymentDate,
            notes: updatedPayment.notes,
            referenceNumber: updatedPayment.referenceNumber,
            authorizationNumber: updatedPayment.authorizationNumber,
          },
        );

        // 5. Log the action
        await logAction({
          action: "updated",
          entityType: "payment",
          entityId: paymentId,
          organizationId: existingPayment.organizationId,
          changes: paymentChanges,
          metadata: {
            reason: "Actualización de fecha de registro de pago",
            source: "manual",
          },
          tx,
        });

        // 6. Revalidate path and log for linked invoices
        for (const allocation of existingPayment.allocations) {
          const allocationChanges = calculateDiff(
            {
              paymentDate: existingPayment.paymentDate,
            },
            {
              paymentDate: updatedPayment.paymentDate,
            },
          );

          if (allocation.invoiceId) {
            await logAction({
              action: "updated",
              entityType: "invoice",
              entityId: allocation.invoiceId,
              organizationId: existingPayment.organizationId,
              changes: allocationChanges,
              metadata: {
                reason: "Actualización de fecha de registro de pago",
                source: "manual",
              },
              tx,
            });
          }
          revalidatePath(`/invoices/${allocation.invoiceId}`);
        }

        return { success: true, payment: updatedPayment };
      });
    },
  );
