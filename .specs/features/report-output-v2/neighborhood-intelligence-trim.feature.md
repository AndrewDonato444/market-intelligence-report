---
feature: Neighborhood Intelligence Trim
domain: report-output-v2
source: lib/agents/insight-generator.ts, lib/pdf/templates/renderers.tsx, lib/agents/report-assembler.ts
tests:
  - __tests__/features/neighborhood-intelligence-trim.test.ts
components:
  - NeighborhoodIntelligencePdf
personas:
  - report-reader
  - established-practitioner
  - anti-persona-report
status: implemented
created: 2026-03-13
updated: 2026-03-13
---

# Neighborhood Intelligence Trim

**Source Files**:
- `lib/agents/insight-generator.ts` — Agent prompt that generates `neighborhoodAnalysis.narrative`
- `lib/agents/report-assembler.ts` — Assembly logic (section 4)
- `lib/pdf/templates/renderers.tsx` — `NeighborhoodIntelligencePdf` component
- `lib/services/market-analytics.ts` — `NeighborhoodBreakdown` type + computation

**Design System**: `.specs/design-system/tokens.md`
**Personas**: `.specs/personas/report-reader.md`, `.specs/personas/established-practitioner.md`

## Problem

The Neighborhood Intelligence section currently suffers from two issues:

1. **No source attribution** — the narrative appears as if the agent wrote it from personal knowledge. The report reader persona needs to know where intelligence comes from ("this came from a research team, not a template"). Without attribution, the section lacks the institutional credibility that differentiates this report from a blog post.

2. **Too much text** — the current prompt asks for "1-2 paragraphs of ground-level neighborhood intelligence." Combined with the data table, the section is text-heavy relative to its analytical value. The report-reader persona skips sections the moment they feel like filler. The neighborhood data table already provides the raw evidence; the narrative should be a tight interpretive layer on top, not a restatement.

## Feature: Neighborhood Intelligence Trim

### Scenario: Narrative is tighter and shorter
Given the insight-generator agent receives neighborhood breakdown data
When it generates the `neighborhoodAnalysis` field
Then the narrative is 2-4 sentences maximum (not 1-2 paragraphs)
And it leads with the single most important micro-market pattern
And it highlights one contrarian or surprising neighborhood-level finding
And it does not restate data visible in the neighborhood table (median prices, counts, YoY %)

### Scenario: Source attribution appears in the PDF
Given the Neighborhood Intelligence section is rendered in the PDF
When the reader views the section
Then a source attribution line appears below the narrative
And the attribution reads "Source: [data source description] as of [date range]"
And the attribution uses `text-xs`, `color-text-tertiary`, `font-sans` styling
And the attribution is visually distinct from the narrative body text

### Scenario: Source data is passed through the assembly pipeline
Given the report assembler builds section 4 (neighborhood_intelligence)
When it assembles the section content
Then the content includes a `sourceAttribution` string field
And the attribution describes the data origin (e.g., "Analysis of [N] transactions via RealEstateAPI, [date range]")
And the attribution is derived from the computed analytics metadata (transaction count, date range)

### Scenario: Narrative does not duplicate the data table
Given the neighborhood data table shows per-neighborhood metrics (name, ZIP, median price, count, YoY)
When the insight-generator writes the neighborhoodAnalysis narrative
Then the narrative does not list individual neighborhood median prices
And the narrative does not enumerate property counts per neighborhood
And the narrative focuses on cross-neighborhood patterns, relative positioning, and micro-market dynamics

### Scenario: Empty neighborhood data
Given no neighborhood breakdown data is available
When the section is rendered
Then the narrative is omitted entirely (no "data is unavailable" placeholder)
And the source attribution is omitted
And the section shows only the table (which will also be empty, handled by existing logic)

### Scenario: Existing tests remain green
Given the existing test suite includes:
  - PDF-V2-04 (renderer selection for neighborhood_intelligence)
  - Report assembler test (section 4 contains neighborhoods array and narrative)
  - Pipeline executor test (section 4 sectionType is neighborhood_intelligence)
  - Report eval test cases (rtc-02, rtc-03, rtc-04 completeness/formatting)
When the changes are implemented
Then all existing tests pass (with updated assertions where narrative length expectations change)
And report eval rubric for neighborhood_intelligence is updated to expect shorter narrative + source attribution

## User Journey

1. Agent generates a report via the creation flow
2. Pipeline runs insight-generator agent (produces tighter neighborhood narrative)
3. Report assembler includes narrative + source attribution in section 4
4. **Neighborhood Intelligence section** in PDF shows:
   - 2-4 sentence interpretive narrative (pattern-focused, not data-restating)
   - Source attribution line (small, muted text)
   - Neighborhood data table (unchanged)
5. Agent reads the section and finds it dense, credible, and scannable

## UI Mockup

```
┌─ Section 4: Neighborhood Intelligence ──────────────────────────────────────┐
│                                                                              │
│  NEIGHBORHOOD INTELLIGENCE                                                   │
│  (font: serif, text: 2xl, weight: bold, color: primary)                     │
│                                                                              │
│  The waterfront corridors of 34102 and 34103 command a 34% price            │
│  premium over inland neighborhoods, yet 34105 posted the strongest          │
│  YoY appreciation at +12.4% — signaling buyer migration toward              │
│  emerging luxury pockets. Watch for 34110's thinning inventory              │
│  (8 transactions) to compress pricing further.                              │
│  (font: sans, text: base, color: text)                                      │
│                                                                              │
│  Source: Analysis of 847 transactions via RealEstateAPI,                     │
│  Jan 2025 – Dec 2025                                                        │
│  (font: sans, text: xs, color: text-tertiary)                               │
│                                                                              │
│  ┌──────────────┬───────┬──────────────┬───────┬────────┐                   │
│  │ Neighborhood │  ZIP  │ Median Price │ Count │  YoY   │                   │
│  │ (text: sm,   │       │              │       │        │                   │
│  │  weight:     │       │              │       │        │                   │
│  │  semibold)   │       │              │       │        │                   │
│  ├──────────────┼───────┼──────────────┼───────┼────────┤                   │
│  │ 34102        │ 34102 │ $9.0M        │  20   │ +10.0% │ (color: success) │
│  │ 34103        │ 34103 │ $7.2M        │  15   │  +4.2% │ (color: success) │
│  │ 34105        │ 34105 │ $5.8M        │  12   │ +12.4% │ (color: success) │
│  │ 34110        │ 34110 │ $6.1M        │   8   │  -2.1% │ (color: error)   │
│  └──────────────┴───────┴──────────────┴───────┴────────┘                   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Implementation Scope

### Layer 2: Agent Prompt Changes (`lib/agents/insight-generator.ts`)

1. **Tighten the `neighborhoodAnalysis` prompt instruction** — change from "1-2 paragraphs" to "2-4 sentences maximum":
   - Lead with the single most notable cross-neighborhood pattern
   - Include one contrarian or surprising finding
   - Do NOT restate per-neighborhood numbers visible in the table
   - Focus on relative positioning, migration signals, and micro-market dynamics

2. **Update the system prompt section differentiation rules** — update the `neighborhoodAnalysis` description to reflect the tighter format.

### Layer 3: Assembly Changes (`lib/agents/report-assembler.ts`)

1. **Add `sourceAttribution` to section 4 content** — derive from:
   - `analytics.market.totalProperties` (transaction count)
   - Date range from the market parameters or computed analytics metadata
   - Data source name: "RealEstateAPI"

### PDF Rendering (`lib/pdf/templates/renderers.tsx`)

1. **Render source attribution** — add a `<Text>` element between the narrative and the data table:
   - Style: `text-xs`, `color-text-tertiary` (maps to `fontSize: 10, color: '#94A3B8'`)
   - Content: `sourceAttribution` string from section content
   - Only render if `sourceAttribution` is present

### Tests

1. Update report assembler test — assert `sourceAttribution` field exists in section 4 content
2. Update PDF renderer test — verify `NeighborhoodIntelligencePdf` renders attribution text
3. Update report eval rubric — adjust neighborhood_intelligence expectations for shorter narrative

## Component References

- NeighborhoodIntelligencePdf: `lib/pdf/templates/renderers.tsx` (lines 1051-1096)

## Files to Change

| File | Change |
|------|--------|
| `lib/agents/insight-generator.ts` | Tighten `neighborhoodAnalysis` prompt (2-4 sentences, no table duplication) |
| `lib/agents/report-assembler.ts` | Add `sourceAttribution` to section 4 content |
| `lib/pdf/templates/renderers.tsx` | Render source attribution line in `NeighborhoodIntelligencePdf` |
| `__tests__/agents/report-assembler.test.ts` | Assert `sourceAttribution` field |
| `__tests__/pdf/document.test.tsx` | Verify attribution rendering |
| `lib/eval/report-eval/test-cases.ts` | Update neighborhood_intelligence rubric |
