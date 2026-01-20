import {
  FiscalPayment,
  FiscalValidationResult,
  FISCAL_VALIDATION_RULES,
  FiscalValidationError,
} from "./types";

export function validatePayment(payment: FiscalPayment): FiscalValidationResult {
  const errors: FiscalValidationError[] = [];
  const amount =
    typeof payment.amount === "string"
      ? parseFloat(payment.amount)
      : payment.amount;

  // PAY-01: payment.amount > 0
  if (amount <= 0) {
    errors.push({
      code: FISCAL_VALIDATION_RULES.PAYMENT.POSITIVE_AMOUNT,
      message: "Payment amount must be positive.",
      field: "amount",
    });
  }

  // PAY-02: payment.payment_date <= current system date
  // We compare dates strictly (ignoring time if possible, or spec implies strict timestamp).
  // Spec says "no future payments".
  // Let's assume day granularity or strict now().
  // If paymentDate is > now.
  const now = new Date();
  // Reset time part of now to end of day to allow same-day payments if just date is stored?
  // Schema has timestamp.
  // If user picks "today", the time might be 00:00:00.
  // We should probably allow "today" up to the end of the day or just strict timestamp comparison.
  // "Future-dated payments" usually implies DATE > TODAY.
  // Let's compare timestamps. If paymentDate is > now + buffer (e.g. 5 mins for clock skew).
  // Or just strict.
  if (payment.paymentDate > now) {
     errors.push({
      code: FISCAL_VALIDATION_RULES.PAYMENT.NO_FUTURE_DATE,
      message: "Payment date cannot be in the future.",
      field: "paymentDate",
    });
  }

  // PAY-03: SUM(allocations.amount_allocated) <= payment.amount
  const allocations = payment.allocations || [];
  const allocatedSum = allocations.reduce((sum, alloc) => {
    const val = typeof alloc.amount === "string" ? parseFloat(alloc.amount) : alloc.amount;
    return sum + val;
  }, 0);

  if (allocatedSum > amount + 0.001) {
    errors.push({
      code: FISCAL_VALIDATION_RULES.PAYMENT.ALLOCATION_SUM_LIMIT,
      message: "Sum of allocations exceeds payment amount.",
      field: "allocations",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
