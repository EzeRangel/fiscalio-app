"use server";

import { eq } from "drizzle-orm";

import { getDB } from "@/db/drizzle";
import { chartOfAccounts } from "@/db/schema";
import { getActiveOrganizationId } from "@/lib/session";
import { actionClient } from "@/lib/safe-action";
import { AccountFormSchema } from "@/types/chart-of-accounts";
import { revalidatePath } from "next/cache";
import { ActionError } from "@/lib/errors";
import { getChartOfAccountsByOrg } from "@/data/chart-of-accounts";

export async function fetchChartOfAccounts() {
  return getChartOfAccountsByOrg();
}

export const createAccount = actionClient
  .inputSchema(AccountFormSchema)
  .action(async ({ parsedInput }) => {
    const organizationId = await getActiveOrganizationId();
    const { db } = await getDB();

    let level = 0;
    const parentIdAsNumber = parsedInput.parentAccountId
      ? parseInt(parsedInput.parentAccountId, 10)
      : null;

    if (parentIdAsNumber) {
      const parentAccount = await db.query.chartOfAccounts.findFirst({
        where: eq(chartOfAccounts.id, parentIdAsNumber),
      });

      if (parentAccount) {
        level = parentAccount.level + 1;
      } else {
        // If parent is not found, we can't determine the level.
        // It's better to throw an error than to create an orphan
        // or a root-level account silently.
        throw new ActionError("Parent account not found");
      }
    }

    await db
      .insert(chartOfAccounts)
      .values({
        ...parsedInput,
        organizationId,
        level: level,
        parentAccountId: parentIdAsNumber,
      })
      .returning();

    revalidatePath("/settings/chart-of-accounts");
  });
