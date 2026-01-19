# Specification: Fix Payment Complement Schema Validation

## Overview
The current Zod schema for validating CFDI JSON output (`ComprobanteSchema`) is causing runtime errors when processing certain Payment Complements or even standard invoices. The issue stems from the `Complemento` field (and potentially others like `Concepto`), which the parsing library converts to a single object when there is only one item, but the Zod schema strictly expects an array. This track aims to make the schema robust enough to handle both single objects and arrays for these repeatable fields, ensuring reliable parsing for both Payment Complements and standard invoices.

## Functional Requirements

### 1. Robust Schema Validation
- Modify `src/types/cfdi-schemas.ts` to handle the variability in the JSON output from `@nodecfdi/cfdi-to-json`.
- **Target Fields:**
    - `Complemento`: Must accept either a single object OR an array of objects.
    - `Conceptos.Concepto`: (Verify/Ensure) Must accept either a single object OR an array of objects.
    - `Impuestos.Traslados.Traslado`: Must accept single object or array.
    - `Impuestos.Retenciones.Retencion`: Must accept single object or array.
    - **Payment Complement Specifics:** Ensure `Pago`, `DoctoRelacionado`, `TrasladoDR`, `RetencionDR`, etc., also handle this polymorphism if applicable.

### 2. Normalization (Optional but Recommended)
- Consider using `z.preprocess` or a `transform` to automatically normalize these fields into arrays. This simplifies downstream code (e.g., `invoice.Complemento.find(...)` works without checking `Array.isArray`).

## Non-Functional Requirements
- **Backwards Compatibility:** Ensure standard invoices (Ingreso/Egreso) continue to function correctly.
- **Type Safety:** The inferred TypeScript types should consistently expose these fields as Arrays (or at least Unions) to prevent runtime crashes in application logic.

## Acceptance Criteria
- [ ] Parsing a CFDI with a single `Complemento` (e.g., just `TimbreFiscalDigital`) succeeds.
- [ ] Parsing a CFDI with multiple `Complemento` nodes (e.g., `TimbreFiscalDigital` AND `Pagos`) succeeds.
- [ ] Parsing a Payment Complement (Type "P") with single or multiple `Pago` nodes succeeds.
- [ ] Parsing a Payment Complement with single or multiple `DoctoRelacionado` nodes succeeds.
- [ ] A comprehensive test suite covers these edge cases (Single vs Array) for all modified fields.

## Out of Scope
- Changes to the `@nodecfdi/cfdi-to-json` library configuration (we fix the validation layer).
- UI changes for displaying payments (unless blocked by this parsing issue).
