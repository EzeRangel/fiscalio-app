import {
  boolean,
  decimal,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { invoices } from "./invoices";
import { taxDeclarations } from "./taxDeclarations";
import { relations } from "drizzle-orm";

export const taxAdjustments = pgTable(
  "tax_adjustments",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    invoiceId: integer("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    fiscalPeriod: varchar("fiscal_period", { length: 7 }).notNull(), // 'YYYY-MM'
    adjustmentType: varchar("adjustment_type", { length: 30 }).notNull(),
    amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).default("MXN"),
    requiresCompensation: boolean("requires_compensation").default(false),
    appliedInDeclarationId: integer("applied_in_declaration_id").references(
      () => taxDeclarations.id
    ),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => {
    return {
      organizationIdIndex: index("idx_tax_adjustments_org").on(table.organizationId),
      invoiceIdIndex: index("idx_tax_adjustments_invoice").on(table.invoiceId),
      fiscalPeriodIndex: index("idx_tax_adjustments_period").on(table.fiscalPeriod),
    };
  }
);

export const taxAdjustmentsRelations = relations(taxAdjustments, ({ one }) => ({
  organization: one(organizations, {
    fields: [taxAdjustments.organizationId],
    references: [organizations.id],
  }),
  invoice: one(invoices, {
    fields: [taxAdjustments.invoiceId],
    references: [invoices.id],
  }),
  declaration: one(taxDeclarations, {
    fields: [taxAdjustments.appliedInDeclarationId],
    references: [taxDeclarations.id],
  }),
}));
