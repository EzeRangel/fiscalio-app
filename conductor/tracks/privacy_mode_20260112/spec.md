# Specification: Privacy Mode (Data Obfuscation)

## Overview
This feature introduces a "Privacy Mode" toggle that allows users to blur sensitive numerical and currency data throughout the application. This is intended to facilitate the creation of demo materials (images/videos) without exposing real financial or personal data.

## Functional Requirements
- **Toggle Location**: A new toggle switch will be added to the **Sidebar Footer**.
- **Obfuscation Method**: Sensitive data will be visually blurred using CSS `filter: blur()`.
- **Target Data**:
    - All currency amounts (prices, totals, balances).
    - Sensitive identifiers containing numbers (RFCs, phone numbers, ID numbers).
- **Persistence**: The state of Privacy Mode will be stored in a cookie to ensure it persists across sessions but remains client-side and easily cleared.
- **Global Application**: The blur effect should apply consistently across all components that render the targeted data types.

## Non-Functional Requirements
- **Performance**: The obfuscation mechanism should not negatively impact page rendering speed or interaction responsiveness.
- **Security**: While this is a visual obfuscation for demo purposes, the underlying data should still be handled securely in the DOM (this is not a data-redaction feature for security, but a visual tool for privacy).

## Acceptance Criteria
- [ ] A "Privacy Mode" toggle exists in the Sidebar Footer.
- [ ] Toggling "Privacy Mode" ON immediately blurs currency values across the app.
- [ ] Toggling "Privacy Mode" ON immediately blurs sensitive identifiers (RFC, etc.) across the app.
- [ ] Toggling "Privacy Mode" OFF immediately restores clear visibility.
- [ ] The Privacy Mode state persists after a page refresh (via cookie).
- [ ] The blur effect is visually consistent and does not break component layouts.

## Out of Scope
- Redacting data from network requests or the database.
- Blurring non-numerical text (unless specified as a sensitive identifier).
- Customizing the blur intensity.
