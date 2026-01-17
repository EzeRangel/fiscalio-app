import { taxDeclarations } from "@/db";

export type TaxDeclaration = typeof taxDeclarations.$inferSelect;
