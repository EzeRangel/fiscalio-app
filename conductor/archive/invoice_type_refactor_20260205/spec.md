# Specification: Invoice Type Refactoring & Classification

## 1. Overview
The current system uses two overlapping fields, `invoiceType` and `cfdiType`, which leads to ambiguity and bugs in dashboard totals and UI tables. `invoiceType` currently only supports `income` and `expense`, failing to distinguish between standard invoices, credit notes, payments, and payroll. This track will refactor the classification logic to strictly derive a descriptive `invoiceType` based on the document's nature (`cfdiType`) and the organization's role (Emitter vs. Receiver).

## 2. Functional Requirements

### 2.1 Refined Classification Mapping
The `invoiceType` field in the `invoices` table will be populated using the following logic:

| CFDI Type (`cfdiType`) | Org Role | New `invoiceType` |
| :--- | :--- | :--- |
| **I** (Ingreso) | Emitter | `income` |
| **I** (Ingreso) | Receiver | `expense` |
| **E** (Egreso) | Emitter | `credit_note_issued` |
| **E** (Egreso) | Receiver | `credit_note_received` |
| **P** (Pago) | Emitter | `payment_issued` |
| **P** (Pago) | Receiver | `payment_received` |
| **N** (Nómina) | Emitter | `payroll_issued` |
| **N** (Nómina) | Receiver | `payroll_received` |
| **T** (Traslado) | Emitter | `transfer_issued` |
| **T** (Traslado) | Receiver | `transfer_received` |

### 2.2 Data Ingestion Updates
- Update `src/data/invoices.ts` and `src/actions/invoices.ts` to implement the new mapping during XML processing.
- Ensure the `invoiceType` derivation happens immediately after RFC verification.

### 2.3 UI & Dashboard Integration
- **Dashboard:** Update KPI calculation logic (e.g., in `src/data/dashboard.ts` and `src/data/tax-declarations.ts`) to account for these new types. (e.g., `credit_note_issued` should potentially decrease "Income").
- **Tables:** Update invoice tables to display more descriptive labels based on the new types.

### 2.4 Data Migration (Backfill)
- Create a script to iterate through existing invoices and update their `invoiceType` based on their `cfdiType` and whether the `partnerId` represents an emitter or receiver relationship.

## 3. Acceptance Criteria
- [ ] All existing invoices in the database are updated to the new `invoiceType` classification.
- [ ] New CFDI uploads are correctly classified into one of the 10 categories defined in 2.1.
- [ ] Dashboard totals remain accurate and correctly incorporate credit notes.
- [ ] The Invoices table correctly filters and labels the new types.

## 4. Out of Scope
- Modifying the `cfdiType` field (this remains the raw SAT value).
- Changes to the physical database schema (the `varchar(20)` field is sufficient).
