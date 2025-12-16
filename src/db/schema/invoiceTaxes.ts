import {
  decimal,
  index,
  integer,
  pgTable,
  serial,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { invoiceItems } from './invoiceItems';
import { relations } from 'drizzle-orm';

export const invoiceTaxes = pgTable(
  'invoice_taxes',
  {
    id: serial('id').primaryKey(),
    itemId: integer('item_id')
      .notNull()
      .references(() => invoiceItems.id, { onDelete: 'cascade' }),
    taxType: varchar('tax_type', { length: 20 }).notNull(), // 'transferred', 'withheld'
    taxName: varchar('tax_name', { length: 10 }).notNull(), // 'IVA', 'ISR', 'IEPS'
    taxCode: varchar('tax_code', { length: 10 }).notNull(), // SAT tax code (002-IVA, 001-ISR, etc.)
    rate: decimal('rate', { precision: 7, scale: 6 }), // Tax rate (0.160000 for 16% IVA)
    factor: varchar('factor', { length: 10 }), // 'Tasa', 'Cuota', 'Exento'
    baseAmount: decimal('base_amount', { precision: 15, scale: 2 }).notNull(), // Amount on which tax is calculated
    taxAmount: decimal('tax_amount', { precision: 15, scale: 2 }).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => {
    return {
      itemIdIndex: index('idx_taxes_item').on(table.itemId),
    };
  },
);

export const invoiceTaxRelations = relations(invoiceTaxes, ({ one }) => ({
  invoiceItem: one(invoiceItems, {
    fields: [invoiceTaxes.itemId],
    references: [invoiceItems.id],
  }),
}));
