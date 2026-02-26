# Specification: IVA Accreditation (RESICO)

## Overview
This track introduces a granular system for managing "IVA Acreditable" (Creditable VAT) for expenses within the RESICO tax regime. While ISR in RESICO is calculated strictly on Gross Income (Cash-Basis), IVA paid on business-related expenses can be credited against IVA collected from income. This feature allows users to define the "business-relatedness" (as a percentage) for each category in their Chart of Accounts, enabling accurate tax declarations.

## Functional Requirements
1. **Account Configuration (Chart of Accounts):**
   - Add a new field `ivaAccreditationPercentage` (0-100) to the Account entity.
   - Update the Account creation and editing forms to include this field.
   - This percentage represents how much of the IVA paid for expenses under this account is creditable (e.g., Gasolina = 50% creditable).

2. **Invoice Processing & UI:**
   - In the Invoice details/view, display the calculated "IVA Acreditable" based on the account classification of the expense.
   - Calculation Logic: `Creditable IVA = Total IVA Paid * (Accreditation Percentage / 100)`.
   - Visual indicators should show the user how the accreditation percentage affects their tax balance.

3. **Tax Declaration Integration:**
   - Update the Tax Declaration view to provide an "Integrated Summary" of spendings.
   - Show both Gross Spending and the total "IVA Acreditable" for the period.
   - Ensure the calculated IVA Acreditable is used in the final "IVA to Pay" calculation: `(IVA Collected) - (IVA Acreditable)`.

## Non-Functional Requirements
- **Data Integrity:** Ensure the percentage is stored as a precise decimal (e.g., using `decimal` in Drizzle/Postgres) to avoid rounding errors.
- **Offline Consistency:** Calculation must be performed locally using the existing classification engine or a dedicated utility.

## Acceptance Criteria
- [ ] Users can set an IVA accreditation percentage (0-100%) for any account in the Chart of Accounts.
- [ ] Changing an account's percentage automatically updates the "IVA Acreditable" calculation for all associated (and future) invoices.
- [ ] The Tax Declaration view correctly sums the total creditable IVA based on the classifications and their respective percentages.
- [ ] The calculation follows the "Simple Percentage" rule: `IVA * %`.

## Out of Scope
- Advanced proration based on exempt vs. taxable income (focus is on business-relatedness percentage).
- Overriding the percentage at the individual invoice level (staying with Account-level defaults for now).
- Partner-level overrides.
