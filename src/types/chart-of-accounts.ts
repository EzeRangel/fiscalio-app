import { chartOfAccounts } from "@/db";
import z from "zod/v4";

export const AccountFormSchema = z.object({
  accountCode: z.string().min(1, "El código es requerido").max(20),
  accountName: z.string().min(1, "El nombre es requerido").max(255),
  accountType: z.enum(["asset", "liability", "equity", "income", "expense"], {
    error: "Selecciona un tipo de cuenta",
  }),
  accountSubtype: z.string().max(50).optional(),
  parentAccountId: z.string().optional(),
  satCode: z.string().max(20).optional(),
  isDeductible: z.boolean().default(false),
  deductionPercentage: z.string().default("100.00"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type AccountFormValues = z.infer<typeof AccountFormSchema>;
export type Account = typeof chartOfAccounts.$inferSelect;

export type HierarchicalAccount = {
  children: HierarchicalAccount[];
};

export interface HierarchicalAccountFull
  extends Omit<Account, "parentAccountId"> {
  children?: HierarchicalAccountFull[];
}
