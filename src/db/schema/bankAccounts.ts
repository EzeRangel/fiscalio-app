import {
  boolean,
  decimal,
  index,
  integer,
  pgTable,
  serial,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { relations } from 'drizzle-orm';

export const bankAccounts = pgTable(
  'bank_accounts',
  {
    id: serial('id').primaryKey(),
    organizationId: integer('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    accountName: varchar('account_name', { length: 100 }).notNull(),
    bankName: varchar('bank_name', { length: 100 }).notNull(),
    accountNumber: varchar('account_number', { length: 50 }).notNull(),
    accountType: varchar('account_type', { length: 20 }),
    currency: varchar('currency', { length: 3 }).default('MXN'),
    initialBalance: decimal('initial_balance', {
      precision: 15,
      scale: 2,
    }).default('0'),
    currentBalance: decimal('current_balance', {
      precision: 15,
      scale: 2,
    }).default('0'),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => {
    return {
      organizationIdIndex: index('idx_bank_accounts_org').on(
        table.organizationId,
      ),
    };
  },
);

export const bankAccountRelations = relations(bankAccounts, ({ one }) => ({
  organization: one(organizations, {
    fields: [bankAccounts.organizationId],
    references: [organizations.id],
  }),
}));
