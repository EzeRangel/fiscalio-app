import { taxRegimes } from "@/db";

export type Regime = typeof taxRegimes.$inferSelect;
