import { invoices } from "@/db";
import { InferResultType } from "./orm";

export type Invoice = typeof invoices.$inferSelect;
export type InvoiceDetails = InferResultType<
  "invoices",
  { account: true; businessPartner: true; items: { with: { taxes: true } } }
>;

export type ProcessingInvoice =
  | {
      type: "started";
      id: string;
      fileName: string;
      total: number;
      current: number;
    }
  | {
      type: "status";
      id: string;
      status: "parsing" | "validating" | "saving" | "classifying";
    }
  | {
      type: "success";
      id: string;
    }
  | { type: "error"; id: string; error: string; fileName: string }
  | {
      type: "complete";
      totalProcessed: number;
      successful: number;
      failed: number;
    };
