# Specification: Fiscal Validation Layer (RESICO)

## 1. Overview
This track implements a robust fiscal validation layer for the CFDI Accounting Web App, specifically tailored to the RESICO tax regime. The core principle is that **Issued CFDI ≠ Taxable Income**; taxable income is recognized only upon effective cash collection. This feature aims to enforce fiscal correctness, prevent user errors that could lead to incorrect tax reporting, and ensure internal data consistency without assuming legal advisory responsibility.

## 2. Goals
-   **Enforce Cash-Basis Accounting:** Ensure taxable income is derived exclusively from payment allocations, not invoice issuance.
-   **Data Integrity:** Implement strict invariants for Invoices, Payments, and Allocations to prevent impossible or illegal fiscal states.
-   **User Safety:** Prevent users from performing actions that would generate non-collected income or violate RESICO rules.
-   **Legacy Compatibility:** Provide a safe transition/regression strategy for existing data (e.g., invoices without payments).

## 3. Functional Requirements

### 3.1 Domain Logic & Validation
*   **Location:** Validation logic must be implemented in a **Shared Logic Layer** (e.g., Domain Services/Entity methods) invoked by Server Actions, reinforced by **Database Constraints** where feasible.
*   **Core Entities & Responsibilities:**
    *   **Invoice:** Immutable fiscal identity. *Derived* attributes only for `amountPaid` and `paymentStatus`.
    *   **Payment:** Represents real-world cash movement. Serves as the temporal anchor for fiscal periods.
    *   **Payment Allocation:** The atomic unit of taxable income. Links Payment to Invoice.

### 3.2 Validation Rules (Invariants)
The system must enforce the following invariants. Violations must be rejected with a **Toast/Notification** error message.

*   **Invoice Level:**
    *   `INV-01`: An invoice cannot generate taxable income by itself.
    *   `INV-02`: A cancelled invoice cannot accept new payment allocations.
    *   `INV-03`: Total allocated amount ≤ `invoice.total`.
    *   `INV-04`: Payment status is always derived.
*   **Payment Level:**
    *   `PAY-01`: `payment.amount > 0`.
    *   `PAY-02`: `payment.payment_date` ≤ current system date (no future payments).
    *   `PAY-03`: Sum of allocations ≤ `payment.amount`.
*   **Allocation Level:**
    *   `ALL-01`: `allocation.amount_allocated > 0`.
    *   `ALL-02`: Related invoice must not be cancelled.
    *   `ALL-03`: Allocation sum per invoice ≤ `invoice.total`.
    *   `ALL-04`: Allocation sum per payment ≤ `payment.amount`.
    *   `ALL-05`: Allocation fiscal period must match `month(payment.payment_date)`.
    *   `ALL-06`: Allocations are immutable after creation (must be reversed/deleted to "edit").

### 3.3 Fiscal Period Attribution
*   **Rule:** Fiscal attribution is strictly cash-based.
*   **Source:** `payment.paymentDate` is the *only* source of truth for the fiscal period.
*   **Constraint:** `invoice.invoiceDate` and `invoice.accountingPeriod` must NEVER be used for income calculation.

### 3.4 Prohibited Actions (Hard Blocks)
The system must explicitly block (and notify via Toast):
*   Marking an invoice as "income" or "accumulated" manually.
*   Direct editing of `amountPaid` or `paymentStatus`.
*   Creating allocations for cancelled invoices.
*   Creating future-dated payments.

## 4. Migration & Legacy Data Strategy
*   **Challenge:** Existing invoices in the system may lack related payments or strictly validated allocations.
*   **Strategy:**
    *   **Strict Forward Enforcement:** New records must strictly adhere to all rules.
    *   **Regression Handling:** Implement a specific migration or "fix-up" routine to identify existing invoices without payments. These should *not* be treated as paid income.
    *   **Data Cleanup:** Existing data should be validated against the new DB constraints. If violations exist, a migration script must be provided to normalize them (e.g., creating "placeholder" payment records for historically "paid" invoices if necessary, or flagging them for user review).

## 5. Non-Functional Requirements
*   **Performance:** Validation checks must be efficient enough to not degrade UI responsiveness.
*   **Offline Capability:** Validation must work entirely locally (no dependency on external SAT/PAC APIs).

## 6. Out of Scope
*   SAT/PAC validation.
*   Tax determination, filing, or payment calculation.
*   CFDI issuance or cancellation workflows (handling the *status* is in scope, performing the cancellation is not).
*   Legal/Fiscal advice.
