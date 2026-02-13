# Specification: Fiscal Logic Validations (RESICO Specific)

## Overview
This track implements a robust validation layer to ensure all processed invoices (CFDI) strictly adhere to the RESICO (Régimen Simplificado de Confianza) tax regime requirements in Mexico. This includes regime verification, ISR withholding checks for legal entities, and currency/exchange rate validation.

## Functional Requirements

### 1. Strict RESICO Regime Enforcement
- **Constraint:** The application only supports organizations under the RESICO regime (`626`).
- **Validation Logic:** During CFDI upload/parsing:
    - If it's an **Income (Ingreso)** invoice: The `Emisor.RegimenFiscal` must be `626`.
    - If it's an **Expense (Gasto/Ingreso from others)** invoice: The `Receptor.RegimenFiscal` (or the current organization's regime) must be `626`.
- **Action:** If the regime is not `626`, the system must throw an error and **not save** the invoice.

### 2. ISR Withholding Validation (1.25%)
- **Logic:** Triggered if `Receptor.Rfc` length is 12 (Legal Entity/Persona Moral) AND `TipoDeComprobante` is "I" (Income).
- **Validation:** Verify the existence of an `Impuesto Retenido` for ISR at a rate of exactly `0.012500` (1.25%).
- **Action:** 
    - If missing or incorrect, log a high-priority entry in the `validation_errors` field.
    - Display a "Fix Required" flag in the invoice details page.
    - Since the XML is the source of truth, the user must re-upload a corrected CFDI to resolve this.

### 3. Currency & Exchange Rate Validation
- **Logic:** Triggered if `Moneda` is not "MXN".
- **Validation:** `TipoCambio` must be present and greater than `1.0`.
- **Action:**
    - If missing or `TipoCambio <= 1.0`, treat as a high-priority error.
    - Log in `validation_errors` and flag as "Fix Required" in the UI.
    - Exclude these invoices from financial reporting/tax estimations until a valid CFDI is provided.
    - Store the valid `TipoCambio` for financial reporting while maintaining the original currency values.

## UI/UX Requirements
- **Immediate Feedback:** Validation errors should be surfaced during the upload process.
- **Invoice Details:**
    - Visual flags (icons/colors) should indicate the presence of validation errors.
    - A dedicated "Fix Required" section should detail the specific fiscal logic failures.

## Acceptance Criteria
- [ ] Uploading a non-RESICO income invoice is rejected with a clear error message.
- [ ] Income invoices to legal entities without 1.25% ISR withholding are saved but flagged with a high-priority "Fix Required" error.
- [ ] Non-MXN invoices without a valid exchange rate are saved but flagged and excluded from reports.
- [ ] Validation errors are correctly stored in the `validation_errors` database field.
- [ ] UI correctly displays flags and error details in the Invoice Details view.

## Out of Scope
- Automatic correction of XML data.
- Validation for tax regimes other than RESICO (626).
- Handling of "Traslados" or "Nómina" CFDI types in this specific validation phase (unless they impact income/expense logic).
