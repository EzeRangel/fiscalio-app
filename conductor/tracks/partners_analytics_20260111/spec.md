# Track Spec: Partners Analytics & Aggregation

## Context
The Business Partners page currently lacks key insights regarding the financial relationship with each partner. Users need to see the total volume of net income/expense and the total count of invoices associated with each client or provider to make better decisions and understand their financial standing.

## Requirements
1.  **Summary Cards:**
    -   Display "Total Net Volume from Clients" (Income).
    -   Display "Total Net Volume to Providers" (Expenses).
    -   *Constraint:* These must be calculated dynamically based on the current set of invoices in the database.

2.  **Partners Table Enhancements:**
    -   Add a column for "Invoice Count" displaying the total number of invoices linked to that partner.
    -   Add a column for "Total Volume" displaying the sum of the net amounts of those invoices.
    -   *Constraint:* Ensure performance is optimal even with a growing number of invoices.

3.  **Data Source:**
    -   Use the existing `invoices` and `businessPartners` tables in PGLite.
    -   Aggregations should be performed efficiently, preferably at the database query level or via optimized Drizzle queries.

## Technical Considerations
-   **Database:** Modify/Create queries using Drizzle ORM to perform `count` and `sum` aggregations grouped by partner.
-   **Frontend:** Update the `BusinessPartners` component (and children) to receive and display this new data.
-   **Performance:** Avoid N+1 queries. Fetch aggregated data in a single efficient query or a parallel query alongside the partners list.

## Acceptance Criteria
-   [ ] The Partners page header shows correct "Total Client Volume" and "Total Provider Volume".
-   [ ] The Partners table lists every partner with their correct "Invoice Count" and "Total Volume".
-   [ ] Clicking on a partner still opens their details (existing functionality preserved).
-   [ ] UI adheres to the "Refined Editorial" aesthetic defined in product guidelines.
