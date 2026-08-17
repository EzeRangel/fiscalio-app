import "server-only";

import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "./schema";
import { resolveDBPath } from "@/lib/db-path";
import { runBootstrapOnPG } from "@/lib/bootstrap";

let dbPromise: ReturnType<typeof initDB> | null = null;

export async function initDB() {
  const dataDir = resolveDBPath();
  const pg = await PGlite.create({
    dataDir,
  });

  await runBootstrapOnPG(pg);

  const db = drizzle(pg, { schema });

  return { pg, db };
}

export function getDB() {
  if (!dbPromise) {
    dbPromise = initDB();
  }

  return dbPromise;
}
