"use server";

import { actionClient } from "@/lib/safe-action";
import { z } from "zod";
import { getDB } from "@/db/drizzle";
import { auditLogs } from "@/db/schema/auditLogs";
import { eq, and } from "drizzle-orm";
import { getActiveOrganizationId } from "@/lib/session";

const getAuditLogsSchema = z.object({
  entityType: z.string(),
  entityId: z.number(),
});

export const getAuditLogs = actionClient
  .inputSchema(getAuditLogsSchema)
  .action(async ({ parsedInput: { entityType, entityId } }) => {
    const { db } = await getDB();
    const organizationId = await getActiveOrganizationId();
    const logs = await db
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.entityType, entityType),
          eq(auditLogs.entityId, entityId),
          eq(auditLogs.organizationId, organizationId)
        )
      );

    return logs;
  });
