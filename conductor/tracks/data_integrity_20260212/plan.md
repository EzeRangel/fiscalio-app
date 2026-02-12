# Plan: Pre-Processing & Data Integrity for CFDI Imports

## Phase 1: Utility Implementation & Unit Testing
Implement the core logic for de-duplication and uniqueness checks, ensuring they work independently of the main import flow.

- [ ] Task: Create `src/lib/data-integrity.ts` with hash and UUID check utilities.
- [ ] Task: Write failing tests for `data-integrity.ts` (Red Phase).
- [ ] Task: Implement hash generation and database lookup in `data-integrity.ts` (Green Phase).
- [ ] Task: Implement UUID extraction and database lookup in `data-integrity.ts` (Green Phase).
- [ ] Task: Refactor and optimize `data-integrity.ts` (Refactor Phase).
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Utility Implementation' (Protocol in workflow.md)

## Phase 2: Integration into `processInvoices` Action
Integrate the integrity checks into the existing `processInvoices` server action.

- [ ] Task: Update `src/actions/proccess-invoices.tsx` to include de-duplication checks.
- [ ] Task: Write failing integration tests for `processInvoices` with duplicate files/UUIDs (Red Phase).
- [ ] Task: Implement integrity checks in the action flow before parsing/saving (Green Phase).
- [ ] Task: Ensure `ActionError` is correctly propagated and handled by the UI (Green Phase).
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Integration into Action' (Protocol in workflow.md)

## Phase 3: Final Verification & Cleanup
- [ ] Task: Run full test suite and verify coverage >80%.
- [ ] Task: Perform manual verification with duplicate XML files.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Final Verification' (Protocol in workflow.md)
