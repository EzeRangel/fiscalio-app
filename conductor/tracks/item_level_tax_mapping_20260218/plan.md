# Implementation Plan: Item-Level Tax Mapping and Proration

This plan outlines the implementation of item-level tax mapping, tax base consistency validation, and granular tax proration for partial payments.

## Phase 1: Database Consistency & Validation Logic [checkpoint: 7d2d0cd]

### [x] Task: Update Fiscal Validation Constants (13d8d1b)
- [x] Add new validation rule codes to `src/lib/fiscal-validation/constants.ts`:
    - `INVOICE_SUBTOTAL_INCONSISTENCY`: Sum of items minus discounts != header subtotal.
    - `INVOICE_MISSING_ITEM_TAXES`: Item-level tax data is missing.

### [x] Task: Implement Tax Base Consistency Validation (20e9553)
- [x] **Write Failing Tests (Red Phase):**
    - Create `__tests__/lib/fiscal-validation/tax-base-consistency.test.ts`.
    - Test cases for consistent and inconsistent subtotals (considering rounding tolerance).
- [x] **Implement to Pass Tests (Green Phase):**
    - Add `validateTaxBaseConsistency` function in `src/lib/fiscal-validation/invoice-rules.ts`.
    - Logic: `Math.abs((SUM(items.subtotal) - SUM(items.discount)) - invoice.subtotal) < 0.01`.
- [x] **Verify Coverage:** Run `pnpm test __tests__/lib/fiscal-validation/tax-base-consistency.test.ts` and check coverage.

### [x] Task: Implement Item-Level Tax Fallback Distribution (bb73254)
- [x] **Write Failing Tests (Red Phase):**
    - Create `__tests__/lib/invoice-utils.test.ts`.
    - Test case: Invoice with header taxes but no item taxes. Verify proportional distribution across 2-3 items.
- [x] **Implement to Pass Tests (Green Phase):**
    - Add `distributeHeaderTaxesToItems` utility in `src/lib/invoice-utils.ts`.
    - Logic: `ItemTax = HeaderTax * (item.subtotal / invoice.subtotal)`.
    - Update `src/actions/invoices.ts` (or the relevant processing action) to call this utility when item taxes are missing during saving.
- [x] **Verify Coverage:** Run tests and ensure distribution logic is correct and handles division by zero (empty subtotal).

### [ ] Task: Conductor - User Manual Verification 'Phase 1: Database Consistency & Validation Logic' (Protocol in workflow.md)

## Phase 2: Proration & Calculation Engine [checkpoint: 42212b9]

### [x] Task: Implement Granular Tax Proration Logic (a75f1c0)
- [x] **Write Failing Tests (Red Phase):**
    - Create `__tests__/lib/proration-utils.test.ts`.
    - Test case: Calculate "Paid" tax for a partial payment allocation at the item level.
- [x] **Implement to Pass Tests (Green Phase):**
    - Create `src/lib/proration-utils.ts`.
    - Implement `calculatePaidTaxForItem(allocation, itemTax)`:
        - `Factor = allocation.amountAllocated / invoice.total`.
        - `PaidAmount = itemTax.taxAmount * Factor`.
- [x] **Verify Coverage:** Run tests and ensure high-precision decimals are maintained.

### [x] Task: Integrate Proration into Tax Declaration Logic (d5bfba8)
- [x] **Write Failing Tests (Red Phase):**
    - Identify current tax declaration data fetching in `src/data/tax-declarations.ts` or `src/actions/tax-declarations.ts`.
    - Write integration tests in `__tests__/data/tax-declarations.proration.test.ts` for a declaration with partial payments.
- [x] **Implement to Pass Tests (Green Phase):**
    - Refactor tax declaration logic to use the item-level proration utility or update the SQL queries to perform this calculation.
    - Ensure both IVA (transferred) and ISR (withheld) are correctly calculated for the period.
- [x] **Verify Coverage:** Run integration tests and ensure the final tax estimation matches manual calculation.

### [x] Task: Conductor - User Manual Verification 'Phase 2: Proration & Calculation Engine' (Protocol in workflow.md) (42212b9)

## Phase: Review Fixes
- [x] Task: Apply review suggestions (4df878b)
