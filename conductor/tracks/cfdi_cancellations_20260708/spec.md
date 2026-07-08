 # Specification: CFDI Invoices Cancellation & Tax Adjustments (RESICO)
 
 ## Overview
 This specification details the implementation of a robust, compliant cancellation flow for CFDI invoices (types I - Ingreso and E - Egreso) in Fiscalio. This is specifically tailored to the RESICO regime where tax liabilities operate strictly under the cash-basis principle. To ensure cash-basis calculations and audits remain simple, consistent, and accurate, the system must support cancelled and substituted invoice states, record customer refund payments natively under `payments`, handle cross-period tax adjustments, and correctly shift allocations of money on invoice substitution.
 
 ## Functional Requirements
 1. **Invoice Status Lifecycle**
    - Invoices should transition from `active` to either `cancelled` (terminal state without replacement) or `substituted` (terminal state with replacement).
    - `cancelled` invoices appear in lists with a red "Cancelada" badge and remain accessible.
    - `substituted` invoices are hidden from lists by default (the substitute replaces them); accessible via link from the substitute's detail.
    - Status badges ("Cancelada"/"Sustituida") shown in invoice details and list.
    - Payment status state machine: `pending → partial → paid → refunded` (terminal).
    - Direct cancellation restricted to only type I (Ingreso) and E (Egreso) invoices.
 
 2. **Re-emission / Substitution (Motivo 01/02)**
    - When cancelling under SAT Motive "01" or "02", a substitute invoice (already existing in the system) must be supplied. User can paste its UUID (`folioFiscal`) or search/select from a visual selector. Server resolves UUID → internal `invoices.id`.
    - Upon successful cancellation, all `paymentAllocations` associated with the original invoice are atomically reassigned to the substitute (`UPDATE paymentAllocations SET invoice_id = <substitute_id> WHERE invoice_id = <original_id>`).
    - Original invoice status → `substituted`. Substitute remains `active`.
 
 3. **Devoluciones (Refunds - Motivo 03)**
    - Under SAT Motive "03", if `amountPaid > 0`, direct cancellation is blocked. User must first register a refund ("Registrar Devolución").
    - Refund is saved in `payments` with:
      - `isRefund = true`
      - `paymentType = "refund"` (via `PAYMENT_TYPE` constant)
      - `amount > 0` (positive, same precision)
      - `refundedInvoiceId` FK to the invoice being cancelled
      - **No allocations** (refunds do not use `paymentAllocations`)
    - Only full refunds supported in this version. Partial refunds are out of scope.
    - Applying a refund sets `amountPaid` to 0 and `paymentStatus` to `refunded` on the invoice.
    - Validation rule INT-CAN-03: refund amount must not exceed original `amountPaid`.
 
 4. **Ajustes Fiscales (Tax Adjustments)**
    - A `taxAdjustment` is automatically created on **every** Motivo 03 refund (always, not just cross-period). Fiscal period is the refund's `paymentDate` (YYYY-MM).
    - `requiresCompensation = true` always.
    - A dedicated UI section in the Tax Declarations view renders all pending adjustments (`appliedInDeclarationId IS NULL`).
    - Adjustments do NOT auto-modify declaration calculations (opción 3 híbrido). User must explicitly apply an adjustment to a declaration via "Aplicar a esta declaración" button.
    - Fiscal impact of cross-period compensation deferred for expert validation.
 
 5. **Cancellation UX**
    - Single dialog with branching conditional (not a wizard):
      - Motivo selector (4 radios)
      - Conditional UUID input + search for Motivo 01
      - Optional description
      - Confirmation checkbox ("Entiendo que esta acción no se puede deshacer")
    - Pre-dialog banner: if `amountPaid > 0` and Motivo 03, show yellow banner with CTA "Registrar Devolución". Cancel button blocked until refund is registered.
 
 6. **Validation Rules (INT-CAN)**
    - Pre-transaction validation in server action:
      - **INT-CAN-01**: Cancellation with payments without prior refund → blocked
      - **INT-CAN-02**: Motivo 01/02 without `substituteInvoiceId` → blocked
      - **INT-CAN-03**: Refund amount exceeds invoice's original `amountPaid` → blocked
    - Rules live in `src/lib/fiscal-validation/cancellation-rules.ts`.
 
 7. **Traceability**
    - Every cancellation writes `auditLogs` with action `"cancelled"`.
    - Every refund writes `auditLogs` with action `"refunded"`.
    - Every `taxAdjustment` creation writes `auditLogs` with action `"created"`, entity `"tax_adjustment"`.
 
 ## Non-Functional Requirements
 - **100% Offline operation:** All states, transactions, and logic run inside PGLite.
 - **Unit Test Coverage:** All newly created files (actions, database schema, helper methods, components) must have >80% test coverage.
 - **TDD:** Implement following a red-green-refactor workflow.
 - **Language:** Spanish-neutral, avoid fiscal jargon where possible.
 
 ## Acceptance Criteria
 - [ ] Direct cancellation restricted to CFDI Type I and E.
 - [ ] Correct update of Drizzle schema to support `taxAdjustments` table and `payments` new fields.
 - [ ] Safe, transactional updates for invoice status transition and allocation transfer on substitution.
 - [ ] Automatic creation of `taxAdjustments` on every Motivo 03 refund (fiscal period from refund date).
 - [ ] `cancelled` invoices visible with badge; `substituted` invoices hidden by default.
 - [ ] UI components: single `CancelInvoiceDialog` (branching) and `RegisterRefundDialog` with double confirmation.
 - [ ] Rendering pending tax adjustments in Tax Declarations dashboard with manual "apply to declaration" trigger.
 - [ ] 100% audit log coverage for cancellations, refunds, and tax adjustments.
 - [ ] INT-CAN-01/02/03 validation rules enforced pre-transaction.
