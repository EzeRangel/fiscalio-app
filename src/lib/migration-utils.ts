import fs from "node:fs";
import path from "node:path";

export interface MigrationResult {
  migrated: boolean;
  reason?: string;
  source?: string;
  target?: string;
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

  // Create target and recursively copy legacy files
  fs.mkdirSync(resolvedTarget, { recursive: true });
  fs.cpSync(resolvedLegacy, resolvedTarget, { recursive: true });

  return {
    migrated: true,
    source: resolvedLegacy,
    target: resolvedTarget,
  };
}
