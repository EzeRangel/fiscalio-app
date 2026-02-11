# Specification: Tax Declaration Cash-Basis & Currency Fix

## Overview
The current tax declaration draft generation in `src/actions/tax-declarations.ts` incorrectly calculates totals based on invoice issuance (accrual basis) and fails to normalize USD amounts to MXN. This track aims to align the declaration logic with the cash-basis principle (essential for RESICO) and ensure all financial data is processed in a single currency (MXN).

## Functional Requirements
1.  **Cash-Basis Alignment:**
    *   Modify the tax declaration logic to only include amounts and taxes for invoices that have a recorded payment.
    *   For PUE (Pago en una sola exhibición) invoices, they should be treated as paid on the invoice date if no specific payment record exists, or prioritized by the payment record if one does.
    *   For PPD (Pago en parcialidades o diferido) invoices, only the amounts associated with linked payment complements (REP) should be included.
2.  **Currency Normalization (USD to MXN):**
    *   Detect invoices or payments issued in USD.
    *   Convert USD amounts to MXN using the exchange rate (`TipoCambio`) specified in the XML/Database record for that specific transaction.
    *   Ensure all summary totals (Income, Expenses, IVA, ISR) are calculated and displayed in MXN.

## Non-Functional Requirements
*   **Accuracy:** Calculations must match the official SAT cash-basis rules for RESICO.
*   **Auditability:** The system-wide audit log should reflect the use of normalized values if applicable.

## Acceptance Criteria
*   [ ] Tax declarations generated for a specific period only show amounts from paid invoices/payments within that period.
*   [ ] Invoices in USD are correctly converted to MXN in the declaration summary.
*   [ ] Unit tests verify the conversion logic and the cash-basis filtering.
*   [ ] Integration tests ensure that a mix of MXN and USD invoices results in a correct MXN-only total.

## Out of Scope
*   Automated fetching of exchange rates from external APIs (Banxico/SAT). We will rely on the exchange rate recorded in the CFDI.
*   Modifying the database schema for invoices or payments.
