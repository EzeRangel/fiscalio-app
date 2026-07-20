# Specification: Manual Linking of Invoice to Payment Complement

## Overview

When a Payment Complement (Complemento de Pago) XML is imported before its related Ingreso invoice, the system cannot auto-create `paymentAllocations` because the target invoice does not exist yet. This feature provides a manual way for users to link a Payment Complement to an Ingreso invoice, re-processing the complement's XML to create all missing allocations.

## Functional Requirements

1. **Entry Point:** A "Link Payment Complement" button appears in the Actions sidebar on the Ingreso invoice detail page, below "Descargar XML". Always visible on invoices with `cfdiType === "I"` and `status === "active"`.

2. **Selection Modal:**
   - Opens on button click.
   - Lists Payment Complement invoices (`cfdiType === "P"`, non-cancelled, non-refund) that have at least one unresolved `DoctoRelacionado`.
   - Pre-filtered to the Ingreso's `partnerId`.
   - Client-side search/filter by partner name.
   - Columns: Partner name, payment date, amount, UUID (TimbreFiscalDigital), assignment status (e.g. "2 de 3 facturas asignadas").

3. **Linking Action:** User selects a complement and confirms. The server action:
   - Validates that the complement's XML contains at least one `DoctoRelacionado.IdDocumento` matching the Ingreso's `folioFiscal`.
   - Re-parses the complement's `xmlContent` and iterates all `DoctoRelacionado`.
   - For each `IdDocumento`, finds the target invoice by `folioFiscal`.
   - If the target invoice exists and no `paymentAllocation` exists for that (payment, invoice) pair, creates one (idempotent).
   - Runs the same fiscal validations as auto-linking (`validateAllocation`, `validateInvoice`).
   - On failure: generic error toast, details logged.

4. **Cardinality:** M:N. The XML is the source of truth — a single complement may reference multiple Ingreso invoices, and the linking creates allocations for all existing targets.

5. **Post-Linking:** Modal closes, success toast, `revalidatePath` for the invoice detail page. The existing "Historial de Pagos" section reflects the new allocations automatically.

## Non-Functional Requirements

- **Offline-First:** All search, filtering, and linking actions execute locally via PGLite.
- **Immediate Feedback:** `revalidatePath` triggers a fresh server component render showing updated data.

## Acceptance Criteria

- Ingreso invoice detail page shows "Link Payment Complement" button in Actions sidebar.
- Clicking opens a modal with pre-filtered, searchable list of available complements.
- Selecting a complement and confirming creates `paymentAllocations` for all unresolved `DoctoRelacionado`.
- Fiscal validations are enforced (date mismatch blocks linking).
- Historial de Pagos section reflects newly linked payment (amountPaid updated, allocations visible).
- Re-linking an already-fully-resolved complement is a no-op with success toast.
- XML re-parsing is idempotent — already-existing allocations are not duplicated.

## Out of Scope

- Automatic retrospective linking when a previously-missing invoice is imported.
- Unlinking or removing a payment allocation.
