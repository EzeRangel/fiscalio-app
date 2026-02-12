# Spec: Pre-Processing & Data Integrity for CFDI Imports

## Overview
This track implements robust data integrity checks during the CFDI (XML) import process to prevent duplicate records in the database. It focuses on two layers of protection: file-level de-duplication (via SHA-256 hash) and fiscal-level uniqueness (via SAT UUID).

## Functional Requirements

### 1. File De-duplication
- **Requirement:** Before parsing the full XML content, the system must verify if the exact file has been uploaded previously.
- **Logic:** Generate a SHA-256 hash of the XML file content.
- **Action:** Check the `invoices.file_hash` column. If a record with the same hash exists within the current organization, the import must be aborted.
- **Error Handling:** Throw a descriptive `ActionError` (e.g., "This file has already been imported.") to be displayed in the UI.

### 2. UUID Uniqueness
- **Requirement:** Ensure that the same fiscal invoice (UUID) is not registered twice, even if the file content differs slightly (e.g., different file naming or metadata).
- **Logic:** Extract the `UUID` from the `TimbreFiscalDigital` node in the CFDI XML.
- **Action:** Query the `invoices.folio_fiscal` column. If a record with the same UUID exists, the import must be aborted.
- **Error Handling:** Throw a descriptive `ActionError` (e.g., "An invoice with this UUID (Folio Fiscal) is already registered.") to be displayed in the UI.

## Non-Functional Requirements
- **Performance:** Hash generation and initial lookups must be performed efficiently before heavy XML parsing or database insertions.
- **Database Integrity:** Maintain the existing unique indexing strategy if applicable (currently handled via application logic/queries).

## Acceptance Criteria
- [ ] Uploading an identical XML file results in an `ActionError` and no new database record.
- [ ] Uploading a different file that contains the same `folio_fiscal` results in an `ActionError` and no new database record.
- [ ] Both checks are scoped to the current organization to allow the same invoice to be uploaded in different organization contexts if necessary (though usually RFC-bound).
- [ ] The `processInvoices` action correctly handles these errors per-file without crashing the batch.

## Out of Scope
- Re-processing or updating existing invoices when a duplicate is found.
- Handling duplicates across different tax regimes or organizations if not already restricted by business logic.
