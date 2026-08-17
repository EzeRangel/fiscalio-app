import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  pruneBackupsFifo,
  createBackupFilename,
  BackupEngine,
  BACKUP_MAX_DAYS,
  BACKUP_MAX_FILES,
} from "@/lib/backup-engine";

describe("Backup Engine & FIFO Pruning (Issue #22)", () => {
  let tempBaseDir: string;
  let backupsDir: string;

  beforeEach(() => {
    tempBaseDir = fs.mkdtempSync(path.join(os.tmpdir(), "backup-test-"));
    backupsDir = path.join(tempBaseDir, "backups");
  });

  afterEach(() => {
    fs.rmSync(tempBaseDir, { recursive: true, force: true });
  });

  it("should generate proper Fiscalio-<appVersion>-<timestamp>.tar.gz filename", () => {
    const date = new Date("2026-08-17T15:30:00.000Z");
    const name = createBackupFilename("1.0.0", date);
    expect(name).toBe("Fiscalio-1.0.0-2026-08-17T15-30-00-000Z.tar.gz");
  });

  it("should prune old backups using FIFO rotation by count (50 files limit)", () => {
    fs.mkdirSync(backupsDir, { recursive: true });

    const now = Date.now();
    // Create 60 backup files with different mtimes
    for (let i = 1; i <= 60; i++) {
      const fileName = `Fiscalio-1.0.0-20260817-${String(i).padStart(3, "0")}.tar.gz`;
      const filePath = path.join(backupsDir, fileName);
      fs.writeFileSync(filePath, "dummy backup data");
      // Set utimes so file 1 is oldest and file 60 is newest
      const fileTime = (now - (60 - i) * 60 * 1000) / 1000;
      fs.utimesSync(filePath, fileTime, fileTime);
    }

    expect(fs.readdirSync(backupsDir).length).toBe(60);

    const removed = pruneBackupsFifo(backupsDir, 7, 50, now);
    expect(removed.length).toBe(10);

    const remaining = fs.readdirSync(backupsDir);
    expect(remaining.length).toBe(50);
    // Oldest 10 files should have been removed
    expect(remaining).not.toContain("Fiscalio-1.0.0-20260817-001.tar.gz");
    expect(remaining).not.toContain("Fiscalio-1.0.0-20260817-010.tar.gz");
    // Newest files must be preserved
    expect(remaining).toContain("Fiscalio-1.0.0-20260817-060.tar.gz");
  });

  it("should prune backups older than 7 days", () => {
    fs.mkdirSync(backupsDir, { recursive: true });

    const now = Date.now();
    const tenDaysAgo = (now - 10 * 24 * 60 * 60 * 1000) / 1000;
    const twoDaysAgo = (now - 2 * 24 * 60 * 60 * 1000) / 1000;

    const oldFile = path.join(backupsDir, "Fiscalio-1.0.0-old.tar.gz");
    const freshFile = path.join(backupsDir, "Fiscalio-1.0.0-fresh.tar.gz");

    fs.writeFileSync(oldFile, "old backup");
    fs.utimesSync(oldFile, tenDaysAgo, tenDaysAgo);

    fs.writeFileSync(freshFile, "fresh backup");
    fs.utimesSync(freshFile, twoDaysAgo, twoDaysAgo);

    const removed = pruneBackupsFifo(backupsDir, 7, 50, now);
    expect(removed).toContain("Fiscalio-1.0.0-old.tar.gz");
    expect(fs.readdirSync(backupsDir)).toEqual(["Fiscalio-1.0.0-fresh.tar.gz"]);
  });

  it("should handle CHECKPOINT, 100-ops threshold, and clean shutdown on BackupEngine", async () => {
    const engine = new BackupEngine(tempBaseDir, "1.0.0");
    const mockPg = {
      exec: jest.fn().mockResolvedValue(undefined),
      dumpDataDir: jest.fn().mockResolvedValue({
        arrayBuffer: async () => new Uint8Array([1, 2, 3, 4]).buffer,
      }),
    };

    // Perform checkpoint
    await engine.performCheckpoint(mockPg as any);
    expect(mockPg.exec).toHaveBeenCalledWith("CHECKPOINT;");

    // Perform backup
    const result = await engine.performBackup(mockPg as any, "test_reason");
    expect(result.filename).toMatch(/^Fiscalio-1\.0\.0-.*\.tar\.gz$/);
    expect(fs.existsSync(result.backupPath)).toBe(true);

    // Record write ops up to 100
    for (let i = 0; i < 99; i++) {
      await engine.recordWriteOp(mockPg as any);
    }
    expect(engine.getWriteOpsCount()).toBe(99);

    // 100th op triggers backup
    await engine.recordWriteOp(mockPg as any);
    expect(engine.getWriteOpsCount()).toBe(0); // reset

    // Clean shutdown
    await engine.handleCleanShutdown(mockPg as any);
    expect(engine.listBackups().length).toBeGreaterThan(0);
  });
});
