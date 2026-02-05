# Implementation Plan: Invoice Type Refactoring & Classification

## Phase 1: Core Logic & Types [checkpoint: ]
- [x] Task: Define Supported Invoice Types 763eb08
    - [x] Create a central constant or type definition for `InvoiceType` (e.g., in `src/types/invoices.ts` or `src/lib/constants.ts`).
    - [x] Update `src/db/schema/invoices.ts` comments or validation if applicable to reflect the new types.
- [ ] Task: Implement Centralized Derivation Logic
    - [ ] Create `src/lib/invoice-utils.ts` (or update existing) with a `deriveInvoiceType(cfdiType, isEmitter)` function.
    - [ ] Write unit tests for the derivation logic: `src/lib/invoice-utils.test.ts`.
- [ ] Task: Conductor - User Manual Verification 'Core Logic & Types' (Protocol in workflow.md)

## Phase 2: Data Ingestion Updates [checkpoint: ]
- [ ] Task: Update CFDI Processing (Invoices Data Layer)
    - [ ] Update `src/data/invoices.ts` to use the new `deriveInvoiceType` function.
    - [ ] Ensure `savePaymentComplement` and `savePUEPayment` are compatible with the new type strings.
- [ ] Task: Update CFDI Processing (Server Actions)
    - [ ] Update `src/actions/invoices.ts` to use the new `deriveInvoiceType` function.
- [ ] Task: Update Classification Engine
    - [ ] Update `src/lib/classification-engine.ts` to handle the expanded `invoiceType` set.
- [ ] Task: Verify with Integration Test
    - [ ] Update or create a test in `src/data/invoices.test.ts` to verify a CFDI 'E' results in `credit_note_issued/received`.
- [ ] Task: Conductor - User Manual Verification 'Data Ingestion Updates' (Protocol in workflow.md)

## Phase 3: Data Migration (Backfill) [checkpoint: ]
- [ ] Task: Create Backfill Script
    - [ ] Create `src/scripts/backfill-invoice-types.ts`.
    - [ ] Implement logic to query all invoices, determine `isEmitter` by comparing `organization.rfc` with `partner.rfc` (or existing metadata), and update the record.
- [ ] Task: Execute and Verify Backfill
    - [ ] Run the script on the local database.
    - [ ] Verify a sample of various `cfdiType` records (I, E, P) have the correct `invoiceType`.
- [ ] Task: Conductor - User Manual Verification 'Data Migration (Backfill)' (Protocol in workflow.md)

## Phase 4: Dashboard & UI Integration [checkpoint: ]
- [ ] Task: Update Dashboard Aggregations
    - [ ] Update `src/data/dashboard.ts` to include `credit_note_*` and `payment_*` in calculations or exclude them from "Standard Income/Expense" as needed.
    - [ ] Update `src/data/tax-declarations.ts` to correctly handle `credit_note_received` as a deduction or credit.
- [ ] Task: Update Invoice Table UI
    - [ ] Update the display logic in the invoices table (likely `src/app/invoices/page.tsx` or its components) to show user-friendly labels (e.g., "Pago Recibido" instead of "income" for Type P).
- [ ] Task: Conductor - User Manual Verification 'Dashboard & UI Integration' (Protocol in workflow.md)
