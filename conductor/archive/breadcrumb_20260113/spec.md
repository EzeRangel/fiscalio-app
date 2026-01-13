# Specification: Breadcrumb in Site Header

## Overview
Implement a dynamic breadcrumb component in the `SiteHeader` to improve user navigation and orientation within the FDI Assistant. The breadcrumb will provide a clear path from the "Dashboard" to the current page.

## Functional Requirements
- **Dynamic Path Generation:** Generate breadcrumb items based on the current URL path segments.
- **Friendly Name Overrides:** Support a configuration mapping to replace technical URL segments (e.g., `invoices`) with user-friendly labels (e.g., `Invoices`).
- **Root Item:** The first item in the breadcrumb must always be "Dashboard" linking to the root path (`/`).
- **Placement:** The breadcrumb must be rendered inside the `src/components/site-header.tsx` component, left-aligned, immediately following the `SidebarTrigger`.
- **Interactivity:** Each segment (except the last) must be a clickable link to its respective path.
- **Responsiveness:** If the breadcrumb path is too long for the available horizontal space (especially on mobile), middle segments should be collapsed into an ellipsis (`...`).

## Non-Functional Requirements
- **Accessibility:** Use standard HTML breadcrumb patterns (`<nav aria-label="Breadcrumb">`) and ensure proper contrast.
- **Consistency:** Use `shadcn/ui` components (like `Breadcrumb`) and `Lucide` icons where appropriate.

## Acceptance Criteria
- [ ] Breadcrumb appears in the header on all pages except the Dashboard itself (or as specified).
- [ ] URL `/invoices/[id]` correctly displays "Dashboard > Invoices > [Invoice ID or Friendly Name]".
- [ ] Clicking "Invoices" navigates the user back to `/invoices`.
- [ ] On small screens, intermediate segments collapse to prevent layout overflow.

## Out of Scope
- Custom breadcrumb logic for complex multi-step wizards unless they are reflected in the URL.
