import { FiscalValidationRuleCode } from "./constants";

export interface FiscalValidationError {
  code: FiscalValidationRuleCode;
  message: string;
  field?: string;
}

export interface FiscalValidationResult {
  isValid: boolean;
  errors: FiscalValidationError[];
}

export interface FiscalAllocation {
  amount: number | string;
  paymentId?: number; // Optional for new allocations being validated
  invoiceId?: number;
}

export interface FiscalInvoice {
  id: number;
  total: number | string;
  amountPaid: number | string;
  paymentStatus: string;
  status: string; // active, cancelled
  allocations?: FiscalAllocation[];
}

// Re-export constants for convenience if needed, or keep them separate.
export * from "./constants";
