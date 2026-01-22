# Specification - Payment Correction UI (PUE Date Fix)

## Overview
This feature addresses the discrepancy between the auto-generated payment dates for PUE (Pago en una sola exhibición) invoices and the actual cash flow date. In a cash-basis (RESICO) regime, the exact date of payment is critical for tax attribution. This track provides a mechanism for users to manually correct the payment date and add clarifying notes for auto-generated payments.

## Functional Requirements

### 1. Payment Modification
- **Editable Fields:** Users can modify the `paymentDate` and `notes` of an existing payment record.
- **Locked Fields:** The `amount` field must remain read-only during the correction process to maintain data integrity with the linked invoice.
- **Validation:** 
    - The new `paymentDate` cannot be earlier than the linked invoice's `invoiceDate`.
    - Future dates are permitted (to reflect expected cash flow).

### 2. UI/UX (Invoice Details View)
- **Entry Point:** Add an "Edit" or "Correct" button next to each payment entry in the `InvoiceDetails` view.
- **Visual Cues:** Auto-generated payments for PUE invoices should display a "Verify" badge or warning icon to alert the user that the date is an assumption.
- **Feedback:** Upon saving, the UI must immediately reflect the updated date and note, and provide a success toast.

### 3. Data & Auditing
- **Server Action:** Implement a `updatePaymentDateAction` that handles the update and logging.
- **Audit Logging:** Every correction must be logged in the `audit_logs` table with the action type `modified`, specifically capturing the old vs. new date in the metadata.

## Non-Functional Requirements
- **Data Integrity:** Ensure that updating the payment date correctly triggers recalculations in any period-based reporting (Dashboards/Tax Declarations).

## Acceptance Criteria
- [ ] A user can navigate to an invoice details page and click "Edit" on an auto-generated payment.
- [ ] The "Edit Payment" dialog allows changing the date and notes but disables the amount input.
- [ ] Saving a valid date updates the record in the database and the UI.
- [ ] Attempting to set a date earlier than the invoice date shows a validation error.
- [ ] The audit log captures the change.

## Out of Scope
- Full bank reconciliation (matching payments to bank statements).
- Changing the payment amount or deleting the payment from this specific UI.
- Bulk editing of payment dates.
