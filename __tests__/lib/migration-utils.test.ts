import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { migrateLegacyDataIfNeeded } from "@/lib/migration-utils";

describe("Legacy PGLite Data Migration", () => {
  let tempBaseDir: string;
  let legacyDir: string;
  let targetDir: string;

  beforeEach(() => {
    tempBaseDir = fs.mkdtempSync(path.join(os.tmpdir(), "migration-test-"));
    legacyDir = path.join(tempBaseDir, "legacy-pglite", "db");
    targetDir = path.join(tempBaseDir, "userData", "data");
  });

  afterEach(() => {
    fs.rmSync(tempBaseDir, { recursive: true, force: true });
  });

  it("should do nothing if legacy directory does not exist", async () => {
    const result = await migrateLegacyDataIfNeeded(targetDir, legacyDir);
    expect(result.migrated).toBe(false);
    expect(result.reason).toContain("No legacy data found");
    expect(fs.existsSync(targetDir)).toBe(false);
  });

  it("should migrate legacy data when target directory is empty", async () => {
    fs.mkdirSync(legacyDir, { recursive: true });
    fs.writeFileSync(path.join(legacyDir, "PG_VERSION"), "17\n");
    fs.writeFileSync(path.join(legacyDir, "pg_control"), "control-data");

    const result = await migrateLegacyDataIfNeeded(targetDir, legacyDir);
    expect(result.migrated).toBe(true);
    expect(fs.existsSync(path.join(targetDir, "PG_VERSION"))).toBe(true);
    expect(fs.readFileSync(path.join(targetDir, "PG_VERSION"), "utf-8")).toBe("17\n");
    expect(fs.existsSync(path.join(targetDir, "pg_control"))).toBe(true);
  });

  it("should not overwrite target directory if target already contains data (idempotent)", async () => {
    fs.mkdirSync(legacyDir, { recursive: true });
    fs.writeFileSync(path.join(legacyDir, "PG_VERSION"), "17\n");

    fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(path.join(targetDir, "PG_VERSION"), "already-exists\n");

    const result = await migrateLegacyDataIfNeeded(targetDir, legacyDir);
    expect(result.migrated).toBe(false);
    expect(result.reason).toContain("already initialized");
    expect(fs.readFileSync(path.join(targetDir, "PG_VERSION"), "utf-8")).toBe("already-exists\n");
  });

  it("should do nothing if legacy and target paths are the same", async () => {
    fs.mkdirSync(legacyDir, { recursive: true });
    fs.writeFileSync(path.join(legacyDir, "PG_VERSION"), "17\n");

    const result = await migrateLegacyDataIfNeeded(legacyDir, legacyDir);
    expect(result.migrated).toBe(false);
    expect(result.reason).toContain("identical");
  });
});
