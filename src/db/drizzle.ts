import "server-only";

import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "./schema";
import { resolveDBPath } from "@/lib/db-path";
import { runBootstrapOnPG } from "@/lib/bootstrap";
import { BackupEngine } from "@/lib/backup-engine";

let dbPromise: ReturnType<typeof initDB> | null = null;
let activeBackupEngine: BackupEngine | null = null;

export async function initDB() {
  const dataDir = resolveDBPath();
  const pg = await PGlite.create({
    dataDir,
  });

  await runBootstrapOnPG(pg);

  const userDataPath = path.dirname(dataDir);
  activeBackupEngine = new BackupEngine(userDataPath);
  activeBackupEngine.startTimer(pg);

  const shutdownHandler = async () => {
    try {
      if (activeBackupEngine) {
        await activeBackupEngine.handleCleanShutdown(pg);
      }
      await pg.close();
    } catch (err) {
      console.error("Error during clean shutdown backup:", err);
    }
  };

  process.once("SIGTERM", shutdownHandler);
  process.once("SIGINT", shutdownHandler);

  const db = drizzle(pg, { schema });

  return { pg, db };
}

export function getDB() {
  if (!dbPromise) {
    dbPromise = initDB();
  }

  return dbPromise;
}

export function getActiveBackupEngine() {
  return activeBackupEngine;
}
