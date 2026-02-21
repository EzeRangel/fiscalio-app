/**
 * Calculates the portion of a specific tax that is considered "paid" based on a payment allocation.
 *
 * @param amountAllocated - The amount from the payment allocated to this specific invoice.
 * @param invoiceTotal - The total amount of the invoice.
 * @param taxAmount - The total amount of the specific tax associated with an item.
 * @returns The prorated tax amount.
 */
export function calculatePaidTaxForItem(
  amountAllocated: number,
  invoiceTotal: number,
  taxAmount: number
): number {
  if (invoiceTotal === 0) {
    return 0;
  }

  // PaidAmount = (amountAllocated * taxAmount) / invoiceTotal
  // We multiply first to maintain precision before the division
  return (amountAllocated * taxAmount) / invoiceTotal;
}
