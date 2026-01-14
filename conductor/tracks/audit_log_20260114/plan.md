# Plan: System-Wide Audit Log

## Phase 1: Database & Core Service
- [x] Task: Define Drizzle schema for `audit_logs` table (including indexes and types) and generate migration.
- [x] Task: Create `AuditService` utility.
    - [x] Subtask: Define Zod schemas for `metadata` and `changes` JSONB structures.
    - [x] Subtask: Implement `calculateDiff(oldObj, newObj)` utility.
    - [x] Subtask: Implement `logAction` function.
- [x] Task: TDD - Write unit tests for `AuditService` (verifying diff logic and schema validation).
- [x] Task: Implement `AuditService` logic to pass tests.
- [ ] Task: Conductor - User Manual Verification 'Database & Core Service' (Protocol in workflow.md)

## Phase 2: Invoice & Payment Integration
- [ ] Task: TDD - Create integration tests for Invoice Server Actions (ensure actions create audit records).
    - [ ] Subtask: Test cases for Create, Update, Delete, and Classify (AI vs Manual).
- [ ] Task: Integrate `AuditService` into Invoice Server Actions.
- [ ] Task: TDD - Create integration tests for Payment Server Actions.
- [ ] Task: Integrate `AuditService` into Payment Server Actions.
- [ ] Task: Conductor - User Manual Verification 'Invoice & Payment Integration' (Protocol in workflow.md)

## Phase 3: Configuration Integration
- [ ] Task: TDD - Create integration tests for Business Partner Server Actions.
- [ ] Task: Integrate `AuditService` into Business Partner Server Actions.
- [ ] Task: TDD - Create integration tests for Chart of Accounts Server Actions.
- [ ] Task: Integrate `AuditService` into Chart of Accounts Server Actions.
- [ ] Task: Conductor - User Manual Verification 'Configuration Integration' (Protocol in workflow.md)
