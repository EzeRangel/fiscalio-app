# Implementation Plan - Fiscal Validation Layer

## Phase 1: Foundation & Shared Logic [checkpoint: c85f2cd]
- [x] Task: Create `src/lib/fiscal-validation` directory and define types 30e015a
    - [x] Create `src/lib/fiscal-validation/types.ts` with error types and validation result interfaces.
    - [x] Create `src/lib/fiscal-validation/constants.ts` with validation rule codes (INV-01, etc.).
- [x] Task: Implement Invoice Validation Logic (TDD) 3d54366
    - [x] Create `src/lib/fiscal-validation/invoice-rules.test.ts`.
    - [x] Implement `validateInvoice` in `src/lib/fiscal-validation/invoice-rules.ts` covering INV-01 to INV-04.
- [x] Task: Implement Payment Validation Logic (TDD) 8361047
    - [x] Create `src/lib/fiscal-validation/payment-rules.test.ts`.
    - [x] Implement `validatePayment` in `src/lib/fiscal-validation/payment-rules.ts` covering PAY-01 to PAY-03.
- [x] Task: Implement Allocation Validation Logic (TDD) 28b5a4b
    - [x] Create `src/lib/fiscal-validation/allocation-rules.test.ts`.
    - [x] Implement `validateAllocation` in `src/lib/fiscal-validation/allocation-rules.ts` covering ALL-01 to ALL-06.
- [x] Task: Conductor - User Manual Verification 'Foundation & Shared Logic' (Protocol in workflow.md)

## Phase 2: Database Constraints & Schema
- [x] Task: Add DB constraints for key invariants ad481b6
    - [x] Create a new Drizzle migration to add check constraints where possible (e.g., positive amounts).
    - [x] Add application-level schema validation (Zod) in `src/db/schema` to mirror the rules.
- [ ] Task: Conductor - User Manual Verification 'Database Constraints & Schema' (Protocol in workflow.md)

## Phase 3: Integration with Server Actions [checkpoint: b1c3cb6]
- [x] Task: Integrate Validation into Invoice Actions ed6b0e3
    - [x] Update `src/actions/invoices.ts` (or relevant file) to call `validateInvoice` before mutations.
    - [x] Ensure proper error handling (returning `ActionState` with error messages).
- [x] Task: Integrate Validation into Payment Actions ed6b0e3
    - [x] Update `src/actions/payments.ts` to call `validatePayment` before creation/update.
- [x] Task: Integrate Validation into Allocation Actions ed6b0e3
    - [x] Update `src/actions/allocations.ts` to call `validateAllocation`.
    - [x] Enforce the "Fiscal Period Attribution" rule during allocation creation.
- [x] Task: Conductor - User Manual Verification 'Integration with Server Actions' (Protocol in workflow.md)

## Phase 4: Legacy Data Migration
- [x] Task: Create Analysis Script 4bbdf64
    - [x] Write a script `src/scripts/analyze-fiscal-integrity.ts` to report on existing data violations.
- [x] Task: Implement Migration/Cleanup Strategy 4bbdf64
    - [x] Based on the spec, implement a migration to flag or fix invalid records.
    - [x] (Optional) Create "placeholder" payments for historic data if confirmed by user.
- [x] Task: Conductor - User Manual Verification 'Legacy Data Migration' (Protocol in workflow.md)

## Phase 5: UI Feedback
- [ ] Task: Enhance UI Error Handling
    - [ ] Update forms to display validation errors via Toast/Notification as per spec.
    - [ ] Disable specific UI actions (e.g., "Add Allocation" on cancelled invoices) where appropriate for better UX (preventative).
- [ ] Task: Conductor - User Manual Verification 'UI Feedback' (Protocol in workflow.md)
