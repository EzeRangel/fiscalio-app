# Product Guide: FDI Assistant

## Product Vision
An offline-first web application designed to help Mexican taxpayers (specifically small business owners and freelancers under the **RESICO** tax regime) manage their SAT invoices (CFDI) with high accuracy and minimal manual effort.

## Target Audience
- **Small Business Owners in Mexico:** Managing their own accountability and tax compliance.
- **Freelancers:** Needing to track deductible expenses and income under the RESICO regime.

## Key Features & Goals
- **Automated Invoice Classification:** An ML Engine that learns from patterns to automatically suggest account classifications based on invoice data and product codes.
- **Tax Declaration Generation:** Creating preliminary tax declarations and financial reports tailored to the RESICO regime.
- **CFDI Validation:** Automatically validating invoices against official SAT requirements to ensure compliance.
- **Business Partner Analytics:** Real-time tracking of invoice volumes and financial balance for clients and providers.
- **System-Wide Audit Log:** Comprehensive traceability for critical operations, tracking changes in invoices, payments, and configurations for compliance and debugging.
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
- **Compliance Assurance:** Ensuring 100% adherence to SAT regulations and reporting standards.
