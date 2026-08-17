import fs from "node:fs";
import path from "node:path";
import type { PGlite } from "@electric-sql/pglite";

export const BACKUP_MAX_DAYS = 7;
export const BACKUP_MAX_FILES = 50;
export const WRITE_OPS_THRESHOLD = 100;
export const TIMER_FALLBACK_MS = 15 * 60 * 1000; // 15 minutes

export function createBackupFilename(
  appVersion = "1.0.0",
  date = new Date()
): string {
  const timestamp = date.toISOString().replace(/[:.]/g, "-");
  return `Fiscalio-${appVersion}-${timestamp}.tar.gz`;
}

/**
 * Prunes backup files in `backupsDir` matching Fiscalio-*.tar.gz.
 * Retention rule (Issue #22): 7 days or 50 files (whichever cuts first), FIFO rotation.
 */
export function pruneBackupsFifo(
  backupsDir: string,
  maxDays = BACKUP_MAX_DAYS,
  maxFiles = BACKUP_MAX_FILES,
  now = Date.now()
): string[] {
  if (!fs.existsSync(backupsDir)) {
    return [];
  }

  const cutoffTime = now - maxDays * 24 * 60 * 60 * 1000;

  const entries = fs
    .readdirSync(backupsDir)
    .filter((f) => f.startsWith("Fiscalio-") && f.endsWith(".tar.gz"))
    .map((name) => {
      const fullPath = path.join(backupsDir, name);
      const stat = fs.statSync(fullPath);
      return {
        name,
        fullPath,
        mtimeMs: stat.mtimeMs,
      };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs); // Newest first

  const removed: string[] = [];

  entries.forEach((file, index) => {
    const isBeyondMaxFiles = index >= maxFiles;
    const isOlderThanCutoff = file.mtimeMs < cutoffTime;

    if (isBeyondMaxFiles || isOlderThanCutoff) {
      try {
        fs.unlinkSync(file.fullPath);
        removed.push(file.name);
      } catch (err) {
        console.error(`Failed to prune backup ${file.fullPath}:`, err);
      }
    }
  });

  return removed;
}

export class BackupEngine {
  private baseDir: string;
  private backupsDir: string;
  private appVersion: string;
  private writeOpsCount: number = 0;
  private timer: NodeJS.Timeout | null = null;

  constructor(userDataPath: string, appVersion = "1.0.0") {
    this.baseDir = userDataPath;
    this.backupsDir = path.join(userDataPath, "backups");
    this.appVersion = appVersion;
  }

  public getBackupsDir(): string {
    return this.backupsDir;
  }

  public getWriteOpsCount(): number {
    return this.writeOpsCount;
  }

  public async performCheckpoint(pg: PGlite): Promise<void> {
    try {
      await pg.exec("CHECKPOINT;");
    } catch (err) {
      console.error("Failed to execute CHECKPOINT on database:", err);
    }
  }

  public async performBackup(
    pg: PGlite,
    reason: string = "manual",
    customFilename?: string
  ): Promise<{ backupPath: string; sizeBytes: number; filename: string }> {
    fs.mkdirSync(this.backupsDir, { recursive: true });

    // 1. Run CHECKPOINT before dump to keep WAL small
    await this.performCheckpoint(pg);

    const filename =
      customFilename || createBackupFilename(this.appVersion, new Date());
    const targetPath = path.join(this.backupsDir, filename);

    // 2. Dump data directory as gzip
    const dumpBlob = await pg.dumpDataDir("gzip");
    const arrayBuffer = await dumpBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    fs.writeFileSync(targetPath, buffer);

    // 3. FIFO pruning: 7 days or 50 files
    pruneBackupsFifo(this.backupsDir);

    // Reset write ops counter after successful backup
    this.writeOpsCount = 0;

    return {
      backupPath: targetPath,
      filename,
      sizeBytes: buffer.length,
    };
  }

  public async recordWriteOp(pg: PGlite): Promise<void> {
    this.writeOpsCount++;
    if (this.writeOpsCount >= WRITE_OPS_THRESHOLD) {
      await this.performBackup(pg, "100_ops_threshold");
    }
  }

  public startTimer(pg: PGlite, intervalMs = TIMER_FALLBACK_MS): void {
    this.stopTimer();
    this.timer = setInterval(async () => {
      if (this.writeOpsCount > 0) {
        await this.performBackup(pg, "15_min_timer_fallback");
      }
    }, intervalMs);
    // Unref timer so it doesn't block graceful Node exit
    if (this.timer && typeof this.timer.unref === "function") {
      this.timer.unref();
    }
  }

  public stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public async handleCleanShutdown(pg: PGlite): Promise<void> {
    this.stopTimer();
    await this.performBackup(pg, "clean_shutdown");
  }

  public listBackups(): string[] {
    if (!fs.existsSync(this.backupsDir)) {
      return [];
    }
    return fs
      .readdirSync(this.backupsDir)
      .filter((f) => f.startsWith("Fiscalio-") && f.endsWith(".tar.gz"))
      .sort()
      .reverse();
  }
}

