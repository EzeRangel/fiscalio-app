import { PGlite } from "@electric-sql/pglite";
import fs from "fs";
import path from "path";
import os from "os";
import { runBootstrapOnPG } from "@/lib/bootstrap";

describe("initDB Bootstrap Integration", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "fiscalio-initdb-test-"));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("should initialize a completely empty database, applying migrations and catalogs", async () => {
    const pg = new PGlite(tempDir);
    try {
      const result = await runBootstrapOnPG(pg);
      expect(result.taxRegimesCount).toBeGreaterThan(0);

      // Verify that tables such as 'organizations', 'tax_regimes', and 'app_meta.schema_version' exist
      const orgsCheck = await pg.query("SELECT * FROM organizations;");
      expect(orgsCheck.rows).toEqual([]);

      const regimesCheck = await pg.query('SELECT count(*) as count FROM "taxRegimes";');
      expect(Number(regimesCheck.rows[0].count)).toBeGreaterThan(0);

      const schemaCheck = await pg.query("SELECT * FROM app_meta.schema_version;");
      expect(schemaCheck.rows.length).toBeGreaterThan(0);
    } finally {
      await pg.close();
    }
  });

  it("should keep a single app_meta.schema_version row across repeated boots", async () => {
    const pg = new PGlite(tempDir);
    try {
      await runBootstrapOnPG(pg);
      await runBootstrapOnPG(pg);
      await runBootstrapOnPG(pg);

      const schemaCheck = await pg.query("SELECT * FROM app_meta.schema_version;");
      expect(schemaCheck.rows.length).toBe(1);
    } finally {
      await pg.close();
    }
  });
});
