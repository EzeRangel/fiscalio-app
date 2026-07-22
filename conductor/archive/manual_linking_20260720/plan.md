# Implementation Plan: Manual Linking of Invoice to Payment Complement

## Phase 1: Data Layer & Server Actions [checkpoint: fff9061]

- [x] **Task: Create `processPendingAllocations` data function**
  - Read payment + invoice complement from DB.
  - Parse `xmlContent` to extract `DoctoRelacionado` entries.
  - For each entry: find target invoice by `folioFiscal`, skip if allocation already exists, else create it (idempotent).
  - Run fiscal validations (`validateAllocation`, `validateInvoice`).
  - Update `amountPaid`/`paymentStatus` on target invoices.
  - Write failing unit test → implement → refactor.

- [x] **Task: Create `getUnlinkedPaymentComplements` data function**
  - Query invoices of `cfdiType === "P"`, non-cancelled, shared `partnerId` with current invoice.
  - Filter to those whose payments have at least one unresolved `DoctoRelacionado` (compare XML vs allocations).
  - Return display data: partner name, payment date, amount, UUID, assignment status.
  - Write failing unit test → implement → refactor.

- [x] **Task: Create `linkPaymentAction` server action**
  - Input schema (Zod): `{ paymentId: number, invoiceId: number }`.
  - Validate complement references this invoice via `DoctoRelacionado`.
  - Call `processPendingAllocations` in a transaction.
  - Log action, `revalidatePath`.
  - Generic error handling with `ActionError`.
  - Write failing unit test → implement → refactor.


- [x] **Task: Conductor - User Manual Verification 'Phase 1'** (per workflow.md)

## Phase 2: UI Components & Integration

- [x] **Task: Build LinkPaymentComplementModal component**
  - TanStack Query to fetch unlinked complements on open.
  - Display table with partner, date, amount, UUID, status columns.
  - Client-side search/filter by partner name.
  - "Link" button per row; confirmation step.
  - Integration with `linkPaymentAction` via `useAction`.
  - Loading/error/empty states.
  - Close modal + toast + trigger refetch on success.
  - Write component tests → implement → refactor.

- [x] **Task: Update InvoiceDetails page**
  - Add "Link Payment Complement" button in Actions sidebar (after "Descargar XML").
  - Visible for `cfdiType === "I"` with `status === "active"`.
  - Button opens `LinkPaymentComplementModal`.
  - Write component tests → implement → refactor.

- [ ] **Task: Conductor - User Manual Verification 'Phase 2'** (per workflow.md)
