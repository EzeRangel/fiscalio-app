# Specification: CFDI Invoices Cancellation & Tax Adjustments (RESICO)

## Overview
This specification details the implementation of a robust, compliant cancellation flow for CFDI invoices (types I - Ingreso and E - Egreso) in Fiscalio. This is specifically tailored to the RESICO regime where tax liabilities operate strictly under the cash-basis principle. To ensure cash-basis calculations and audits remain simple, consistent, and accurate, the system must support cancelled and substituted invoice states, record customer refund payments natively under `payments`, handle cross-period tax adjustments, and correctly shift allocations of money on invoice substitution.

## Functional Requirements
1. **Invoice Status Lifecycle**
   - Invoices should transition from `active` to either `cancelled` (terminal state without replacement) or `substituted` (terminal state with replacement).
   - If an invoice is cancelled or substituted, its status badge must be clearly displayed as "Cancelada" or "Sustituida".
   - Restrict direct cancellation to only type I (Ingreso) and E (Egreso) invoices.

2. **Re-emission / Substitution (Motivo 01/02)**
   - When cancelling an invoice under SAT Motive "01" (with errors, with relation) or "02" (with errors, without relation), a substitute invoice's UUID (`substituteInvoiceId`) must be supplied.
   - Upon successful cancellation, all `paymentAllocations` associated with the original invoice must be atomically updated to point to the substitute invoice (`UPDATE paymentAllocations SET invoice_id = <substitute_id> WHERE invoice_id = <original_id>`).
   - This ensures that money remains allocated correctly to the active income/expense record.

3. **Devoluciones (Refunds - Motivo 03)**
   - Under SAT Motive "03" (no operation occurred), if the invoice has an `amountPaid > 0`, direct cancellation is blocked.
   - The user must register a refund payment ("Registrar Devolución") before completing cancellation.
   - A refund is saved in `payments` with `isRefund = true`, and a reference `refundedInvoiceId` pointing to the invoice being cancelled.
   - Refund payment validation allows checking standard rules but permits correct handling of refunds.
   - Applying a refund decreases the effective `amountPaid` on the invoice to 0 and transitions its `paymentStatus` to `refunded`.

4. **Ajustes Fiscales (Tax Adjustments)**
   - When a refund is registered and its payment date falls in a different month (fiscal period) than the original invoice's accounting period, a `taxAdjustment` entry must be automatically created in a new table `tax_adjustments`.
   - The adjustment stores the amount, period of occurrence, and flag `requiresCompensation = true`.
   - A dedicated UI section in the Tax Declarations view must render all active tax adjustments and provide a manual trigger to mark them as compensated (`appliedInDeclarationId` FK).

5. **Traceability**
   - Every cancellation, substitution, and refund must write a corresponding entry to `auditLogs` to ensure full compliance.

## Non-Functional Requirements
- **100% Offline operation:** All states, transactions, and logic run inside PGLite.
- **Unit Test Coverage:** All newly created files (actions, database schema, helper methods, components) must have >80% test coverage.
- **TDD:** Implement following a red-green-refactor workflow.

## Acceptance Criteria
- [ ] Direct cancellation restricted to CFDI Type I and E.
- [ ] Correct update of Drizzle schema to support `taxAdjustments` table and `payments` new fields.
- [ ] Safe, transactional updates for invoice status transition and allocation transfer on substitution.
- [ ] Automatic creation of cross-period `taxAdjustments` when refunds occur in different months.
- [ ] UI components `CancelInvoiceDialog` and `RegisterRefundDialog` with double confirmation on destructive actions.
- [ ] Rendering pending tax adjustments in Tax Declarations dashboard, allowing compensation tracking.
- [ ] 100% audit log coverage for cancellations.
