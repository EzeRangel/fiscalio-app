import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { validateBackupArchive, restoreBackupFromArchive } from "@/lib/restore-engine";

describe("Backup Restore Engine", () => {
  let tempDir: string;
  let targetDataDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "restore-test-"));
    targetDataDir = path.join(tempDir, "data");
    fs.mkdirSync(targetDataDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("should fail validation if backup archive does not exist", async () => {
    const invalidPath = path.join(tempDir, "nonexistent.tar.gz");
    const result = await validateBackupArchive(invalidPath);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("does not exist");
  });

  it("should fail validation if file is not a valid tar.gz archive", async () => {
    const corruptedPath = path.join(tempDir, "corrupted.tar.gz");
    fs.writeFileSync(corruptedPath, "not-a-gzip-file");

    const result = await validateBackupArchive(corruptedPath);
    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
  });
});
