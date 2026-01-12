# Plan: Privacy Mode (Data Obfuscation)

This plan implements a "Privacy Mode" that blurs sensitive data (currency and IDs) throughout the application to facilitate demos and recordings.

## Phase 1: Setup and State Management [checkpoint: bd801d5]
Implement the logic for managing the Privacy Mode state via cookies and a global provider.

- [x] Task: Create `src/lib/privacy-mode.ts` with utilities for cookie-based state management (get/set). 1bcdfe6
- [x] Task: Implement a Server Action in `src/actions/privacy-mode.ts` to toggle the state. 57500d2
- [x] Task: Create a React Context `PrivacyModeProvider` and hook `usePrivacyMode` in `src/components/providers/privacy-mode-provider.tsx`. d38b173
- [x] Task: Wrap the application with `PrivacyModeProvider` in `src/app/layout.tsx`. 70fe4fd
- [x] Task: Conductor - User Manual Verification 'Phase 1: Setup and State Management' (Protocol in workflow.md) bd801d5

## Phase 2: UI Implementation
Add the toggle switch to the application header's user menu.

- [ ] Task: Create a `UserNav` component in `src/components/user-nav.tsx` using `DropdownMenu`.
- [ ] Task: Add the Privacy Mode toggle switch inside `UserNav`.
- [ ] Task: Update `src/components/site-header.tsx` to include the `UserNav` component.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: UI Implementation' (Protocol in workflow.md)

## Phase 3: Obfuscation Mechanism
Implement the visual blurring logic and components.

- [ ] Task: Define a Tailwind utility or CSS variable for the blur effect in `src/app/globals.css`.
- [ ] Task: Create a `PrivacyBlur` component in `src/components/privacy-blur.tsx` that conditionally applies the blur.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Obfuscation Mechanism' (Protocol in workflow.md)

## Phase 4: Global Application
Apply the obfuscation to target data fields across the app.

- [ ] Task: Apply `PrivacyBlur` to currency amounts (e.g., in Invoice lists, Dashboards).
- [ ] Task: Apply `PrivacyBlur` to sensitive IDs like RFCs and Phone numbers.
- [ ] Task: Perform a final audit to ensure no sensitive numbers are missed.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Global Application' (Protocol in workflow.md)
