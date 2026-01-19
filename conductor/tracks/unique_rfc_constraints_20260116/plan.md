# Implementation Plan: Enforce Unique RFC Constraints with Generic RFC Exceptions

## Phase 1: Database Schema and Data Integrity [checkpoint: f706b66]

- [x] Task: Create a Drizzle migration to add the partial unique index to `business_partners`.
    - [x] Create a new migration file.
    - [x] Add a unique index on `(organization_id, rfc)` with a `WHERE` clause excluding generic RFCs (`XAXX010101000`, `XEXX010101000`).
- [x] Task: Update the `businessPartners` table definition in `src/db/schema/businessPartners.ts`.
    - [x] Add the `uniqueIndex` to the table configuration to match the migration.
- [x] Task: Conductor - User Manual Verification 'Database Schema and Data Integrity' (Protocol in workflow.md)

## Phase 2: Refine Invoice Ingestion Logic

- [x] Task: Write failing tests for generic RFC handling in `src/data/invoices.test.ts`.
    - [ ] Test that two invoices with the same generic RFC but different names create two separate partners.
    - [ ] Test that two invoices with the same generic RFC and the same name link to the same partner.
    - [ ] Test that two invoices with the same specific RFC always link to the same partner.
- [x] Task: Implement the refined "Find or Create" logic in `src/data/invoices.ts`.
    - [x] Modify `saveNewInvoice` to include `businessName` in the query when the RFC is generic.
    - [x] Ensure the query is scoped to the `organizationId`.
- [x] Task: Verify the tests pass for invoice ingestion.
- [x] Task: Conductor - User Manual Verification 'Refine Invoice Ingestion Logic' (Protocol in workflow.md)

## Phase 3: Update Manual Partner Creation [checkpoint: 252de62]

- [x] Task: Write failing tests for manual partner creation uniqueness in `src/actions/business-partners.test.ts`. 252de62
    - [x] Test that creating a partner with an existing specific RFC in the same organization fails. 252de62
    - [x] Test that creating a partner with an existing specific RFC in a different organization succeeds. 252de62
    - [x] Test that creating a partner with an existing generic RFC succeeds. 252de62
- [x] Task: Update `saveBusinessPartner` server action in `src/actions/business-partners.ts`. 252de62
    - [x] Add a pre-check to query for existing RFCs (scoped to organization) if the RFC is not generic. 252de62
    - [x] Return a structured error if a duplicate is found. 252de62
- [x] Task: Update the UI to handle the duplicate RFC error. 252de62
    - [x] Ensure the `useAction` hook in the partner form displays a toast notification when the specific uniqueness error occurs. 252de62
- [x] Task: Verify the tests pass for manual creation. 252de62
- [x] Task: Conductor - User Manual Verification 'Update Manual Partner Creation' (Protocol in workflow.md) 252de62
