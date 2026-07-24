# Specification: Payment Complements Sub-rows

## Overview
The goal is to allow users to view "Payment Complements" (type P invoices) linked to a parent invoice (Income/Expense) directly from the invoice list (`/invoices`). Currently, these type P invoices are hidden from the main list to avoid duplication, but there's no way to view them. We will use an expandable rows design to nest this information without leaving the main view.

## Functional Requirements
- **Expansion Indicator:** Invoices with associated payment complements will show a toggle icon (e.g., Chevron) to expand the row.
- **Sub-panel:** Clicking the icon will display a sub-row containing a nested table.
- **Data Displayed:** The sub-panel will exclusively show the Internal Folio, Date, UUID (Folio Fiscal), and Amount of the payment complement.
- **Relationship Resolution:** Complements will be filtered in memory using the data already returned by the database via `allInvoices`. If the `invoiceType` indicates it is a payment and it has `linkedPayments` with an allocation to the parent invoice, it will be listed.

## Non-Functional Requirements
- **Performance:** No extra server requests will be made (zero additional network requests). It will leverage data already present in the UI state.
- **UX/UI:** The expanded row must integrate harmoniously with the shadcn/ui `Table` component.

## Out of Scope
- No additional action buttons (e.g., "View Detail") will be included in the nested payments table; it will remain purely informational.
- Underlying SQL queries will not be modified, as the current data already supports this requirement.
