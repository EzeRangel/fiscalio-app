# Implementation Plan: Fiscal Logic Validations (RESICO Specific)

This plan implements strict fiscal validations for the RESICO regime, including regime enforcement, ISR withholding checks, and exchange rate validation during the invoice processing pipeline.

## Phase 1: Core Validation Logic (Library & Logic)
This phase focuses on implementing the pure validation functions and integrating them into the existing CFDI parser/processor.

- [ ] Task: Define Zod schema updates for `validation_errors` in the database if needed.
- [ ] Task: Create `src/lib/fiscal-validation/resico.ts` with validation functions.
    - [ ] Write tests for `validateResicoRegime` (Income/Expense checks).
    - [ ] Implement `validateResicoRegime`.
    - [ ] Write tests for `validateIsrWithholding` (1.25% check for legal entities).
    - [ ] Implement `validateIsrWithholding`.
    - [ ] Write tests for `validateExchangeRate` (non-MXN checks).
    - [ ] Implement `validateExchangeRate`.
- [ ] Task: Integrate validations into the invoice processing pipeline (`src/lib/cfdi-parser.ts` or relevant action).
    - [ ] Write integration tests for the parsing pipeline ensuring non-RESICO invoices are rejected.
    - [ ] Implement the rejection logic in the parser/action.
    - [ ] Write integration tests ensuring ISR and Currency errors are captured in `validation_errors`.
    - [ ] Implement the error capturing logic.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Core Validation Logic' (Protocol in workflow.md)

## Phase 2: UI Enhancements (Invoice Details & Upload Feedback)
This phase focuses on displaying the validation results to the user.

- [ ] Task: Update the invoice details component to display visual flags and error messages.
    - [ ] Write tests for the `InvoiceDetails` component to ensure it renders "Fix Required" flags based on `validation_errors`.
    - [ ] Implement the UI changes in `src/components/invoices/invoice-details.tsx` (or equivalent).
- [ ] Task: Enhance the upload feedback to show immediate errors for non-RESICO invoices.
    - [ ] Write tests for the uploader component handling rejection errors.
    - [ ] Implement error toast/feedback in `src/components/cfdi-uploader.tsx`.
- [ ] Task: Update dashboard/reporting queries to exclude invoices with high-priority validation errors.
    - [ ] Write tests for data fetching logic (e.g., in `src/data/invoices.ts`) to ensure exclusion.
    - [ ] Update queries to filter out invoices with specific error codes in `validation_errors`.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: UI Enhancements' (Protocol in workflow.md)
