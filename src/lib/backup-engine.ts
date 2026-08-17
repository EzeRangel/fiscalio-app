import fs from "node:fs";
import path from "node:path";
import type { PGlite } from "@electric-sql/pglite";

export function createDailyBackupFilename(date = new Date()): string {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const min = String(date.getUTCMinutes()).padStart(2, "0");
  const ss = String(date.getUTCSeconds()).padStart(2, "0");
  return `backup-${yyyy}${mm}${dd}-${hh}${min}${ss}.tar.gz`;
}

export function createMonthlyBackupFilename(date = new Date()): string {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `backup-${yyyy}${mm}.tar.gz`;
}

export function pruneOldBackups(dirPath: string, maxKeep: number): string[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const files = fs
    .readdirSync(dirPath)
    .filter((f) => f.endsWith(".tar.gz"))
    .map((name) => ({
      name,
      fullPath: path.join(dirPath, name),
      ctime: fs.statSync(path.join(dirPath, name)).ctimeMs,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  if (files.length <= maxKeep) {
    return [];
  }

  const toRemove = files.slice(0, files.length - maxKeep);
  const removedNames: string[] = [];

  for (const file of toRemove) {
    try {
      fs.unlinkSync(file.fullPath);
      removedNames.push(file.name);
    } catch (err) {
      console.error(`Failed to prune backup file ${file.fullPath}:`, err);
    }
  }

  return removedNames;
}

export class BackupEngine {
  private baseDir: string;
  private backupsDir: string;
  private dailyDir: string;
  private monthlyDir: string;
  private manualDir: string;

  constructor(userDataPath: string) {
    this.baseDir = userDataPath;
    this.backupsDir = path.join(userDataPath, "backups");
    this.dailyDir = path.join(this.backupsDir, "daily");
    this.monthlyDir = path.join(this.backupsDir, "monthly");
    this.manualDir = path.join(this.backupsDir, "manual");
  }

  public getBackupsDir(): string {
    return this.backupsDir;
  }

  public getDailyDir(): string {
    return this.dailyDir;
  }

  public getMonthlyDir(): string {
    return this.monthlyDir;
  }

  public getManualDir(): string {
    return this.manualDir;
  }

  public async performBackup(
    pg: PGlite,
    type: "daily" | "monthly" | "manual" = "daily",
    customFilename?: string
  ): Promise<{ backupPath: string; sizeBytes: number }> {
    const targetDir =
      type === "daily"
        ? this.dailyDir
        : type === "monthly"
        ? this.monthlyDir
        : this.manualDir;

    fs.mkdirSync(targetDir, { recursive: true });

    const filename =
      customFilename ||
      (type === "monthly"
        ? createMonthlyBackupFilename()
        : createDailyBackupFilename());

    const targetPath = path.join(targetDir, filename);

    // PGLite 0.3.14 dumpDataDir returns a Blob (tar.gz)
    const dumpBlob = await pg.dumpDataDir("gzip");
    const arrayBuffer = await dumpBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    fs.writeFileSync(targetPath, buffer);

    // Prune retention: daily keeps 7, monthly keeps 12
    if (type === "daily") {
      pruneOldBackups(this.dailyDir, 7);
    } else if (type === "monthly") {
      pruneOldBackups(this.monthlyDir, 12);
    }

    return {
      backupPath: targetPath,
      sizeBytes: buffer.length,
    };
  }

  public listBackups(): { daily: string[]; monthly: string[]; manual: string[] } {
    const list = (dir: string) =>
      fs.existsSync(dir)
        ? fs.readdirSync(dir).filter((f) => f.endsWith(".tar.gz"))
        : [];

    return {
      daily: list(this.dailyDir),
      monthly: list(this.monthlyDir),
      manual: list(this.manualDir),
    };
  }
}
