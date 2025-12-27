import { chartOfAccounts, getDB } from "@/db";
import { CHART_OF_ACCOUNTS_TEMPLATE } from "@/lib/constants";
import { getActiveOrganizationId } from "@/lib/session";
import { eq } from "drizzle-orm";
import "server-only";

export const seedDefaultChartOfAccounts = async (organizationId: number) => {
  const dataToInsert = CHART_OF_ACCOUNTS_TEMPLATE.map((account) => ({
    ...account,
    organizationId,
  }));

  const { db } = await getDB();

  await db.insert(chartOfAccounts).values(dataToInsert).onConflictDoNothing();
};

export const getChartOfAccountsByOrg = async () => {
  const organizationId = await getActiveOrganizationId();
  const { db } = await getDB();

  return await db.query.chartOfAccounts.findMany({
    where: eq(chartOfAccounts.organizationId, organizationId),
    orderBy: (chartOfAccounts, { asc }) => [asc(chartOfAccounts.accountCode)],
  });
};
