# Specification: Business Partner Actions Enhancement

## Overview
This track aims to refine the Business Partners management interface by replacing the generic "Edit" functionality with specific, high-value actions: viewing related invoices and managing tags via a side sheet.

## Functional Requirements

### 1. Business Partners Table Actions
- **Remove Edit Option:** Remove the "Edit" action from the business partners table row menu.
- **Add "View Invoices" Action:** 
    - Add a new action to the row menu labeled "View Invoices".
    - Clicking this action must navigate the user to `/invoices?partner=[partnerId]`.
- **Add "Manage Tags" Action:**
    - Add a new action to the row menu labeled "Manage Tags".
    - Clicking this action must open a Side Sheet (using `shadcn/ui` Sheet component).

### 2. Tag Management UI (Side Sheet)
- **Display Tags:** Show the current tags of the selected business partner as removable badges.
- **Add Tags:** Provide an input field to add new tags (strings) to the list.
- **Remove Tags:** Allow users to remove tags from the list.
- **Persistence:** Provide a "Save" button to persist the updated array of tags to the database via a server action.
- **Data Structure:** Tags will remain an array of strings (`text[]`) in the `business_partners` table.

### 3. Invoices Page Integration
- **Filtering by Partner:** Ensure the `/invoices` page correctly handles the `partner` query parameter to filter the list of invoices displayed.

## Non-Functional Requirements
- **UX/UI:** Use standard `shadcn/ui` components (Sheet, Input, Badge, Button, DropdownMenu) to maintain consistency.
- **Responsiveness:** The side sheet and table actions should work well on both desktop and mobile views.

## Acceptance Criteria
- [ ] The "Edit" option is no longer visible in the Business Partners table.
- [ ] Clicking "View Invoices" on a partner navigates to `/invoices?partner=X` and correctly filters the results.
- [ ] Clicking "Manage Tags" opens a side sheet containing the partner's current tags.
- [ ] New tags can be added and existing ones removed within the side sheet.
- [ ] Changes to tags are successfully saved to the database and reflected in the UI upon closing/saving.

## Out of Scope
- Creating a separate page for tag management.
- Adding colors or other metadata to tags (tags are simple strings).
- Bulk tag management for multiple partners at once.
