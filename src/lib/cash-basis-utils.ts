export interface CashBasisSummary {
  totalPaid: number;
  subtotalPaid: number;
  taxesPaid: number;
  withholdingsPaid: number;
}

interface AllocationWithInvoice {
  amountAllocated: string | number;
  invoice: {
    total: string | number;
    subtotal: string | number;
    totalTaxes?: string | number | null;
    totalWithholdings?: string | number | null;
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
  };

  for (const allocation of allocations) {
    const amountAllocated = parseFloat(allocation.amountAllocated.toString());
    const invoiceTotal = parseFloat(allocation.invoice.total.toString());

    if (invoiceTotal === 0) continue;

    const ratio = amountAllocated / invoiceTotal;

    summary.totalPaid += amountAllocated;
    summary.subtotalPaid +=
      parseFloat(allocation.invoice.subtotal.toString()) * ratio;
    summary.taxesPaid +=
      parseFloat((allocation.invoice.totalTaxes ?? 0).toString()) * ratio;
    summary.withholdingsPaid +=
      parseFloat((allocation.invoice.totalWithholdings ?? 0).toString()) * ratio;
  }

  // Round to 2 decimal places to avoid floating point precision issues
  return {
    totalPaid: Math.round(summary.totalPaid * 100) / 100,
    subtotalPaid: Math.round(summary.subtotalPaid * 100) / 100,
    taxesPaid: Math.round(summary.taxesPaid * 100) / 100,
    withholdingsPaid: Math.round(summary.withholdingsPaid * 100) / 100,
  };
}
