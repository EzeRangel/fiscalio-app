# Implementation Plan - Fiscal Validation Layer

## Phase 1: Foundation & Shared Logic
- [x] Task: Create `src/lib/fiscal-validation` directory and define types 30e015a
    - [x] Create `src/lib/fiscal-validation/types.ts` with error types and validation result interfaces.
    - [x] Create `src/lib/fiscal-validation/constants.ts` with validation rule codes (INV-01, etc.).
- [ ] Task: Implement Invoice Validation Logic (TDD)
    - [ ] Create `src/lib/fiscal-validation/invoice-rules.test.ts`.
    - [ ] Implement `validateInvoice` in `src/lib/fiscal-validation/invoice-rules.ts` covering INV-01 to INV-04.
- [ ] Task: Implement Payment Validation Logic (TDD)
    - [ ] Create `src/lib/fiscal-validation/payment-rules.test.ts`.
    - [ ] Implement `validatePayment` in `src/lib/fiscal-validation/payment-rules.ts` covering PAY-01 to PAY-03.
- [ ] Task: Implement Allocation Validation Logic (TDD)
    - [ ] Create `src/lib/fiscal-validation/allocation-rules.test.ts`.
    - [ ] Implement `validateAllocation` in `src/lib/fiscal-validation/allocation-rules.ts` covering ALL-01 to ALL-06.
- [ ] Task: Conductor - User Manual Verification 'Foundation & Shared Logic' (Protocol in workflow.md)

## Phase 2: Database Constraints & Schema
- [ ] Task: Add DB constraints for key invariants
    - [ ] Create a new Drizzle migration to add check constraints where possible (e.g., positive amounts).
    - [ ] Add application-level schema validation (Zod) in `src/db/schema` to mirror the rules.
- [ ] Task: Conductor - User Manual Verification 'Database Constraints & Schema' (Protocol in workflow.md)

## Phase 3: Integration with Server Actions
- [ ] Task: Integrate Validation into Invoice Actions
    - [ ] Update `src/actions/invoices.ts` (or relevant file) to call `validateInvoice` before mutations.
    - [ ] Ensure proper error handling (returning `ActionState` with error messages).
- [ ] Task: Integrate Validation into Payment Actions
    - [ ] Update `src/actions/payments.ts` to call `validatePayment` before creation/update.
- [ ] Task: Integrate Validation into Allocation Actions
    - [ ] Update `src/actions/allocations.ts` to call `validateAllocation`.
    - [ ] Enforce the "Fiscal Period Attribution" rule during allocation creation.
- [ ] Task: Conductor - User Manual Verification 'Integration with Server Actions' (Protocol in workflow.md)

## Phase 4: Legacy Data Migration
- [ ] Task: Create Analysis Script
    - [ ] Write a script `src/scripts/analyze-fiscal-integrity.ts` to report on existing data violations.
- [ ] Task: Implement Migration/Cleanup Strategy
    - [ ] Based on the spec, implement a migration to flag or fix invalid records.
    - [ ] (Optional) Create "placeholder" payments for historic data if confirmed by user.
- [ ] Task: Conductor - User Manual Verification 'Legacy Data Migration' (Protocol in workflow.md)

## Phase 5: UI Feedback
- [ ] Task: Enhance UI Error Handling
    - [ ] Update forms to display validation errors via Toast/Notification as per spec.
    - [ ] Disable specific UI actions (e.g., "Add Allocation" on cancelled invoices) where appropriate for better UX (preventative).
- [ ] Task: Conductor - User Manual Verification 'UI Feedback' (Protocol in workflow.md)
