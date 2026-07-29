# Plan: Onboarding Cookie Persistence & Org Selection

## Phase 1: Cookie Persistence & Test Coverage
- [ ] Task: Write session server action unit tests
    - [ ] Create `src/actions/session.test.ts` with test cases verifying cookie settings and options
    - [ ] Verify that the test for `maxAge` fails (Red Phase)
- [ ] Task: Implement cookie persistence
    - [ ] Update `src/actions/session.ts` to add `maxAge: 60 * 60 * 24 * 365` (1 year) to `activeOrganizationId` cookie
    - [ ] Verify that tests now pass (Green Phase)
- [ ] Task: Conductor - User Manual Verification 'Phase 1' (Protocol in workflow.md)

## Phase 2: Onboarding Page Hybrid Implementation
- [ ] Task: Create Onboarding Org Selector Component
    - [ ] Create `src/app/onboarding/_components/org-selector.tsx`
    - [ ] Design a grid/list of cards representing each organization
    - [ ] Display business name and RFC (applying `PrivacyBlur` to RFC) for each organization
    - [ ] Make each card clickable, calling `setActiveOrganization` and redirecting to `/` on success
    - [ ] Include a prominent card/button to "Crear nueva organización" which toggles to show the onboarding form
- [ ] Task: Update Onboarding Page logic
    - [ ] Update `src/app/onboarding/page.tsx` to fetch `getOrganizations()`
    - [ ] If organizations exist, show the `OrgSelector` component
    - [ ] If no organizations exist, show the existing `OnboardingForm`
    - [ ] Support switching between the selection list and the creation form
- [ ] Task: Write Onboarding page and component tests
    - [ ] Create tests to verify page behavior under different database states (0 orgs vs >0 orgs)
    - [ ] Verify that page correctly switches views and triggers the actions
- [ ] Task: Conductor - User Manual Verification 'Phase 2' (Protocol in workflow.md)
