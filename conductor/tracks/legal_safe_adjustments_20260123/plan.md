# Implementation Plan - Legal-Safe Adjustments for RESICO Tax Assistance

## Phase 1: Global Terminology Refactor (UI & Navigation) [checkpoint: 1605a4d]
- [x] Task: Update Navigation and Sidebar Labels cd0c6d7
    - [ ] Write unit tests for `AppSidebar` or navigation constants to ensure "Tax Declarations" is not present and "Tax Estimations" is used.
    - [ ] Update labels in `src/components/app-sidebar.tsx` and any relevant navigation config.
- [x] Task: Update Main Page Headings and Breadcrumbs 298f715
    - [ ] Write tests for breadcrumb generation to verify renamed segments.
    - [ ] Update `src/app/tax-declarations/page.tsx` (and related files) to reflect the new "Estimations" heading.
- [ ] Task: Conductor - User Manual Verification 'Global Terminology Refactor (UI & Navigation)' (Protocol in workflow.md)

## Phase 2: Dashboard & Summary Disclaimers [checkpoint: b37289e]
- [x] Task: Implement Persistent Disclaimer on Estimations Page 57b0e97
    - [ ] Create a reusable `DisclaimerBanner` component or similar.
    - [ ] Write tests to ensure the disclaimer is rendered in the `tax-declarations` (Estimations) route.
    - [ ] Add the disclaimer to the main estimation summary view.
- [x] Task: Add Footer Disclaimers to Summary Cards 6a4f89f
    - [ ] Update `SummaryCard` or specific dashboard components to include a small informational footer.
    - [ ] Write tests to verify the disclaimer text presence.
- [ ] Task: Conductor - User Manual Verification 'Dashboard & Summary Disclaimers' (Protocol in workflow.md)

## Phase 3: Validation Error Messaging Reframing [checkpoint: 07e3f53]
- [x] Task: Update FiscalValidator Error Messages d38c033
    - [ ] Identify all error strings in `src/lib/fiscal-validation/` (or wherever `FiscalValidator` resides).
    - [ ] Update tests to expect "Consistency Warning" or "Suggested Correction" instead of "Compliance Violation".
    - [ ] Refactor the validator to return these new message formats.
- [x] Task: Update UI Error Displays a647001
    - [ ] Ensure that form error messages and toast notifications reflect the advisory framing.
    - [ ] Write tests for form submission failures to verify the new advisory wording.
- [ ] Task: Conductor - User Manual Verification 'Validation Error Messaging Reframing' (Protocol in workflow.md)

## Phase 4: Metadata & Audit Log Updates [checkpoint: 71da51c]
- [x] Task: Refactor Audit Log Action Descriptions c57999f
    - [ ] Update `src/actions/audit-logs.ts` (or similar) to use "Estimation Preferences" instead of "Compliance Settings".
    - [ ] Write unit tests to verify that newly created audit logs use the updated terminology.
- [x] Task: Update Internal Constants and Comments 7d069ea
    - [ ] Search and replace "fiscal" or "compliance" in internal constant files (e.g., `src/lib/constants.ts`) where it affects user-facing labels or audit logs.
- [ ] Task: Conductor - User Manual Verification 'Metadata & Audit Log Updates' (Protocol in workflow.md)
