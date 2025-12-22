import {
  AnyPgColumn,
  boolean,
  decimal,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { organizations } from "./organizations";

export const chartOfAccounts = pgTable(
  "chart_of_accounts",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    accountCode: varchar("account_code", { length: 20 }).notNull(),
    accountName: varchar("account_name", { length: 255 }).notNull(),
    accountType: varchar("account_type", { length: 20 }).notNull(), // 'asset', 'liability', 'equity', 'income', 'expense'
    accountSubtype: varchar("account_subtype", { length: 50 }), // More specific classification
    parentAccountId: integer("parent_account_id").references(
      (): AnyPgColumn => chartOfAccounts.id
    ),
    level: integer("level").notNull(), // Hierarchy level

    satCode: varchar("sat_code", { length: 20 }), // SAT account code for reporting
    isDeductible: boolean("is_deductible").default(false),
    deductionPercentage: decimal("deduction_percentage", {
      precision: 5,
      scale: 2,
    }).default("100.00"),

    description: text("description"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => {
    return {
      organizationIdAccountCodeUnique: unique(
        "organization_id_account_code_unique"
      ).on(table.organizationId, table.accountCode),
      organizationIdIndex: index("idx_chart_of_accounts_org_id").on(
        table.organizationId
      ),
      accountCodeIndex: index("idx_chart_of_accounts_code").on(
        table.accountCode
      ),
      accountTypeIndex: index("idx_chart_of_accounts_type").on(
        table.accountType
      ),
    };
  }
);

export const chartOfAccountsRelations = relations(
  chartOfAccounts,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [chartOfAccounts.organizationId],
      references: [organizations.id],
    }),
    parentAccount: one(chartOfAccounts, {
      fields: [chartOfAccounts.parentAccountId],
      references: [chartOfAccounts.id],
      relationName: "parentChartOfAccount",
    }),
    childAccounts: many(chartOfAccounts, {
      relationName: "parentChartOfAccount",
    }),
  })
);
