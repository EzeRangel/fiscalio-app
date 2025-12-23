import { chartOfAccounts, getDB } from "@/db";
import { getActiveOrganizationId } from "@/lib/session";
import { eq } from "drizzle-orm";
import "server-only";

export const getChartOfAccountsByOrg = async () => {
  const organizationId = await getActiveOrganizationId();
  const { db } = await getDB();

  return await db.query.chartOfAccounts.findMany({
    where: eq(chartOfAccounts.organizationId, organizationId),
    orderBy: (chartOfAccounts, { asc }) => [asc(chartOfAccounts.accountCode)],
  });
};
