import {
  decimal,
  index,
  integer,
  pgTable,
  serial,
  timestamp,
} from 'drizzle-orm/pg-core';
import { payments } from './payments';
import { invoices } from './invoices';
import { relations } from 'drizzle-orm';

export const paymentAllocations = pgTable(
  'payment_allocations',
  {
    id: serial('id').primaryKey(),
    paymentId: integer('payment_id')
      .notNull()
      .references(() => payments.id, { onDelete: 'cascade' }),
    invoiceId: integer('invoice_id')
      .notNull()
      .references(() => invoices.id, { onDelete: 'cascade' }),
    amountAllocated: decimal('amount_allocated', {
      precision: 15,
      scale: 2,
    }).notNull(),
    exchangeRate: decimal('exchange_rate', {
      precision: 10,
      scale: 6,
    }).default('1.0'),
    installmentNumber: integer('installment_number').default(1),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => {
    return {
      paymentIdIndex: index('idx_allocations_payment').on(table.paymentId),
      invoiceIdIndex: index('idx_allocations_invoice').on(table.invoiceId),
    };
  },
);

export const paymentAllocationRelations = relations(
  paymentAllocations,
  ({ one }) => ({
    payment: one(payments, {
      fields: [paymentAllocations.paymentId],
      references: [payments.id],
    }),
    invoice: one(invoices, {
      fields: [paymentAllocations.invoiceId],
      references: [invoices.id],
    }),
  }),
);
