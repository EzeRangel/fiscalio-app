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
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import z from "zod/v4";
import { taxRegimes } from "./taxRegimes";
import { relations } from "drizzle-orm/relations";
import {
  organizationAddressSchema,
  organizationContactSchema,
} from "@/types/organizations";

export const businessPartners = pgTable(
  "business_partners",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    partnerType: varchar("partner_type", { length: 20 }).notNull(), // 'client', 'supplier', 'both'
    businessName: varchar("business_name", { length: 255 }).notNull(),
    rfc: varchar("rfc", { length: 13 }).notNull(),
    taxRegimeId: integer("tax_regime_id")
      .notNull()
      .references(() => taxRegimes.id),
    legalName: varchar("legal_name", { length: 255 }),
    address:
      jsonb("address").$type<z.infer<typeof organizationAddressSchema>>(),
    contact:
      jsonb("contact").$type<z.infer<typeof organizationContactSchema>>(),
    paymentTerms: integer("payment_terms"), // Days
    creditLimit: decimal("credit_limit", { precision: 15, scale: 2 }),
    tags: text("tags").array(), // For categorization
    notes: text("notes"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => {
    return {
      organizationIdIndex: index("idx_partners_org").on(table.organizationId),
      rfcIndex: index("idx_partners_rfc").on(table.rfc),
    };
  }
);

export const businessPartnersRelations = relations(
  businessPartners,
  ({ one }) => ({
    taxRegime: one(taxRegimes, {
      fields: [businessPartners.taxRegimeId],
      references: [taxRegimes.id],
    }),
  })
);
