import {
  index,
  integer,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { invoices } from "./invoices";
import { relations } from "drizzle-orm";
import { classificationSnapshots } from "./classificationSnapshot";
import { chartOfAccounts } from "./chartOfAccounts";

export const classificationFeedback = pgTable(
  "classification_feedback",
  {
    id: serial("id").primaryKey(),
    invoiceId: integer("invoice_id").references(() => invoices.id),
    snapshotId: integer("snapshot_id").references(
      () => classificationSnapshots.id
    ),
    selectedAccountId: integer("selected_account_id").references(
      () => chartOfAccounts.id
    ),
    // positive, negative, manual
    feedbackType: varchar("feedback_type", { length: 20 }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => {
    return {
      invoiceIdIndex: index("idx_classification_feedback_invoice").on(
        table.invoiceId
      ),
      snapshotIdIndex: index("idx_classification_feedback_snapshot").on(
        table.snapshotId
      ),
    };
  }
);

export const classificationFeedbackRelations = relations(
  classificationFeedback,
  ({ one }) => ({
    invoice: one(invoices, {
      fields: [classificationFeedback.invoiceId],
      references: [invoices.id],
    }),
    snapshot: one(classificationSnapshots, {
      fields: [classificationFeedback.snapshotId],
      references: [classificationSnapshots.id],
    }),
    account: one(chartOfAccounts, {
      fields: [classificationFeedback.selectedAccountId],
      references: [chartOfAccounts.id],
    }),
  })
);
