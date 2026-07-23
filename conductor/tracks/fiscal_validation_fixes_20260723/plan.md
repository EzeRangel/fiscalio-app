# Implementation Plan: Fix Fiscal Validation for P, T, N CFDIs

## Phase 1: Test Preparation (Red Phase)
- [x] Task: Write failing tests for special CFDI types in `invoice-rules.test.ts`
    - [x] Add tests for `validateExchangeRate` with currency "XXX" (should not require exchange rate)
    - [x] Add tests for `validateInvoice` with cfdiType "P", "T", "N" ensuring integrity/tax-base validations are bypassed
    - [x] Run test command (`pnpm test`) to confirm failure (Red Phase)

## Phase 2: Implementation (Green Phase)
- [x] Task: Implement validation bypasses and currency exemptions in `invoice-rules.ts`
    - [x] Modify `validateExchangeRate` to exempt `"XXX"` currency (no change to function signature needed)
    - [x] Modify `validateInvoice` to bypass INV-03, INV-04, and INT-INV-06 for `"P"`, `"T"`, `"N"` using an early return or guard clause at the top of the function — do not add individual conditions per check
    - [x] Update `analyze-fiscal-integrity.ts` to pass `cfdiType` when calling `validateInvoice` so the bypass applies
    - [x] Update callers in `invoices.ts` and `payments.ts` (x2) to pass `cfdiType`
    - [x] Run test command (`pnpm test`) to confirm tests pass (Green Phase)

## Phase 3: Verification & Checkpoint
- [x] Task: Verify codebase health and quality gates
    - [x] Verify test coverage is >80% for the modified modules (invoice-rules.ts: 100% stmts/funcs/lines)
    - [x] Run full fiscal-validation test suite: 52 tests passed, 5 suites
    - [x] Task: Conductor - User Manual Verification 'Validation Fixes' (Protocol in workflow.md)

