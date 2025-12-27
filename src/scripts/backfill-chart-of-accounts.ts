import { drizzle } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import { organizations } from "../db/schema/organizations";
import { chartOfAccounts } from "../db/schema/chartOfAccounts";
import { eq, isNull } from "drizzle-orm";
import { DB_PATH } from "@/lib/db-path";
import { CHART_OF_ACCOUNTS_TEMPLATE } from "@/lib/constants";

async function main() {
  const pg = new PGlite(DB_PATH);
  const db = drizzle(pg);

  console.log(
    "Starting to backfill chart of accounts for existing organizations..."
  );

  const orgsWithoutAccounts = await db
    .select({ id: organizations.id, businessName: organizations.businessName })
    .from(organizations)
    .leftJoin(
      chartOfAccounts,
      eq(organizations.id, chartOfAccounts.organizationId)
    )
    .where(isNull(chartOfAccounts.id))
    .groupBy(organizations.id);

  if (orgsWithoutAccounts.length === 0) {
    console.log(
      "All organizations already have a chart of accounts. Nothing to do."
    );
    await pg.close();
    return;
  }

  console.log(
    `Found ${orgsWithoutAccounts.length} organization(s) that need a chart of accounts.`
  );

  for (const org of orgsWithoutAccounts) {
    console.log(
      `- Seeding accounts for ${org.businessName} (ID: ${org.id})...`
    );

    const dataToInsert = CHART_OF_ACCOUNTS_TEMPLATE.map((account) => ({
      ...account,
      organizationId: org.id,
    }));

    await db.insert(chartOfAccounts).values(dataToInsert).onConflictDoNothing();
  }

  console.log("Backfill completed successfully.");

  await pg.close();
}

main().catch((err) => {
  console.error("Error during backfill:", err);
  process.exit(1);
});
