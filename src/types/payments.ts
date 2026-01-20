import { payments } from "@/db";
import { InferResultType } from "./orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export type Payment = typeof payments.$inferSelect;
export type PaymentAllocation = InferResultType<
  "payments",
  {
    allocations: { with: { invoice: true } };
  }
>;

export const insertPaymentSchema = createInsertSchema(payments, {
  amount: (schema) => schema.refine((v) => parseFloat(v) > 0, {
    message: "Amount must be positive",
  }),
  paymentDate: z.date().refine((d) => d <= new Date(), {
    message: "Payment date cannot be in the future",
  }),
});
