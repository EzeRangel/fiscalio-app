# Product Guidelines: FDI Assistant

## Tone & Voice
- **Professional & Trustworthy:** The application communicates with precision, clarity, and authority suitable for a financial compliance tool. Language should be objective and reassuring.
- **Transparent:** Always explain *why* a calculation or suggestion was made, specifically regarding tax implications.

## Visual Identity & Aesthetic
- **Refined Editorial UI:** The design draws inspiration from premium financial documents with a modern twist.
- **Typography:** Heavy use of monospaced fonts to evoke the precision of ledgers and code, paired with clean sans-serifs for readability.
- **Layout:** Asymmetric and spacious layouts that reflect confidence and sophistication. Avoid clutter; use whitespace to guide the eye.
- **Color Palette:** A restrained, high-contrast palette (e.g., stark blacks, whites, and subtle grays) with deliberate accent colors for status indicators (e.g., success, error, pending).

## User Experience (UX) Principles
- **Trust through Transparency:**
    - **Confidence Scores:** The ML Engine must clearly display the confidence score and "evidence" for its suggestions.
    - **User Sovereignty:** The user always has the final word. The system suggests; the user confirms. This feedback loop reinforces or corrects the system's rules.
    - **Clear Distinctions:** Visually distinguish between "system-suggested" values and "user-confirmed" data.
- **Data Visualization:**
    - **Clarity & Simplicity:** Prioritize clear indicators of tax due, deductible status, and overall financial health.
    - **Detail & Auditability:** Provide deep-dive views that show the full audit trail for every classification and calculation.

## Data Management Strategy (Offline-First)
- **Local Sovereignty:** The application operates strictly offline. The local PGLite database is the single source of truth.
- **No Cloud Sync:** There is no background synchronization with cloud services to ensure absolute data privacy.
- **Manual Control:** Users are responsible for their data management via manual export/backup features.
