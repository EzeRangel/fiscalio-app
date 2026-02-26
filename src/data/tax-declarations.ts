import "server-only";
import { getDB } from "@/db";
import { and, eq, gte, lt, desc, sql, inArray } from "drizzle-orm";
import {
  invoices,
  taxDeclarations,
  paymentAllocations,
  payments,
} from "@/db/schema";
import {
  calculateCashBasisSummary,
  getEffectiveExchangeRate,
  getTaxClassification,
} from "@/lib/cash-basis-utils";
import { calculateISR_RESICO } from "@/lib/tax-calculations";

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
      eq(taxDeclarations.fiscalPeriod, fiscalPeriodToDeclare),
    ),
  });

  let totalIncome = 0;
  let totalExpenses = 0;
  let netAmount = 0;
  let incomeInvoiceCount = 0;
  let expenseInvoiceCount = 0;
  let estimatedTax = 0;
  let ivaBalance = 0;

  if (declarationForPeriod) {
    totalIncome = parseFloat(declarationForPeriod.totalIncome);
    totalExpenses = parseFloat(declarationForPeriod.totalExpenses);
    netAmount = parseFloat(declarationForPeriod.isrBase || "0");
    estimatedTax = parseFloat(declarationForPeriod.isrCalculated || "0");
    ivaBalance = parseFloat(declarationForPeriod.ivaBalance || "0");
  }

  // 3. Detailed Calculation (Fallback or Verification)
  // We run this to get the invoice counts (which aren't stored in declaration)
  // and to provide fallback values if declaration is missing.

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  const periodPayments = await db.query.payments.findMany({
    where: and(
      eq(payments.organizationId, organizationId),
      gte(payments.paymentDate, startDate),
      lt(payments.paymentDate, endDate),
    ),
    columns: { id: true },
  });

  const paymentIds = periodPayments.map((p) => p.id);

  let calcTotalIncome = 0;
  let calcTotalIncomeSubtotal = 0;
  let calcTotalExpenses = 0;
  let calcDeductibleExpenses = 0;
  let calcIvaCharged = 0;
  let calcIvaCreditable = 0;
  let calcIsrWithheld = 0;

  const incomeInvoiceIds = new Set<number>();
  const expenseInvoiceIds = new Set<number>();

  if (paymentIds.length > 0) {
    const rawAllocations = await db.query.paymentAllocations.findMany({
      where: inArray(paymentAllocations.paymentId, paymentIds),
      with: {
        invoice: {
          with: {
            account: true,
            items: {
              with: {
                taxes: true,
              },
            },
          },
        },
      },
    });

    // Group by invoice to avoid double counting if multiple payments for same invoice
    const allocationsByInvoice = new Map<number, any[]>();
    for (const item of rawAllocations) {
      if (!allocationsByInvoice.has(item.invoiceId)) {
        allocationsByInvoice.set(item.invoiceId, []);
      }
      allocationsByInvoice.get(item.invoiceId)!.push(item);
    }

    for (const [invoiceId, items] of allocationsByInvoice.entries()) {
      const firstItem = items[0];
      const fullInvoice = firstItem.invoice;

      if (!fullInvoice) continue;

      // Flatten taxes
      const allTaxes = fullInvoice.items.flatMap((item: any) =>
        item.taxes.map((t: any) => ({
          taxType: t.taxType,
          taxCode: t.taxCode,
          rate: t.rate,
          amount: t.taxAmount,
        })),
      );

      const invoiceAllocations = items.map((i: any) => {
        const finalRate = getEffectiveExchangeRate(
          fullInvoice.currency,
          i.exchangeRate,
          fullInvoice.exchangeRate,
        );

        return {
          amountAllocated: i.amountAllocated,
          exchangeRate: finalRate,
          invoice: {
            total: fullInvoice.total,
            subtotal: fullInvoice.subtotal,
            taxes: allTaxes,
          },
        };
      });

      const summary = calculateCashBasisSummary(invoiceAllocations);

      const isDeductible = fullInvoice.account?.isDeductible || false;
      const deductionPercentage = parseFloat(
        fullInvoice.account?.deductionPercentage || "100.00",
      );

      // Only deductible amount of what was PAID
      const deductibleAmount = isDeductible
        ? summary.subtotalPaid * (deductionPercentage / 100)
        : 0;

      const { category, multiplier } = getTaxClassification(
        fullInvoice.invoiceType,
      );

      if (category === "income") {
        calcTotalIncome += summary.totalPaid * multiplier;
        calcTotalIncomeSubtotal += summary.subtotalPaid * multiplier;
        incomeInvoiceIds.add(invoiceId);

        // IVA Charged
        for (const tax of summary.taxBreakdown) {
          if (tax.taxCode === "002" && tax.taxType === "transferred") {
            calcIvaCharged += tax.amount * multiplier;
          } else if (tax.taxCode === "001" && tax.taxType === "withheld") {
            calcIsrWithheld += tax.amount * multiplier;
          }
        }
      } else if (category === "expense") {
        calcTotalExpenses += summary.totalPaid * multiplier;
        expenseInvoiceIds.add(invoiceId);

        const ivaAccreditationPercentage = parseFloat(
          fullInvoice.account?.ivaAccreditationPercentage || "0.00"
        );

        if (isDeductible) {
          calcDeductibleExpenses += deductibleAmount * multiplier;
        }

        // IVA Creditable (based on accreditation percentage, regardless of ISR deductibility)
        for (const tax of summary.taxBreakdown) {
          if (tax.taxCode === "002" && tax.taxType === "transferred") {
            calcIvaCreditable +=
              tax.amount * (ivaAccreditationPercentage / 100) * multiplier;
          }
        }
      }
    }
  }

  incomeInvoiceCount = incomeInvoiceIds.size;
  expenseInvoiceCount = expenseInvoiceIds.size;

  if (!declarationForPeriod) {
    totalIncome = calcTotalIncome;
    totalExpenses = calcTotalExpenses;
    // In RESICO, ISR Base is typically just Gross Income (Subtotal).
    const isrBase = calcTotalIncomeSubtotal;
    netAmount = isrBase;

    const calculatedIsr = calculateISR_RESICO(isrBase, "monthly");
    estimatedTax = Math.max(0, calculatedIsr - calcIsrWithheld);

    ivaBalance = calcIvaCharged - calcIvaCreditable;
  }

  // 4. Get History
  const history = await db.query.taxDeclarations.findMany({
    where: and(
      eq(taxDeclarations.organizationId, organizationId),
      eq(taxDeclarations.status, "filed"), // Only show filed declarations in history
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
      incomeInvoiceCount,
      expenseInvoiceCount,
      estimatedTax,
      ivaBalance,
    },
    history,
  };
}

export async function getTaxDeclarationById(
  declarationId: number,
  organizationId: number,
) {
  const { db } = await getDB();

  const declaration = await db.query.taxDeclarations.findFirst({
    where: and(
      eq(taxDeclarations.id, declarationId),
      eq(taxDeclarations.organizationId, organizationId),
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
