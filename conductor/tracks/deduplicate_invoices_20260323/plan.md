# Implementation Plan: Deduplicate Invoices in Dashboard and Lists

## Objective
Clean up the dashboard and invoice lists by hiding "Pago" (Payment Complement) and "Egreso" (Credit Note) invoices that are already linked to an "Ingreso" (Income/Expense) invoice. This ensures that only the primary financial events are shown, while still reflecting their payment status via the existing status indicators.

## Key Files & Context
- `src/db/schema/invoices.ts`: Define relationships to detect linked payments.
- `src/data/invoices.ts`: Update data fetchers to include linkage information.
- `src/lib/invoice-utils.ts`: Centralize the deduplication logic.
- `src/components/invoices/invoices-list.tsx`: Apply filtering in the Dashboard.
- `src/app/invoices/_components/list.tsx`: Apply filtering in the full Invoices list.

## Implementation Steps

### Phase 1: Database Schema & Relationships
- [ ] Task: Add `linkedPayments` relation to `invoices` in `src/db/schema/invoices.ts`.
    - [ ] Define a `many-to-one` relationship from `invoices` to `payments` using `invoices.folioFiscal` as the source and `payments.cfdiPaymentId` as the reference.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Database Schema & Relationships' (Protocol in workflow.md)

### Phase 2: Data Fetching Layer
- [ ] Task: Update `getInvoicesByPeriod` in `src/data/invoices.ts` to fetch `linkedPayments`.
    - [ ] Include `linkedPayments` and its `allocations` in the `with` query.
- [ ] Task: Update `getLatestInvoices` in `src/data/invoices.ts` to fetch `linkedPayments`.
- [ ] Task: Update `getInvoicesByOrganization` in `src/data/invoices.ts` to fetch `linkedPayments`.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Data Fetching Layer' (Protocol in workflow.md)

### Phase 3: Filtering Logic Utility
- [ ] Task: Create `isInvoiceLinked` utility in `src/lib/invoice-utils.ts`.
    - [ ] Logic for "P": Check if `linkedPayments` array exists and has at least one allocation.
    - [ ] Logic for "E": Check if `substituteInvoiceId` is not null.
- [ ] Task: Write unit tests for `isInvoiceLinked` in `src/lib/invoice-utils.test.ts`.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Filtering Logic Utility' (Protocol in workflow.md)

### Phase 4: UI Integration
- [ ] Task: Apply filtering in `src/components/invoices/invoices-list.tsx`.
    - [ ] Filter out invoices where `isInvoiceLinked` is true.
- [ ] Task: Apply filtering in `src/app/invoices/_components/list.tsx`.
    - [ ] Filter out invoices where `isInvoiceLinked` is true.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: UI Integration' (Protocol in workflow.md)

## Verification & Testing
- **Automated Tests:**
    - New tests in `src/lib/invoice-utils.test.ts` to verify the deduplication logic for various invoice types and linkage states.
- **Manual Verification:**
    - Upload an "Ingreso" invoice. It should appear.
    - Upload a "Pago" complement linked to that "Ingreso". The "Pago" should NOT appear in the list, but the "Ingreso" status should change to "Paid".
    - Upload a "Pago" complement whose "Ingreso" is NOT in the system. The "Pago" SHOULD appear.
    - Verify the "Export" and "Totals" logic still works as expected.
