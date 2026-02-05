# Implementation Plan: Invoice Type Refactoring & Classification

## Phase 1: Core Logic & Types [checkpoint: fbde912]
- [x] Task: Define Supported Invoice Types 763eb08
    - [x] Create a central constant or type definition for `InvoiceType` (e.g., in `src/types/invoices.ts` or `src/lib/constants.ts`).
    - [x] Update `src/db/schema/invoices.ts` comments or validation if applicable to reflect the new types.
- [x] Task: Implement Centralized Derivation Logic 417e0b5
    - [x] Create `src/lib/invoice-utils.ts` (or update existing) with a `deriveInvoiceType(cfdiType, isEmitter)` function.
    - [x] Write unit tests for the derivation logic: `src/lib/invoice-utils.test.ts`.
- [ ] Task: Conductor - User Manual Verification 'Core Logic & Types' (Protocol in workflow.md)

## Phase 2: Data Ingestion Updates [checkpoint: 3f4d2c7]
- [x] Task: Update CFDI Processing (Invoices Data Layer) b01c37b
    - [x] Update `src/data/invoices.ts` to use the new `deriveInvoiceType` function.
    - [x] Ensure `savePaymentComplement` and `savePUEPayment` are compatible with the new type strings.
- [x] Task: Update CFDI Processing (Server Actions) b01c37b
    - [x] Update `src/actions/invoices.ts` to use the new `deriveInvoiceType` function.
- [x] Task: Update Classification Engine b01c37b
    - [x] Update `src/lib/classification-engine.ts` to handle the expanded `invoiceType` set.
- [x] Task: Verify with Integration Test b01c37b
    - [x] Update or create a test in `src/data/invoices.test.ts` to verify a CFDI 'E' results in `credit_note_issued/received`.
- [ ] Task: Conductor - User Manual Verification 'Data Ingestion Updates' (Protocol in workflow.md)

## Phase 3: Data Migration (Backfill) [checkpoint: f2cee33]
- [x] Task: Create Backfill Script
    - [x] Create `src/scripts/backfill-invoice-types.ts`.
    - [x] Implement logic to query all invoices, determine `isEmitter` by comparing `organization.rfc` with `partner.rfc` (or existing metadata), and update the record.
- [x] Task: Execute and Verify Backfill
    - [x] Run the script on the local database.
    - [x] Verify a sample of various `cfdiType` records (I, E, P) have the correct `invoiceType`.
- [ ] Task: Conductor - User Manual Verification 'Data Migration (Backfill)' (Protocol in workflow.md)

## Phase 4: Dashboard & UI Integration [checkpoint: 8527e3c]
- [x] Task: Update Dashboard Aggregations 7261f6a
    - [x] Update `src/data/dashboard.ts` to include `credit_note_*` and `payment_*` in calculations or exclude them from "Standard Income/Expense" as needed.
    - [x] Update `src/data/tax-declarations.ts` to correctly handle `credit_note_received` as a deduction or credit.
- [x] Task: Update Invoice Table UI 7261f6a
    - [x] Update the display logic in the invoices table (likely `src/app/invoices/page.tsx` or its components) to show user-friendly labels (e.g., "Pago Recibido" instead of "income" for Type P).
- [ ] Task: Conductor - User Manual Verification 'Dashboard & UI Integration' (Protocol in workflow.md)
