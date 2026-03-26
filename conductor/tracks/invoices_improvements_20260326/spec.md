# Specification: /invoices Page Improvements

## Overview
Improve the `/invoices` page by implementing interactive client-side filtering and dynamic period-based grouping. The system must ensure that grouping sections and summary totals always accurately reflect the current filtered set of invoices.

## Functional Requirements

### 1. Interactive Client-Side Filtering
- **Search Filtering:** Connect the search input to filter invoices by Business Partner name, RFC, or internal Folio.
- **Type Filtering:** Provide a selector to filter invoices by CFDI Type:
  - **Todos:** Show all invoices.
  - **Ingreso:** Show only income invoices.
  - **Egreso:** Show only expense invoices.
- **Reactive Header:** The total invoice count displayed in the page header must update in real-time to reflect the number of invoices currently visible after filtering.

### 2. Dynamic Period-Based Grouping
- **Grouping Selector:** Provide a selector to choose how invoices are grouped:
  - **Sin agrupar:** Display a flat list of all filtered invoices.
  - **Por mes:** Group filtered invoices by accounting month (e.g., "Enero 2026").
  - **Por año:** Group filtered invoices by accounting year (e.g., "2026").
- **Sectioned UI:** Grouped invoices should be presented in distinct sections with clear headers.
- **Filtering Integration:** Grouping must apply *after* filtering. If a group (month or year) contains no invoices that match the current filters, that group should not be rendered.

### 3. Reactive Summary Totals
- **Per-Group Totals:** Each grouping section (Month or Year) must display summary totals calculated *only* from the filtered invoices within that group:
  - **Ingresos (Cobrado):** Sum of paid amounts for income-type invoices.
  - **Egresos (Pagado):** Sum of paid amounts for expense-type invoices.
  - **Efectivo Neto:** The difference between total income and total expenses for the group.
- **Real-Time Recalculation:** Totals must update instantly as filters are applied or grouping is changed.

### 4. Performance
- **Client-Side Processing:** All filtering, grouping, and total calculations must be performed on the client side to ensure a responsive user experience.
- **Scalability:** The implementation should efficiently handle at least 1,000 invoices without noticeable lag.

## Technical Requirements
- **State Management:** Lift the filtering (search query, type filter) and grouping state to a common parent component (`InvoicesClient`) in `src/app/invoices/page.tsx`.
- **Component Communication:**
  - Pass the state and update functions to the `Filters` component.
  - Pass the filtered/grouped data to the `List` component for rendering.
- **Utility Reuse:** Leverage existing utilities like `calculateInvoicePaid`, `formatPrice`, and `isInvoiceLinked` for consistency.

## Acceptance Criteria
- [ ] Searching for a partner name filters the list and updates the totals in the group headers.
- [ ] Selecting "Ingreso" in the type filter hides all expense invoices and recalculates the monthly totals.
- [ ] Changing from "Por mes" to "Por año" grouping correctly reshapes the UI and aggregates totals by year.
- [ ] The total invoice count in the page header accurately reflects the filtered results.
- [ ] Groups with no matching invoices are automatically hidden.
