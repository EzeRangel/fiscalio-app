import { auditLogs } from "@/db";

export type AuditLog = typeof auditLogs.$inferSelect;
