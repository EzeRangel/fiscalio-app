import "server-only";

import { and, eq, gte, lte, sql } from "drizzle-orm";
import { getDB, invoices, paymentAllocations, payments } from "@/db";
import { DashboardMetrics, PeriodSelection } from "@/types/dashboard";

export async function getDashboardMetrics(
  organizationId: number,
  period: PeriodSelection,
): Promise<DashboardMetrics> {
  const { db } = await getDB();

  const startOfMonth = new Date(period.year, period.month, 1, 0, 0, 0, 0);
  const endOfMonth = new Date(
    period.year,
    period.month + 1,
    0,
    23,
    59,
    59,
    999,
  );

  // Cash-Basis Income: sum of payment_allocations where invoice_type = 'income'
  const incomeResult = await db
    .select({
      total: sql<string>`sum(
        ${paymentAllocations.amountAllocated} * 
        CASE 
          WHEN ${paymentAllocations.exchangeRate} = 1.0 AND ${invoices.currency} != 'MXN' 
          THEN ${invoices.exchangeRate} 
          ELSE ${paymentAllocations.exchangeRate} 
        END
      )`,
    })
    .from(paymentAllocations)
    .innerJoin(payments, eq(paymentAllocations.paymentId, payments.id))
    .innerJoin(invoices, eq(paymentAllocations.invoiceId, invoices.id))
    .where(
      and(
        eq(payments.organizationId, organizationId),
        eq(invoices.invoiceType, "income"),
        gte(payments.paymentDate, startOfMonth),
        lte(payments.paymentDate, endOfMonth),
      ),
    );

  // Cash-Basis Expenses: sum of payment_allocations where invoice_type = 'expense'
  const expenseResult = await db
    .select({
      total: sql<string>`sum(
        ${paymentAllocations.amountAllocated} * 
        CASE 
          WHEN ${paymentAllocations.exchangeRate} = 1.0 AND ${invoices.currency} != 'MXN' 
          THEN ${invoices.exchangeRate} 
          ELSE ${paymentAllocations.exchangeRate} 
        END
      )`,
    })
    .from(paymentAllocations)
    .innerJoin(payments, eq(paymentAllocations.paymentId, payments.id))
    .innerJoin(invoices, eq(paymentAllocations.invoiceId, invoices.id))
    .where(
      and(
        eq(payments.organizationId, organizationId),
        eq(invoices.invoiceType, "expense"),
        gte(payments.paymentDate, startOfMonth),
        lte(payments.paymentDate, endOfMonth),
      ),
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
