# Implementation Plan

## Phase 1: Data Access & Logic Update [checkpoint: 0b300c8]

- [x] Task: Write tests (`src/data/tax-declarations.history.test.ts`) for `getTaxDeclarationsDashboardData` verifying that `history`: [ee97a39]
  - Includes all statuses (`draft`, `validated`, `filed`, `exported`)
  - Excludes the current period's declaration
  - Only includes `monthly` declarations
  - Respects `limit: 12`
- [x] Task: Modify `src/data/tax-declarations.ts`: [ee97a39]
  - Import `not` from `drizzle-orm`
  - Replace `eq(taxDeclarations.status, "filed")` with `not(eq(taxDeclarations.fiscalPeriod, fiscalPeriodToDeclare))`
  - Add `eq(taxDeclarations.declarationType, "monthly")`
- [x] Task: Conductor - User Manual Verification 'Phase 1: Data Access & Logic Update' (Protocol in workflow.md) [0b300c8]

## Phase 2: UI Implementation

- [x] Task: Update `src/app/tax-declarations/_utils/getStatusInfo.tsx`: [e34f11d]
  - Add `exported` case → "Exportada", icon, color style
  - Keep `default` with TypeScript exhaustiveness check + "Desconocida" fallback
- [x] Task: Create `src/app/tax-declarations/_utils/getHistoryItemSecondaryText.ts`: [e34f11d]
  - Maps status to secondary text using the appropriate timestamp column
  - Handles `null` timestamps with fallback text
- [x] Task: Refactor `src/app/tax-declarations/page.tsx`: [e34f11d]
  - Remove inline `getStatusInfo` (lines 31-62), import from `_utils/getStatusInfo.tsx`
  - Replace hardcoded history item icon/color/text with `getStatusInfo()` call
  - Replace hardcoded "Presentada el..." text with `getHistoryItemSecondaryText()` call
  - Add status badge text per row
- [x] Task: Write tests (`src/app/tax-declarations/__tests__/page.test.tsx`) verifying: [e34f11d]
  - Rendering of history items for all 4 statuses
  - Correct badge text, icon, and secondary text per status
  - Empty state when no history exists
- [ ] Task: Conductor - User Manual Verification 'Phase 2: UI Implementation' (Protocol in workflow.md)
