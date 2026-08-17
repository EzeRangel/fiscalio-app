"use server";

import { actionClient } from "@/lib/safe-action";
import { getActiveBackupEngine, getDB } from "@/db";
import { resolveDBPath } from "@/lib/db-path";
import { BackupEngine } from "@/lib/backup-engine";
import path from "node:path";

function engineFor(dataDir: string): BackupEngine {
  const active = getActiveBackupEngine();
  if (active) {
    return active;
  }
  const userDataPath = path.dirname(dataDir);
  return new BackupEngine(userDataPath);
}

export const listBackupsAction = actionClient.action(async () => {
  const dataDir = resolveDBPath();
  const engine = engineFor(dataDir);
  return engine.listBackups();
});

export const createManualBackupAction = actionClient.action(async () => {
  const { pg } = await getDB();
  const dataDir = resolveDBPath();
  const engine = engineFor(dataDir);

  const result = await engine.performBackup(pg, "manual");
  return {
    success: true,
    backupPath: result.backupPath,
    sizeBytes: result.sizeBytes,
    filename: path.basename(result.backupPath),
  };
});
