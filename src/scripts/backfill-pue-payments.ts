import { drizzle } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import { DB_PATH } from "@/lib/db-path";
import { backfillPuePayments } from "@/lib/pue-backfill-utils";
import * as schema from "@/db/schema";

async function main() {
  console.log("Starting PUE backfill process...");
  console.log(`Using database at: ${DB_PATH}`);

  const pg = new PGlite(DB_PATH);
  const db = drizzle(pg, { schema });

  try {
    await backfillPuePayments(db as any);
    console.log("PUE backfill completed successfully.");
  } catch (error) {
    console.error("Error during PUE backfill:", error);
    process.exit(1);
  } finally {
    await pg.close();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
