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
  invoice: {
    total: string | number;
    subtotal: string | number;
    taxes?: TaxInfo[]; // Granular tax info
    totalTaxes?: string | number | null; // Fallback
    totalWithholdings?: string | number | null; // Fallback
  };
}

/**
 * Calculates a summary of paid amounts based on payment allocations.
 * It applies a proportional calculation for each allocation based on the invoice's total.
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
    const amountAllocated = parseFloat(allocation.amountAllocated.toString());
    const invoiceTotal = parseFloat(allocation.invoice.total.toString());

    if (invoiceTotal === 0) continue;

    const ratio = amountAllocated / invoiceTotal;

    summary.totalPaid += amountAllocated;
    summary.subtotalPaid +=
      parseFloat(allocation.invoice.subtotal.toString()) * ratio;

    // Process granular taxes if available
    if (allocation.invoice.taxes && allocation.invoice.taxes.length > 0) {
      for (const tax of allocation.invoice.taxes) {
        const taxAmount = parseFloat(tax.amount.toString()) * ratio;
        
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
        parseFloat((allocation.invoice.totalTaxes ?? 0).toString()) * ratio;
      summary.withholdingsPaid +=
        parseFloat((allocation.invoice.totalWithholdings ?? 0).toString()) * ratio;
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