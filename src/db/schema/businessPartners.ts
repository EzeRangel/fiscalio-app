import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  decimal,
} from 'drizzle-orm/pg-core';
import { organizations, OrganizationAddress, OrganizationContact } from './organizations';

export const businessPartners = pgTable(
  'business_partners',
  {
    id: serial('id').primaryKey(),
    organizationId: integer('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    partnerType: varchar('partner_type', { length: 20 }).notNull(), // 'client', 'supplier', 'both'
    businessName: varchar('business_name', { length: 255 }).notNull(),
    rfc: varchar('rfc', { length: 13 }).notNull(),
    taxRegime: varchar('tax_regime', { length: 10 }),
    legalName: varchar('legal_name', { length: 255 }),
    address: jsonb('address').$type<OrganizationAddress>(),
    contact: jsonb('contact').$type<OrganizationContact>(),
    paymentTerms: integer('payment_terms'), // Days
    creditLimit: decimal('credit_limit', { precision: 15, scale: 2 }),
    tags: text('tags').array(), // For categorization
    notes: text('notes'),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => {
    return {
      organizationIdIndex: index('idx_partners_org').on(table.organizationId),
      rfcIndex: index('idx_partners_rfc').on(table.rfc),
    };
  },
);
