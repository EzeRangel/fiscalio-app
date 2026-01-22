import {
  FiscalAllocationContext,
  FiscalValidationResult,
  FISCAL_VALIDATION_RULES,
  FiscalValidationError,
} from "./types";

export function validateAllocation(context: FiscalAllocationContext): FiscalValidationResult {
  const errors: FiscalValidationError[] = [];
  const { allocation, invoice, payment, existingAllocationsForInvoice = [], existingAllocationsForPayment = [] } = context;

  const amount = typeof allocation.amount === "string" ? parseFloat(allocation.amount) : allocation.amount;
  const invoiceTotal = typeof invoice.total === "string" ? parseFloat(invoice.total) : invoice.total;
  const paymentAmount = typeof payment.amount === "string" ? parseFloat(payment.amount) : payment.amount;

  // ALL-01: allocation.amount_allocated > 0
  if (amount <= 0) {
    errors.push({
      code: FISCAL_VALIDATION_RULES.ALLOCATION.POSITIVE_AMOUNT,
      message: "Allocation amount must be positive.",
      field: "amount",
    });
  }

  // ALL-02: Allocation invoice must not be cancelled
  if (invoice.status === "cancelled") {
    errors.push({
      code: FISCAL_VALIDATION_RULES.ALLOCATION.INVOICE_NOT_CANCELLED,
      message: "Cannot allocate to a cancelled invoice.",
      field: "invoice.status",
    });
  }

  // ALL-03: Allocation sum per invoice <= invoice.total
  const existingInvoiceAllocSum = existingAllocationsForInvoice.reduce((sum, alloc) => {
     // Exclude current allocation if it's being updated (not handled here, assuming creating new or adding)
     // If we are validating an UPDATE, we need to know the ID to exclude. 
     // Assuming for now this is "add new" validation or "check consistency".
     // If existingAllocations includes the current one (updated), we'd double count. 
     // The context implies "existing" means *other* allocations or *previous state*.
     // Let's assume existingAllocationsForInvoice are committed allocations.
     const val = typeof alloc.amount === "string" ? parseFloat(alloc.amount) : alloc.amount;
     return sum + val;
  }, 0);

  if (existingInvoiceAllocSum + amount > invoiceTotal + 0.001) {
    errors.push({
      code: FISCAL_VALIDATION_RULES.ALLOCATION.INVOICE_SUM_LIMIT,
      message: "Total allocations for invoice exceed invoice total.",
      field: "amount",
    });
  }

  // ALL-04: Allocation sum per payment <= payment.amount
  const existingPaymentAllocSum = existingAllocationsForPayment.reduce((sum, alloc) => {
     const val = typeof alloc.amount === "string" ? parseFloat(alloc.amount) : alloc.amount;
     return sum + val;
  }, 0);

  if (existingPaymentAllocSum + amount > paymentAmount + 0.001) {
    errors.push({
      code: FISCAL_VALIDATION_RULES.ALLOCATION.PAYMENT_SUM_LIMIT,
      message: "Total allocations for payment exceed payment amount.",
      field: "amount",
    });
  }

  // ALL-05 is structural/derived.

  // ALL-06 is about editability (logic layer check, not valid value check).

  // ALL-07: Payment date cannot be earlier than Invoice date
  if (invoice.invoiceDate && payment.paymentDate < invoice.invoiceDate) {
    errors.push({
      code: FISCAL_VALIDATION_RULES.ALLOCATION.DATE_MISMATCH,
      message: "Payment date cannot be earlier than invoice date.",
      field: "payment.paymentDate",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
