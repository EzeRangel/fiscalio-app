import "server-only";

import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "./schema";
import { DB_PATH } from "@/lib/db-path";

let dbPromise: ReturnType<typeof initDB> | null = null;

export async function initDB() {
  const pg = await PGlite.create({
    dataDir: DB_PATH,
  });

  const db = drizzle(pg, { schema });

  return { pg, db };
}

export function getDB() {
  if (!dbPromise) {
    dbPromise = initDB();
  }

  return dbPromise;
}
