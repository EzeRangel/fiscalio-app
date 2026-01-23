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
      message: "El monto de la aplicación debe ser mayor a cero para mantener registros válidos.",
      field: "amount",
    });
  }

  // ALL-02: Allocation invoice must not be cancelled
  if (invoice.status === "cancelled") {
    errors.push({
      code: FISCAL_VALIDATION_RULES.ALLOCATION.INVOICE_NOT_CANCELLED,
      message: "No se sugieren aplicaciones a facturas que figuran como canceladas.",
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
      message: "El total de las aplicaciones registradas excedería el monto total de la factura. Favor de revisar los saldos.",
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
      message: "El total de las aplicaciones excedería el monto disponible en el pago. Se sugiere verificar los montos.",
      field: "amount",
    });
  }

  // ALL-05 is structural/derived.

  // ALL-06 is about editability (logic layer check, not valid value check).

  // ALL-07: Payment date cannot be earlier than Invoice date
  // We compare only the date part to allow same-day payments regardless of time.
  if (invoice.invoiceDate) {
    const invDate = new Date(invoice.invoiceDate);
    const payDate = new Date(payment.paymentDate);

    // Reset time to midnight for comparison
    invDate.setHours(0, 0, 0, 0);
    payDate.setHours(0, 0, 0, 0);

    if (payDate < invDate) {
      errors.push({
        code: FISCAL_VALIDATION_RULES.ALLOCATION.DATE_MISMATCH,
        message: "La fecha de pago es anterior a la fecha de la factura. Se sugiere revisar la consistencia de las fechas.",
        field: "payment.paymentDate",
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
