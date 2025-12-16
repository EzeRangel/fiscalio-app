import {
  AnyPgColumn,
  boolean,
  date,
  decimal,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { businessPartners } from "./businessPartners";
import { relations } from "drizzle-orm";
import { invoiceItems } from './invoiceItems';
import { paymentAllocations } from "./paymentAllocations";

export const invoices = pgTable(
  "invoices",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    partnerId: integer("partner_id").references(() => businessPartners.id),

    // SAT/CFDI identification
    invoiceType: varchar("invoice_type", { length: 20 }).notNull(),
    cfdiType: varchar("cfdi_type", { length: 10 }).notNull(),
    cfdiVersion: varchar("cfdi_version", { length: 10 }).default("4.0"),
    folioFiscal: uuid("folio_fiscal"),
    internalFolio: varchar("internal_folio", { length: 50 }),
    series: varchar("series", { length: 10 }),

    // Dates
    invoiceDate: timestamp("invoice_date").notNull(),
    certificationDate: timestamp("certification_date"),
    paymentDueDate: date("payment_due_date"),

    // Financial data
    currency: varchar("currency", { length: 3 }).default("MXN"),
    exchangeRate: decimal("exchange_rate", {
      precision: 10,
      scale: 6,
    }).default("1.0"),
    subtotal: decimal("subtotal", { precision: 15, scale: 2 }).notNull(),
    discount: decimal("discount", { precision: 15, scale: 2 }).default("0"),
    totalTaxes: decimal("total_taxes", { precision: 15, scale: 2 }).default(
      "0"
    ),
    totalWithholdings: decimal("total_withholdings", {
      precision: 15,
      scale: 2,
    }).default("0"),
    total: decimal("total", { precision: 15, scale: 2 }).notNull(),

    // Payment information
    paymentMethod: varchar("payment_method", { length: 10 }),
    paymentForm: varchar("payment_form", { length: 10 }),
    paymentStatus: varchar("payment_status", { length: 20 }).default("pending"),
    amountPaid: decimal("amount_paid", { precision: 15, scale: 2 }).default(
      "0"
    ),

    // SAT fiscal data
    taxRegimeIssuer: varchar("tax_regime_issuer", { length: 10 }),
    taxRegimeReceiver: varchar("tax_regime_receiver", { length: 10 }),
    cfdiUse: varchar("cfdi_use", { length: 10 }),

    // Document storage
    xmlContent: text("xml_content"),
    pdfUrl: text("pdf_url"),
    originalFileName: varchar("original_file_name", { length: 255 }),
    fileHash: varchar("file_hash", { length: 64 }),

    // AI Processing status
    processingStatus: varchar("processing_status", { length: 20 }).default(
      "pending"
    ),
    extractionConfidence: decimal("extraction_confidence", {
      precision: 5,
      scale: 4,
    }),
    aiClassification: jsonb("ai_classification"),
    validationErrors: jsonb("validation_errors").array(),

    // Accounting
    accountingPeriod: varchar("accounting_period", { length: 7 }),
    isReconciled: boolean("is_reconciled").default(false),
    reconciliationDate: timestamp("reconciliation_date"),

    // Status and metadata
    status: varchar("status", { length: 20 }).default("active"),
    cancellationReason: text("cancellation_reason"),
    cancellationDate: timestamp("cancellation_date"),
    substituteInvoiceId: integer("substitute_invoice_id").references(
      (): AnyPgColumn => invoices.id
    ),

    notes: text("notes"),
    tags: text("tags").array(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => {
    return {
      organizationIdIndex: index("idx_invoices_org").on(table.organizationId),
      partnerIdIndex: index("idx_invoices_partner").on(table.partnerId),
      folioFiscalIndex: index("idx_invoices_folio_fiscal").on(
        table.folioFiscal
      ),
    };
  }
);

export const invoiceRelations = relations(invoices, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [invoices.organizationId],
    references: [organizations.id],
  }),
  businessPartner: one(businessPartners, {
    fields: [invoices.partnerId],
    references: [businessPartners.id],
  }),
  substituteInvoice: one(invoices, {
    fields: [invoices.substituteInvoiceId],
    references: [invoices.id],
  }),
  items: many(invoiceItems),
  allocations: many(paymentAllocations),
}));
