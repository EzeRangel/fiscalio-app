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
} from 'drizzle-orm/pg-core';
import { invoices } from './invoices';
import { relations } from 'drizzle-orm';
import { invoiceTaxes } from './invoiceTaxes';

export const invoiceItems = pgTable(
  'invoice_items',
  {
    id: serial('id').primaryKey(),
    invoiceId: integer('invoice_id')
      .notNull()
      .references(() => invoices.id, { onDelete: 'cascade' }),
    lineNumber: integer('line_number').notNull(),

    // Product/Service identification
    productServiceKey: varchar('product_service_key', { length: 10 }).notNull(),
    identificationNumber: varchar('identification_number', { length: 100 }),
    description: text('description').notNull(),
    unit: varchar('unit', { length: 10 }).notNull(),
    quantity: decimal('quantity', { precision: 15, scale: 4 }).notNull(),
    unitPrice: decimal('unit_price', { precision: 15, scale: 4 }).notNull(),
    discount: decimal('discount', { precision: 15, scale: 2 }).default('0'),
    subtotal: decimal('subtotal', { precision: 15, scale: 2 }).notNull(),

    // Accounting classification
    accountCode: varchar('account_code', { length: 20 }),
    costCenter: varchar('cost_center', { length: 50 }),
    projectCode: varchar('project_code', { length: 50 }),
    department: varchar('department', { length: 50 }),

    // AI classification
    aiSuggestedAccount: varchar('ai_suggested_account', { length: 20 }),
    aiConfidence: decimal('ai_confidence', { precision: 5, scale: 4 }),
    isManuallyClassified: boolean('is_manually_classified').default(false),

    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => {
    return {
      invoiceIdIndex: index('idx_items_invoice').on(table.invoiceId),
      accountCodeIndex: index('idx_items_account').on(table.accountCode),
      productServiceKeyIndex: index('idx_items_product_key').on(
        table.productServiceKey,
      ),
    };
  },
);

export const invoiceItemRelations = relations(invoiceItems, ({ one, many }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
  taxes: many(invoiceTaxes),
}));
