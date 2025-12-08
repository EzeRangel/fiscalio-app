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
} from 'drizzle-orm/pg-core';

export type OrganizationAddress = {
  street: string;
  exterior: string;
  interior?: string;
  colony: string;
  municipality: string;
  state: string;
  country: string;
  postalCode: string;
};

export type OrganizationContact = {
  email: string;
  phone?: string;
  website?: string;
};

export const organizations = pgTable(
  'organizations',
  {
    id: serial('id').primaryKey(),
    businessName: varchar('business_name', { length: 255 }).notNull(),
    rfc: varchar('rfc', { length: 13 }).notNull().unique(),
    taxRegime: varchar('tax_regime', { length: 10 }).notNull(),
    legalName: varchar('legal_name', { length: 255 }),
    address: jsonb('address').$type<OrganizationAddress>(),
    contact: jsonb('contact').$type<OrganizationContact>(),
    logoUrl: text('logo_url'),
    fiscalYearStart: integer('fiscal_year_start').default(1),
    currency: varchar('currency', { length: 3 }).default('MXN'),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => {
    return {
      rfcIndex: index('idx_organizations_rfc').on(table.rfc),
    };
  },
);
