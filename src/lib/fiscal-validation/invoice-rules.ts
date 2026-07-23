import {
  FiscalInvoice,
  FiscalValidationResult,
  FISCAL_VALIDATION_RULES,
  FiscalValidationError,
} from "./types";

const NON_COMMERCIAL_CFDI_TYPES = new Set(["P", "T", "N"]);

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

  const isNonCommercial = invoice.cfdiType ? NON_COMMERCIAL_CFDI_TYPES.has(invoice.cfdiType) : false;

  // INV-02: A cancelled invoice cannot accept new payment allocations. Applies to ALL cfdiTypes.
  if (invoice.status === "cancelled" && allocations.length > 0) {
    errors.push({
      code: FISCAL_VALIDATION_RULES.INTEGRITY.INVOICE_CANCELLED_NO_ALLOCATIONS,
      message:
        "Una factura cancelada no debería tener aplicaciones de pago activas en los registros.",
      severity: "error",
      field: "status",
    });
  }

  // Skip commercial integrity checks for non-commercial CFDI types (P, T, N)
  if (!isNonCommercial) {
    // INV-03: Total allocated amount <= invoice.total
    if (amountPaid > total + 0.001) {
      errors.push({
        code: FISCAL_VALIDATION_RULES.INTEGRITY.INVOICE_ALLOCATION_LIMIT,
        message: "El monto pagado excede el total de la factura. Favor de revisar la consistencia de los datos registrados.",
        severity: "error",
        field: "amountPaid",
      });
    }

    if (allocatedSum > total + 0.001) {
       const alreadyReported = errors.some(e => e.code === FISCAL_VALIDATION_RULES.INTEGRITY.INVOICE_ALLOCATION_LIMIT);
       if (!alreadyReported) {
          errors.push({
              code: FISCAL_VALIDATION_RULES.INTEGRITY.INVOICE_ALLOCATION_LIMIT,
              message: "La suma de las aplicaciones excede el total de la factura. Se sugiere verificar los montos.",
              severity: "error",
              field: "allocations",
          });
       }
    }

    // INV-04: Payment status is always derived
    if (invoice.paymentStatus === "paid" && amountPaid < total - 0.001) {
      errors.push({
        code: FISCAL_VALIDATION_RULES.INTEGRITY.INVOICE_PAYMENT_STATUS_DERIVED,
        message: "La factura figura como pagada pero el monto registrado es menor al total. Favor de verificar la información.",
        severity: "error",
        field: "paymentStatus",
      });
    }

    if (invoice.paymentStatus === "pending" && amountPaid > 0.001) {
        errors.push({
          code: FISCAL_VALIDATION_RULES.INTEGRITY.INVOICE_PAYMENT_STATUS_DERIVED,
          message: "La factura figura como pendiente pero tiene pagos registrados. Se sugiere revisar el estado de pago.",
          severity: "error",
          field: "paymentStatus",
        });
    }

    if (invoice.paymentStatus === "partial" && Math.abs(amountPaid - total) < 0.001) {
        errors.push({
          code: FISCAL_VALIDATION_RULES.INTEGRITY.INVOICE_PAYMENT_STATUS_DERIVED,
          message: "La factura figura como parcial pero parece estar pagada en su totalidad.",
          severity: "error",
          field: "paymentStatus",
        });
    }

    // INT-INV-06: Tax Base Consistency (Items sum matches subtotal)
    const taxBaseResult = validateTaxBaseConsistency(invoice);
    if (!taxBaseResult.isValid) {
      errors.push(...taxBaseResult.errors);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export interface ResicoRegimeParams {
  type: "income" | "expense";
  issuerRegime: string | null;
  receiverRegime: string | null;
}

/**
 * Validates that the invoice belongs to a RESICO (626) context.
 * For Income: Issuer must be 626.
 * For Expense: Receiver must be 626.
 */
export function validateResicoRegime(params: ResicoRegimeParams): FiscalValidationResult {
  const errors: FiscalValidationError[] = [];

  if (params.type === "income" && params.issuerRegime !== "626") {
    errors.push({
      code: FISCAL_VALIDATION_RULES.INTEGRITY.INVOICE_NON_RESICO_REGIME,
      message: "El emisor del CFDI de ingreso debe estar bajo el régimen RESICO (626).",
      severity: "error",
      field: "issuerRegime",
    });
  } else if (params.type === "expense" && params.receiverRegime !== "626") {
    errors.push({
      code: FISCAL_VALIDATION_RULES.INTEGRITY.INVOICE_NON_RESICO_REGIME,
      message: "El receptor del CFDI de egreso debe ser una organización RESICO (626).",
      severity: "error",
      field: "receiverRegime",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export interface IsrWithholdingParams {
  cfdiType: string;
  receiverRfc: string;
  taxes: { taxType: "transferred" | "withheld", taxCode: string, rate: string }[];
}

/**
 * Validates 1.25% ISR withholding for legal entity receivers on income invoices.
 */
export function validateIsrWithholding(params: IsrWithholdingParams): FiscalValidationResult {
  const errors: FiscalValidationError[] = [];

  // Logic: If Receptor.Rfc length is 12 (Legal Entity) AND TipoDeComprobante is "I" (Income).
  if (params.receiverRfc.length === 12 && params.cfdiType === "I") {
    const isrWithholding = params.taxes.find(
      t => t.taxType === "withheld" && t.taxCode === "001"
    );

    if (!isrWithholding || Math.abs(parseFloat(isrWithholding.rate) - 0.0125) > 0.00001) {
      errors.push({
        code: FISCAL_VALIDATION_RULES.USER_FACING.INVOICE_MISSING_ISR_WITHHOLDING,
        message: "Falta la retención de ISR del 1.25% requerida para operaciones con personas morales.",
        severity: "warning",
        field: "taxes",
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export interface ExchangeRateParams {
  currency: string;
  exchangeRate: number | string | undefined;
}

/**
 * Validates that foreign currency invoices have a valid exchange rate (> 1.0).
 */
export function validateExchangeRate(params: ExchangeRateParams): FiscalValidationResult {
  const errors: FiscalValidationError[] = [];

  // Currency "XXX" indicates no monetary value (used by P, T, N CFDIs). No exchange rate needed.
  if (params.currency === "XXX") {
    return { isValid: true, errors: [] };
  }

  if (params.currency !== "MXN") {
    const rate = typeof params.exchangeRate === "string" ? parseFloat(params.exchangeRate) : params.exchangeRate;

    if (!rate || rate <= 1.0) {
      errors.push({
        code: FISCAL_VALIDATION_RULES.USER_FACING.INVOICE_INVALID_EXCHANGE_RATE,
        message: "El tipo de cambio debe ser mayor a 1.0 para facturas en moneda extranjera.",
        severity: "warning",
        field: "exchangeRate",
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates that the sum of item subtotals minus discounts equals the invoice subtotal.
 * Logic: Math.abs((SUM(items.subtotal) - SUM(items.discount)) - invoice.subtotal) < 0.01
 */
export function validateTaxBaseConsistency(invoice: FiscalInvoice): FiscalValidationResult {
  const errors: FiscalValidationError[] = [];

  if (!invoice.items || invoice.items.length === 0) {
    return { isValid: true, errors: [] };
  }

  const invoiceSubtotal =
    typeof invoice.subtotal === "string"
      ? (parseFloat(invoice.subtotal) || 0)
      : (invoice.subtotal || 0);

  const itemsNetTotal = invoice.items.reduce((sum, item) => {
    const subtotal =
      typeof item.subtotal === "string"
        ? (parseFloat(item.subtotal) || 0)
        : (item.subtotal || 0);
    const discount =
      typeof item.discount === "string"
        ? (parseFloat(item.discount || "0") || 0)
        : (item.discount || 0);
    return sum + (subtotal - discount);
  }, 0);

  if (Math.abs(itemsNetTotal - (invoiceSubtotal as number)) > 0.01) {
    errors.push({
      code: FISCAL_VALIDATION_RULES.INTEGRITY.INVOICE_SUBTOTAL_INCONSISTENCY,
      message:
        "La suma de los subtotales de los conceptos menos descuentos no coincide con el subtotal de la factura.",
      severity: "error",
      field: "subtotal",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
