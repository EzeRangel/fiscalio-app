# Implementation Plan - USD Support & MXN Normalization

## Phase 1: Core Logic & Normalization (TDD) [checkpoint: a586d1d]
- [x] Task: Create Normalization Utilities 16a9d7c
    - [ ] Update `src/lib/cash-basis-utils.ts` to support currency normalization.
    - [ ] Implement `normalizeToMXN(amount, rate)` helper.
    - [ ] Update `calculateCashBasisSummary` to multiply each allocation's components (subtotal, taxes, etc.) by its `exchangeRate`.
- [x] Task: Unit Tests for Currency Normalization 16a9d7c
    - [ ] Update `src/lib/cash-basis-utils.test.ts`.
    - [ ] Test cases: MXN-only, USD-only (PUE), Mixed currencies, PPD with different rates on Invoice vs Payment.
- [ ] Task: Conductor - User Manual Verification 'Core Logic & Normalization' (Protocol in workflow.md)

## Phase 2: Data Access Layer Normalization
- [x] Task: Update Dashboard Metrics 5386535
    - [ ] Verify `src/data/dashboard.ts` correctly handles `exchangeRate` in SQL queries (already present, needs confirmation with tests).
- [ ] Task: Update Partner Analytics
    - [ ] Refactor `fetchBusinessPartnersWithAnalytics` and `fetchGlobalPartnerStats` in `src/data/businessPartners.ts` to multiply `invoices.total` and `paymentAllocations.amountAllocated` by their respective `exchangeRate`.
- [ ] Task: Update Tax Declarations Logic
    - [ ] Ensure `src/actions/tax-declarations.ts` passes the `exchangeRate` from allocations to the calculation utility.
- [ ] Task: Conductor - User Manual Verification 'Data Access Layer Normalization' (Protocol in workflow.md)

## Phase 3: Forms & Schema Updates
- [ ] Task: Update Zod Schemas
    - [ ] Update invoice and payment validation schemas to ensure `currency` and `exchangeRate` are correctly handled (defaults to MXN/1.0).
- [ ] Task: Update Form Components
    - [ ] Add `currency` (Select) and `exchangeRate` (Input) fields to manual invoice/payment creation forms.
    - [ ] Add logic to hide/show `exchangeRate` input based on selected `currency`.
- [ ] Task: Conductor - User Manual Verification 'Forms & Schema Updates' (Protocol in workflow.md)

## Phase 4: UI Enhancements & Indicators
- [ ] Task: Create CurrencyDisplay Component
    - [ ] Create a reusable component that displays a formatted currency value with a "USD" badge if the source currency is not MXN.
- [ ] Task: Update Dashboard & Lists
    - [ ] Use `CurrencyDisplay` in `SummaryCard` (Dashboard).
    - [ ] Use `CurrencyDisplay` in the Invoices and Payments data tables.
- [ ] Task: Conductor - User Manual Verification 'UI Enhancements & Indicators' (Protocol in workflow.md)

## Phase 5: Verification & Testing
- [ ] Task: End-to-End Verification
    - [ ] Upload a USD CFDI and verify it appears normalized in the dashboard.
    - [ ] Create a manual USD payment for a USD invoice and verify the cash-basis calculation.
- [ ] Task: Conductor - User Manual Verification 'Verification & Testing' (Protocol in workflow.md)
