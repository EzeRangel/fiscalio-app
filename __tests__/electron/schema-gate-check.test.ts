import {
  checkSchemaGateForDataDir,
  readExpectedSchemaInfo,
  DowngradeDetectedError,
} from "@/electron/schema-gate-check";
import fs from "fs";
import path from "path";
import os from "os";

describe("Schema Gate Check for Electron Main Process", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "schema-gate-electron-test-"));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("should allow startup when target directory is empty (fresh install)", async () => {
    const result = await checkSchemaGateForDataDir(tempDir, 20, "1.0.0");
    expect(result.allowed).toBe(true);
  });

  it("should allow startup when directory does not exist", async () => {
    const nonExistent = path.join(tempDir, "sub", "nonexistent");
    const result = await checkSchemaGateForDataDir(nonExistent, 20, "1.0.0");
    expect(result.allowed).toBe(true);
  });

  it("should read expected schema info from fallback or schema.json", () => {
    const info = readExpectedSchemaInfo();
    expect(typeof info.expectedMigrationCount).toBe("number");
    expect(typeof info.version).toBe("string");
  });
});
