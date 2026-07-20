# ADR 0001: Manual linking via full XML reprocessing

When a Payment Complement is imported before its related Ingreso invoice, the system cannot auto-create `paymentAllocations` because the target invoice doesn't exist yet. The manual linking feature needs to bridge this gap.

**Decision:** The server action for manual linking will re-parse the Payment Complement's stored XML (`xmlContent`), extract all `DoctoRelacionado` entries, and create `paymentAllocations` for every unresolved document whose target invoice now exists. This is the same logic as `savePaymentComplement`'s allocation loop, extracted into a reusable `processPendingAllocations(paymentId)` function. Linking is idempotent — re-linking a complement that already has all allocations is a no-op.

**Rationale:** The XML is the source of truth for payment relationships. Re-processing it guarantees allocations match exactly what the SAT document declares, without requiring schema changes (e.g. tracking columns) or user data entry. A simpler 1-to-1 approach was rejected because real Payment Complements frequently reference multiple Ingreso invoices in a single XML, and the existing schema already supports M:N via `paymentAllocations`.

**Considered Options:**
- **Tracking columns** (`totalDoctos`/`resolvedDoctos`): faster queries but requires migration and stays in sync with XML (same work, duplicating data).
- **1-to-1 linking** (per original spec): rejected as inconsistent with SAT data model and existing schema.
- **Linking without allocations** (set `cfdiPaymentId` only): insufficient — would not update `amountPaid`/`paymentStatus` or create audit trail.
