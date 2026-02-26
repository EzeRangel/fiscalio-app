# Implementation Plan: IVA Accreditation (RESICO)

This plan outlines the implementation of a system for managing "IVA Acreditable" (Creditable VAT) for expenses in the RESICO regime by adding an accreditation percentage to the Chart of Accounts.

## Phase 1: Database and Schema Updates [checkpoint: ]
Focus on updating the database schema to support the new `ivaAccreditationPercentage` field.

- [x] Task: Update Drizzle Schema for Accounts [90f03e5]
    - [x] Add `ivaAccreditationPercentage` to the `accounts` table.
    - [x] Set a default value of 100 for existing and new accounts (or null depending on type).
    - [x] Generate and run migrations to update the local PGLite database.
- [ ] Task: Update Zod Schemas and Types [ ]
    - [ ] Update the `Account` Zod schema to include the new field with validation (0-100).
    - [ ] Update the corresponding TypeScript types and interfaces.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Database and Schema Updates' (Protocol in workflow.md) [ ]

## Phase 2: Core Logic and Utils [checkpoint: ]
Implement the calculation logic for "IVA Acreditable" based on the account percentage.

- [ ] Task: Implement `calculateCreditableIva` Utility [ ]
    - [ ] Write unit tests for the calculation logic (`IVA * percentage`).
    - [ ] Create a utility function in `src/lib/invoice-utils.ts` to perform the calculation.
    - [ ] Ensure it handles rounding correctly for financial data.
- [ ] Task: Integrate Calculation into Invoice Data Retrieval [ ]
    - [ ] Update the invoice data fetching logic to include the calculated "IVA Acreditable".
    - [ ] Verify that changing an account's percentage correctly updates the calculation.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Core Logic and Utils' (Protocol in workflow.md) [ ]

## Phase 3: UI Implementation - Chart of Accounts [checkpoint: ]
Update the UI to allow users to configure the accreditation percentage.

- [ ] Task: Update Account Creation/Edit Form [ ]
    - [ ] Add a numeric input for the `ivaAccreditationPercentage`.
    - [ ] Include clear labels and help text explaining its purpose (business-relatedness).
    - [ ] Verify that the form correctly saves the new field to the database via server actions.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: UI Implementation - Chart of Accounts' (Protocol in workflow.md) [ ]

## Phase 4: UI Implementation - Invoices and Declarations [checkpoint: ]
Reflect the creditable IVA in the invoice views and the tax declaration summary.

- [ ] Task: Update Invoice View UI [ ]
    - [ ] Display the "IVA Acreditable" value in the invoice details or list view.
    - [ ] Add visual indicators to help the user understand how it was calculated.
- [ ] Task: Update Tax Declaration Integrated Summary [ ]
    - [ ] Modify the Tax Declaration view to include the total "IVA Acreditable" for the period.
    - [ ] Update the final "IVA to Pay" calculation to use the total creditable IVA.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: UI Implementation - Invoices and Declarations' (Protocol in workflow.md) [ ]
