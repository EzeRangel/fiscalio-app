# Implementation Plan: Tax Declaration Cash-Basis & Currency Fix

This plan outlines the steps to align the tax declaration logic with cash-basis principles and implement USD to MXN currency normalization.

## Phase 1: Research and Utility Preparation
In this phase, we will analyze the existing calculation logic and prepare utility functions for currency conversion and cash-basis filtering.

- [x] Task: Analyze `src/actions/tax-declarations.ts` and `src/data/tax-declarations.ts` to identify the current data fetching and calculation flow. f1b2c3d
- [x] Task: Create or update a utility function in `src/lib/invoice-utils.ts` (or similar) to handle USD to MXN conversion using the `exchangeRate` from the database. [6a7b8c9]
- [x] Task: Create a utility function to filter invoices and payments based on the "Cash-Basis" principle for a given date range. [7b8c9d0]
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Research and Utility Preparation' (Protocol in workflow.md)

## Phase 2: Data Layer Updates
Update the data fetching logic to ensure it provides the necessary information for cash-basis calculations (e.g., linked payments).

- [ ] Task: Write Tests: Verify that `src/data/tax-declarations.ts` (or relevant data fetcher) correctly retrieves paid invoices and their associated payments for a period.
- [ ] Task: Implement: Refactor data fetching to include payment status and exchange rate information for each record.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Data Layer Updates' (Protocol in workflow.md)

## Phase 3: Calculation Logic Refactor (Cash-Basis & Currency)
Refactor the core tax declaration calculation logic to apply normalization and cash-basis rules.

- [ ] Task: Write Tests: Create a test suite in `src/actions/tax-declarations.test.ts` (or a new integration test) that covers:
    - [ ] Correct filtering of unpaid PPD invoices.
    - [ ] Inclusion of PUE invoices as paid.
    - [ ] Correct conversion of USD invoices to MXN in totals.
    - [ ] Summation of mixed currency transactions into a single MXN total.
- [ ] Task: Implement: Update the calculation logic in `src/actions/tax-declarations.ts` to use the new utilities and ensure totals are cash-basis and MXN-normalized.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Calculation Logic Refactor' (Protocol in workflow.md)

## Phase 4: UI and Verification
Ensure the UI correctly reflects the normalized MXN values and perform final verification.

- [ ] Task: Verify that the tax declaration preview/draft UI correctly displays currency labels (MXN) for the calculated totals.
- [ ] Task: Perform a manual verification with a sample dataset containing both MXN and USD invoices.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: UI and Verification' (Protocol in workflow.md)
