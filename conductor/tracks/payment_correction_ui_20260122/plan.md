# Implementation Plan - Payment Correction UI (PUE Date Fix)

## Phase 1: Backend Logic & Data Integrity (TDD)
- [x] Task: Create Payment Update Action Foundation 83ddcc9
    - [x] Create `src/actions/payments.ts` (if it doesn't exist) or add to it.
    - [x] Define Zod schema for payment updates (date and notes).
- [ ] Task: Unit Tests for `updatePaymentAction`
    - [ ] Create `src/actions/payments.test.ts`.
    - [ ] Test case: Successful update of date and notes.
    - [ ] Test case: Fail if new date is before invoice date.
    - [ ] Test case: Fail if payment doesn't exist.
    - [ ] Test case: Verify audit log entry is created.
- [ ] Task: Implement `updatePaymentAction`
    - [ ] Implement logic in `src/actions/payments.ts`.
    - [ ] Integrate `logAction` from `src/lib/audit-service.ts`.
    - [ ] Ensure amount remains untouched.
- [ ] Task: Conductor - User Manual Verification 'Backend Logic & Data Integrity' (Protocol in workflow.md)

## Phase 2: UI Components & Visual Cues
- [ ] Task: Enhance Payment Item with "Verify" Badge
    - [ ] Identify payment list component in `src/components/invoices/` or `src/app/invoices/`.
    - [ ] Add a conditional "Verify" badge (Tooltip: "Auto-generated for PUE. Please verify date.") for system-generated payments.
- [ ] Task: Create `EditPaymentDialog` Component
    - [ ] Build a Shadcn-based dialog for editing payment date and notes.
    - [ ] Implement client-side validation (date >= invoice date).
- [ ] Task: Integrate Edit Flow in Invoice Details
    - [ ] Add "Edit" button to the payment list items.
    - [ ] Connect the button to the `EditPaymentDialog`.
    - [ ] Handle success state with `toast` and router refresh.
- [ ] Task: Conductor - User Manual Verification 'UI Components & Visual Cues' (Protocol in workflow.md)

## Phase 3: Final Integration & Audit Review
- [ ] Task: End-to-End Verification
    - [ ] Manually verify a full PUE flow: Upload -> Auto-Payment -> Correction -> Audit Log.
- [ ] Task: Audit Log Visibility
    - [ ] Ensure the modification appears correctly in the `EntityAuditLog` component.
- [ ] Task: Conductor - User Manual Verification 'Final Integration & Audit Review' (Protocol in workflow.md)
