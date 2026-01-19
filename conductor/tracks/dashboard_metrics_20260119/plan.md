# Implementation Plan - Dashboard Metrics & Period Selection

## Phase 1: Setup & Types [checkpoint: 0cc18de]
- [x] Task: Create or Update Dashboard Types 028d1aa
    - [x] Define types for Dashboard Metrics (income, expenses, declaration date).
    - [x] Define types for Period Selection state (month, year).
- [ ] Task: Conductor - User Manual Verification 'Setup & Types' (Protocol in workflow.md)

## Phase 2: Data Fetching Logic (TDD)
- [x] Task: Update/Create Server Action for Dashboard Data 1f985ed
    - [x] Write failing test: `dashboard.test.ts` - Ensure `getDashboardMetrics` accepts month/year and returns correct aggregates.
    - [x] Implement `getDashboardMetrics` server action to query DB with date filters.
    - [x] Refactor: Optimize query if necessary.
    - [x] Verify Coverage: Ensure tests pass.
- [ ] Task: Conductor - User Manual Verification 'Data Fetching Logic' (Protocol in workflow.md)

## Phase 3: UI Implementation
- [ ] Task: Create Period Selector Component
    - [ ] Create `PeriodSelector` component using `shadcn/ui` Select/Dropdown.
    - [ ] Ensure it accepts `value` (month/year) and `onChange` props.
- [ ] Task: Update Dashboard Page Structure
    - [ ] Integrate `PeriodSelector` into `src/app/dashboard/page.tsx` (or equivalent).
    - [ ] Manage local state or URL search params for the selected period.
    - [ ] Fetch data using the new server action based on the selected period.
- [ ] Task: Implement Summary Cards
    - [ ] Use `SummaryCard` to display "Total Income".
    - [ ] Use `SummaryCard` to display "Total Expenses".
    - [ ] Use `SummaryCard` to display "Next Tax Declaration".
    - [ ] Connect real data to these cards.
- [ ] Task: Conductor - User Manual Verification 'UI Implementation' (Protocol in workflow.md)

## Phase 4: Final Polish & Verification
- [ ] Task: Mobile Responsiveness Check
    - [ ] Verify layout on small screens (stacking order, padding).
- [ ] Task: Loading States
    - [ ] Add Suspense boundaries or Skeleton loaders for the new dashboard sections.
- [ ] Task: Conductor - User Manual Verification 'Final Polish & Verification' (Protocol in workflow.md)
