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

export interface BootstrapResult {
  taxRegimesCount: number;
  classificationRulesSeededFor: number[];
  chartOfAccountsSeededFor: number[];
}

/**
 * Applies pending drizzle migrations and seeds the mandatory catalogs
 * (tax regimes, base classification rules, chart of accounts) for organizations
 * that are missing them. Idempotent: safe to run on every boot.
 *
 * The caller must close any prior PGlite handle on `dataDir` (single-writer) and
 * must not open a second handle on the same data dir concurrently.
 */
export async function runBootstrap(dataDir: string): Promise<BootstrapResult> {
  const migrationsFolder = path.resolve(process.cwd(), "src/db/migrations");
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

  const pg = new PGlite(dataDir);
  try {
    // 1. Schema compatibility and downgrade protection
    await checkSchemaCompatibility(pg, expectedMigrationCount, "0.1.0");

    const db = drizzle(pg);

    await migrate(db, { migrationsFolder });

    await db.insert(taxRegimes).values(TAX_REGIMES).onConflictDoNothing();
    const taxRegimesCount = (
      await db.select({ code: taxRegimes.code }).from(taxRegimes)
    ).length;

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
  } finally {
    await pg.close();
  }
}