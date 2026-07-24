# Specification: Payment Complements Sub-rows

## Overview
The goal is to allow users to view "Payment Complements" (type P invoices) linked to a parent invoice (Income/Expense) directly from the invoice list (`/invoices`). Currently, these type P invoices are hidden from the main list to avoid duplication, but there's no way to view them. We will use an expandable rows design to nest this information without leaving the main view.

## Functional Requirements
- **Scope:** Support displaying payment complements for both Income (Ingreso) and Expense (Egreso) invoices as long as there is an active payment allocation linking them.
- **Expansion Indicator & Trigger:** Add a new column at the far left of the table. If an invoice has complements, render a toggle button (ChevronRight/ChevronDown). If it doesn't, render an empty cell. Clicking the chevron toggles the sub-row.
- **Sub-panel:** Clicking the toggle will display a sub-row containing a nested table below the main row.
- **Data Displayed:** For each related payment complement, show:
  - **Folio** (Internal folio)
  - **Date** (Invoice date)
  - **UUID** (Folio Fiscal)
  - **Parcialidad** (Installment number from the allocation)
  - **Monto Aplicado** (The portion of the payment allocated to this invoice)
  - **Monto Total** (The total amount of the payment complement invoice)
- **Relationship Resolution:** Complements will be filtered in memory using the `allInvoices` array. A complement matches if it is a payment type (`payment_issued` or `payment_received`) and has `linkedPayments` containing an allocation matching the parent invoice ID.

## Non-Functional Requirements
- **Performance:** No extra server requests will be made (zero additional network requests). It will leverage data already present in the UI state.
- **UX/UI:** The expanded row must integrate harmoniously with the shadcn/ui `Table` component.
- **Privacy Mode:** Respect global Privacy Mode by wrapping the nested table's **UUID**, **Monto Aplicado**, and **Monto Total** in the `<PrivacyBlur>` component.

## Out of Scope
- No additional action buttons (e.g., "View Detail") will be included in the nested payments table; it will remain purely informational.
- Underlying SQL queries will not be modified, as the current data already supports this requirement.
