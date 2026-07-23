# Implementation Plan: Fix Fiscal Validation for P, T, N CFDIs

## Phase 1: Test Preparation (Red Phase)
- [ ] Task: Write failing tests for special CFDI types in `invoice-rules.test.ts`
    - [ ] Add tests for `validateExchangeRate` with currency "XXX" (should not require exchange rate)
    - [ ] Add tests for `validateInvoice` with cfdiType "P", "T", "N" ensuring integrity/tax-base validations are bypassed
    - [ ] Run test command (`pnpm test`) to confirm failure (Red Phase)

## Phase 2: Implementation (Green Phase)
- [ ] Task: Implement validation bypasses and currency exemptions in `invoice-rules.ts`
    - [ ] Modify `validateExchangeRate` to allow "XXX" currency without warning
    - [ ] Modify `validateInvoice` to bypass INV-03, INV-04, and INT-INV-06 validations for "P", "T", "N" CFDI types
    - [ ] Run test command (`pnpm test`) to confirm tests pass (Green Phase)

## Phase 3: Verification & Checkpoint
- [ ] Task: Verify codebase health and quality gates
    - [ ] Verify test coverage is >80% for the modified modules
    - [ ] Run ESLint to ensure no syntax/formatting regressions
    - [ ] Task: Conductor - User Manual Verification 'Validation Fixes' (Protocol in workflow.md)
