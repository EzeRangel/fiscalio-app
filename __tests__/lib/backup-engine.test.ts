import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  pruneOldBackups,
  createDailyBackupFilename,
  createMonthlyBackupFilename,
  BackupEngine,
} from "@/lib/backup-engine";

describe("Backup Engine & Pruning", () => {
  let tempBaseDir: string;
  let backupsDir: string;

  beforeEach(() => {
    tempBaseDir = fs.mkdtempSync(path.join(os.tmpdir(), "backup-test-"));
    backupsDir = path.join(tempBaseDir, "backups");
  });

  afterEach(() => {
    fs.rmSync(tempBaseDir, { recursive: true, force: true });
  });

  it("should generate proper daily and monthly filenames", () => {
    const date = new Date("2026-08-17T15:30:00Z");
    const dailyName = createDailyBackupFilename(date);
    expect(dailyName).toMatch(/^backup-20260817-\d{6}\.tar\.gz$/);

    const monthlyName = createMonthlyBackupFilename(date);
    expect(monthlyName).toBe("backup-202608.tar.gz");
  });

  it("should prune old backups keeping only the specified max count", () => {
    const dailyDir = path.join(backupsDir, "daily");
    fs.mkdirSync(dailyDir, { recursive: true });

    // Create 10 dummy backup files
    for (let i = 1; i <= 10; i++) {
      const fileName = `backup-202608${String(i).padStart(2, "0")}-120000.tar.gz`;
      fs.writeFileSync(path.join(dailyDir, fileName), "dummy content");
    }

    expect(fs.readdirSync(dailyDir).length).toBe(10);

    const removed = pruneOldBackups(dailyDir, 7);
    expect(removed.length).toBe(3);

    const remaining = fs.readdirSync(dailyDir);
    expect(remaining.length).toBe(7);
    // Oldest ones (01, 02, 03) should have been pruned
    expect(remaining).not.toContain("backup-20260801-120000.tar.gz");
    expect(remaining).not.toContain("backup-20260802-120000.tar.gz");
    expect(remaining).not.toContain("backup-20260803-120000.tar.gz");
    expect(remaining).toContain("backup-20260810-120000.tar.gz");
  });

  it("should handle empty or non-existent directories gracefully during pruning", () => {
    const nonExistent = path.join(backupsDir, "nonexistent");
    const removed = pruneOldBackups(nonExistent, 7);
    expect(removed).toEqual([]);
  });

  it("should initialize BackupEngine with base backup directory", () => {
    const engine = new BackupEngine(tempBaseDir);
    expect(engine.getBackupsDir()).toBe(path.join(tempBaseDir, "backups"));
    expect(engine.getDailyDir()).toBe(path.join(tempBaseDir, "backups", "daily"));
    expect(engine.getMonthlyDir()).toBe(path.join(tempBaseDir, "backups", "monthly"));
  });
});
