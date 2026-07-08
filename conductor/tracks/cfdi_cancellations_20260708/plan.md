# Implementation Plan: CFDI Invoices Cancellation & Tax Adjustments (RESICO)

This plan outlines the implementation steps to add invoice cancellation, substitution, refunds, and cross-period tax adjustments.

> **Refinements from design interview (2026-07-08):** See `CONTEXT.md` for glossary. Key decisions: (1) Refunds use `isRefund=true` without allocations (no negative allocations); (2) `paymentType="refund"` via new `PAYMENT_TYPE` constant; (3) `paymentStatus` machine: `pending→partial→paid→refunded`; (4) substitute lookup by UUID (`folioFiscal`) + visual selector; (5) `taxAdjustment` auto-created on every Motivo 03 refund with `fiscalPeriod` from refund date (fiscal domain pending expert validation); (6) audit actions: `"cancelled"`, `"refunded"` added; (7) validation rules renamed to `INT-CAN-01/02/03` living in `cancellation-rules.ts`; (8) single dialog with condicional branching (no wizard); (9) `cancelled` visible in list, `substituted` hidden; (10) tax adjustments as separate UI section (opción 3 híbrido).

## Phase 1: Database Migration & Schema Updates [checkpoint]
Focus on setting up the database schema for tax adjustments and payment refunds.

- [ ] Task: Create `taxAdjustments` Drizzle Schema
    - [ ] Create `src/db/schema/taxAdjustments.ts` with columns: `id`, `organizationId`, `invoiceId`, `fiscalPeriod`, `adjustmentType`, `amount`, `currency`, `requiresCompensation`, `appliedInDeclaration`, `notes`, `createdAt`, `updatedAt`.
    - [ ] Export `taxAdjustments` in `src/db/schema/index.ts`.
- [ ] Task: Update `payments` Drizzle Schema
    - [ ] Add `isRefund` boolean (default false) and `refundedInvoiceId` integer FK (to `invoices.id`) in `src/db/schema/payments.ts`.
- [ ] Task: Generate and Run Migration
    - [ ] Run `pnpm db:generate` to generate migration `0019` and apply it to the database.
- [ ] Task: Update Zod schemas and TypeScript types
    - [ ] Create `src/types/cancellation.ts` with types for cancellation request and reasons.
    - [ ] Create `PAYMENT_TYPE` constant in `src/lib/constants.ts` with `{ refund: "Reembolso" }`.
    - [ ] Add `PaymentTypes = InvoiceTypes | keyof typeof PAYMENT_TYPE` to `src/types/utils.ts`.
    - [ ] Add `"cancelled"`, `"refunded"` to `logAction` action union in `src/lib/audit-service.ts`.
    - [ ] Add `"tax_adjustment"` to `AUDIT_ENTITIES` in `src/lib/constants.ts`.
    - [ ] Add `isRefund?: boolean` to `FiscalPayment` in `src/lib/fiscal-validation/types.ts`.
    - [ ] Update `src/types/invoices.ts` and `src/types/payments.ts` or equivalent zod schemas to support the new fields.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Database Migration & Schema Updates' (Protocol in workflow.md)

## Phase 2: Fiscal Validation & Core Logic [checkpoint]
Implement validation rules and update payment validations to handle refunds.

- [ ] Task: Extend validation constants
    - [ ] Add `CANCELLATION` section to `FISCAL_VALIDATION_RULES` with codes: `INT-CAN-01` (cancelación con pagos sin refund), `INT-CAN-02` (motivo 01/02 sin `substituteInvoiceId`), `INT-CAN-03` (refund monto > `amountPaid`) in `src/lib/fiscal-validation/constants.ts`.
- [ ] Task: Create Cancellation Rules
    - [ ] Create `src/lib/fiscal-validation/cancellation-rules.ts` with `validateCancellation()` function. Runs pre-transaction in server action.
    - [ ] Export cancellation rules in `src/lib/fiscal-validation/index.ts`.
- [ ] Task: Update Payment validation rules
    - [ ] Add `isRefund?: boolean` field to `FiscalPayment` type. No rule changes needed (refunds have `amount>0`, pass existing checks).
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Fiscal Validation & Core Logic' (Protocol in workflow.md)

## Phase 3: Server Actions & Data Layer [checkpoint]
Implement the core logic for cancel, substitution, and refund in server actions.

- [ ] Task: Implement `cancellation` data access layer
    - [ ] Create `src/data/cancellation.ts` with methods like `loadInvoiceForCancellation` and `updateInvoiceStatus`.
    - [ ] Write unit tests for these data access methods in `src/data/cancellation.test.ts`.
- [ ] Task: Implement `cancelInvoiceAction`
    - [ ] Create `src/actions/cancellation.ts` containing `cancelInvoiceAction`.
    - [ ] Implement support for substitution (Motivo 01/02) reassigning allocations within a transaction.
    - [ ] Implement write to `auditLogs` upon cancellation.
    - [ ] Write unit/integration tests in `src/actions/cancellation.test.ts` (handling Red and Green phases).
- [ ] Task: Implement `registerRefundAction`
    - [ ] Add `registerRefundAction` in `src/actions/cancellation.ts`.
    - [ ] Implement creation of refund payment (`paymentType="refund"`, `isRefund=true`, `refundedInvoiceId`, `amount>0`, no allocations).
    - [ ] Validar INT-CAN-03 (refund amount ≤ invoice `amountPaid` original) pre-transaction.
    - [ ] Adjust invoice `amountPaid` to 0 and `paymentStatus` to `refunded` (full refund only).
    - [ ] Auto-create `taxAdjustment` always on Motivo 03 refund (fiscalPeriod from refund paymentDate, `requiresCompensation=true`). Fiscal domain pending expert validation on cross-period handling.
    - [ ] Write audit log with action `"refunded"`.
    - [ ] Write tests in `src/actions/cancellation.test.ts` for refund registering.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Server Actions & Data Layer' (Protocol in workflow.md)

## Phase 4: UI Dialogs & Invoice Detail Integration [checkpoint]
Build user-facing components to trigger cancellation and register refunds.

- [ ] Task: Build Dialog components
    - [ ] Create `src/app/invoices/_components/cancel-invoice-dialog.tsx` using shadcn components. Single dialog with branching conditional (no wizard): motivo selector (4 radios), conditional UUID input for motivo 01 with lookup button, optional description, confirmation checkbox.
    - [ ] Create `src/app/invoices/_components/register-refund-dialog.tsx`. Form: amount, date, payment method. No allocations.
    - [ ] Write tests for both dialog components.
- [ ] Task: Integrate into Invoice Details
    - [ ] Update `src/app/invoices/_components/details.tsx`: (a) new status badge row showing `Cancelada`/`Sustituida` when `status !== "active"`; (b) cancel button visible only if `cfdiType=I|E` and `status=active`; (c) `getPaymentStatus` reads `invoice.paymentStatus` field directly; (d) refund payments in list shown as "Devolución" with distinct icon; (e) pre-cancellation yellow banner if `amountPaid > 0` with CTA "Registrar Devolución".
    - [ ] Ensure Cancel options only render for Type I and E.
- [ ] Task: Update invoice list to filter substituted
    - [ ] Add `status !== "substituted"` filter to `getInvoicesByOrganization` default query. Add optional `showSubstituted` param.
    - [ ] Update `isInvoiceLinked()` to handle new statuses. `cancelled` stays visible.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: UI Dialogs & Invoice Detail Integration' (Protocol in workflow.md)

## Phase 5: Tax Declarations Integration [checkpoint]
Integrate tax adjustments into the declarations page.

- [ ] Task: Build Tax Adjustments UI Section
    - [ ] Create `src/app/tax-declarations/_components/tax-adjustments-section.tsx` to list pending adjustments (`appliedInDeclarationId IS NULL`).
    - [ ] "Aplicar a esta declaración" button sets `appliedInDeclarationId` FK. Recalcula declaration totals after applying.
    - [ ] Adjustments do NOT auto-modify declaration calculations (opción 3 híbrido). User must explicitly apply them.
- [ ] Task: Integrate into Declarations View
    - [ ] Add tax adjustments section to the declarations page, fetching `taxAdjustments` by `fiscalPeriod = current period` or `appliedInDeclarationId IS NULL`.
    - [ ] Do not modify existing `createTaxDeclarationDraft` query (it filters `invoices.status=active` and is correct).
- [ ] Task: Conductor - User Manual Verification 'Phase 5: Tax Declarations Integration' (Protocol in workflow.md)
