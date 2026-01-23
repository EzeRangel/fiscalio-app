# Implementation Plan - Legal-Safe Adjustments for RESICO Tax Assistance

## Phase 1: Global Terminology Refactor (UI & Navigation)
- [x] Task: Update Navigation and Sidebar Labels cd0c6d7
    - [ ] Write unit tests for `AppSidebar` or navigation constants to ensure "Tax Declarations" is not present and "Tax Estimations" is used.
    - [ ] Update labels in `src/components/app-sidebar.tsx` and any relevant navigation config.
- [ ] Task: Update Main Page Headings and Breadcrumbs
    - [ ] Write tests for breadcrumb generation to verify renamed segments.
    - [ ] Update `src/app/tax-declarations/page.tsx` (and related files) to reflect the new "Estimations" heading.
- [ ] Task: Conductor - User Manual Verification 'Global Terminology Refactor (UI & Navigation)' (Protocol in workflow.md)

## Phase 2: Dashboard & Summary Disclaimers
- [ ] Task: Implement Persistent Disclaimer on Estimations Page
    - [ ] Create a reusable `DisclaimerBanner` component or similar.
    - [ ] Write tests to ensure the disclaimer is rendered in the `tax-declarations` (Estimations) route.
    - [ ] Add the disclaimer to the main estimation summary view.
- [ ] Task: Add Footer Disclaimers to Summary Cards
    - [ ] Update `SummaryCard` or specific dashboard components to include a small informational footer.
    - [ ] Write tests to verify the disclaimer text presence.
- [ ] Task: Conductor - User Manual Verification 'Dashboard & Summary Disclaimers' (Protocol in workflow.md)

## Phase 3: Validation Error Messaging Reframing
- [ ] Task: Update FiscalValidator Error Messages
    - [ ] Identify all error strings in `src/lib/fiscal-validation/` (or wherever `FiscalValidator` resides).
    - [ ] Update tests to expect "Consistency Warning" or "Suggested Correction" instead of "Compliance Violation".
    - [ ] Refactor the validator to return these new message formats.
- [ ] Task: Update UI Error Displays
    - [ ] Ensure that form error messages and toast notifications reflect the advisory framing.
    - [ ] Write tests for form submission failures to verify the new advisory wording.
- [ ] Task: Conductor - User Manual Verification 'Validation Error Messaging Reframing' (Protocol in workflow.md)

## Phase 4: Metadata & Audit Log Updates
- [ ] Task: Refactor Audit Log Action Descriptions
    - [ ] Update `src/actions/audit-logs.ts` (or similar) to use "Estimation Preferences" instead of "Compliance Settings".
    - [ ] Write unit tests to verify that newly created audit logs use the updated terminology.
- [ ] Task: Update Internal Constants and Comments
    - [ ] Search and replace "fiscal" or "compliance" in internal constant files (e.g., `src/lib/constants.ts`) where it affects user-facing labels or audit logs.
- [ ] Task: Conductor - User Manual Verification 'Metadata & Audit Log Updates' (Protocol in workflow.md)
