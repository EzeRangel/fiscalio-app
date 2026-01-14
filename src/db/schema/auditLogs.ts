import {
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    entityType: varchar("entity_type", { length: 50 }).notNull(),
    entityId: integer("entity_id").notNull(),
    action: varchar("action", { length: 50 }).notNull(),
    userIdentifier: varchar("user_identifier", { length: 100 })
      .notNull()
      .default("local-user"),
    changes: jsonb("changes").notNull(),
    metadata: jsonb("metadata").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      orgIndex: index("idx_audit_logs_org").on(table.organizationId),
      entityIndex: index("idx_audit_logs_entity").on(
        table.entityType,
        table.entityId
      ),
      actionIndex: index("idx_audit_logs_action").on(table.action),
      dateIndex: index("idx_audit_logs_created_at").on(table.createdAt),
    };
  }
);
