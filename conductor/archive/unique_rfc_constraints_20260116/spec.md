# Specification: Enforce Unique RFC Constraints with Generic RFC Exceptions

## Overview
Currently, the system allows duplicate RFCs for business partners because there is no unique constraint at the database level. Additionally, the invoice ingestion logic automatically collapses all entities sharing a generic RFC (e.g., foreign providers) into a single partner record. This track aims to enforce RFC uniqueness for specific entities while allowing multiple distinct partners to share generic RFCs.

## User Persona
- **Small Business Owners & Accountants:** Who need to ensure their database of clients and providers is clean and accurate, especially when dealing with multiple foreign entities that share a generic SAT RFC.

## Functional Requirements

### 1. Database-Level Uniqueness
- Implement a **Partial Unique Index** on the `business_partners` table.
- The constraint must ensure that the combination of `(organization_id, rfc)` is unique.
- **Exception:** The uniqueness constraint MUST NOT apply if the `rfc` is one of the following generic values:
    - `XAXX010101000` (Generic Domestic / Public)
    - `XEXX010101000` (Generic Foreign)
- This ensures Organization A and Organization B can both have a partner with RFC `ABC123456`, but Organization A cannot have *two* partners with that same RFC.

### 2. Manual Partner Creation
- When creating or updating a partner manually:
    - Check for duplicates within the **current active organization**.
    - If a specific (non-generic) RFC is entered that already exists in the same organization, the operation must be blocked.
    - The user must receive a **Toast Notification** explaining that the RFC is already registered to another partner.

### 3. Automated Invoice Ingestion
- Modify the "Find or Create Partner" logic during CFDI upload:
    - **Specific RFC:** Match existing partner by `(organization_id, rfc)`.
    - **Generic RFC:** Match existing partner by `(organization_id, rfc, business_name)`.
    - If no match is found for a generic RFC (even if the RFC exists but the name is different), create a new Business Partner record.

## Non-Functional Requirements
- **Data Integrity:** Ensure no duplicate specific RFCs are created through any entry point (UI or API).
- **Performance:** The unique index should not negatively impact the performance of partner lookups during invoice processing.

## Acceptance Criteria
- [ ] Attempting to manually create a partner with an existing specific RFC (in the same organization) triggers a toast error and fails.
- [ ] Attempting to manually create a partner with an existing generic RFC (in the same organization) succeeds.
- [ ] Two different organizations can have a partner with the exact same specific RFC without conflict.
- [ ] Uploading an invoice with a generic RFC and a *new* business name creates a new partner record.
- [ ] Uploading an invoice with a generic RFC and an *existing* business name links to the existing record.
- [ ] Database schema includes a partial index verifying the uniqueness rules scoped by `organization_id`.

## Out of Scope
- Migrating/Merging existing duplicate data (this track assumes a clean start or that manual cleanup is handled separately).
- Validation of RFC format (already handled by other layers).
