import {
  boolean,
  decimal,
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
import { organizations } from "./organizations";
import { z } from "zod";

// Define Zod schema for match-criteria for better type inference
const matchCriteriaSchema = z.union([
  z.object({
    keywords: z.array(z.string()),
    field: z.string(),
  }),
  z.object({
    regex: z.string(),
    field: z.string(),
  }),
  z.object({
    min: z.number().optional(),
    max: z.number().optional(),
  }),
  z.object({
    partnerIds: z.array(z.number()),
  }),
]);

export const classificationRules = pgTable(
  "classification_rules",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    ruleName: varchar("rule_name", { length: 100 }).notNull(),
    ruleType: varchar("rule_type", { length: 20 }).notNull(), // 'keyword', 'pattern', 'amount-range', 'partner', 'product-key'

    matchCriteria: jsonb("match_criteria")
      .$type<z.infer<typeof matchCriteriaSchema>>()
      .notNull(),

    accountCode: varchar("account_code", { length: 20 }).notNull(),
    costCenter: varchar("cost_center", { length: 50 }),
    department: varchar("department", { length: 50 }),
    tags: text("tags").array(),

    priority: integer("priority").default(100),
    confidenceBoost: decimal("confidence_boost", {
      precision: 5,
      scale: 4,
    }).default("0.1"),

    timesApplied: integer("times_applied").default(0),
    timesAccepted: integer("times_accepted").default(0),
    timesRejected: integer("times_rejected").default(0),
    accuracyRate: decimal("accuracy_rate", { precision: 5, scale: 4 }),

    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => {
    return {
      organizationIdIndex: index("idx_classification_rules_org_id").on(
        table.organizationId
      ),
      ruleTypeIndex: index("idx_classification_rules_type").on(table.ruleType),
    };
  }
);

export const classificationRulesRelations = relations(
  classificationRules,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [classificationRules.organizationId],
      references: [organizations.id],
    }),
  })
);
