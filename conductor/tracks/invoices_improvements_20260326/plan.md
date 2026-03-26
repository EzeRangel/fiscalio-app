# Implementation Plan: /invoices Page Improvements

This plan outlines the steps to implement interactive client-side filtering and dynamic period-based grouping for the `/invoices` page.

## Phase 1: State Management & Component Restructuring [checkpoint: bf345c4]
Refactor the `/invoices` page to use a client-side wrapper that manages shared state for filtering and grouping.

- [x] Task: Create `InvoicesClient` wrapper component 0c71aa6
    - [x] Create `src/app/invoices/_components/invoices-client.tsx`
    - [x] Define state for `searchQuery`, `filterType`, and `periodGroup`
    - [x] Move the `invoices` data fetching (or receiving) to this component
- [x] Task: Refactor `src/app/invoices/page.tsx` 0c71aa6
    - [x] Update `InvoicesList` server component to pass data to `InvoicesClient`
    - [x] Remove direct rendering of `Filters` and `List` from `page.tsx`
- [x] Task: Connect `Filters` to shared state 0c71aa6
    - [x] Update `Filters` component to accept `value` and `onChange` props for all controls
    - [x] Remove local state from `Filters`
- [x] Task: Conductor - User Manual Verification 'Phase 1: State Management & Component Restructuring' (Protocol in workflow.md) bf345c4

## Phase 2: Filtering Implementation [checkpoint: 803b21f]
Implement the client-side filtering logic for search and CFDI type.

- [x] Task: Implement filtering logic 2fc1c2e, d016f9d
    - [x] Create unit tests for filtering logic in `__tests__/components/invoices-client.test.tsx`
    - [x] Implement `useMemo` based filtering in `InvoicesClient` or a dedicated hook
    - [x] Ensure filtering covers legal name, RFC, folio, and CFDI type
- [x] Task: Update Header Count 2fc1c2e, d016f9d
    - [x] Pass the filtered count back to the header or move the header into `InvoicesClient`
    - [x] Verify the header count updates in real-time
- [x] Task: Conductor - User Manual Verification 'Phase 2: Filtering Implementation' (Protocol in workflow.md) 803b21f

## Phase 3: Dynamic Grouping & Totals [checkpoint: 657fa46]
Ensure that the list grouping and summary totals are reactive to the filtered data.

- [x] Task: Refactor `List` component for reactive grouping d99cdc6, 9d1a697
    - [x] Create unit tests for reactive grouping in `__tests__/components/list.test.tsx`
    - [x] Ensure `List` uses the pre-filtered invoices for its grouping logic
    - [x] Verify that empty groups are not rendered
- [x] Task: Verify Summary Totals d99cdc6, 9d1a697
    - [x] Create unit tests for summary total calculations with filtered data
    - [x] Ensure `calculatePeriodTotals` in `List` correctly reflects the filtered set
- [x] Task: Conductor - User Manual Verification 'Phase 3: Dynamic Grouping & Totals' (Protocol in workflow.md) 657fa46

## Phase 4: Polish & Final Verification
Final touches on UI/UX and comprehensive testing.

- [ ] Task: UI/UX Refinement
    - [ ] Add a "Clear Filters" button that works with all filters
    - [ ] Ensure smooth transitions and loading states (if any)
- [ ] Task: Final System Integration Test
    - [ ] Run all tests in the project to ensure no regressions
    - [ ] Verify performance with simulated large dataset (up to 1,000 invoices)
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Polish & Final Verification' (Protocol in workflow.md)
