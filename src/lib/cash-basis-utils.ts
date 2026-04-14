import { calculatePaidTaxForItem } from "./proration-utils";

export interface TaxBreakdownItem {
  taxType: string;
  taxCode: string;
  rate: string;
  amount: number;
}

export interface CashBasisSummary {
  totalPaid: number;
  subtotalPaid: number;
  taxesPaid: number;
  withholdingsPaid: number;
  taxBreakdown: TaxBreakdownItem[];
}

interface TaxInfo {
  taxType: string; // 'transferred' | 'withheld'
  taxCode: string;
  rate: string | null;
  amount: string | number;
}

interface AllocationWithInvoice {
  amountAllocated: string | number;
  exchangeRate?: string | number | null;
  invoice: {
    total: string | number;
    subtotal: string | number;
    taxes?: TaxInfo[]; // Granular tax info
    totalTaxes?: string | number | null; // Fallback
    totalWithholdings?: string | number | null; // Fallback
  };
}

/**
 * Normalizes an amount to MXN using an exchange rate.
 * Defaults to 1.0 if no rate is provided.
 */
export function normalizeToMXN(
  amount: string | number,
  exchangeRate: string | number | null = 1.0
): number {
  const parsedAmount = parseFloat(amount.toString());
  if (isNaN(parsedAmount)) return 0;

  const rateToUse =
    exchangeRate !== null && exchangeRate !== undefined ? exchangeRate : 1.0;
  const parsedRate = parseFloat(rateToUse.toString());

  if (isNaN(parsedRate)) return parsedAmount;

  return parsedAmount * parsedRate;
}

/**
 * Classifies an invoice type for tax calculation purposes.
 * Returns the category (income/expense) and a multiplier (1 or -1) to apply to totals.
 */
export function getTaxClassification(invoiceType: string) {
  switch (invoiceType) {
    case "income":
      return { category: "income", multiplier: 1 };
    case "credit_note_issued":
      return { category: "income", multiplier: -1 };
    case "expense":
      return { category: "expense", multiplier: 1 };
    case "credit_note_received":
      return { category: "expense", multiplier: -1 };
    default:
      return { category: "other", multiplier: 0 };
  }
}

/**
 * Returns the date range for a given fiscal period (YYYY-MM).
 */
export function getPeriodDateRange(fiscalPeriod: string) {
  const [year, month] = fiscalPeriod.split("-").map(Number);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);
  return { startDate, endDate };
}

/**
 * Determines the effective exchange rate to use for a transaction.
 * If the currency is not MXN and the provided rate is effectively 1.0, 
 * it falls back to the invoice's exchange rate.
 */
export function getEffectiveExchangeRate(
  currency: string | null | undefined,
  providedRate: string | number | null | undefined,
  invoiceRate: string | number | null | undefined
): string {
  const currencyStr = currency || "MXN";
  const providedRateVal = parseFloat((providedRate ?? "1.0").toString()) || 1.0;
  const invoiceRateStr = (invoiceRate ?? "1.0").toString();

  if (currencyStr !== "MXN" && Math.abs(providedRateVal - 1.0) < 0.0001) {
    return invoiceRateStr;
  }

  return providedRateVal.toString();
}

/**
 * Calculates a summary of paid amounts based on payment allocations.
 * It applies a proportional calculation for each allocation based on the invoice's total.
 * All amounts are normalized to MXN using the allocation's exchange rate.
 */
export function calculateCashBasisSummary(
  allocations: AllocationWithInvoice[]
): CashBasisSummary {
  const summary: CashBasisSummary = {
    totalPaid: 0,
    subtotalPaid: 0,
    taxesPaid: 0,
    withholdingsPaid: 0,
    taxBreakdown: [],
  };

  const breakdownMap = new Map<string, TaxBreakdownItem>();

  for (const allocation of allocations) {
    const amountAllocated = parseFloat((allocation.amountAllocated ?? 0).toString());
    const invoiceTotal = parseFloat((allocation.invoice?.total ?? 0).toString());
    const exchangeRate = parseFloat((allocation.exchangeRate ?? 1.0).toString()) || 1.0;

    if (invoiceTotal === 0) continue;

    summary.totalPaid += amountAllocated * exchangeRate;
    summary.subtotalPaid +=
      calculatePaidTaxForItem(
        amountAllocated,
        invoiceTotal,
        parseFloat((allocation.invoice?.subtotal ?? allocation.invoice?.total ?? 0).toString())
      ) * exchangeRate;

    // Process granular taxes if available
    if (allocation.invoice?.taxes && allocation.invoice.taxes.length > 0) {
      for (const tax of allocation.invoice.taxes) {
        const taxAmount =
          calculatePaidTaxForItem(
            amountAllocated,
            invoiceTotal,
            parseFloat((tax.amount ?? 0).toString())
          ) * exchangeRate;
        
        // Aggregate totals
        if (tax.taxType === 'transferred') {
          summary.taxesPaid += taxAmount;
        } else if (tax.taxType === 'withheld') {
          summary.withholdingsPaid += taxAmount;
        }

        // Detailed breakdown
        // Key: type-code-rate
        const key = `${tax.taxType}-${tax.taxCode}-${tax.rate || '0'}`;
        
        if (!breakdownMap.has(key)) {
          breakdownMap.set(key, {
            taxType: tax.taxType,
            taxCode: tax.taxCode,
            rate: tax.rate || '0',
            amount: 0
          });
        }
        
        const item = breakdownMap.get(key)!;
        item.amount += taxAmount;
      }
    } else {
      // Fallback to simplistic calculation if no granular taxes provided
      summary.taxesPaid +=
        calculatePaidTaxForItem(
          amountAllocated,
          invoiceTotal,
          parseFloat((allocation.invoice.totalTaxes ?? 0).toString())
        ) * exchangeRate;
      summary.withholdingsPaid +=
        calculatePaidTaxForItem(
          amountAllocated,
          invoiceTotal,
          parseFloat((allocation.invoice.totalWithholdings ?? 0).toString())
        ) * exchangeRate;
    }
  }

  // Final rounding
  summary.totalPaid = round(summary.totalPaid);
  summary.subtotalPaid = round(summary.subtotalPaid);
  summary.taxesPaid = round(summary.taxesPaid);
  summary.withholdingsPaid = round(summary.withholdingsPaid);
  
  summary.taxBreakdown = Array.from(breakdownMap.values()).map(item => ({
    ...item,
    amount: round(item.amount)
  }));

  return summary;
}

function round(num: number): number {
  return Math.round(num * 100) / 100;
}