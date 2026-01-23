# Specification - Cash-Basis Financial Reporting (Issued CFDI ≠ Taxable Income)

## Overview
This track implements the core RESICO principle: **Issued CFDI ≠ Taxable Income**. In the Mexican RESICO regime, taxable income and deductible expenses are recognized only upon effective cash collection/payment. This track shifts the application's financial logic from an accrual-basis (based on invoice totals) to a cash-basis (based on payment allocations).

## Functional Requirements

### 1. Global Financial Logic
- **Payment-Centric Calculation:** All financial totals (Income, Expenses, Taxes) must be derived from `PaymentAllocation` records rather than `Invoice` totals.
- **Partial Payment Support:** Financial recognition must be proportional to the actual amount paid. If an invoice is partially paid, only the allocated amount contributes to the period's totals.
- **Unallocated Payment Handling:** Payments not yet linked to an invoice (unallocated) are excluded from taxable income/deductible expense totals to ensure correct tax concept attribution (VAT rates, Retentions).

### 2. UI/UX Updates
- **Main Dashboard:**
    - Update KPI cards (Total Income, Total Expenses, Net Profit) to reflect collected/paid amounts.
    - Charts must plot data based on payment dates, not invoice issuance dates.
- **Tax Declarations:**
    - Calculation logic must strictly use payment allocation dates for period attribution.
- **Business Partner Analytics:**
    - "Total Volume" and "Balance" should distinguish between "Invoiced" and "Actually Paid/Collected".
- **Invoice Lists & Tables:**
    - Clearly display the payment status (e.g., Unpaid, Partially Paid, Paid).
    - Totals in these views should reflect the "Paid" portion.

### 3. Data Integrity
- Ensure that the "Fiscal Period Attribution" rule (from the Fiscal Validation Layer) is the source of truth for when an amount is recognized.

## Non-Functional Requirements
- **Performance:** Ensure that joining `Invoices` with `PaymentAllocations` and `Payments` for totals doesn't significantly degrade dashboard load times.
- **Consistency:** The "Cash-Basis" view must be applied consistently across the entire application to prevent user confusion.

## Acceptance Criteria
- [ ] Dashboard KPI cards match the sum of payment allocations for the selected period.
- [ ] An unpaid invoice does not increase the "Total Income" or "Total Expenses" in any summary report.
- [ ] A partial payment of $X on an invoice of $Y correctly shows $X in the financial reports.
- [ ] All invoice lists clearly show the remaining balance and payment status.
- [ ] Tax declaration previews match the cash-basis principle.

## Out of Scope
- Modifying the underlying CFDI parser or official XML storage.
- Implementing bank reconciliation (matching bank statements to payments).
