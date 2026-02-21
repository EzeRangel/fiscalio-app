# Specification: Item-Level Tax Mapping and Proration

## Overview
To support detailed and accurate tax reporting (especially for RESICO freelancers), this track implements strict item-level tax mapping and precise proration for partial payments. This ensures that the tax base is consistent across the invoice and that taxes considered "paid" in any given period are calculated with high granularity.

## Functional Requirements

### 1. Tax Base Consistency Validation
- **Requirement:** For every invoice, the sum of item subtotals minus the sum of item discounts must equal the invoice header subtotal.
- **Logic:** `SUM(invoice_items.subtotal) - SUM(invoice_items.discount) == invoices.subtotal`.
- **Action:** Implement a validation check during invoice processing/saving. If a discrepancy is detected, it should be logged as a validation issue.

### 2. Item-Level Tax Mapping & Fallback
- **Requirement:** Taxes (IVA and ISR) must be associated with specific invoice items.
- **Fallback Strategy:** If an invoice is parsed and item-level tax data is missing:
    - Distribute the header-level `totalTaxes` and `totalWithholdings` proportionally across all items.
    - The proportion for each item is based on its contribution to the total subtotal: `(item.subtotal / invoice.subtotal)`.
- **Supported Taxes:** Focus on IVA (transferred) and ISR (withheld), as these are critical for RESICO.

### 3. Granular Prorated Tax Calculation
- **Requirement:** When a payment is allocated to an invoice (full or partial), the "paid" portion of each tax must be calculated at the item level.
- **Algorithm:**
    1. Calculate the **Global Payment Factor**: `Factor = AmountAllocated / InvoiceTotal`.
    2. For each tax entry (`invoice_taxes`) associated with the invoice's items:
        - `PaidTaxAmount = tax_amount * Factor`.
- **Usage:** This calculation will be used primarily by the Tax Declaration engine to determine creditable IVA and payable ISR for a specific period based on actual cash flow.

## Non-Functional Requirements
- **Precision:** Use high-precision decimals (matching the database schema) for all calculations to avoid rounding errors.
- **Performance:** Ensure that the proration logic is efficient, as it may be executed over many invoices during report generation.

## Acceptance Criteria
- [ ] Invoices with inconsistent totals (items vs. header) are flagged with a validation error.
- [ ] Invoices missing item-level taxes have taxes correctly distributed based on subtotal proportion.
- [ ] Tax declaration reports correctly calculate "Paid" taxes by applying the payment factor to individual item taxes.
- [ ] Unit tests verify the consistency logic, the fallback distribution, and the proration algorithm.

## Out of Scope
- Support for taxes other than IVA and ISR (though the logic should be extensible).
- Automatic correction of invoice totals (only flagging is required).
