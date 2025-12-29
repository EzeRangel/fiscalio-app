import { invoices } from "@/db";
import { InferResultType } from "./orm";

export type Invoice = typeof invoices.$inferSelect;
export type InvoiceDetails = InferResultType<
  "invoices",
  { account: true; businessPartner: true; items: { with: { taxes: true } } }
>;
