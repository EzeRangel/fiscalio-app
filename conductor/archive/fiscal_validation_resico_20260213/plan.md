# Implementation Plan: Fiscal Logic Validations (RESICO Specific)

This plan implements strict fiscal validations for the RESICO regime, including regime enforcement, ISR withholding checks, and exchange rate validation during the invoice processing pipeline.

## Phase 1: Core Validation Logic (Library & Logic)
This phase focuses on implementing the pure validation functions and integrating them into the existing CFDI parser/processor.

- [x] Task: Define Zod schema updates for `validation_errors` in the database if needed.
- [x] Task: Create `src/lib/fiscal-validation/resico.ts` with validation functions.
    - [x] Write tests for `validateResicoRegime` (Income/Expense checks).
    - [x] Implement `validateResicoRegime`.
    - [x] Write tests for `validateIsrWithholding` (1.25% check for legal entities).
    - [x] Implement `validateIsrWithholding`.
    - [x] Write tests for `validateExchangeRate` (non-MXN checks).
    - [x] Implement `validateExchangeRate`.
- [ ] Task: Integrate validations into the invoice processing pipeline (`src/lib/cfdi-parser.ts` or relevant action).
    - [ ] Write integration tests for the parsing pipeline ensuring non-RESICO invoices are rejected.
    - [ ] Implement the rejection logic in the parser/action.
    - [ ] Write integration tests ensuring ISR and Currency errors are captured in `validation_errors`.
    - [ ] Implement the error capturing logic.
- [x] Task: Conductor - User Manual Verification 'Phase 1: Core Validation Logic' (Protocol in workflow.md)

## Phase 2: UI Enhancements (Invoice Details & Upload Feedback)
This phase focuses on displaying the validation results to the user.

- [x] Task: Update the invoice details component to display visual flags and error messages.
    - [x] Write tests for the `InvoiceDetails` component to ensure it renders "Fix Required" flags based on `validation_errors`.
    - [x] Implement the UI changes in `src/app/invoices/_components/details.tsx`.
- [x] Task: Enhance the upload feedback to show immediate errors for non-RESICO invoices.
    - [x] Write tests for the uploader component handling rejection errors.
    - [x] Implement error toast/feedback in `src/actions/proccess-invoices.tsx` and `src/components/upload-item.tsx`.
- [x] Task: Update dashboard/reporting queries to exclude invoices with high-priority validation errors.
    - [x] Write tests for data fetching logic (e.g., in `src/data/invoices.ts`) to ensure exclusion.
    - [x] Update queries to filter out invoices with specific error codes in `validation_errors`.
- [x] Task: Conductor - User Manual Verification 'Phase 2: UI Enhancements' (Protocol in workflow.md)
