import {
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { invoices } from "./invoices";

export const classificationSnapshots = pgTable(
  "classification_snapshots",
  {
    id: serial("id").primaryKey(),
    invoiceId: integer("invoice_id").references(() => invoices.id),
    candidates: jsonb("candidates").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => {
    return {
      organizationIdIndex: index("idx_classification_snapshots_invoice").on(
        table.invoiceId
      ),
    };
  }
);

export const classificationSnapshotsRelations = relations(
  classificationSnapshots,
  ({ one }) => ({
    invoice: one(invoices, {
      fields: [classificationSnapshots.invoiceId],
      references: [invoices.id],
    }),
  })
);
