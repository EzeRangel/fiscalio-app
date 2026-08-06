import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { eq } from "drizzle-orm";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import { organizations } from "@/db/schema/organizations";
import { classificationRules } from "@/db/schema/classificationRules";
import { chartOfAccounts } from "@/db/schema/chartOfAccounts";
import { BASE_RULES, CHART_OF_ACCOUNTS_TEMPLATE, TAX_REGIMES } from "@/lib/constants";
import { runBootstrap } from "./bootstrap";

function makeDataDir(): string {
  return mkdtempSync(path.join(tmpdir(), "fiscalio-bootstrap-"));
}

describe("runBootstrap", () => {
  let dataDir: string;

  beforeEach(() => {
    dataDir = makeDataDir();
  });

  afterEach(() => {
    rmSync(dataDir, { recursive: true, force: true });
  });

  it("applies migrations and seeds the mandatory tax regimes", async () => {
    const result = await runBootstrap(dataDir);
    expect(result.taxRegimesCount).toBe(TAX_REGIMES.length);
    expect(result.classificationRulesSeededFor).toEqual([]);
    expect(result.chartOfAccountsSeededFor).toEqual([]);
  });

  it("is idempotent and does not duplicate tax regimes", async () => {
    const first = await runBootstrap(dataDir);
    const countAfterSeeds = first.taxRegimesCount;
    const second = await runBootstrap(dataDir);
    expect(second.taxRegimesCount).toBe(countAfterSeeds);
    expect(second.taxRegimesCount).toBe(TAX_REGIMES.length);
  });

  it("seeds classification rules and chart of accounts for new organizations", async () => {
    await runBootstrap(dataDir);

    const pg = new PGlite(dataDir);
    const db = drizzle(pg);
    const inserted = await db
      .insert(organizations)
      .values({ businessName: "Acme SA", rfc: "AAA010101AAA", taxRegimeId: 1 })
      .returning({ id: organizations.id });
    const orgId = inserted[0].id;
    await pg.close();

    const result = await runBootstrap(dataDir);

    expect(result.taxRegimesCount).toBe(TAX_REGIMES.length);
    expect(result.classificationRulesSeededFor).toEqual([orgId]);
    expect(result.chartOfAccountsSeededFor).toEqual([orgId]);

    const pg2 = new PGlite(dataDir);
    const db2 = drizzle(pg2);
    const rules = await db2
      .select({ id: classificationRules.id })
      .from(classificationRules)
      .where(eq(classificationRules.organizationId, orgId));
    const accounts = await db2
      .select({ id: chartOfAccounts.id })
      .from(chartOfAccounts)
      .where(eq(chartOfAccounts.organizationId, orgId));
    await pg2.close();

    expect(rules.length).toBe(BASE_RULES.length);
    expect(accounts.length).toBe(CHART_OF_ACCOUNTS_TEMPLATE.length);
  });

  it("does not re-seed scoped data for an organization on a second run", async () => {
    await runBootstrap(dataDir);

    const pg = new PGlite(dataDir);
    const db = drizzle(pg);
    const inserted = await db
      .insert(organizations)
      .values({ businessName: "Acme SA", rfc: "AAA010101AAA", taxRegimeId: 1 })
      .returning({ id: organizations.id });
    const orgId = inserted[0].id;
    await pg.close();

    await runBootstrap(dataDir);
    const again = await runBootstrap(dataDir);

    expect(again.classificationRulesSeededFor).toEqual([]);
    expect(again.chartOfAccountsSeededFor).toEqual([]);
    expect(orgId).toBeDefined();
  });
});