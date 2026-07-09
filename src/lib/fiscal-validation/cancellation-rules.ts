import { FISCAL_VALIDATION_RULES } from "./constants";
import { FiscalInvoice, FiscalValidationError, FiscalValidationResult } from "./types";

export function validateCancellation(
  invoice: FiscalInvoice,
  request: {
    reasonCode: "01" | "02" | "03" | "04";
    substituteInvoiceUuid?: string | null;
  },
  refunds: { amount: number | string }[] = []
): FiscalValidationResult {
  const errors: FiscalValidationError[] = [];

  // INT-CAN-02: Motivo 01 sin substituteInvoiceId (UUID)
  if (request.reasonCode === "01") {
    if (!request.substituteInvoiceUuid || request.substituteInvoiceUuid.trim() === "") {
      errors.push({
        code: FISCAL_VALIDATION_RULES.CANCELLATION.MISSING_SUBSTITUTE,
        message: "Las cancelaciones por motivo 01 requieren especificar el UUID de la factura sustituta.",
        severity: "error",
        field: "substituteInvoiceUuid",
      });
    }
  }

  // INT-CAN-01: Cancelación con pagos sin refund (RESICO)
  if (request.reasonCode === "03") {
    const amountPaid =
      typeof invoice.amountPaid === "string"
        ? parseFloat(invoice.amountPaid)
        : invoice.amountPaid || 0;

    if (amountPaid > 0) {
      const totalRefunded = refunds.reduce((sum, refund) => {
        const val =
          typeof refund.amount === "string"
            ? parseFloat(refund.amount)
            : refund.amount || 0;
        return sum + val;
      }, 0);

      // If the sum of refunds is less than what was paid, trigger the rule
      if (totalRefunded < amountPaid - 0.001) {
        errors.push({
          code: FISCAL_VALIDATION_RULES.CANCELLATION.UNPAID_REFUND,
          message: "No se puede cancelar una factura cobrada con motivo 03 sin registrar devoluciones equivalentes al monto cobrado.",
          severity: "error",
          field: "refunds",
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
