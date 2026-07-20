# Track Specification: Declaration History Organized by Status

## Overview
Implement a comprehensive history list of all tax declarations on the `/tax-declarations` page, organized by their current status. This addresses the issue where unclosed declarations (e.g., drafts or errors from previous periods) are omitted from the default view and become inaccessible ("stuck in limbo").

## Functional Requirements
- **Location:** The list will be located in the dedicated "Declaraciones" page/route (`/app/tax-declarations/page.tsx`), likely replacing or enhancing the current "Historial" section.
- **Statuses to Handle:**
  - `draft` (Borrador)
  - `validated` (Verificada)
  - `filed` (Finalizada)
  - `exported` (Exportada)
- **Secondary text per status:**
  - `draft`: "Creado el {createdAt}"
  - `validated`: "Verificada el {updatedAt}"
  - `filed`: "Presentada el {filedAt}"
  - `exported`: "Exportada el {exportedAt}"
- **Data Display:** For each declaration, the list must display:
  - Period (Month/Year)
  - Current Status
- **Organization:** Flat list in reverse chronological order (`fiscalPeriod DESC`), each item with a status badge.

## Acceptance Criteria
- Users can view a list of all their historical declarations on the Declaraciones page.
- Declarations that are in `draft`, `validated`, or `error` states are visible in this list and do not disappear.
- Each item in the list clearly shows its period and status.
- Users can click on any declaration in the list to view or continue its process.

## Out of Scope
- Creating new declaration workflows.
- Modifying the underlying calculation logic for declarations.
- Annual or bimonthly declaration types. Only `monthly` is currently supported.
