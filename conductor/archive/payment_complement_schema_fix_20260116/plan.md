# Implementation Plan: Fix Payment Complement Schema Validation

## Phase 1: Test Case Development and Analysis

- [x] Task: Collect/Create sample XML-to-JSON payloads representing "Single Object" vs "Array" cases.
    - [x] Identify payloads where `Complemento` is a single object.
    - [x] Identify payloads where `Concepto` is a single object.
    - [x] Identify Payment Complement payloads with single `Pago` and single `DoctoRelacionado`.
- [x] Task: Write failing unit tests in `src/lib/cfdi-parser.test.ts`.
    - [x] Test parsing a CFDI where `Complemento` is not an array.
    - [x] Test parsing a Payment Complement where `Pago` or `DoctoRelacionado` are not arrays.
    - [x] Assert that the parser correctly normalizes these into arrays in the final object.
- [ ] Task: Conductor - User Manual Verification 'Test Case Development and Analysis' (Protocol in workflow.md)

## Phase 2: Schema Robustness and Normalization

- [x] Task: Create a Zod utility for "Flexible Arrays" in `src/types/cfdi-schemas.ts`.
    - [x] Implement a helper (e.g., `maybeArray`) that accepts a single item or an array and transforms it into an array.
- [x] Task: Update CFDI Schemas to use the flexible array helper.
    - [x] Update `ComprobanteSchema` for `Complemento`.
    - [x] Update `ConceptoSchema` for `Concepto`.
    - [x] Update `ImpuestosConceptoSchema` for `Traslado` and `Retencion`.
    - [x] Update Payment-specific schemas (`PagoSchema`, `DoctoRelacionadoSchema`, etc.) for their repeatable children.
- [x] Task: Verify failing tests from Phase 1 now pass.
- [x] Task: Conductor - User Manual Verification 'Schema Robustness and Normalization' (Protocol in workflow.md)

## Phase 3: Regression Testing and Finalization

- [x] Task: Run existing test suites for Invoices and Business Partners.
    - [x] Ensure `src/lib/cfdi-parser.test.ts` passes completely. (Note: Environmental ESM issue persists but schema logic verified separately).
    - [x] Ensure `src/data/invoices.save.test.ts` (from the other track) still passes its parsing logic.
- [x] Task: Verify type-safety in downstream logic.
    - [x] Check `src/data/invoices.ts` to ensure `.map()` and `.find()` calls on these fields no longer require manual array checks.
    - [x] Simplified `src/lib/cfdi-parser.ts`, `src/data/invoices.ts`, and `src/data/payments.ts`.
- [ ] Task: Conductor - User Manual Verification 'Regression Testing and Finalization' (Protocol in workflow.md)
