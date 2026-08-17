import fs from "node:fs";
import path from "node:path";

export interface MigrationResult {
  migrated: boolean;
  reason?: string;
  source?: string;
  target?: string;
}

/**
 * Cheap heuristic for "looks like a PGLite/Postgres data directory" so we
 * don't spin up WASM PGlite against arbitrary folders. A real data dir has a
 * PG_VERSION and a global/pg_control control file.
 */
export function isLikelyPgliteDataDir(dataDir: string): boolean {
  return (
    fs.existsSync(path.join(dataDir, "PG_VERSION")) &&
    fs.existsSync(path.join(dataDir, "global", "pg_control"))
  );
}

/**
 * Opens a PGLite data directory to replay any pending WAL and run a CHECKPOINT,
 * leaving it in a consistent state before it is copied. Best-effort: if the
 * directory isn't a recoverable PGLite data dir, the caller falls back to a
 * plain copy rather than aborting the migration.
 */
export async function checkpointPgliteDir(dataDir: string): Promise<boolean> {
  if (!isLikelyPgliteDataDir(dataDir)) {
    return false;
  }
  try {
    const { PGlite } = await import("@electric-sql/pglite");
    const pg = new PGlite(dataDir);
    try {
      await pg.exec("CHECKPOINT;");
      return true;
    } finally {
      await pg.close();
    }
  } catch (err) {
    console.warn(
      `[migration] CHECKPOINT on legacy data dir failed (${dataDir}):`,
      err instanceof Error ? err.message : err
    );
    return false;
  }
}

/**
 * Checks for existing legacy PGLite data at `legacyDataDir` (e.g. `pglite/db`)
 * and migrates it to `targetDataDir` if and only if `targetDataDir` is empty.
 * Idempotent: safe to run on every application startup.
 */
export async function migrateLegacyDataIfNeeded(
  targetDataDir: string,
  legacyDataDir = path.resolve(process.cwd(), "pglite", "db")
): Promise<MigrationResult> {
  const resolvedLegacy = path.resolve(legacyDataDir);
  const resolvedTarget = path.resolve(targetDataDir);

  if (resolvedLegacy === resolvedTarget) {
    return {
      migrated: false,
      reason: "Target and legacy paths are identical",
      source: resolvedLegacy,
      target: resolvedTarget,
    };
  }

  if (!fs.existsSync(resolvedLegacy)) {
    return {
      migrated: false,
      reason: "No legacy data found",
      source: resolvedLegacy,
      target: resolvedTarget,
    };
  }

  const legacyFiles = fs.readdirSync(resolvedLegacy);
  if (legacyFiles.length === 0) {
    return {
      migrated: false,
      reason: "Legacy data directory is empty",
      source: resolvedLegacy,
      target: resolvedTarget,
    };
  }

  if (fs.existsSync(resolvedTarget)) {
    const targetFiles = fs.readdirSync(resolvedTarget);
    if (targetFiles.length > 0) {
      return {
        migrated: false,
        reason: "Target data directory already initialized",
        source: resolvedLegacy,
        target: resolvedTarget,
      };
    }
  }

  // Recover WAL + CHECKPOINT the legacy dir so the copy below is consistent
  await checkpointPgliteDir(resolvedLegacy);

  // Create target and recursively copy legacy files
  fs.mkdirSync(resolvedTarget, { recursive: true });
  fs.cpSync(resolvedLegacy, resolvedTarget, { recursive: true });

  return {
    migrated: true,
    source: resolvedLegacy,
    target: resolvedTarget,
  };
}
