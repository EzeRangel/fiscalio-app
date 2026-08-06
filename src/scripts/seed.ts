import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { PGlite } from "@electric-sql/pglite";
import { taxRegimes } from "../db/schema/taxRegimes";
import { DB_PATH } from "@/lib/db-path";
import { TAX_REGIMES } from "@/lib/constants";

async function main() {
  const data = TAX_REGIMES;

  const pg = new PGlite(DB_PATH);
  const db = drizzle(pg);
  const migrationsFolder = "./src/db/migrations";

  console.log("Running migrations...");
  await migrate(db, { migrationsFolder });
  console.log("Migrations completed in:", migrationsFolder);

  console.log("Seeding tax regimes...");

  await db.insert(taxRegimes).values(data).onConflictDoNothing();

  console.log("Seeding completed.");

  await pg.close();
}

main().catch((err) => {
  console.error("Error seeding database:", err);
  process.exit(1);
});
