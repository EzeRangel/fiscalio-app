import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";
import path from "node:path";
import { checkSchemaCompatibility, DowngradeDetectedError } from "./schema-gate";

export { DowngradeDetectedError };

export function readExpectedSchemaInfo(): { expectedMigrationCount: number; version: string } {
  let expectedMigrationCount = 20;
  let version = "1.0.0";

  const resourcesPath =
    typeof process !== "undefined" ? (process as { resourcesPath?: string }).resourcesPath : undefined;

  const candidateJsonPaths = [
    path.resolve(process.cwd(), "schema.json"),
    path.resolve(process.cwd(), ".next", "standalone", "schema.json"),
    ...(resourcesPath
      ? [path.resolve(resourcesPath, ".next", "standalone", "schema.json")]
      : []),
    path.resolve(__dirname, "../../schema.json"),
    path.resolve(__dirname, "../.next/standalone/schema.json"),
  ];

  for (const p of candidateJsonPaths) {
    if (fs.existsSync(p)) {
      try {
        const data = JSON.parse(fs.readFileSync(p, "utf-8"));
        if (typeof data.expectedMigrationCount === "number") {
          expectedMigrationCount = data.expectedMigrationCount;
        }
        if (typeof data.version === "string") {
          version = data.version;
        }
        return { expectedMigrationCount, version };
      } catch {
        // ignore
      }
    }
  }

  return { expectedMigrationCount, version };
}

/**
 * Checks schema compatibility on a target data directory before launching the server.
 * Closes PGlite immediately after checking to preserve single-writer safety.
 */
export async function checkSchemaGateForDataDir(
  dataDirPath: string,
  overrideExpectedCount?: number,
  overrideVersion?: string
): Promise<{ allowed: boolean; currentStoredCount: number; expectedCount: number }> {
  const resolvedDir = path.resolve(dataDirPath);

  if (!fs.existsSync(resolvedDir)) {
    return { allowed: true, currentStoredCount: 0, expectedCount: overrideExpectedCount ?? 20 };
  }

  const files = fs.readdirSync(resolvedDir);
  if (files.length === 0) {
    return { allowed: true, currentStoredCount: 0, expectedCount: overrideExpectedCount ?? 20 };
  }

  const schemaInfo = readExpectedSchemaInfo();
  const expectedCount = overrideExpectedCount ?? schemaInfo.expectedMigrationCount;
  const version = overrideVersion ?? schemaInfo.version;

  const pg = new PGlite(resolvedDir);
  try {
    return await checkSchemaCompatibility(pg, expectedCount, version);
  } finally {
    await pg.close();
  }
}
