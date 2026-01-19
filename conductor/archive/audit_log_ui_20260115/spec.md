# Track: Implement Audit Log UI for Various Entities

## Overview
This track focuses on extending the existing `AuditLogPane` component (currently used for invoices) to display audit logs for other key entities within the application. The goal is to provide a consistent and comprehensive audit trail for Tax Declarations, and other user-facing entities that have a detail page, using the established UI/UX and information structure.

## Functional Requirements

### FR1: Extend AuditLogPane Integration
The `AuditLogPane` component shall be integrated into the detail/view pages of the following entities:
- Tax Declarations
- Any other relevant user-facing entities that have a detail page, identified during implementation.

### FR2: Consistent UI/UX
The integration of the `AuditLogPane` for new entities shall utilize the existing UI/UX pattern: a floating toggle button that, when clicked, opens a pane from the bottom of the screen displaying a timeline of audit events.

### FR3: Consistent Information Display
The `AuditLogPane` shall display the same set of information for all integrated entities, including:
- Action type (e.g., created, updated, deleted, classified, reconciled)
- User identifier
- Timestamp of the event
- Reason for the action (if available)
- Source of the action (manual, AI, import, reconciliation)
- AI confidence score (if applicable)
- Details of changes (old vs. new values for modified fields)

### FR4: Dynamic Data Fetching
The `AuditLogPane` shall dynamically fetch and display audit log data relevant to the specific entity it is integrated with, based on the entity's ID.

## Non-Functional Requirements

### NFR1: Performance
The integration of the `AuditLogPane` shall not negatively impact the loading times or responsiveness of the entity detail/view pages.

### NFR2: Maintainability
The implementation should be modular and follow existing project conventions to ensure easy maintenance and future extensions to other entities.

## Acceptance Criteria

### AC1: Tax Declarations Audit Log
- Given a Tax Declaration detail page is loaded,
- When the audit log toggle button is clicked,
- Then the `AuditLogPane` appears from the bottom, displaying the audit history specific to that Tax Declaration, with all specified information fields present.

### AC2: General Entity Audit Log
- Given any other user-facing entity detail page where audit log is integrated is loaded,
- When the audit log toggle button is clicked,
- Then the `AuditLogPane` appears from the bottom, displaying the audit history specific to that entity, with all specified information fields present.

## Out of Scope
- Modification of the existing `AuditLogPane`'s visual design or layout.
- Introduction of new filtering or search capabilities within the `AuditLogPane` beyond what is currently available.
- Changes to the underlying audit log data storage or retrieval mechanisms, other than adapting them to fetch data for different entity types.