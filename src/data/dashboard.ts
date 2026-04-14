import "server-only";

import { and, eq, gte, lte, sql, inArray, desc } from "drizzle-orm";
import {
  getDB,
  invoices,
  paymentAllocations,
  payments,
  taxDeclarations,
} from "@/db";
import { DashboardMetrics, PeriodSelection } from "@/types/dashboard";
import { parse } from "date-fns";

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

  // Cash-Basis Income: sum of payment_allocations where invoice_type IN ('income', 'credit_note_received')
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
        inArray(invoices.invoiceType, ["income", "credit_note_received"]),
        gte(payments.paymentDate, startOfMonth),
        lte(payments.paymentDate, endOfMonth),
        eq(invoices.status, "active"),
      ),
    );

  // Cash-Basis Expenses: sum of payment_allocations where invoice_type IN ('expense', 'credit_note_issued')
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
        inArray(invoices.invoiceType, ["expense", "credit_note_issued"]),
        gte(payments.paymentDate, startOfMonth),
        lte(payments.paymentDate, endOfMonth),
        eq(invoices.status, "active"),
      ),
    );

  const income = Number(incomeResult[0]?.total || 0);
  const expenses = Number(expenseResult[0]?.total || 0);

  let nextDeclarationDate = new Date(period.year, period.month + 1, 17);

  const [lastDeclaration] = await db
    .select()
    .from(taxDeclarations)
    .where(eq(taxDeclarations.organizationId, organizationId))
    .orderBy(desc(taxDeclarations.id))
    .limit(1);

  if (lastDeclaration.status !== "filed") {
    const declaration = parse(
      lastDeclaration.fiscalPeriod,
      "yyyy-MM",
      new Date(),
    );
    nextDeclarationDate = declaration;
  }

  return {
    income,
    expenses,
    nextDeclarationDate,
  };
}
