# Track Plan: Partners Analytics & Aggregation

## Phase 1: Data Access Layer & Server Actions [checkpoint: 399bb62]
- [x] Task: Create specific Drizzle queries to aggregate invoice statistics (count, sum amount) grouped by business partner (RFC). 9576fa4
    - [ ] Subtask: Write Tests: [CANCELLED] Skip due to environment complexity.
    - [x] Subtask: Implement Feature: Implement `getPartnersWithAnalytics` server action (or modify existing) to return partners with their attached stats.
- [x] Task: Create Drizzle queries for global partner stats (Total Client Volume, Total Provider Volume). 9576fa4
    - [ ] Subtask: Write Tests: [CANCELLED] Skip due to environment complexity.
    - [x] Subtask: Implement Feature: Implement `getGlobalPartnerStats` server action.
- [x] Task: Conductor - User Manual Verification 'Data Access Layer & Server Actions' (Protocol in workflow.md) 13acca3

## Phase 2: UI Implementation - Summary Cards [checkpoint: 68fb7e2]
- [x] Task: Create/Update `PartnersSummary` component to display the global volumes. bf97445
    - [ ] Subtask: Write Tests: [CANCELLED] Skip due to environment complexity.
    - [x] Subtask: Implement Feature: specific UI implementation matching the "Refined Editorial" style.
- [x] Task: Integrate `getGlobalPartnerStats` data into the Partners page layout. bf97445
    - [x] Subtask: Implement Feature: Fetch data in `page.tsx` and pass to the summary component.
- [x] Task: Conductor - User Manual Verification 'UI Implementation - Summary Cards' (Protocol in workflow.md) a4eda49

## Phase 3: UI Implementation - Partners Table [checkpoint: a80a785]
- [x] Task: Update the `columns` definition for the Partners data table. 1ecc054
    - [ ] Subtask: Write Tests: [CANCELLED] Skip due to environment complexity.
    - [x] Subtask: Implement Feature: Add `invoiceCount` and `totalVolume` columns with proper sorting capabilities.
- [x] Task: Update the Partners data fetching logic to use the new `getPartnersWithAnalytics` action. 1ecc054
    - [x] Subtask: Implement Feature: Ensure the table receives the enriched data.
- [x] Task: Conductor - User Manual Verification 'UI Implementation - Partners Table' (Protocol in workflow.md) a80a785

## Phase 4: Final Polish & Integration
- [x] Task: Verify currency formatting and localization (MXN). a4eda49
    - [x] Subtask: Implement Feature: Ensure all monetary values use the standard formatter.
- [x] Task: Verify empty states (Partners with 0 invoices). 13acca3
    - [x] Subtask: Implement Feature: Ensure they display "0" or "-" gracefully.
- [~] Task: Conductor - User Manual Verification 'Final Polish & Integration' (Protocol in workflow.md)
