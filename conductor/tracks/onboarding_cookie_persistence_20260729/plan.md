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
- [x] Task: Create Onboarding Org Selector Component (4461b7b)
    - [x] Create `src/app/onboarding/_components/org-selector.tsx`
    - [x] Props: `organizations: Organization[]`, `onSwitchToForm: () => void`
    - [x] Design a grid/list of cards representing each organization
    - [x] Display business name and RFC (applying `PrivacyBlur` to RFC) for each organization
    - [x] Make each card clickable, calling `setActiveOrganization` via `useAction`. On success, redirect with `router.replace("/")` — **do NOT use `window.location.reload()`** (unlike the sidebar `OrganizationSwitcher` which needs it; the proxy will re-evaluate the cookie on next navigation)
    - [x] Include a prominent card/button "Crear nueva organización". Clicking it calls `onSwitchToForm()` (local state toggle managed in the parent page, not a redirect)
- [x] Task: Update Onboarding Page logic (eabe1aa)
    - [x] Update `src/app/onboarding/page.tsx`:
        - [x] Fetch `getOrganizations()` alongside `getTaxRegimes()`
        - [x] Pass `organizations` and `regimes` as props to client components
    - [x] If organizations exist, render `OrgSelector` with `onSwitchToForm` callback
    - [x] If no organizations exist, render the existing `OnboardingForm`
    - [x] The `OnboardingForm` is already a client component; it needs no changes
    - [x] **Toggle mechanism**: the page uses a client wrapper with local `useState` (`showForm: boolean`). Initial state: `false` (show selector). `onSwitchToForm` sets it to `true` to reveal `OnboardingForm`. On successful org creation (`onSuccess` of `createOnboardingOrganization`), `router.replace("/")` closes the loop
- [x] Task: Write Onboarding page and component tests (eabe1aa)
    - [x] Follow existing patterns (e.g., `src/app/tax-declarations/__tests__/page.test.tsx`) for testing server components with PGLite
    - [x] Create tests to verify page behavior under different database states (0 orgs vs >0 orgs)
    - [x] Verify that page correctly switches between selector and creation form via `onSwitchToForm`
    - [x] Verify org selection calls `setActiveOrganization` and redirects
- [ ] Task: Conductor - User Manual Verification 'Phase 2' (Protocol in workflow.md)
