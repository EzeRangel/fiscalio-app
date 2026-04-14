# Product Guide: FDI Assistant

## Product Vision

An offline-first web application designed to help Mexican taxpayers (specifically small business owners and freelancers under the **RESICO** tax regime) manage their SAT invoices (CFDI) with high accuracy and minimal manual effort.

## Target Audience

- **Small Business Owners in Mexico:** Managing their own accountability and tax compliance.
- **Freelancers:** Needing to track income, expenses and creditable IVA under the RESICO regime.

## Key Features & Goals

- **Autonomous Classification System:** An adaptive engine that learns from patterns to suggest account classifications and autonomously generates new rules based on observed user behavior and high-confidence patterns.
- **Tax Estimation Support:** Creating preliminary tax estimations and financial reports tailored to the RESICO regime for informational purposes.
- **Data Integrity Layer:** Enforcing strict RESICO-aligned rules (e.g., "Cash-Basis") to ensure data consistency and accuracy in estimations, including **item-level tax mapping, granular proration for partial payments, and account-level IVA accreditation percentage tracking**. Supported by robust validation (including file de-duplication and UUID uniqueness checks) and tools for manual data correction.
- **CFDI Validation:** Automatically validating invoices against official SAT requirements to ensure compliance.
- **Business Partner Analytics:** Real-time tracking of invoice volumes and financial balance for clients and providers.
- **System-Wide Audit Log:** Comprehensive traceability for critical operations, tracking changes in invoices, payments, and configurations for compliance and debugging.
- **Interactive Financial Views:** Dynamic, client-side filtering and period-based grouping (month/year) for invoices, with real-time recalculation of cash-basis summary totals.
- **Multi-Currency Support (USD):** Automatic normalization of USD transactions to MXN based on cash-basis principles for accurate financial reporting.
- **Partner Management & Categorization:** Tools for managing business partners, including tagging and quick access to related invoice history.
- **Smart Predictions:** Providing auto-completion and suggestions during manual data adjustments to increase efficiency.
- **Privacy Mode:** A global toggle to blur sensitive currency and identifier data (RFCs, phones) for safe recording and demo presentations.

## Technical Philosophy: Offline-First

- **Privacy & Security:** Sensitive financial data (SAT credentials and invoices) stays local on the user's device using PGLite.
- **Reliability:** The application works seamlessly without an internet connection.
- **Cost Efficiency:** No cloud database hosting fees, making the tool more accessible.

## Success Metrics

- **High Accuracy:** Maximizing the precision of the ML classification engine.
- **User Efficiency:** Significantly reducing the time required for manual tax preparation.
- **Estimation Reliability:** Providing accurate, high-quality data summaries that align with RESICO best practices.
