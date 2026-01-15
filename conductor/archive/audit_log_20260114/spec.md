# Specification: System-Wide Audit Log

## 1. Overview
Implement a comprehensive Audit Log system to provide traceability for critical operations within the FDI Assistant. This feature is essential for compliance and debugging, allowing the tracking of lifecycle events for key entities (Invoices, Payments, Classifications) and configuration changes (Business Partners, Chart of Accounts). Given the local-first nature of the application, the system will assume a single local user context.

## 2. Functional Requirements

### 2.1 Database Schema
- Create a new table `audit_logs` in the local PGLite database.
- **Fields:**
  - `id`: Serial Primary Key.
  - `organization_id`: Reference to Organizations (cascade delete).
  - `entity_type`: String (e.g., 'invoice', 'payment', 'business_partner', 'account').
  - `entity_id`: Integer (ID of the affected entity).
  - `action`: String (e.g., 'created', 'updated', 'deleted', 'classified', 'reconciled').
  - `user_identifier`: String (Defaults to "local-user" for now, allowing for future auth expansion).
  - `changes`: JSONB (Stores the diff of the change: `{ field: { old: val, new: val } }`).
  - `metadata`: JSONB (Stores contextual info like source, reason, AI confidence).
  - `created_at`: Timestamp (Defaults to current time).
- **Indexes:**
  - On `organization_id`
  - On `entity_type`, `entity_id`
  - On `action`
  - On `created_at`

### 2.2 Logging Service / Utilities
- Implement a reusable service or utility function (e.g., `logAuditAction`) that can be called from Server Actions.
- The service should handle:
  - Formatting the `changes` diff.
  - Setting default values (e.g., `user_identifier`).
  - Validating the `metadata` structure.

### 2.3 Integration Points
Refactor existing Server Actions to insert audit logs for the following:
- **Invoices:** Creation, Deletion, Updates, and Classification events (especially AI-driven ones).
- **Payments:** Creation, Update, Deletion.
- **Business Partners:** Creation, Update, Deletion.
- **Chart of Accounts:** Creation, Update, Deletion.

## 3. Data Requirements

### 3.1 Metadata Structure
The `metadata` column must support the following typed structure (Drizzle definition):
```typescript
{
  reason?: string;
  source?: 'manual' | 'ai' | 'import' | 'reconciliation';
  aiConfidence?: number;
  [key: string]: any;
}
```

### 3.2 Change Tracking (Diff)
The `changes` column should strictly store the difference between the old and new states to conserve space.
- **Format:** `{ "field_name": { "old": <value>, "new": <value> } }`

## 4. Non-Functional Requirements
- **Performance:** Writes to the audit log should be non-blocking or efficient enough not to degrade the user experience of the primary action.
- **Storage:** Use `JSONB` for flexible data storage in PGLite.
- **Compatibility:** Ensure strictly typed interfaces using Zod/Drizzle to prevent malformed logs.

## 5. Out of Scope
- UI for viewing the Audit Logs (this track focuses on backend implementation and data capture).
- Tracking of `ip-address` and `user-agent` (removed per user preference).
