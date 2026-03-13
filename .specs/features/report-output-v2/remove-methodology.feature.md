---
feature: Remove Methodology Section
domain: report-output-v2
source: lib/agents/report-assembler.ts, lib/agents/schema.ts, lib/services/report-validation.ts, components/reports/report-disclaimer.tsx, components/reports/report-preview.tsx
tests:
  - __tests__/agents/report-assembler.test.ts
  - __tests__/agents/schema.test.ts
  - __tests__/eval/report-eval-fixtures.test.ts
  - __tests__/reports/view-report-readonly.test.tsx
  - __tests__/pipeline/pipeline-executor.test.ts
components:
  - ReportDisclaimer
personas:
  - report-reader
  - established-practitioner
status: implemented
created: 2026-03-13
updated: 2026-03-13
---

# Remove Methodology Section

**Source Files**:
- `lib/agents/report-assembler.ts` (Section assembly, `DISCLAIMER_TEXT` constant)
- `lib/agents/schema.ts` (`SECTION_REGISTRY_V2` — removed `disclaimer_methodology` entry)
- `lib/services/report-validation.ts` (`REPORT_SECTIONS` — removed entry)
- `components/reports/report-disclaimer.tsx` (new `ReportDisclaimer` UI component)
- `components/reports/report-preview.tsx` (silently skips `disclaimer_methodology` for old reports)
- `components/reports/steps/step-your-review.tsx` (removed from `ALL_SECTIONS` list)
- `app/(protected)/reports/[id]/page.tsx` (renders `ReportDisclaimer` banner)
- `lib/eval/report-eval/test-cases.ts` (updated section counts and rubrics)

**Design System**: .specs/design-system/tokens.md
**Personas**: .specs/personas/report-reader.md, .specs/personas/established-practitioner.md

## Context

The Disclaimer & Methodology section (formerly Section 8) contained boilerplate legal/methodology text that consumed a full page in the PDF without adding analytical value. The report-reader persona demands density over length. Moving the disclaimer to a front-end UI banner keeps legal transparency in the app while producing a cleaner PDF for client delivery.

## Feature: Remove Disclaimer & Methodology Section

Remove the Disclaimer & Methodology section from report assembly, PDF rendering, and front-end preview. Relocate the disclaimer text to a UI banner on the report detail page.

### Scenario: Report assembler omits the methodology section
Given a report is being assembled with all pipeline outputs available
When the report assembler builds the section list
Then there is no section with type `disclaimer_methodology`
And the `DISCLAIMER_TEXT` constant remains exported for the front-end banner
And the report has 7 sections (or 8 with persona intelligence)

### Scenario: SECTION_REGISTRY_V2 excludes methodology
Given the v2 section registry in `schema.ts`
When the registry entries are inspected
Then there is no entry for `disclaimer_methodology`
And the registry has 8 entries (7 required/optional sections + persona_intelligence)

### Scenario: Report validation excludes methodology
Given the `REPORT_SECTIONS` array in `report-validation.ts`
When section types are listed
Then `disclaimer_methodology` is not present
And 8 section types remain (including persona_intelligence)

### Scenario: Persona intelligence renumbered to Section 8
Given a report assembled with persona intelligence output
When the persona intelligence section is included
Then it has `sectionNumber: 8` (was previously 9)
And `sectionType: "persona_intelligence"`

### Scenario: Front-end preview silently skips methodology for old reports
Given a previously generated report stored in the database containing a `disclaimer_methodology` section
When that report is rendered in the front-end preview
Then the `SectionRenderer` returns `null` for `disclaimer_methodology`
And no error is thrown
And other sections render normally

### Scenario: Disclaimer text appears as a UI banner on report detail page
Given a completed report is displayed on the report detail page
When the page renders
Then a `ReportDisclaimer` component is visible above the section preview
And it displays the `DISCLAIMER_TEXT` from `report-assembler.ts`
And it uses design token styles (`color-surface`, `color-border`, `radius-md`)

### Scenario: Step review wizard excludes methodology from section list
Given the Report Builder wizard reaches the review step
When the `ALL_SECTIONS` array is used to create a report
Then `disclaimer_methodology` is not included
And the request sends 8 section types to the API

### Scenario: Eval test cases updated for 7-section reports
Given the report eval test cases in `test-cases.ts`
When completeness and formatting cases reference section counts
Then they reference 7 sections (not 8 or 9)
And `disclaimer_methodology` does not appear in any `requiredSections` array

## User Journey

1. Agent configures market and generates a report
2. **Report is assembled without the methodology section** — one fewer section, tighter document
3. Agent views completed report on the detail page
4. Disclaimer text appears as a subtle banner above the report sections
5. PDF export contains only analytical sections — no boilerplate page

## Scope of Changes

### Files Modified

| File | Change |
|------|--------|
| `lib/agents/report-assembler.ts` | Removed Section 8 (disclaimer_methodology) from sections array. Renumbered persona_intelligence from 9 to 8. Kept `DISCLAIMER_TEXT` export. |
| `lib/agents/schema.ts` | Removed `disclaimer_methodology` from `SECTION_REGISTRY_V2`. |
| `lib/services/report-validation.ts` | Removed `disclaimer_methodology` entry from `REPORT_SECTIONS`. |
| `components/reports/report-disclaimer.tsx` | New component — renders `DISCLAIMER_TEXT` as a styled banner. |
| `components/reports/report-preview.tsx` | `SectionRenderer` returns `null` for `disclaimer_methodology` (backward compat). |
| `components/reports/steps/step-your-review.tsx` | Removed `disclaimer_methodology` from `ALL_SECTIONS`. |
| `app/(protected)/reports/[id]/page.tsx` | Added `<ReportDisclaimer />` to report detail page. |
| `lib/eval/report-eval/test-cases.ts` | Updated section counts and rubrics to reflect 7-section reports. |

### Files NOT Modified

| File | Reason |
|------|--------|
| `lib/pdf/templates/renderers.tsx` | PDF renderer kept for backward compatibility with old stored reports. |
| DB schema / enums | Old reports may still reference `disclaimer_methodology` — no migration needed. |

## Risks & Edge Cases

- **Stored reports**: Previously generated reports with `disclaimer_methodology` sections still render. The front-end preview silently skips them; the PDF renderer falls back to generic handling.
- **DISCLAIMER_TEXT coupling**: The disclaimer constant lives in `report-assembler.ts` (not a dedicated module) because it's the canonical source and only one consumer exists (`ReportDisclaimer`).

## Learnings

### 2026-03-13
- **Pattern**: When removing a report section, update 4 registries in sync: `assembleReport()` sections array, `SECTION_REGISTRY_V2`, `REPORT_SECTIONS`, and `ALL_SECTIONS` in step-your-review.
- **Decision**: PDF renderer kept for backward compatibility — old reports in DB still contain the section type.
- **Decision**: `DISCLAIMER_TEXT` constant kept in `report-assembler.ts` and re-exported for the new UI banner component.

## Component References

- `ReportDisclaimer`: `.specs/design-system/components/report-disclaimer.md` (stub — pending documentation)
