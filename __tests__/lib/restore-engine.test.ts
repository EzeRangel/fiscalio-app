import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { create as createTar } from "tar";
import {
  validateBackupArchive,
  restoreBackupFromArchive,
} from "@/lib/restore-engine";

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

  it("should extract a valid PGLite data-dir archive into the target", async () => {
    const archivePath = path.join(tempDir, "Fiscalio-1.0.0-test.tar.gz");
    const srcBase = path.join(tempDir, "src-data");
    fs.mkdirSync(path.join(srcBase, "global"), { recursive: true });
    fs.writeFileSync(path.join(srcBase, "PG_VERSION"), "17\n");
    fs.writeFileSync(path.join(srcBase, "pg_hba.conf"), "local all all trust\n");
    fs.writeFileSync(path.join(srcBase, "global", "pg_control"), "control-data");

    await createTar(
      { gzip: true, cwd: srcBase, file: archivePath },
      ["PG_VERSION", "pg_hba.conf", "global", "global/pg_control"]
    );
    expect(validateBackupArchive(archivePath)).toBeDefined();

    const result = await restoreBackupFromArchive(archivePath, targetDataDir);
    expect(result.success).toBe(true);
    expect(fs.readFileSync(path.join(targetDataDir, "PG_VERSION"), "utf-8")).toBe("17\n");
    expect(fs.readFileSync(path.join(targetDataDir, "global", "pg_control"), "utf-8")).toBe("control-data");
  });

  it("should reject an archive that is not a PGLite data dir", async () => {
    const archivePath = path.join(tempDir, "not-pglite.tar.gz");
    const srcBase = path.join(tempDir, "src-notes");
    fs.mkdirSync(srcBase, { recursive: true });
    fs.writeFileSync(path.join(srcBase, "notes.txt"), "just notes");

    await createTar({ gzip: true, cwd: srcBase, file: archivePath }, ["notes.txt"]);

    const preExisting = path.join(targetDataDir, "keep.txt");
    fs.writeFileSync(preExisting, "do-not-delete");

    const result = await restoreBackupFromArchive(archivePath, targetDataDir);
    expect(result.success).toBe(false);
    expect(result.error).toContain("PG_VERSION");
    expect(fs.readFileSync(preExisting, "utf-8")).toBe("do-not-delete");
  });
});
