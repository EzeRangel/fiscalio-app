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
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

import { bankAccounts } from "./bankAccounts";
import { businessPartners } from "./businessPartners";
import { invoices } from "./invoices";
import { taxRegimes } from "./taxRegimes";

export const organizationAddressSchema = z.object({
  street: z.string(),
  exterior: z.string(),
  interior: z.string().optional(),
  colony: z.string(),
  municipality: z.string(),
  state: z.string(),
  country: z.string(),
  postalCode: z.string(),
});

export const organizationContactSchema = z.object({
  email: z.email(),
  phone: z.string().optional(),
  website: z.url().optional(),
});

export const organizations = pgTable(
  "organizations",
  {
    id: serial("id").primaryKey(),
    businessName: varchar("business_name", { length: 255 }).notNull(),
    rfc: varchar("rfc", { length: 13 }).notNull().unique(),
    taxRegimeId: integer("tax_regime_id")
      .notNull()
      .references(() => taxRegimes.id),
    legalName: varchar("legal_name", { length: 255 }),
    address:
      jsonb("address").$type<z.infer<typeof organizationAddressSchema>>(),
    contact:
      jsonb("contact").$type<z.infer<typeof organizationContactSchema>>(),
    logoUrl: text("logo_url"),
    fiscalYearStart: integer("fiscal_year_start").default(1),
    currency: varchar("currency", { length: 3 }).default("MXN"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => {
    return {
      rfcIndex: index("idx_organizations_rfc").on(table.rfc),
    };
  }
);

export const insertOrganizationSchema = createInsertSchema(organizations, {
  address: organizationAddressSchema,
  contact: organizationContactSchema,
  taxRegimeId: z.number(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const organizationRelations = relations(organizations, ({ many, one }) => ({
  businessPartners: many(businessPartners),
  invoices: many(invoices),
  bankAccounts: many(bankAccounts),
  taxRegime: one(taxRegimes, {
    fields: [organizations.taxRegimeId],
    references: [taxRegimes.id],
  }),
}));
