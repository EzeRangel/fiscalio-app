import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { copyStandaloneAssets } from "@/scripts/build-standalone";

describe("build-standalone script", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "standalone-test-"));
    // Setup mock directory structure
    fs.mkdirSync(path.join(tempDir, "public"), { recursive: true });
    fs.writeFileSync(path.join(tempDir, "public", "favicon.ico"), "mock-favicon");

    fs.mkdirSync(path.join(tempDir, ".next", "static", "chunks"), { recursive: true });
    fs.writeFileSync(path.join(tempDir, ".next", "static", "main.js"), "mock-main-js");

    fs.mkdirSync(path.join(tempDir, ".next", "standalone", ".next"), { recursive: true });
    fs.writeFileSync(path.join(tempDir, ".next", "standalone", "server.js"), "// server");

    fs.mkdirSync(path.join(tempDir, "src", "db", "migrations", "meta"), { recursive: true });
    fs.writeFileSync(
      path.join(tempDir, "src", "db", "migrations", "meta", "_journal.json"),
      JSON.stringify({
        version: "7",
        entries: [
          { idx: 0, tag: "0000_init" },
          { idx: 1, tag: "0001_update" },
        ],
      })
    );
    fs.writeFileSync(
      path.join(tempDir, "package.json"),
      JSON.stringify({ name: "fiscalio", version: "1.0.0" })
    );
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("should copy public, .next/static, migrations, and emit schema.json into standalone directory", () => {
    const result = copyStandaloneAssets({ projectRoot: tempDir });

    expect(result.expectedMigrationCount).toBe(2);

    // Verify public copy
    const standalonePublic = path.join(tempDir, ".next", "standalone", "public", "favicon.ico");
    expect(fs.existsSync(standalonePublic)).toBe(true);

    // Verify .next/static copy
    const standaloneStatic = path.join(tempDir, ".next", "standalone", ".next", "static", "main.js");
    expect(fs.existsSync(standaloneStatic)).toBe(true);

    // Verify migrations copy
    const standaloneMigrations = path.join(
      tempDir,
      ".next",
      "standalone",
      "src",
      "db",
      "migrations",
      "meta",
      "_journal.json"
    );
    expect(fs.existsSync(standaloneMigrations)).toBe(true);

    // Verify schema.json
    const schemaFile = path.join(tempDir, ".next", "standalone", "schema.json");
    expect(fs.existsSync(schemaFile)).toBe(true);
    const schema = JSON.parse(fs.readFileSync(schemaFile, "utf-8"));
    expect(schema.expectedMigrationCount).toBe(2);
    expect(schema.version).toBe("1.0.0");
  });

  it("should throw an error if standalone directory does not exist", () => {
    const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), "empty-test-"));
    expect(() => copyStandaloneAssets({ projectRoot: emptyDir })).toThrow(
      "Standalone directory not found"
    );
    fs.rmSync(emptyDir, { recursive: true, force: true });
  });

  it("should handle missing optional assets gracefully", () => {
    const minimalDir = fs.mkdtempSync(path.join(os.tmpdir(), "minimal-test-"));
    fs.mkdirSync(path.join(minimalDir, ".next", "standalone"), { recursive: true });

    const result = copyStandaloneAssets({ projectRoot: minimalDir });
    expect(result.expectedMigrationCount).toBe(0);
    expect(fs.existsSync(path.join(minimalDir, ".next", "standalone", "schema.json"))).toBe(true);

    fs.rmSync(minimalDir, { recursive: true, force: true });
  });
});
