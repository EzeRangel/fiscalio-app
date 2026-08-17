"use server";

import { actionClient } from "@/lib/safe-action";
import { getDB } from "@/db";
import { resolveDBPath } from "@/lib/db-path";
import { BackupEngine } from "@/lib/backup-engine";
import path from "node:path";
import fs from "node:fs";
import z from "zod/v4";

export const listBackupsAction = actionClient.action(async () => {
  const dataDir = resolveDBPath();
  const userDataPath = path.dirname(dataDir);
  const engine = new BackupEngine(userDataPath);
  return engine.listBackups();
});

export const createManualBackupAction = actionClient.action(async () => {
  const { pg } = await getDB();
  const dataDir = resolveDBPath();
  const userDataPath = path.dirname(dataDir);
  const engine = new BackupEngine(userDataPath);

  const result = await engine.performBackup(pg, "manual");
  return {
    success: true,
    backupPath: result.backupPath,
    sizeBytes: result.sizeBytes,
    filename: path.basename(result.backupPath),
  };
});
