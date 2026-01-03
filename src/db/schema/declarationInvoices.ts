import {
  boolean,
  decimal,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { taxDeclarations } from "./taxDeclarations";
import { invoices } from "./invoices";
import { relations } from "drizzle-orm";

export const declarationInvoices = pgTable(
  "declaration_invoices",
  {
    id: serial("id").primaryKey(),
    declarationId: integer("declaration_id")
      .notNull()
      .references(() => taxDeclarations.id, { onDelete: "cascade" }),
    invoiceId: integer("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),

    // Clasificación aplicada al momento de la declaración (snapshot)
    appliedAccountCode: varchar("applied_account_code", { length: 20 }),
    appliedAccountName: varchar("applied_account_name", { length: 255 }),
    isDeductible: boolean("is_deductible").default(false),
    deductionPercentage: decimal("deduction_percentage", {
      precision: 5,
      scale: 2,
    }).default("100.00"),

    // Montos considerados (pueden diferir del total si hay ajustes)
    includedAmount: decimal("included_amount", {
      precision: 15,
      scale: 2,
    }).notNull(),
    deductibleAmount: decimal("deductible_amount", {
      precision: 15,
      scale: 2,
    }).default("0"),

    // IVA específico de esta factura
    ivaAmount: decimal("iva_amount", { precision: 15, scale: 2 }).default("0"),
    ivaType: varchar("iva_type", { length: 20 }), // 'charged', 'creditable', 'exempt'

    // Override manual
    wasManuallyAdjusted: boolean("was_manually_adjusted").default(false),
    adjustmentReason: text("adjustment_reason"),

    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => {
    return {
      declarationIdIndex: index("idx_declaration_invoices_declaration").on(
        table.declarationId
      ),
      invoiceIdIndex: index("idx_declaration_invoices_invoice").on(
        table.invoiceId
      ),
      // Una factura solo puede estar en una declaración del mismo período
      uniqueInvoicePerDeclaration: unique("unique_invoice_declaration").on(
        table.declarationId,
        table.invoiceId
      ),
    };
  }
);

export const declarationInvoicesRelations = relations(
  declarationInvoices,
  ({ one }) => ({
    taxDeclaration: one(taxDeclarations, {
      fields: [declarationInvoices.declarationId],
      references: [taxDeclarations.id],
    }),
    invoice: one(invoices, {
      fields: [declarationInvoices.invoiceId],
      references: [invoices.id],
    }),
  })
);
