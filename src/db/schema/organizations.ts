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
import { z } from "zod";

import { bankAccounts } from "./bankAccounts";
import { businessPartners } from "./businessPartners";
import { invoices } from "./invoices";
import { taxRegimes } from "./taxRegimes";
import {
  organizationAddressSchema,
  organizationContactSchema,
} from "@/types/organizations";

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

export const organizationRelations = relations(
  organizations,
  ({ many, one }) => ({
    businessPartners: many(businessPartners),
    invoices: many(invoices),
    bankAccounts: many(bankAccounts),
    taxRegime: one(taxRegimes, {
      fields: [organizations.taxRegimeId],
      references: [taxRegimes.id],
    }),
  })
);
