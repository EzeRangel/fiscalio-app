import "server-only";
import { getDB } from "@/db";
import { and, eq, gte, lt, desc, sql } from "drizzle-orm";
import { invoices, taxDeclarations, paymentAllocations, payments } from "@/db/schema";

export async function getTaxDeclarationsDashboardData(organizationId: number) {
  const { db } = await getDB();

  // 1. Determine the fiscal period to be declared (previous month)
  const now = new Date();
  now.setDate(1); // Go to the first of the current month
  now.setMonth(now.getMonth() - 1); // Go back one month

  const year = now.getFullYear();
  const month = now.getMonth() + 1; // JS month is 0-indexed
  const fiscalPeriodToDeclare = `${year}-${month.toString().padStart(2, "0")}`;

  // 2. Get Declaration Status for the period to declare
  const declarationForPeriod = await db.query.taxDeclarations.findFirst({
    where: and(
      eq(taxDeclarations.organizationId, organizationId),
      eq(taxDeclarations.fiscalPeriod, fiscalPeriodToDeclare)
    ),
  });

  // 3. Get Cash-Basis Income/Expense data for that period
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  // We calculate paid amounts proportionally based on subtotal for reporting
  const periodResults = await db
    .select({
      invoiceType: invoices.invoiceType,
      paidAmount: sql<number>`sum(${paymentAllocations.amountAllocated})`.mapWith(Number),
      // For a simplified preview, we use the amountAllocated. 
      // In the real declaration creation, we use the proportional subtotal.
      // To keep preview consistent, let's try to get a better approximation if possible, 
      // or just show the paid total.
    })
    .from(paymentAllocations)
    .innerJoin(payments, eq(paymentAllocations.paymentId, payments.id))
    .innerJoin(invoices, eq(paymentAllocations.invoiceId, invoices.id))
    .where(
      and(
        eq(payments.organizationId, organizationId),
        gte(payments.paymentDate, startDate),
        lt(payments.paymentDate, endDate)
      )
    )
    .groupBy(invoices.invoiceType);

  let totalIncome = 0;
  let totalExpenses = 0;

  periodResults.forEach(row => {
    if (row.invoiceType === "income") {
        totalIncome = row.paidAmount || 0;
    } else if (row.invoiceType === "expense") {
        totalExpenses = row.paidAmount || 0;
    }
  });

  const netAmount =
    (Number(declarationForPeriod?.totalIncome) || 0) -
    (Number(declarationForPeriod?.deductibleExpenses) || 0);

  // 4. Get History
  const history = await db.query.taxDeclarations.findMany({
    where: and(
      eq(taxDeclarations.organizationId, organizationId),
      eq(taxDeclarations.status, "filed") // Only show filed declarations in history
    ),
    orderBy: [desc(taxDeclarations.fiscalPeriod)],
    limit: 12, // Last 12 months
  });

  return {
    currentPeriod: {
      period: fiscalPeriodToDeclare,
      declaration: declarationForPeriod, // Pass the whole object (or null)
      totalIncome,
      totalExpenses,
      netAmount,
    },
    history,
  };
}

export async function getTaxDeclarationById(
  declarationId: number,
  organizationId: number
) {
  const { db } = await getDB();

  const declaration = await db.query.taxDeclarations.findFirst({
    where: and(
      eq(taxDeclarations.id, declarationId),
      eq(taxDeclarations.organizationId, organizationId)
    ),
    with: {
      declarationInvoices: {
        with: {
          invoice: {
            with: {
              businessPartner: true,
            },
          },
        },
      },
    },
  });

  if (!declaration) {
    return null;
  }

  return {
    ...declaration,
    aiValidations: [], // Add the placeholder validations
  };
}