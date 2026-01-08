import { payments } from "@/db";
import { InferResultType } from "./orm";

export type Payment = typeof payments.$inferSelect;
export type PaymentAllocation = InferResultType<
  "payments",
  {
    allocations: { with: { invoice: true } };
  }
>;
