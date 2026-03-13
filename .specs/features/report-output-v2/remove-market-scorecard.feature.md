---
feature: Remove Market Scorecard Section
domain: report-output-v2
source: lib/agents/report-assembler.ts, lib/pdf/templates/renderers.tsx
tests:
  - __tests__/agents/report-assembler.test.ts
  - __tests__/agents/schema.test.ts
  - __tests__/pdf/document.test.tsx
  - __tests__/eval/report-eval-fixtures.test.ts
  - __tests__/pipeline/pipeline-executor.test.ts
components:
  - StrategicBenchmarkPdf
personas:
  - report-reader
  - established-practitioner
status: implemented
created: 2026-03-13
updated: 2026-03-13
---

# Remove Market Scorecard Section

**Source Files**:
- `lib/agents/report-assembler.ts` (Section 8 assembly)
- `lib/pdf/templates/renderers.tsx` (`StrategicBenchmarkPdf` renderer)
- `lib/services/market-analytics.ts` (`SegmentScorecard` type, `computeScorecard()`)

**Design System**: .specs/design-system/tokens.md
**Personas**: .specs/personas/report-reader.md, .specs/personas/established-practitioner.md

## Context

The Market Scorecard (rendered as "Strategic Benchmark", Section 8) displays a table of segment-by-segment performance metrics: rating, median price, YoY change, trend direction, and property count. User feedback indicates this section is weak — it duplicates information already visible in the Market Analysis Matrix (Section 3) and the Luxury Market Dashboard (Section 4), adding pages without adding insight. The report-reader persona demands "density over length" and will skip sections that feel like filler. Removing this section makes the intelligence brief tighter and more authoritative.

## Feature: Remove Market Scorecard Section

Cut the Strategic Benchmark / Market Scorecard section entirely from report assembly and PDF rendering. The scorecard data (`SegmentScorecard[]`) is still computed in Layer 1 and used elsewhere (e.g., ratings feed into the Market Analysis Matrix), so the computation function stays. Only the report section and its renderer are removed.

### Scenario: Report assembler omits the scorecard section
Given a report is being assembled with all pipeline outputs available
When the report assembler builds the section list
Then section 8 "Strategic Benchmark" (type `strategic_benchmark`) is NOT included
And the section count is reduced by one
And sections 9+ are renumbered to close the gap (Disclaimer & Methodology becomes section 8, Persona Intelligence becomes section 9)

### Scenario: PDF renderer no longer registers the scorecard renderer
Given the PDF renderer dispatch map (`RENDERER_MAP`)
When the renderer map is inspected
Then there is no entry for `strategic_benchmark`
And the `StrategicBenchmarkPdf` component is removed from the renderers file

### Scenario: Existing reports with scorecard data render gracefully
Given a previously generated report stored in the database that contains a `strategic_benchmark` section
When that report is rendered in the PDF viewer
Then the scorecard section is silently skipped (the generic fallback renderer handles unknown types gracefully)
And no error is thrown

### Scenario: The scorecard computation function is preserved
Given the Layer 1 computation pipeline runs for a market
When `computeMarketAnalytics()` executes
Then `computeScorecard()` still runs and populates `analytics.scorecard`
And segment ratings remain available for other sections that reference them

### Scenario: Polish Agent no longer generates strategicBrief narrative
Given the Polish Agent receives report data for polishing
When the Polish Agent generates its output
Then it does NOT generate a `strategicBrief` field
And the prompt no longer asks for a strategic benchmark narrative

### Scenario: Tests are updated to reflect removal
Given the test suite for report-assembler
When tests run
Then no test asserts the presence of a `strategic_benchmark` section
And there is a test confirming section 8 is NOT `strategic_benchmark`

## User Journey

1. Agent configures market and generates a report
2. **Report is assembled without the scorecard section** — one fewer section, tighter document
3. Agent receives a report that goes directly from Comparative Positioning → Disclaimer & Methodology
4. The intelligence brief feels denser and more purposeful

## Scope of Changes

### Files to Modify

| File | Change |
|------|--------|
| `lib/agents/report-assembler.ts` | Remove Section 8 (strategic_benchmark) from the sections array. Renumber Section 9 → 8, Section 10 → 9. |
| `lib/pdf/templates/renderers.tsx` | Remove `StrategicBenchmarkPdf` component, `StrategicBenchmarkContent` interface, and the `strategic_benchmark` entry from `RENDERER_MAP`. |
| `lib/agents/polish-agent.ts` (if it generates `strategicBrief`) | Remove the `strategicBrief` field from the prompt and output schema. |
| `__tests__/agents/report-assembler.test.ts` | Update test fixtures and assertions — remove scorecard section, update section numbers. |
| `__tests__/services/market-analytics.test.ts` | Keep `computeScorecard()` tests (function is preserved). |
| `.specs/learnings/data-architecture-mapping.md` | Update Section 8 documentation to reflect removal. |

### Files to NOT Modify

| File | Reason |
|------|--------|
| `lib/services/market-analytics.ts` | `computeScorecard()` stays — ratings are used elsewhere. `SegmentScorecard` type stays. |
| `lib/services/market-analytics.ts` (`computeMarketAnalytics`) | Still calls `computeScorecard()` — the data is computed, just not assembled into a report section. |

## UI Mockup

N/A — this is a removal. The report flow goes:

```
Section 7: Comparative Positioning
  (peer market comparisons)
----------------------------------------
  REMOVED — Market Scorecard gone        <- Section 8 "Strategic Benchmark"
                                            is CUT from the report
----------------------------------------
  Section 8: Disclaimer & Methodology    <- Was Section 9, now renumbered
  (disclaimer, methodology, confidence)
----------------------------------------
  Section 9: Persona Intelligence        <- Was Section 10, now renumbered
  (if personas selected)
```

## Risks & Edge Cases

- **Stored reports**: Previously generated reports in the DB will still contain `strategic_benchmark` sections. The PDF renderer's `getSectionRenderer()` already falls back to `GenericSectionPdf` for unknown types, so old reports render without error. No migration needed.
- **Polish Agent coupling**: If the Polish Agent prompt references "strategic benchmark" or "strategicBrief", that reference must be removed to avoid wasted tokens and hallucinated output.
- **Section numbering**: Any code that hardcodes section numbers (e.g., `sectionNumber === 8`) must be audited and updated.

## Learnings

### 2026-03-13
- **Gotcha**: `polish-agent.ts` had `strategicBrief` in three places: type definition, JSON schema prompt, and metadata output. All three must be removed together or the agent wastes tokens generating unused output.
- **Gotcha**: `persona-intelligence.ts` referenced `meta.strategicBrief` from the polish agent's upstream results. Changed to reference `meta.methodology` instead.
- **Decision**: `computeScorecard()` and `SegmentScorecard` type preserved in `market-analytics.ts` — scorecard data feeds ratings into other sections.
- **Gotcha**: Eval test cases in `lib/eval/report-eval/test-cases.ts` had `strategic_benchmark` in `requiredSections` arrays — data definitions, not tests, but still needed updating.

## Component References

- No new components. `StrategicBenchmarkPdf` was removed.
