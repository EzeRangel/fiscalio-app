import type { PGlite } from "@electric-sql/pglite";

export class DowngradeDetectedError extends Error {
  public storedMigrationCount: number;
  public expectedMigrationCount: number;
  public storedVersion?: string;
  public currentVersion: string;

  constructor(params: {
    storedMigrationCount: number;
    expectedMigrationCount: number;
    storedVersion?: string;
    currentVersion: string;
  }) {
    super(
      `La base de datos contiene migraciones de una versión más reciente (migraciones: ${params.storedMigrationCount}) que la versión instalada (esperadas: ${params.expectedMigrationCount}). No se puede degradar la versión sin riesgo de corrupción.`
    );
    this.name = "DowngradeDetectedError";
    this.storedMigrationCount = params.storedMigrationCount;
    this.expectedMigrationCount = params.expectedMigrationCount;
    this.storedVersion = params.storedVersion;
    this.currentVersion = params.currentVersion;
  }
}

export async function ensureSchemaVersionTable(pg: PGlite): Promise<void> {
  await pg.exec(`
    CREATE SCHEMA IF NOT EXISTS app_meta;
    CREATE TABLE IF NOT EXISTS app_meta.schema_version (
      id serial PRIMARY KEY,
      version text NOT NULL,
      migration_count integer NOT NULL,
      updated_at timestamp DEFAULT now()
    );
  `);
}

export async function checkSchemaCompatibility(
  pg: PGlite,
  expectedMigrationCount: number,
  currentVersion: string
): Promise<{ allowed: boolean; currentStoredCount: number; expectedCount: number }> {
  await ensureSchemaVersionTable(pg);

  const res = await pg.query<{ migration_count: number; version: string }>(`
    SELECT migration_count, version FROM app_meta.schema_version ORDER BY id DESC LIMIT 1;
  `);

  const currentStored = res.rows.length > 0 ? res.rows[0] : null;
  const currentStoredCount = currentStored ? Number(currentStored.migration_count) : 0;

  if (currentStoredCount > expectedMigrationCount) {
    throw new DowngradeDetectedError({
      storedMigrationCount: currentStoredCount,
      expectedMigrationCount,
      storedVersion: currentStored?.version,
      currentVersion,
    });
  }

  // Record/update the current version, keeping a single row per database
  const existing = await pg.query<{ id: number }>(
    `SELECT id FROM app_meta.schema_version ORDER BY id DESC LIMIT 1;`
  );
  if (existing.rows.length > 0) {
    await pg.query(
      `UPDATE app_meta.schema_version SET version = $1, migration_count = $2, updated_at = now() WHERE id = $3;`,
      [currentVersion, expectedMigrationCount, existing.rows[0].id]
    );
  } else {
    await pg.query(
      `INSERT INTO app_meta.schema_version (version, migration_count) VALUES ($1, $2);`,
      [currentVersion, expectedMigrationCount]
    );
  }

  return {
    allowed: true,
    currentStoredCount,
    expectedCount: expectedMigrationCount,
  };
}
