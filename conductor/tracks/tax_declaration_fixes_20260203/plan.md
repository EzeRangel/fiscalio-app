# Plan: Tax Declaration Calculations & Summary Improvements

## Phase 1: Analysis & Reproduction
- [x] Task: Analyze existing tax declaration logic. (b3c43aa)
    - [x] Sub-task: Examine `src/actions/tax-declarations.ts` to understand how totals and invoice counts are currently calculated.
    - [x] Sub-task: Identify where currency conversion is missing or incorrect.
    - [x] Sub-task: Identify why the invoice count is returning `undefined` or not being passed to the UI.
- [x] Task: Create reproduction test suite. (b3c43aa)
    - [x] Sub-task: Create `src/actions/tax-declarations.currency-fix.test.ts`.
    - [x] Sub-task: Write a test case with mixed currency invoices (USD & MXN) and assert the expected normalized total in MXN.
    - [x] Sub-task: Write a test case ensuring only paid (cash-basis) invoices contribute to the total and the count.
    - [x] Sub-task: Write a test case explicitly checking that the returned data structure includes the correct invoice count.
- [x] Task: Conductor - User Manual Verification 'Analysis & Reproduction' (Protocol in workflow.md)

## Phase 2: Core Logic Implementation (Currency & Counting)
- [x] Task: Implement Currency Normalization. (b3c43aa)
    - [x] Sub-task: Modify the calculation logic to use the `exchangeRate` for non-MXN invoices when summing totals.
    - [x] Sub-task: Ensure the `currency` field is respected for every invoice in the calculation.
- [x] Task: Implement Cash-Basis Counting. (b3c43aa)
    - [x] Sub-task: Update the logic to filter the list of invoices to only those that are effectively "paid" before counting them.
    - [x] Sub-task: Ensure the count is correctly assigned to the return object (fixing the `undefined` issue).
- [x] Task: Verify with Tests. (b3c43aa)
    - [x] Sub-task: Run `src/actions/tax-declarations.currency-fix.test.ts` and confirm all tests pass.
- [x] Task: Conductor - User Manual Verification 'Core Logic Implementation (Currency & Counting)' (Protocol in workflow.md)

## Phase 3: UI Updates & Integration
- [x] Task: Update Summary Card Display. (b3c43aa)
    - [x] Sub-task: Check the component rendering the summary cards (likely in `src/app/(main)/tax-declarations/` or `src/components/summary-card.tsx`).
    - [x] Sub-task: Ensure the component correctly receives and renders the invoice count label (e.g., "X invoices").
- [x] Task: Conductor - User Manual Verification 'UI Updates & Integration' (Protocol in workflow.md)

## Phase 4: Fallback Estimations (Live Preview)
- [x] Task: Implement preliminary tax calculations in `getTaxDeclarationsDashboardData`. (d97c104)
    - [x] Sub-task: Update `getTaxDeclarationsDashboardData` in `src/data/tax-declarations.ts` to perform a more detailed query (fetching taxes and deductibility).
    - [x] Sub-task: Calculate `deductibleExpenses`, `ivaCharged`, `ivaCreditable`, `isrWithheld` for the current period.
    - [x] Sub-task: Calculate `netAmount` (Base), `estimatedTax` (ISR), and `ivaBalance` using the same logic as the draft creation (but on the fly).
    - [x] Sub-task: Return these values in `currentPeriod` object.
- [x] Task: Update UI to use fallback values. (d97c104)
    - [x] Sub-task: Update `src/app/tax-declarations/_components/summary-cards.tsx` to use the calculated values from `currentPeriod` when `data` is missing.
- [x] Task: Verify with Tests. (d97c104)
    - [x] Sub-task: Update `src/data/tax-declarations.currency-fix.test.ts` to verify the presence and correctness of these new fields.
- [x] Task: Conductor - User Manual Verification 'Fallback Estimations' (Protocol in workflow.md)
