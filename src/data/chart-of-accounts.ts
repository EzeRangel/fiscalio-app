import { chartOfAccounts, getDB } from "@/db";
import { getActiveOrganizationId } from "@/lib/session";
import { eq } from "drizzle-orm";
import "server-only";

export const CHART_OF_ACCOUNTS_TEMPLATE = [
  {
    accountCode: "1000",
    accountName: "Activos",
    accountType: "asset" as const,
    level: 0,
  },
  {
    accountCode: "2000",
    accountName: "Pasivos",
    accountType: "liability" as const,
    level: 0,
  },
  {
    accountCode: "3000",
    accountName: "Capital",
    accountType: "equity" as const,
    level: 0,
  },
  {
    accountCode: "4000",
    accountName: "Ingresos",
    accountType: "income" as const,
    level: 0,
  },
  {
    accountCode: "5000",
    accountName: "Gastos",
    accountType: "expense" as const,
    level: 0,
  },
];

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
