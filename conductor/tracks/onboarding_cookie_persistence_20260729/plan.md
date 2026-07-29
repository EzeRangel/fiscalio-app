# Plan: Onboarding Cookie Persistence & Org Selection

## Phase 1: Cookie Persistence & Test Coverage [checkpoint: 8adecd7]
- [x] Task: Pre-existing session server action unit tests
    - [x] `src/actions/session.test.ts` already exists with a test expecting `maxAge: 60 * 60 * 24 * 365`
    - [x] Test currently fails (Red Phase already complete) — confirm by running `CI=true npx jest src/actions/session.test.ts --no-coverage`
- [x] Task: Implement cookie persistence (Green Phase) (ab26877)
    - [x] Update `src/actions/session.ts` to add `maxAge: 60 * 60 * 24 * 365` (1 year) to `activeOrganizationId` cookie
    - [x] Verify that tests now pass (Green Phase) — run `CI=true npx jest src/actions/session.test.ts --no-coverage`
- [ ] Task: Conductor - User Manual Verification 'Phase 1' (Protocol in workflow.md)

## Phase 2: Onboarding Page Hybrid Implementation
- [ ] Task: Create Onboarding Org Selector Component
    - [ ] Create `src/app/onboarding/_components/org-selector.tsx`
    - [ ] Props: `organizations: Organization[]`, `onSwitchToForm: () => void`
    - [ ] Design a grid/list of cards representing each organization
    - [ ] Display business name and RFC (applying `PrivacyBlur` to RFC) for each organization
    - [ ] Make each card clickable, calling `setActiveOrganization` via `useAction`. On success, redirect with `router.replace("/")` — **do NOT use `window.location.reload()`** (unlike the sidebar `OrganizationSwitcher` which needs it; the proxy will re-evaluate the cookie on next navigation)
    - [ ] Include a prominent card/button "Crear nueva organización". Clicking it calls `onSwitchToForm()` (local state toggle managed in the parent page, not a redirect)
- [ ] Task: Update Onboarding Page logic
    - [ ] Update `src/app/onboarding/page.tsx`:
        - [ ] Fetch `getOrganizations()` alongside `getTaxRegimes()`
        - [ ] Pass `organizations` and `regimes` as props to client components
    - [ ] If organizations exist, render `OrgSelector` with `onSwitchToForm` callback
    - [ ] If no organizations exist, render the existing `OnboardingForm`
    - [ ] The `OnboardingForm` is already a client component; it needs no changes
    - [ ] **Toggle mechanism**: the page uses a client wrapper with local `useState` (`showForm: boolean`). Initial state: `false` (show selector). `onSwitchToForm` sets it to `true` to reveal `OnboardingForm`. On successful org creation (`onSuccess` of `createOnboardingOrganization`), `router.replace("/")` closes the loop
- [ ] Task: Write Onboarding page and component tests
    - [ ] Follow existing patterns (e.g., `src/app/tax-declarations/__tests__/page.test.tsx`) for testing server components with PGLite
    - [ ] Create tests to verify page behavior under different database states (0 orgs vs >0 orgs)
    - [ ] Verify that page correctly switches between selector and creation form via `onSwitchToForm`
    - [ ] Verify org selection calls `setActiveOrganization` and redirects
- [ ] Task: Conductor - User Manual Verification 'Phase 2' (Protocol in workflow.md)
