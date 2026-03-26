# Implementation Plan: /invoices Page Improvements

This plan outlines the steps to implement interactive client-side filtering and dynamic period-based grouping for the `/invoices` page.

## Phase 1: State Management & Component Restructuring
Refactor the `/invoices` page to use a client-side wrapper that manages shared state for filtering and grouping.

- [ ] Task: Create `InvoicesClient` wrapper component
    - [ ] Create `src/app/invoices/_components/invoices-client.tsx`
    - [ ] Define state for `searchQuery`, `filterType`, and `periodGroup`
    - [ ] Move the `invoices` data fetching (or receiving) to this component
- [ ] Task: Refactor `src/app/invoices/page.tsx`
    - [ ] Update `InvoicesList` server component to pass data to `InvoicesClient`
    - [ ] Remove direct rendering of `Filters` and `List` from `page.tsx`
- [ ] Task: Connect `Filters` to shared state
    - [ ] Update `Filters` component to accept `value` and `onChange` props for all controls
    - [ ] Remove local state from `Filters`
- [ ] Task: Conductor - User Manual Verification 'Phase 1: State Management & Component Restructuring' (Protocol in workflow.md)

## Phase 2: Filtering Implementation
Implement the client-side filtering logic for search and CFDI type.

- [ ] Task: Implement filtering logic
    - [ ] Create unit tests for filtering logic in `src/app/invoices/_components/invoices-client.test.tsx`
    - [ ] Implement `useMemo` based filtering in `InvoicesClient` or a dedicated hook
    - [ ] Ensure filtering covers legal name, RFC, folio, and CFDI type
- [ ] Task: Update Header Count
    - [ ] Pass the filtered count back to the header or move the header into `InvoicesClient`
    - [ ] Verify the header count updates in real-time
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Filtering Implementation' (Protocol in workflow.md)

## Phase 3: Dynamic Grouping & Totals
Ensure that the list grouping and summary totals are reactive to the filtered data.

- [ ] Task: Refactor `List` component for reactive grouping
    - [ ] Create unit tests for reactive grouping in `src/app/invoices/_components/list.test.tsx`
    - [ ] Ensure `List` uses the pre-filtered invoices for its grouping logic
    - [ ] Verify that empty groups are not rendered
- [ ] Task: Verify Summary Totals
    - [ ] Create unit tests for summary total calculations with filtered data
    - [ ] Ensure `calculatePeriodTotals` in `List` correctly reflects the filtered set
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Dynamic Grouping & Totals' (Protocol in workflow.md)

## Phase 4: Polish & Final Verification
Final touches on UI/UX and comprehensive testing.

- [ ] Task: UI/UX Refinement
    - [ ] Add a "Clear Filters" button that works with all filters
    - [ ] Ensure smooth transitions and loading states (if any)
- [ ] Task: Final System Integration Test
    - [ ] Run all tests in the project to ensure no regressions
    - [ ] Verify performance with simulated large dataset (up to 1,000 invoices)
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Polish & Final Verification' (Protocol in workflow.md)
