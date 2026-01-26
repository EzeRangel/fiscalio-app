# Specification - USD Support & MXN Normalization

## Overview
The goal of this track is to implement full support for US Dollar (USD) transactions while maintaining the application's core requirement of MXN-based financial reporting. Following the "Cash-Basis" reporting principle, all USD amounts will be normalized to MXN using the exchange rate valid at the time of the transaction (Invoice date for PUE, Payment date for PPD/REP).

## Functional Requirements

### 1. Data Layer & Conversions
- **Normalization Logic:** 
    - For **PUE (Pago en Una Sola Exhibición)** invoices: `MXN_Amount = Total * ExchangeRate` (using the rate from the invoice).
    - For **PPD (Pago en Parcialidades o Diferido)** + **REP (Payments)**: `MXN_Amount = AllocatedAmount * ExchangeRate` (using the rate from the payment/allocation record).
- **Schema Usage:** Utilize existing `currency` and `exchangeRate` columns in `invoices`, `payments`, and `payment_allocations` tables.

### 2. Dashboard & Reporting
- **KPI Cards:** "Collected Income" and "Paid Expenses" must aggregate all transactions into a single MXN total.
- **Charts & Lists:** All financial visualizations should use the normalized MXN values.
- **Partner Analytics:** Invoiced vs. Paid totals for partners must be calculated in MXN.

### 3. User Interface
- **USD Indicator:** Add a small visual badge (e.g., "USD") next to any amount that was converted from a foreign currency to provide transparency to the user.
- **Input Handling:** Ensure that when users manually create payments or invoices, they can select "USD" and provide the "Exchange Rate".

### 4. CFDI Processing
- **Parsing:** Ensure the CFDI parser correctly maps the `Moneda` and `TipoCambio` attributes from the XML to the database fields.

## Non-Functional Requirements
- **Precision:** Use `decimal` math (via the DB and appropriate JS libraries) to avoid floating-point errors during currency conversion.

## Acceptance Criteria
- [ ] A USD invoice of $100.00 with an exchange rate of 20.00 appears as $2,000.00 MXN in the Dashboard KPIs.
- [ ] A PPD USD invoice paid with a USD REP uses the REP's exchange rate for the cash-basis report.
- [ ] UI displays a "USD" badge next to amounts that were converted.
- [ ] Unit tests verify the `MXN = USD * Rate` logic for both PUE and PPD scenarios.

## Out of Scope
- Support for currencies other than USD and MXN.
- Automatic fetching of exchange rates from external APIs (e.g., Banxico).
- Viewing the entire application dashboard in USD (Multi-currency reporting).
