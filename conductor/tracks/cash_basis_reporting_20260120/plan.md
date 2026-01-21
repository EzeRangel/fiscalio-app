# Implementation Plan - Cash-Basis Financial Reporting

## Phase 1: Core Calculation Logic (TDD)
- [x] Task: Create Financial Summary Utilities 0bd9599
    - [x] Create `src/lib/cash-basis-utils.ts` for shared calculation logic.
    - [x] Implement `calculateCashBasisTotal(allocations)` with support for tax breakdowns.
- [ ] Task: Unit Tests for Cash-Basis Calculations
    - [ ] Create `src/lib/cash-basis-utils.test.ts`.
    - [ ] Test cases: Empty allocations, single payment, partial payments, multiple payments for one invoice.
- [ ] Task: Conductor - User Manual Verification 'Core Calculation Logic' (Protocol in workflow.md)

## Phase 2: Data Access Layer Updates
- [ ] Task: Update Invoice Data Fetching
    - [ ] Update `src/data/invoices.ts` to include payment allocation aggregates in `getInvoices`.
    - [ ] Ensure `getInvoiceById` returns detailed payment status and remaining balance.
- [ ] Task: Update Dashboard Data Logic
    - [ ] Refactor `src/data/dashboard.ts` (or `src/actions/dashboard.ts`) to query `paymentAllocations` instead of `invoices` for KPI totals.
    - [ ] Implement TDD for the new dashboard queries.
- [ ] Task: Update Partner Analytics Data logic
    - [ ] Refactor `src/data/partners-analytics.ts` to differentiate between Invoiced vs. Paid totals.
- [ ] Task: Conductor - User Manual Verification 'Data Access Layer Updates' (Protocol in workflow.md)

## Phase 3: Dashboard UI & Visualizations
- [ ] Task: Update KPI Cards to Cash-Basis
    - [ ] Modify `SummaryCard` or specific dashboard components to display "Collected Income" and "Paid Expenses".
- [ ] Task: Update Dashboard Charts
    - [ ] Ensure charts use the payment date for temporal distribution of income/expenses.
- [ ] Task: Conductor - User Manual Verification 'Dashboard UI & Visualizations' (Protocol in workflow.md)

## Phase 4: Invoice Lists & Partner UI
- [ ] Task: Enhance Invoice Data Table
    - [ ] Add "Paid Amount" and "Status" (Unpaid, Partial, Paid) columns to the invoices table.
    - [ ] Add visual indicators/badges for payment status.
- [ ] Task: Update Partner Detail Views
    - [ ] Update the balance displays in partner profiles to reflect the cash-basis reality.
- [ ] Task: Conductor - User Manual Verification 'Invoice Lists & Partner UI' (Protocol in workflow.md)

## Phase 5: Tax Declarations & Final Review
- [ ] Task: Update Tax Declaration Generation
    - [ ] Ensure `src/actions/tax-declarations.ts` uses the new cash-basis calculation engine.
    - [ ] Add tests for period-specific tax calculations based on payment dates.
- [ ] Task: Conductor - User Manual Verification 'Tax Declarations & Final Review' (Protocol in workflow.md)
