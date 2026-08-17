import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import path from "path";
import { eq, isNull } from "drizzle-orm";

import { organizations } from "@/db/schema/organizations";
import { taxRegimes } from "@/db/schema/taxRegimes";
import { classificationRules } from "@/db/schema/classificationRules";
import { chartOfAccounts } from "@/db/schema/chartOfAccounts";
import {
  BASE_RULES,
  CHART_OF_ACCOUNTS_TEMPLATE,
  TAX_REGIMES,
} from "@/lib/constants";
import type { MatchCriteria } from "@/types/classification-rules";

import fs from "fs";
import { checkSchemaCompatibility } from "@/lib/schema-gate";
import { resolveAppVersion } from "@/lib/app-version";

export interface BootstrapResult {
  taxRegimesCount: number;
  classificationRulesSeededFor: number[];
  chartOfAccountsSeededFor: number[];
}

export function resolveMigrationsFolder(): string {
  const candidatePaths = [
    path.resolve(process.cwd(), "src/db/migrations"),
    path.resolve(process.cwd(), "migrations"),
    path.resolve(__dirname, "../db/migrations"),
    path.resolve(__dirname, "../../src/db/migrations"),
    path.resolve(__dirname, "migrations"),
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  return candidatePaths[0];
}

/**
 * Runs schema compatibility checks, Drizzle migrations, and seeds mandatory
 * catalogs on an already-opened PGlite instance.
 */
export async function runBootstrapOnPG(pg: PGlite): Promise<BootstrapResult> {
  const migrationsFolder = resolveMigrationsFolder();
  const journalPath = path.resolve(migrationsFolder, "meta/_journal.json");
  let expectedMigrationCount = 20;

  if (fs.existsSync(journalPath)) {
    try {
      const journal = JSON.parse(fs.readFileSync(journalPath, "utf-8"));
      if (Array.isArray(journal.entries)) {
        expectedMigrationCount = journal.entries.length;
      }
    } catch {
      // ignore
    }
  }

  // 1. Schema compatibility and downgrade protection
  await checkSchemaCompatibility(pg, expectedMigrationCount, resolveAppVersion());

  const db = drizzle(pg);

  // 2. Apply pending migrations
  await migrate(db, { migrationsFolder });

  // 3. Seed tax regimes
  await db.insert(taxRegimes).values(TAX_REGIMES).onConflictDoNothing();
  const taxRegimesCount = (
    await db.select({ code: taxRegimes.code }).from(taxRegimes)
  ).length;

  // 4. Seed classification rules for orgs missing them
  const orgsWithoutRules = await db
    .select({ id: organizations.id })
    .from(organizations)
    .leftJoin(
      classificationRules,
      eq(organizations.id, classificationRules.organizationId)
    )
    .where(isNull(classificationRules.id))
    .groupBy(organizations.id);
  const classificationRulesSeededFor = orgsWithoutRules.map((o) => o.id);
  for (const orgId of classificationRulesSeededFor) {
    await db.insert(classificationRules).values(
      BASE_RULES.map((rule) => ({
        ...rule,
        organizationId: orgId,
        matchCriteria: rule.matchCriteria as MatchCriteria,
      }))
    );
  }

  // 5. Seed chart of accounts for orgs missing them
  const orgsWithoutAccounts = await db
    .select({ id: organizations.id })
    .from(organizations)
    .leftJoin(
      chartOfAccounts,
      eq(organizations.id, chartOfAccounts.organizationId)
    )
    .where(isNull(chartOfAccounts.id))
    .groupBy(organizations.id);
  const chartOfAccountsSeededFor = orgsWithoutAccounts.map((o) => o.id);
  for (const orgId of chartOfAccountsSeededFor) {
    await db
      .insert(chartOfAccounts)
      .values(
        CHART_OF_ACCOUNTS_TEMPLATE.map((account) => ({
          ...account,
          organizationId: orgId,
        }))
      )
      .onConflictDoNothing();
  }

  return {
    taxRegimesCount,
    classificationRulesSeededFor,
    chartOfAccountsSeededFor,
  };
}

/**
 * Convenience runner for standalone scripts / tests that manages its own PGlite lifecycle.
 */
export async function runBootstrap(dataDir: string): Promise<BootstrapResult> {
  const pg = new PGlite(dataDir);
  try {
    return await runBootstrapOnPG(pg);
  } finally {
    await pg.close();
  }
}