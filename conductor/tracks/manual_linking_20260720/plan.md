# Implementation Plan: Manual Linking of Invoice to Payment Complement

## Phase 1: Data Access & Server Actions
- [ ] Task: Create Data fetching query for unlinked Payment Complements
    - [ ] Write failing unit test for `getUnlinkedPaymentComplements` data function.
    - [ ] Implement `getUnlinkedPaymentComplements` (filters by unlinked status and supports Client/Provider name search).
    - [ ] Refactor and ensure all tests pass.
- [ ] Task: Create Server Action for linking Invoice to Payment Complement
    - [ ] Write failing unit test for `linkPaymentComplement` server action.
    - [ ] Implement `linkPaymentComplement` server action (validates input via Zod, updates DB, handles errors).
    - [ ] Refactor and ensure all tests pass.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Data Access & Server Actions' (Protocol in workflow.md)

## Phase 2: UI Components & Integration
- [ ] Task: Build Link Payment Complement Modal/Dialog Component
    - [ ] Write component tests for UI rendering and interactions.
    - [ ] Implement UI with search input and list of unlinked payment complements.
    - [ ] Integrate TanStack Query for fetching data and Next-Safe-Action for the submission.
- [ ] Task: Update Invoice Details Page
    - [ ] Add "Link Payment Complement" button on the Invoice Details page.
    - [ ] Connect button to open the modal/dialog.
    - [ ] Ensure the page re-fetches or optimistically updates to display the newly linked payment complement.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: UI Components & Integration' (Protocol in workflow.md)
