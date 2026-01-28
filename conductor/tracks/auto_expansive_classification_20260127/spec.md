# Specification: Auto-Expansive Classification System

## Overview
The goal of this track is to evolve the existing `ClassificationEngine` into an auto-expansive model capable of discovering and generating new classification rules autonomously. The system will observe patterns in user behavior and invoice data (represented as `EngineInvoice` snapshots) to promote high-confidence patterns into active rules, ensuring operative stability and traceability.

## Functional Requirements

### 1. Pattern Detection & Tracking
- **Snapshot Representation:** Use the `EngineInvoice` structure as the canonical, comparable representation of an invoice for pattern detection.
- **Pattern Candidates:** Implement a mechanism to track recurring feature combinations that lead to specific account classifications.
- **Schema Implementation (`PatternCandidate`):**
    - `id`: UUID.
    - `featureSetHash`: Unique hash of the feature combination for efficient lookup.
    - `features`: JSON representing the specific subset of `EngineInvoice` attributes.
    - `proposedAccountId`: The account code identified by the pattern.
    - `evidenceCount`: Number of times this pattern has been observed.
    - `consistencyRate`: Percentage of matches that resulted in the same classification.
    - `confidenceScore`: Weighted score determining suitability for promotion.
    - `firstSeenAt` / `lastSeenAt`: Timestamps for trend analysis.
    - `status`: Lifecycle state (`candidate`, `promoted`, `rejected`).

### 2. Autonomous Rule Promotion
- **Promotion Logic:** Automatically convert a `PatternCandidate` into an active `ClassificationRule` once it exceeds defined thresholds (e.g., minimum evidence count and consistency rate).
- **Rule Composition:** 
    - Auto-generated rules MUST use feature combinations (composite criteria).
    - Base (manual) rules continue to focus on individual or simple features.
- **Execution Consistency:** The classification engine must execute auto-generated rules alongside manual rules without distinguishing their origin, maintaining existing ranking and scoring logic.

### 3. Lifecycle & Background Processing
- **Async Processing:** Pattern detection and candidate updates must run as background tasks triggered by classification feedback events, ensuring no impact on UI responsiveness.
- **Traceability:** Maintain a link between the promoted rule and its originating `PatternCandidate` for auditing and performance monitoring.

## Non-Functional Requirements
- **Operative Stability:** Ensure that the introduction of autonomous rules does not degrade system performance or result in classification loops.
- **Data Integrity:** The `featureSetHash` must be collision-resistant and represent a stable canonical form of the `EngineInvoice` features.

## Acceptance Criteria
- [ ] New `patternCandidates` table implemented in Drizzle schema.
- [ ] Background task successfully identifies a pattern after X consistent manual classifications.
- [ ] A `PatternCandidate` is automatically promoted to a `ClassificationRule` when thresholds are met.
- [ ] The `ClassificationEngine` uses the new auto-generated rule to correctly suggest accounts for new, unseen invoices matching the pattern.
- [ ] Audit logs reflect the creation and promotion of autonomous rules.

## Out of Scope
- Manual UI for editing auto-generated rules (they are managed by the lifecycle).
- Deletion of manual rules by the auto-expansive system.
