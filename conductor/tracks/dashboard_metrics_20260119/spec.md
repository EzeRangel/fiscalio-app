# Specification: Dashboard Metrics & Period Selection

## Overview
Improve the dashboard to provide better insights by allowing users to select specific time periods (Month/Year) and displaying high-quality metrics including Total Income, Total Expenses, and the Next Tax Declaration deadline.

## User Stories
- As a user, I want to select a specific month and year to see my financial data for that period.
- As a user, I want to see my total income and total expenses at a glance.
- As a user, I want to know when my next tax declaration is due.

## Functional Requirements
### 1. Period Selector
- Implement a dropdown menu to select the Month and Year.
- Defaults to the current month and year.
- When changed, all dashboard metrics should update to reflect the selected period.

### 2. Enhanced Summary Cards
- Use the existing `SummaryCard` component to display:
    - **Total Income**: Sum of all income invoices for the period (Emerald/Green color).
    - **Total Expenses**: Sum of all expense invoices for the period (Red color).
    - **Next Tax Declaration**: The deadline date for the next tax filing (Blue or Amber color).

### 3. Data Fetching
- Update the dashboard data fetching logic to accept period parameters (month, year).
- Ensure loading states are handled (e.g., skeletons or consistent UI while fetching).

## Non-Functional Requirements
- **Consistency**: Use existing `shadcn/ui` components and Tailwind CSS.
- **Responsive Design**: The dashboard must remain fully functional and visually appealing on mobile devices.
- **Performance**: Data fetching should be efficient, leveraging existing indexing or query optimizations where possible.

## Acceptance Criteria
- [ ] A Month/Year selector is present and functional on the dashboard.
- [ ] Changing the period updates the Income and Expense totals correctly.
- [ ] The Next Tax Declaration card displays a valid date.
- [ ] All new/updated UI elements use the `SummaryCard` component and follow project styling.
- [ ] The dashboard is responsive and works well on mobile.

## Out of Scope
- Detailed tax amount projections (only the deadline date is required for now).
- Advanced charts or data visualizations beyond the summary cards.
- Custom date ranges (only Month/Year selection).
