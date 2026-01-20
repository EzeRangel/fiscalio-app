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

// Re-export constants for convenience if needed, or keep them separate.
export * from "./constants";
