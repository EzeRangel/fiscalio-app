# Implementation Plan: CFDI Invoices Cancellation & Tax Adjustments (RESICO)

This plan outlines the implementation steps to add invoice cancellation, substitution, refunds, and cross-period tax adjustments.

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
    - [ ] Update `src/types/invoices.ts` and `src/types/payments.ts` or equivalent zod schemas to support the new fields.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Database Migration & Schema Updates' (Protocol in workflow.md)

## Phase 2: Fiscal Validation & Core Logic [checkpoint]
Implement validation rules and update payment validations to handle refunds.

- [ ] Task: Extend validation constants
    - [ ] Add rules `INT-INV-08` (cancellation with unpaid refunds), `INT-INV-09` (substitution without substitute UUID), `INT-PAY-04` (refund amount exceeds payment), and `INT-TAX-ADJ-01` (cross-period correction requires compensation) in `src/lib/fiscal-validation/constants.ts`.
- [ ] Task: Create Cancellation Rules
    - [ ] Create `src/lib/fiscal-validation/cancellation-rules.ts` to implement validation logic for invoice cancellation requests.
    - [ ] Export cancellation rules in `src/lib/fiscal-validation/index.ts`.
- [ ] Task: Update Payment validation rules
    - [ ] Update `validatePayment` in `src/lib/fiscal-validation/payment-rules.ts` to allow refunds and check that refund amounts do not exceed the original payments.
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
    - [ ] Implement creation of refund payment, adjustment of invoice `amountPaid` and `paymentStatus`.
    - [ ] Implement auto-creation of `taxAdjustment` if refund payment month differs from original invoice month.
    - [ ] Write tests in `src/actions/cancellation.test.ts` for refund registering.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Server Actions & Data Layer' (Protocol in workflow.md)

## Phase 4: UI Dialogs & Invoice Detail Integration [checkpoint]
Build user-facing components to trigger cancellation and register refunds.

- [ ] Task: Build Dialog components
    - [ ] Create `src/app/invoices/_components/cancel-invoice-dialog.tsx` using shadcn components.
    - [ ] Create `src/app/invoices/_components/register-refund-dialog.tsx`.
    - [ ] Write tests for both dialog components.
- [ ] Task: Integrate into Invoice Details
    - [ ] Update `src/app/invoices/_components/details.tsx` to render the Cancel button and corresponding status badges for `cancelled`/`substituted`.
    - [ ] Ensure Cancel options only render for Type I and E.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: UI Dialogs & Invoice Detail Integration' (Protocol in workflow.md)

## Phase 5: Tax Declarations Integration [checkpoint]
Integrate tax adjustments into the declarations page.

- [ ] Task: Build Tax Adjustments UI Section
    - [ ] Create `src/app/tax-declarations/_components/tax-adjustments-section.tsx` to list adjustments.
    - [ ] Add action button to mark adjustments as compensated.
- [ ] Task: Integrate into Declarations View
    - [ ] Update tax declaration calculation and UI to fetch and render adjustments, adjusting the period totals accordingly.
- [ ] Task: Conductor - User Manual Verification 'Phase 5: Tax Declarations Integration' (Protocol in workflow.md)
