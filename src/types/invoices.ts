import { invoices } from "@/db";
import { InferResultType } from "./orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export type Invoice = typeof invoices.$inferSelect;
export type InvoiceDetails = InferResultType<
  "invoices",
  {
    account: true;
    businessPartner: true;
    items: { with: { taxes: true } };
    allocations: { with: { payment: true; invoice: true } };
  }
>;

export const insertInvoiceSchema = createInsertSchema(invoices, {
  amountPaid: (schema) =>
    schema.refine((v) => !v || parseFloat(v) >= 0, {
      message: "Amount paid cannot be negative",
    }),
}).refine(
  (data) => {
    if (data.amountPaid && data.total) {
      return parseFloat(data.amountPaid) <= parseFloat(data.total);
    }
    return true;
  },
  {
    message: "Amount paid cannot exceed total",
    path: ["amountPaid"],
  },
);

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

export const fiscalValidationSchema = z.object({
  code: z.string(), // todo: Refine this later
  message: z.string(),
  severity: z.enum(["error", "warning"]),
  field: z.string().optional(),
});
