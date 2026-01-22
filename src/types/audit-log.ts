import type { auditLogs } from "@/db/schema/auditLogs";
import z from "zod/v4";

export type AuditLog = typeof auditLogs.$inferSelect;

export const auditMetadataSchema = z
  .object({
    reason: z.string().optional(),
    source: z.enum(["manual", "ai", "import", "reconciliation"]).optional(),
    aiConfidence: z.number().optional(),
  })
  .catchall(z.any());

export const auditChangesSchema = z.record(
  z.string(),
  z.object({
    old: z.any(),
    new: z.any(),
  })
);

export type AuditMetadata = z.infer<typeof auditMetadataSchema>;
export type AuditChanges = z.infer<typeof auditChangesSchema>;
