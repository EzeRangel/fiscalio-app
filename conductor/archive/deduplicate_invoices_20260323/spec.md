# Specification: Deduplicate Invoices in Dashboard and Lists

## Overview
Currently, the dashboard and invoice lists display both the main "Ingreso" (Income/Expense) invoices and their related "Pago" (Payment Complement) or "Egreso" (Credit Note) documents. This creates a sense of duplication because the "Ingreso" invoice already reflects its payment status. This track aims to hide these related documents when they are successfully linked to an "Ingreso" invoice, providing a cleaner and more accurate view of financial events.

## Functional Requirements
1. **Deduplication Logic:**
   - **Payment Complements (Type P):** Hide a "Pago" invoice if it is linked to at least one "Ingreso" invoice via the system's payment allocation records.
   - **Credit Notes (Type E):** Hide an "Egreso" invoice if it is linked as a substitution to another invoice (using `substituteInvoiceId`).
2. **Global Application:** Apply this deduplication logic to all invoice lists across the application, including the main Dashboard and the `/invoices` page.
3. **Implicit Linkage for Payments:** A "Pago" invoice is considered "linked" if there exists a record in the `payments` table where `cfdiPaymentId` matches the invoice's `folioFiscal`, and that payment has one or more `paymentAllocations`.

## Non-Functional Requirements
- **Performance:** Ensure that the deduplication logic (filtering) does not significantly impact the loading time of invoice lists.
- **Maintainability:** Implement the filtering logic in a centralized utility or data-fetching layer to avoid duplication of logic.

## Acceptance Criteria
- [ ] "Pago" invoices that have been correctly allocated to their parent invoices are no longer visible in the Dashboard's "Facturas Recientes" list.
- [ ] "Pago" invoices that have been correctly allocated are no longer visible in the full `/invoices` list.
- [ ] "Ingreso" invoices continue to display their correct payment status (Paid, Partial, Pending).
- [ ] "Pago" invoices that are NOT yet linked to any "Ingreso" invoice (e.g., if the Ingreso was not uploaded) REMAINS visible.
- [ ] "Egreso" invoices linked via `substituteInvoiceId` are hidden.

## Out of Scope
- A toggle to show/hide the deduplicated invoices.
- Advanced "Egreso" (Credit Note) linking beyond `substituteInvoiceId` (e.g., parsing `CfdiRelacionados` for discounts).
