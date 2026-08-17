import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { resolveAppVersion } from "@/lib/app-version";

describe("resolveAppVersion", () => {
  let base: string;

  beforeEach(() => {
    base = fs.mkdtempSync(path.join(os.tmpdir(), "app-version-test-"));
  });

  afterEach(() => {
    fs.rmSync(base, { recursive: true, force: true });
  });

  it("reads version from schema.json when present", () => {
    fs.mkdirSync(path.join(base, ".next", "standalone"), { recursive: true });
    fs.writeFileSync(
      path.join(base, ".next", "standalone", "schema.json"),
      JSON.stringify({ expectedMigrationCount: 21, version: "1.1.0" })
    );
    expect(resolveAppVersion(fs, base)).toBe("1.1.0");
  });

  it("falls back to package.json version", () => {
    fs.writeFileSync(
      path.join(base, "package.json"),
      JSON.stringify({ name: "fdi-assistant", version: "1.0.0" })
    );
    expect(resolveAppVersion(fs, base)).toBe("1.0.0");
  });

  it("falls back to the default when nothing is readable", () => {
    expect(resolveAppVersion(fs, base)).toBe("1.0.0");
  });
});