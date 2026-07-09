import { auditLogs } from "@/db/schema/auditLogs";
import { AuditChanges, AuditMetadata } from "@/types/audit-log";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function calculateDiff<T extends Record<string, any>>(
  oldObj: T,
  newObj: T
): AuditChanges {
  const changes: AuditChanges = {};
  // Safely handle null/undefined
  const keys1 = oldObj ? Object.keys(oldObj) : [];
  const keys2 = newObj ? Object.keys(newObj) : [];
  const allKeys = new Set([...keys1, ...keys2]);

  for (const key of allKeys) {
    const oldValue = oldObj ? oldObj[key] : undefined;
    const newValue = newObj ? newObj[key] : undefined;

    let hasChanged = false;

    if (oldValue instanceof Date && newValue instanceof Date) {
      hasChanged = oldValue.getTime() !== newValue.getTime();
    } else {
      hasChanged = oldValue !== newValue;
    }

    if (hasChanged) {
      // Ignore undefined -> undefined
      if (oldValue === undefined && newValue === undefined) continue;

      changes[key] = {
        old: oldValue,
        new: newValue,
      };
    }
  }
  return changes;
}

type LogActionParams = {
  organizationId: number;
  entityType: string;
  entityId: number;
  action: "created" | "updated" | "deleted" | "classified" | "reconciled" | "cancelled" | "refunded";
  changes?: AuditChanges;
  metadata?: AuditMetadata;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx?: any; // To allow passing transaction object
};

export async function logAction(params: LogActionParams) {
  const {
    organizationId,
    entityType,
    entityId,
    action,
    changes = {},
    metadata = {},
    tx,
  } = params;

  try {
    let database = tx;
    if (!database) {
      const { getDB } = await import("@/db");
      const { db } = await getDB();
      database = db;
    }

    await database.insert(auditLogs).values({
      organizationId,
      entityType,
      entityId,
      action,
      userIdentifier: "local-user",
      changes,
      metadata,
    });
  } catch (error) {
    console.error("Failed to log audit action:", error);
  }
}
