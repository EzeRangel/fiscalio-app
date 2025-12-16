import { pgTable, serial, varchar } from "drizzle-orm/pg-core";

export const taxRegimes = pgTable("taxRegimes", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 3 }).notNull().unique(),
  description: varchar("description", { length: 256 }).notNull(),
});
