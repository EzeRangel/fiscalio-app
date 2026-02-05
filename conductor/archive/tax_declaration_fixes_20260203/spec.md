# Specification: Tax Declaration Calculations & Summary Improvements

## Overview
Improve the accuracy and transparency of the Tax Declaration page by ensuring all financial calculations are normalized to MXN pesos and displaying the count of invoices contributing to each summary card, adhering strictly to the cash-basis principle.

## Functional Requirements
1. **Currency Normalization**: 
    - Ensure all financial calculations on the Tax Declaration page use normalized MXN amounts.
    - Invoices in currencies other than MXN (e.g., USD) must be converted to MXN using the project's established normalization logic.
2. **Cash-Basis Compliance**:
    - Only paid invoices (or portions of invoices with associated payments) should be included in the financial totals and the invoice counts.
3. **Summary Card Enhancements**:
    - Display the number of contributing invoices on each summary card.
    - Format the display as a label below the amount (e.g., "5 invoices").
    - Fix the current issue where the count displays as `undefined`.

## Non-Functional Requirements
- **Performance**: Normalization and counting logic should not noticeably impact page load or interaction speed.
- **Accuracy**: Calculations must precisely match the RESICO cash-basis requirements.

## Acceptance Criteria
- [ ] Financial totals on the Tax Declaration page correctly sum mixed currencies by normalizing them to MXN.
- [ ] Only invoices with confirmed payments are included in the totals and counts.
- [ ] Summary cards display the correct number of contributing invoices.
- [ ] The "undefined" label currently appearing on summary cards is replaced by the actual count.
- [ ] Unit tests verify the normalization logic for mixed currency scenarios.

## Out of Scope
- Interactive invoice lists (e.g., clicking the count to see the specific invoices).
- Support for additional currencies not already handled by the system.
