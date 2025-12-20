import { invoices } from "@/db";
import { InferResultType } from "./orm";

export type Invoice = typeof invoices.$inferSelect;
export type InvoiceDetails = InferResultType<
  "invoices",
  { businessPartner: true; items: { with: { taxes: true } } }
>;
