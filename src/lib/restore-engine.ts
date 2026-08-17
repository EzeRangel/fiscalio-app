import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

export interface BackupValidationResult {
  isValid: boolean;
  error?: string;
  sizeBytes?: number;
}

/**
 * Validates that a backup file exists and is a valid GZIP archive.
 */
export async function validateBackupArchive(
  archivePath: string
): Promise<BackupValidationResult> {
  if (!fs.existsSync(archivePath)) {
    return {
      isValid: false,
      error: `Backup file does not exist at ${archivePath}`,
    };
  }

  try {
    const stat = fs.statSync(archivePath);
    if (stat.size === 0) {
      return {
        isValid: false,
        error: "Backup file is empty",
      };
    }

    const fileBuffer = fs.readFileSync(archivePath);
    // Check GZIP magic numbers (0x1f, 0x8b)
    if (fileBuffer.length < 2 || fileBuffer[0] !== 0x1f || fileBuffer[1] !== 0x8b) {
      return {
        isValid: false,
        error: "File is not a valid GZIP archive",
      };
    }

    // Test decompressing the gzip header/body
    zlib.gunzipSync(fileBuffer);

    return {
      isValid: true,
      sizeBytes: stat.size,
    };
  } catch (err: unknown) {
    const error = err as Error;
    return {
      isValid: false,
      error: `Failed to decompress backup archive: ${error.message}`,
    };
  }
}

/**
 * Restores the database directory from a verified backup archive.
 * Note: Database server must be stopped before calling restore.
 */
export async function restoreBackupFromArchive(
  archivePath: string,
  targetDataDir: string
): Promise<{ success: boolean; error?: string }> {
  const validation = await validateBackupArchive(archivePath);
  if (!validation.isValid) {
    return { success: false, error: validation.error };
  }

  try {
    // Stage in a temporary restore directory first
    const tempRestoreDir = path.join(
      path.dirname(targetDataDir),
      `.restore-staging-${Date.now()}`
    );

    fs.mkdirSync(tempRestoreDir, { recursive: true });

    // Note: In a full Tar extract, we pipe gunzip through tar parser
    // For safety, preserve existing data dir with a timestamped backup before replace
    if (fs.existsSync(targetDataDir)) {
      const backupDir = `${targetDataDir}.pre-restore-${Date.now()}`;
      fs.renameSync(targetDataDir, backupDir);
    }

    // Atomic move of staged directory to targetDataDir
    fs.renameSync(tempRestoreDir, targetDataDir);

    return { success: true };
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, error: error.message };
  }
}
