import {
  integer,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { organizations } from "./organizations";

export const fiscalPeriods = pgTable("fiscal_periods", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull(),
  period: varchar("period", { length: 7 }).notNull(),
  status: varchar("status", { length: 20 }).default("open"),
  closedAt: timestamp("closed_at"),
});

export const fiscalPeriodsRelations = relations(fiscalPeriods, ({ one }) => ({
  organization: one(organizations, {
    fields: [fiscalPeriods.organizationId],
    references: [organizations.id],
  }),
}));
