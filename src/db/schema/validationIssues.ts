import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { invoices } from "./invoices";

export const validationIssues = pgTable(
  "validation_issues",
  {
    id: serial("id").primaryKey(),
    invoiceId: integer("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),

    issueType: varchar("issue_type", { length: 50 }).notNull(), // 'missing-data', 'invalid-rfc', 'tax-mismatch', 'duplicate', 'amount-anomaly'
    severity: varchar("severity", { length: 20 }).notNull(), // 'error', 'warning', 'info'
    fieldName: varchar("field_name", { length: 100 }), // Which field has the issue

    description: text("description").notNull(),
    suggestedFix: text("suggested_fix"),
    autoFixable: boolean("auto_fixable").default(false),

    status: varchar("status", { length: 20 }).default("open"), // 'open', 'resolved', 'ignored'
    resolvedAt: timestamp("resolved_at"),
    resolutionNotes: text("resolution_notes"),

    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => {
    return {
      invoiceIdIndex: index("idx_validation_issues_invoice_id").on(
        table.invoiceId
      ),
      issueTypeIndex: index("idx_validation_issues_type").on(table.issueType),
    };
  }
);

export const validationIssuesRelations = relations(
  validationIssues,
  ({ one }) => ({
    invoice: one(invoices, {
      fields: [validationIssues.invoiceId],
      references: [invoices.id],
    }),
  })
);
