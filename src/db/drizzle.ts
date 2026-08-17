import "server-only";

import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import type { Logger } from "drizzle-orm/logger";
import * as schema from "./schema";
import { resolveDBPath } from "@/lib/db-path";
import { runBootstrapOnPG } from "@/lib/bootstrap";
import { BackupEngine } from "@/lib/backup-engine";
import { resolveAppVersion } from "@/lib/app-version";

let dbPromise: ReturnType<typeof initDB> | null = null;
let activeBackupEngine: BackupEngine | null = null;

export async function initDB() {
  const dataDir = resolveDBPath();
  const pg = await PGlite.create({
    dataDir,
  });

  await runBootstrapOnPG(pg);

  const userDataPath = path.dirname(dataDir);
  activeBackupEngine = new BackupEngine(userDataPath, resolveAppVersion());
  activeBackupEngine.startTimer(pg);

  const shutdownHandler = async () => {
    // PGLite's dump runs on the WASM runtime, which doesn't hold a Node event-loop
    // handle: without a keepalive the process exits mid-dump and the backup is lost.
    const keepAlive = setInterval(() => {}, 1000);
    try {
      if (activeBackupEngine) {
        await activeBackupEngine.handleCleanShutdown(pg);
      }
    } catch (err) {
      console.error("Error during clean shutdown backup:", err);
    } finally {
      clearInterval(keepAlive);
    }
    try {
      await pg.close();
    } catch (err) {
      console.error("Error closing database during shutdown:", err);
    }
    process.exit(0);
  };

  process.once("SIGTERM", shutdownHandler);
  process.once("SIGINT", shutdownHandler);

  // Count data writes so the 100-op trigger and the 15-min timer fallback fire
  // (WriteOpsCount must stay > 0 for the timer to do anything).
  const writeLogger: Logger = {
    logQuery(query: string) {
      const normalized = query.trimStart().toUpperCase();
      if (!normalized.startsWith("SELECT") && !normalized.startsWith("WITH")) {
        activeBackupEngine?.recordWriteOp(pg).catch(() => {});
      }
    },
  };

  const db = drizzle(pg, { schema, logger: writeLogger });

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
