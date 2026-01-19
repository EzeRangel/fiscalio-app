import "server-only";

import { and, eq, gte, lte, sql } from "drizzle-orm";
import { getDB, invoices } from "@/db";
import { DashboardMetrics, PeriodSelection } from "@/types/dashboard";

export async function getDashboardMetrics(
  organizationId: number,
  period: PeriodSelection
): Promise<DashboardMetrics> {
  const { db } = await getDB();

  const startOfMonth = new Date(period.year, period.month, 1, 0, 0, 0, 0);
  const endOfMonth = new Date(period.year, period.month + 1, 0, 23, 59, 59, 999);

  const incomeResult = await db
    .select({
      total: sql<string>`sum(${invoices.total})`,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.organizationId, organizationId),
        eq(invoices.invoiceType, "income"),
        gte(invoices.invoiceDate, startOfMonth),
        lte(invoices.invoiceDate, endOfMonth)
      )
    );

  const expenseResult = await db
    .select({
      total: sql<string>`sum(${invoices.total})`,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.organizationId, organizationId),
        eq(invoices.invoiceType, "expense"),
        gte(invoices.invoiceDate, startOfMonth),
        lte(invoices.invoiceDate, endOfMonth)
      )
    );

  const income = Number(incomeResult[0]?.total || 0);
  const expenses = Number(expenseResult[0]?.total || 0);

  // Next tax declaration is usually the 17th of the following month
  const nextDeclarationDate = new Date(period.year, period.month + 1, 17);

  return {
    income,
    expenses,
    nextDeclarationDate,
  };
}
