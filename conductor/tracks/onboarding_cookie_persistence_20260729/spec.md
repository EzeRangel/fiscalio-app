# Specification: Onboarding Cookie Persistence & Org Selection

## Overview
This track addresses session usability and recovery issues in the onboarding flow. 
Currently, the `activeOrganizationId` cookie expires when the browser session ends. If the session expires or is cleared, users with existing organizations in the local PostgreSQL database (PGLite) are redirected to the `/onboarding` page where they are forced to fill out the "Create Organization" form again, with no way to select their existing organizations.

To fix this, we will:
1. Make the session persistent by setting a 1-year `maxAge` on the `activeOrganizationId` cookie.
2. Turn the `/onboarding` page into a hybrid screen:
   - If no organizations exist in the database, show the organization creation form.
   - If organizations exist, show a clean, grid-based card selector of existing organizations with an option to create a new one instead.

## Functional Requirements
1. **Cookie Longevity:**
   - Modify the `setActiveOrganization` server action to set the `activeOrganizationId` cookie with `maxAge: 31536000` (1 year).
   
2. **Hybrid Onboarding Page:**
   - In `/onboarding`, check if the local DB has any organization records.
   - If **0 organizations** exist: Render the existing onboarding form component.
   - If **>0 organizations** exist: Render a standalone organization selector UI.

3. **Organization Selector UI:**
   - A grid/list of cards representing each organization.
   - Each card displays the organization's business name and RFC.
   - Clicking an organization card calls the `setActiveOrganization` action for that organization and redirects immediately to the home page `/`.
   - Include a clear, styled button/card option to "Crear nueva organización". Clicking this toggles the view to show the onboarding/creation form.

## Non-Functional Requirements
- **Consistency:** Follow existing project styling (Tailwind CSS, shadcn/ui components) and patterns.
- **Privacy:** Apply `PrivacyBlur` when displaying RFCs in the organization cards (matching sidebar switcher).

## Acceptance Criteria
- [ ] User session is persistent across browser restarts.
- [ ] Clearing/deleting the cookie and visiting `/onboarding` checks the database.
- [ ] If organizations exist in the DB, the user is presented with the list of organizations.
- [ ] Selecting an organization from the list logs the user in and redirects to `/`.
- [ ] An option to "Create new organization" is visible and renders the onboarding form when clicked.
- [ ] If no organizations exist, the onboarding form is shown immediately.

## Out of Scope
- Organization deletion/editing from this screen (managed in Settings).
- Search/filter inputs for the organization list.
