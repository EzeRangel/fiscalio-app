import "server-only";
import { getDB } from "@/db";
import { and, eq, gte, lt, desc } from "drizzle-orm";
import { invoices, taxDeclarations } from "@/db/schema";

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

  // 3. Get Income/Expense data for that period
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  const periodInvoices = await db
    .select({
      invoiceType: invoices.invoiceType,
      total: invoices.total,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.organizationId, organizationId),
        gte(invoices.invoiceDate, startDate),
        lt(invoices.invoiceDate, endDate)
      )
    );

  let totalIncome = 0;
  let incomeInvoiceCount = 0;
  let totalExpenses = 0;
  let expenseInvoiceCount = 0;
  const netAmount =
    (Number(declarationForPeriod?.totalIncome) || 0) -
    (Number(declarationForPeriod?.deductibleExpenses) || 0);

  for (const invoice of periodInvoices) {
    if (invoice.invoiceType === "income") {
      totalIncome += parseFloat(invoice.total);
      incomeInvoiceCount++;
    } else if (invoice.invoiceType === "expense") {
      totalExpenses += parseFloat(invoice.total);
      expenseInvoiceCount++;
    }
  }

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
      incomeInvoiceCount,
      totalExpenses,
      expenseInvoiceCount,
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

  // AI Validations placeholder
  // const aiValidations = [
  //   { severity: "warning", message: "12 facturas sin clasificar" },
  //   { severity: "warning", message: "IVA difiere 3% del esperado" },
  //   { severity: "error", message: "Gastos de comida exceden límite" },
  // ];

  return {
    ...declaration,
    aiValidations: [], // Add the placeholder validations
  };
}
