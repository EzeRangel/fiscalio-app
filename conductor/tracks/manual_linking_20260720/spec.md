# Specification: Manual Linking of Invoice to Payment Complement

## Overview
Currently, when a user imports a Payment Complement (Complemento de Pago) XML before its related Invoice (CFDI de Ingreso), the system does not automatically link them. This feature provides a manual way for users to link an Invoice to a Payment Complement, ensuring correct account balances and tax information in the application.

## Functional Requirements
1. **Entry Point:** The manual linking action will be accessible from the Invoice details page.
2. **Cardinality:** The linking will support a 1-to-1 relationship initially (one Invoice linked to one Payment Complement).
3. **Selection Modal/UI:** 
   - When triggering the link action, the user will see a list of available Payment Complements.
   - The list will show **only unlinked** Payment Complements by default.
   - The user can search/filter the available Payment Complements by Client/Provider Name.
4. **Linking Action:** Upon selecting a Payment Complement and confirming, the system will update the database to link the Payment Complement to the selected Invoice.

## Non-Functional Requirements
- **Offline-First:** All search, filtering, and linking actions must execute locally using PGLite, adhering to the offline-first philosophy.
- **Immediate Feedback:** The UI must optimistically update or quickly refetch data to show the Invoice as "Linked" immediately after the action completes.

## Acceptance Criteria
- User can navigate to an Invoice details page and find a "Link Payment Complement" button or action.
- Clicking the action opens a selection interface displaying unlinked payment complements.
- The user can search by Client/Provider Name in this interface.
- Selecting a payment complement correctly associates it with the invoice in the local database.
- The Invoice details page reflects the newly linked Payment Complement.

## Out of Scope
- Linking one Payment Complement to multiple Invoices (1-to-Many).
- Linking multiple Payment Complements to one Invoice (Many-to-1).
- Automatic retrospective linking (this track only focuses on the manual action).
