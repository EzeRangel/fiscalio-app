# Implementation Plan: IVA Accreditation (RESICO)

This plan outlines the implementation of a system for managing "IVA Acreditable" (Creditable VAT) for expenses in the RESICO regime by adding an accreditation percentage to the Chart of Accounts.

## Phase 1: Database and Schema Updates [checkpoint: 1690cc9]
Focus on updating the database schema to support the new `ivaAccreditationPercentage` field.

- [x] Task: Update Drizzle Schema for Accounts [90f03e5]
    - [x] Add `ivaAccreditationPercentage` to the `accounts` table.
    - [x] Set a default value of 0.00 for existing and new accounts (or null depending on type). [1690cc9]
    - [x] Generate and run migrations to update the local PGLite database.
- [x] Task: Update Zod Schemas and Types [e7a3707]
    - [x] Update the `Account` Zod schema to include the new field with validation (0-100).
    - [x] Update the corresponding TypeScript types and interfaces.
- [x] Task: Conductor - User Manual Verification 'Phase 1: Database and Schema Updates' (Protocol in workflow.md) [1690cc9]

## Phase 2: Core Logic and Utils [checkpoint: 94154ca]
Implement the calculation logic for "IVA Acreditable" based on the account percentage.

- [x] Task: Implement `calculateCreditableIva` Utility [adcf174]
    - [x] Write unit tests for the calculation logic (`IVA * percentage`).
    - [x] Create a utility function in `src/lib/invoice-utils.ts` to perform the calculation.
    - [x] Ensure it handles rounding correctly for financial data.
- [x] Task: Integrate Calculation into Invoice Data Retrieval [deb40eb]
    - [x] Update the invoice data fetching logic to include the calculated "IVA Acreditable".
    - [x] Verify that changing an account's percentage correctly updates the calculation.
- [x] Task: Conductor - User Manual Verification 'Phase 2: Core Logic and Utils' (Protocol in workflow.md) [94154ca]

## Phase 3: UI Implementation - Chart of Accounts [checkpoint: ]
Update the UI to allow users to configure the accreditation percentage.

- [x] Task: Update Account Creation/Edit Form [d304dd5]
    - [x] Add a numeric input for the `ivaAccreditationPercentage`.
    - [x] Include clear labels and help text explaining its purpose (business-relatedness).
    - [x] Verify that the form correctly saves the new field to the database via server actions.
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
