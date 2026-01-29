# Implementation Plan: Auto-Expansive Classification System

This plan outlines the steps to implement an autonomous rule generation system that learns from observed classification patterns.

## Phase 1: Persistence & Schema
- [x] Task: Database Schema Update
    - [x] Create `src/db/schema/patternCandidates.ts` to define the `patternCandidates` table.
    - [x] Implement the `featureSetHash` and JSON `features` storage.
    - [x] Export the new schema in `src/db/schema/index.ts`.
    - [x] Create and run the Drizzle migration.
- [x] Task: Domain Types & Constants
    - [x] Define TypeScript interfaces for `PatternCandidate` and `EngineInvoice` snapshots in `src/types/classification-engine.ts`.
    - [x] Define threshold constants (e.g., `MIN_EVIDENCE_TO_PROMOTE`, `MIN_CONSISTENCY_RATE`) in `src/lib/constants.ts`.
- [x] Task: Conductor - User Manual Verification 'Phase 1: Persistence & Schema' (Protocol in workflow.md)

## Phase 2: Pattern Detection Engine [checkpoint: dff0def]
- [x] Task: EngineInvoice Canonicalization
    - [x] Implement a utility to extract a stable, hashed feature set from an `EngineInvoice` in `src/lib/classification-engine.ts`.
    - [x] Write unit tests to ensure different invoices with the same core features produce identical hashes.
- [x] Task: Pattern Tracking Logic
    - [x] Implement `upsertPatternCandidate` in a new service `src/lib/pattern-detection.ts`.
    - [x] Logic should update `evidenceCount`, `consistencyRate`, and `confidenceScore`.
    - [x] Write unit tests for pattern tracking with various feedback scenarios.
- [x] Task: Background Task Integration
    - [x] Hook into the `applyClassification` server action to trigger pattern detection asynchronously.
    - [x] Ensure the background process does not block the main response.
- [x] Task: Conductor - User Manual Verification 'Phase 2: Pattern Detection Engine' (Protocol in workflow.md) dff0def

## Phase 3: Autonomous Rule Promotion [checkpoint: bfa4ce1]
- [x] Task: Promotion Service
    - [x] Implement `promoteCandidateToRule` in `src/data/pattern-detection.ts`.
    - [x] This service should create a new `ClassificationRule` and update the `PatternCandidate` status to `promoted`.
    - [x] Ensure proper traceability by linking the rule back to the candidate.
- [x] Task: Threshold Monitor
    - [x] Add logic to the pattern detection flow to check if a candidate has met promotion criteria.
- [x] Task: Conductor - User Manual Verification 'Phase 3: Autonomous Rule Promotion' (Protocol in workflow.md) bfa4ce1

## Phase 4: Integration & Verification
- [x] Task: End-to-End Test Suite
    - [x] Create an integration test that simulates multiple manual classifications. 4c9107c
    - [x] Verify that a `PatternCandidate` is created, updated, and eventually promoted.
    - [x] Verify that the `ClassificationEngine` correctly utilizes the new auto-generated rule for subsequent invoices.
- [x] Task: Audit & Logging
    - [x] Ensure promotion events are recorded in the `auditLogs`. 5a5d0a3
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Integration & Verification' (Protocol in workflow.md)