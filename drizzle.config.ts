import { DB_PATH } from "@/lib/db-path";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql", // 'mysql' | 'sqlite' | 'turso'
  schema: "./src/db/schema",
  out: "./src/db/migrations",
  driver: "pglite",
  dbCredentials: {
    url: DB_PATH,
  },
});
