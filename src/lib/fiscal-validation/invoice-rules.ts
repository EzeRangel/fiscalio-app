import {
  FiscalInvoice,
  FiscalValidationResult,
  FISCAL_VALIDATION_RULES,
  FiscalValidationError,
} from "./types";

export function validateInvoice(invoice: FiscalInvoice): FiscalValidationResult {
  const errors: FiscalValidationError[] = [];

  const total =
    typeof invoice.total === "string"
      ? parseFloat(invoice.total)
      : invoice.total;
  const amountPaid =
    typeof invoice.amountPaid === "string"
      ? parseFloat(invoice.amountPaid)
      : invoice.amountPaid;

  const allocations = invoice.allocations || [];
  const allocatedSum = allocations.reduce((sum, alloc) => {
    const val = typeof alloc.amount === "string" ? parseFloat(alloc.amount) : alloc.amount;
    return sum + val;
  }, 0);

  // INV-03: Total allocated amount <= invoice.total
  // We check against amountPaid AND allocatedSum just to be sure, or just allocatedSum?
  // Spec says "Total allocated amount <= invoice.total".
  // Also check amountPaid consistency? Spec says amountPaid is derived.
  // We'll trust amountPaid is supposed to be the sum, but we check both if possible.
  // Let's assume amountPaid IS the sum of allocations in a consistent state.
  // If amountPaid > total, that's an error.
  if (amountPaid > total + 0.001) {
    errors.push({
      code: FISCAL_VALIDATION_RULES.INVOICE.ALLOCATION_LIMIT,
      message: "El monto pagado excede el total de la factura. Favor de revisar la consistencia de los datos registrados.",
      field: "amountPaid",
    });
  }

  if (allocatedSum > total + 0.001) {
     // Avoid double error if amountPaid is consistent with allocatedSum
     const alreadyReported = errors.some(e => e.code === FISCAL_VALIDATION_RULES.INVOICE.ALLOCATION_LIMIT);
     if (!alreadyReported) {
        errors.push({
            code: FISCAL_VALIDATION_RULES.INVOICE.ALLOCATION_LIMIT,
            message: "La suma de las aplicaciones excede el total de la factura. Se sugiere verificar los montos.",
            field: "allocations",
        });
     }
  }

  // INV-04: Payment status is always derived
  if (invoice.paymentStatus === "paid" && amountPaid < total - 0.001) {
    errors.push({
      code: FISCAL_VALIDATION_RULES.INVOICE.PAYMENT_STATUS_DERIVED,
      message: "La factura figura como pagada pero el monto registrado es menor al total. Favor de verificar la información.",
      field: "paymentStatus",
    });
  }

  if (invoice.paymentStatus === "pending" && amountPaid > 0.001) {
      errors.push({
        code: FISCAL_VALIDATION_RULES.INVOICE.PAYMENT_STATUS_DERIVED,
        message: "La factura figura como pendiente pero tiene pagos registrados. Se sugiere revisar el estado de pago.",
        field: "paymentStatus",
      });
  }

  if (invoice.paymentStatus === "partial" && Math.abs(amountPaid - total) < 0.001) {
      errors.push({
        code: FISCAL_VALIDATION_RULES.INVOICE.PAYMENT_STATUS_DERIVED,
        message: "La factura figura como parcial pero parece estar pagada en su totalidad.",
        field: "paymentStatus",
      });
  }


  // INV-02: A cancelled invoice cannot accept new payment allocations.
  // Interpreted as: validation fails if cancelled invoice has active allocations.
  if (invoice.status === "cancelled" && allocations.length > 0) {
    // Assuming allocations passed here are active ones.
    // If allocations have a status, we should check it, but the type doesn't have it yet.
    // Assuming passed allocations are "valid" existentially.
    errors.push({
        code: FISCAL_VALIDATION_RULES.INVOICE.CANCELLED_NO_ALLOCATIONS,
        message: "Una factura cancelada no debería tener aplicaciones de pago activas en los registros.",
        field: "status",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
