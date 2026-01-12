# Plan: Business Partner Actions Enhancement

## Phase 1: Invoices Page Integration [checkpoint: 3c404b7]
- [x] Task: Update Invoices List Component afcbf3a
    - [x] Sub-task: Modify `InvoicesList` component (or its parent page) to read the `partner` query parameter.
    - [x] Sub-task: Update the initial data fetch/query to support filtering by `businessPartnerId` (if not already supported).
    - [x] Sub-task: Verify that navigating to `/invoices?partner=123` correctly filters the list.
- [x] Task: Conductor - User Manual Verification 'Invoices Page Integration' (Protocol in workflow.md)

## Phase 2: Tag Management Backend [checkpoint: a5e1d11]
- [x] Task: Create Server Action for Tag Updates fb2586f
    - [x] Sub-task: Create a new server action `updateBusinessPartnerTags` in `src/actions/business-partners.ts`.
    - [x] Sub-task: Implement validation using Zod (array of strings).
    - [x] Sub-task: Implement the database update using Drizzle to modify the `tags` column for the given partner ID.
    - [x] Sub-task: Write unit test for the server action.
- [x] Task: Conductor - User Manual Verification 'Tag Management Backend' (Protocol in workflow.md)

## Phase 3: Business Partners UI Updates [checkpoint: 4127207]
- [x] Task: Implement Tag Management Sheet 1e1685c
    - [x] Sub-task: Create a new component `BusinessPartnerTagsSheet`.
    - [x] Sub-task: Implement UI for listing current tags (badges with remove button).
    - [x] Sub-task: Implement UI for adding new tags (input + add button).
    - [x] Sub-task: Integrate `updateBusinessPartnerTags` server action.
- [x] Task: Update Partners Table Actions 1e1685c
    - [x] Sub-task: Remove the "Edit" action from the `BusinessPartnersTable` columns definition.
    - [x] Sub-task: Add "View Invoices" action (link to `/invoices?partner=...`).
    - [x] Sub-task: Add "Manage Tags" action (triggers the `BusinessPartnerTagsSheet`).
- [x] Task: Conductor - User Manual Verification 'Business Partners UI Updates' (Protocol in workflow.md)
