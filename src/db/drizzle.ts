import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  pg: PGlite | undefined;
};

const pg = globalForDb.pg ?? new PGlite(process.env.DATABASE_URL!);
if (process.env.NODE_ENV !== "production") globalForDb.pg = pg;

export const db = drizzle(pg, { schema });
