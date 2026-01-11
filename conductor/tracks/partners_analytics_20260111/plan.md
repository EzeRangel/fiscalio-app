# Track Plan: Partners Analytics & Aggregation

## Phase 1: Data Access Layer & Server Actions
- [ ] Task: Create specific Drizzle queries to aggregate invoice statistics (count, sum amount) grouped by business partner (RFC).
    - [ ] Subtask: Write Tests: Create unit tests for the aggregation logic using seeded test data.
    - [ ] Subtask: Implement Feature: Implement `getPartnersWithAnalytics` server action (or modify existing) to return partners with their attached stats.
- [ ] Task: Create Drizzle queries for global partner stats (Total Client Volume, Total Provider Volume).
    - [ ] Subtask: Write Tests: Create unit tests for global aggregation.
    - [ ] Subtask: Implement Feature: Implement `getGlobalPartnerStats` server action.
- [ ] Task: Conductor - User Manual Verification 'Data Access Layer & Server Actions' (Protocol in workflow.md)

## Phase 2: UI Implementation - Summary Cards
- [ ] Task: Create/Update `PartnersSummary` component to display the global volumes.
    - [ ] Subtask: Write Tests: Component test checking if props are rendered correctly formatted as currency.
    - [ ] Subtask: Implement Feature: specific UI implementation matching the "Refined Editorial" style.
- [ ] Task: Integrate `getGlobalPartnerStats` data into the Partners page layout.
    - [ ] Subtask: Implement Feature: Fetch data in `page.tsx` and pass to the summary component.
- [ ] Task: Conductor - User Manual Verification 'UI Implementation - Summary Cards' (Protocol in workflow.md)

## Phase 3: UI Implementation - Partners Table
- [ ] Task: Update the `columns` definition for the Partners data table.
    - [ ] Subtask: Write Tests: Verify new columns (Invoices, Volume) are present in the table configuration.
    - [ ] Subtask: Implement Feature: Add `invoiceCount` and `totalVolume` columns with proper sorting capabilities.
- [ ] Task: Update the Partners data fetching logic to use the new `getPartnersWithAnalytics` action.
    - [ ] Subtask: Implement Feature: Ensure the table receives the enriched data.
- [ ] Task: Conductor - User Manual Verification 'UI Implementation - Partners Table' (Protocol in workflow.md)

## Phase 4: Final Polish & Integration
- [ ] Task: Verify currency formatting and localization (MXN).
    - [ ] Subtask: Implement Feature: Ensure all monetary values use the standard formatter.
- [ ] Task: Verify empty states (Partners with 0 invoices).
    - [ ] Subtask: Implement Feature: Ensure they display "0" or "-" gracefully.
- [ ] Task: Conductor - User Manual Verification 'Final Polish & Integration' (Protocol in workflow.md)
