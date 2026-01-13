# Implementation Plan - Breadcrumb in Site Header

## Phase 1: Core Logic & Configuration
- [x] Task: Implement Breadcrumb Generation Logic (TDD) 1ae3c5d
  - [ ] Create `src/config/breadcrumb-routes.ts` (or `src/lib/`) to define path-to-label mappings.
  - [ ] Create `src/hooks/use-breadcrumbs.ts` for logic extraction.
  - [ ] **TDD:** Write unit tests (`src/hooks/use-breadcrumbs.test.ts`) covering:
    - [ ] "Dashboard" as the root item.
    - [ ] Dynamic path segment generation.
    - [ ] Application of friendly name overrides.
  - [ ] Implement the `useBreadcrumbs` hook to pass tests.
- [x] Task: Conductor - User Manual Verification 'Core Logic & Configuration' (Protocol in workflow.md)

## Phase 2: UI Implementation & Integration
- [ ] Task: Implement Breadcrumb Component
  - [ ] Verify/Install `shadcn/ui` Breadcrumb component (`npx shadcn@latest add breadcrumb`).
  - [ ] Create `src/components/site-breadcrumb.tsx`.
  - [ ] Implement responsiveness: collapse middle items (`...`) on smaller screens.
- [ ] Task: Integrate into Site Header
  - [ ] Modify `src/components/site-header.tsx` to include `SiteBreadcrumb`.
  - [ ] Position correctly: Left-aligned, immediately after `SidebarTrigger`.
- [ ] Task: Conductor - User Manual Verification 'UI Implementation & Integration' (Protocol in workflow.md)
