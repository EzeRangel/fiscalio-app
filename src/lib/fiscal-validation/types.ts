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

export interface FiscalAllocationContext {
  allocation: FiscalAllocation;
  invoice: FiscalInvoice;
  payment: FiscalPayment;
  existingAllocationsForInvoice?: FiscalAllocation[];
  existingAllocationsForPayment?: FiscalAllocation[];
}

export interface FiscalPayment {
  id: number;
  amount: number | string;
  paymentDate: Date;
  allocations?: FiscalAllocation[];
}

export interface FiscalInvoice {
  id: number;
  total: number | string;
  amountPaid: number | string;
  paymentStatus: string;
  status: string; // active, cancelled
  allocations?: FiscalAllocation[];
  invoiceDate?: Date; // Optional for backward compatibility/simplicity if not always available
}

// Re-export constants for convenience if needed, or keep them separate.
export * from "./constants";
