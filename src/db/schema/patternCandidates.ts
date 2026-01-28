import {
  decimal,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { organizations } from "./organizations";
import { DerivedEngineInvoice } from "@/types/classification-engine";

export const patternCandidates = pgTable(
  "pattern_candidates",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    featureSetHash: varchar("feature_set_hash", { length: 64 }).notNull().unique(),
    features: jsonb("features").$type<Partial<DerivedEngineInvoice>>().notNull(),

    proposedAccountId: varchar("proposed_account_id", { length: 20 }).notNull(),
    
    evidenceCount: integer("evidence_count").default(0).notNull(),
    consistencyRate: decimal("consistency_rate", { precision: 5, scale: 4 }).default("0").notNull(),
    confidenceScore: decimal("confidence_score", { precision: 5, scale: 4 }).default("0").notNull(),

    firstSeenAt: timestamp("first_seen_at").defaultNow().notNull(),
    lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
    
    status: varchar("status", { length: 20 }).default("candidate").notNull(), // candidate, promoted, rejected
  },
  (table) => {
    return {
      hashIndex: index("idx_pattern_candidates_hash").on(table.featureSetHash),
      orgIdIndex: index("idx_pattern_candidates_org_id").on(table.organizationId),
      statusIndex: index("idx_pattern_candidates_status").on(table.status),
    };
  }
);

export const patternCandidatesRelations = relations(
  patternCandidates,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [patternCandidates.organizationId],
      references: [organizations.id],
    }),
  })
);
