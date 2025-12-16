import {
  decimal,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { businessPartners } from './businessPartners';
import { bankAccounts } from './bankAccounts';
import { relations } from 'drizzle-orm';
import { paymentAllocations } from './paymentAllocations';

export const payments = pgTable(
  'payments',
  {
    id: serial('id').primaryKey(),
    organizationId: integer('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    partnerId: integer('partner_id')
      .notNull()
      .references(() => businessPartners.id),
    paymentType: varchar('payment_type', { length: 20 }).notNull(),
    paymentDate: timestamp('payment_date').notNull(),
    paymentMethod: varchar('payment_method', { length: 10 }).notNull(),
    currency: varchar('currency', { length: 3 }).default('MXN'),
    exchangeRate: decimal('exchange_rate', {
      precision: 10,
      scale: 6,
    }).default('1.0'),
    amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
    bankAccountId: integer('bank_account_id').references(
      () => bankAccounts.id,
    ),
    referenceNumber: varchar('reference_number', { length: 100 }),
    authorizationNumber: varchar('authorization_number', { length: 100 }),
    cfdiPaymentId: uuid('cfdi_payment_id'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => {
    return {
      organizationIdIndex: index('idx_payments_org').on(table.organizationId),
      partnerIdIndex: index('idx_payments_partner').on(table.partnerId),
    };
  },
);

export const paymentRelations = relations(payments, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [payments.organizationId],
    references: [organizations.id],
  }),
  businessPartner: one(businessPartners, {
    fields: [payments.partnerId],
    references: [businessPartners.id],
  }),
  bankAccount: one(bankAccounts, {
    fields: [payments.bankAccountId],
    references: [bankAccounts.id],
  }),
  allocations: many(paymentAllocations),
}));