---
feature: Executive Brief Improvements
domain: report-output-v2
source: lib/pdf/templates/renderers.tsx
tests:
  - __tests__/pdf/executive-brief-improvements.test.tsx
components:
  - ExecutiveBriefingPdf
personas:
  - report-reader
  - rising-star-agent
  - established-practitioner
status: implemented
created: 2026-03-13
updated: 2026-03-13
---

# Executive Brief Improvements

**Source Files**: `lib/pdf/templates/renderers.tsx`, `lib/agents/report-assembler.ts`, `lib/services/market-analytics.ts`, `lib/pdf/styles.ts`
**Design System**: `.specs/design-system/tokens.md`
**Personas**: `.specs/personas/report-reader.md`, `.specs/personas/rising-star-agent.md`, `.specs/personas/established-practitioner.md`

## Feature: Executive Brief Improvements

The Executive Briefing section (Section 1 of the report) currently shows four headline tiles — Market Rating, Median Price, YoY Change, and Properties — with no context about what each metric means, no data freshness dates, and no labeled headers for subsections. This improvement adds three things:

1. **Explainer text for each tile/metric** — a concise explanation below each headline tile so the reader knows what they're looking at and why it matters. The report reader persona needs to open to any page and find something worth saying; unexplained metrics fail that test.

2. **Data freshness dates** — a visible "Data as of [date]" line showing when the underlying transaction data was collected. The established practitioner's institutional clients demand recency; the rising star needs credibility. Stale data without a date feels unreliable.

3. **Headers for each content block** — the narrative, confidence, and timing sections currently run together without clear labels. Adding section headers ("Market Overview", "Data Confidence", "Timing Guidance") makes the brief scannable, which matters at Medium patience level.

### Scenario: Each headline tile shows explainer text

Given the Executive Briefing section renders with 4 headline tiles
When the PDF is generated
Then the Market Rating tile shows explainer text "Overall market health based on growth, liquidity, and risk indicators"
And the Median Price tile shows explainer text "50th percentile sale price across all luxury transactions in the analysis period"
And the YoY Change tile shows explainer text "Year-over-year change in median sale price compared to the same period last year"
And the Properties tile shows explainer text "Total luxury property transactions included in this analysis"

### Scenario: Explainer text uses report typography tokens

Given the Executive Briefing headline tiles render with explainer text
When the PDF is generated
Then explainer text uses font-sans at text-xs (10-11px) in color-text-secondary
And explainer text appears below the metric value and label
And explainer text does not crowd the metric value (spacing-1 gap minimum)

### Scenario: Data freshness date displays in Executive Briefing header

Given a report generated with transaction data
And the most recent transaction sale date in the dataset is "2026-02-15"
And the report was generated on "2026-03-13"
When the Executive Briefing section renders
Then a "Data as of February 2026" line appears below the section title
And the date reflects the latest transaction date in the analyzed data, not the generation date

### Scenario: Data freshness falls back to generation date when transaction dates unavailable

Given a report generated on "2026-03-13"
And the transaction data has no parseable sale dates
When the Executive Briefing section renders
Then a "Data as of March 2026" line appears using the report generation date
And no error occurs

### Scenario: Data freshness date uses abbreviated month format

Given the data freshness date is derived from transactions
When the date is formatted for display
Then it uses "Month YYYY" format (e.g., "February 2026")
And it does not show a specific day (privacy/precision — transaction-level dates are not meaningful to the reader)

### Scenario: Narrative block has a section header

Given the Executive Briefing section includes narrative content
When the PDF renders
Then the narrative block is preceded by a "Market Overview" header
And the header uses font-sans at text-sm weight font-semibold in color-text-secondary uppercase

### Scenario: Confidence block has a section header

Given the Executive Briefing section includes confidence metadata
When the PDF renders
Then the confidence line is preceded by a "Data Confidence" header
And the confidence line shows the level and sample size: e.g., "High confidence (n=45 transactions)"

### Scenario: Timing guidance block has a section header

Given the Executive Briefing section includes buyer and seller timing
When the PDF renders
Then the timing block is preceded by a "Timing Guidance" header
And buyer timing and seller timing each show with a bold label ("Buyers:" / "Sellers:")

### Scenario: Executive Briefing renders correctly without optional data

Given an Executive Briefing section with headline metrics and narrative only
And no confidence metadata, no timing guidance, and no data freshness date
When the PDF renders
Then the headline tiles render with explainers
And the narrative renders with its header
And no empty sections or broken layout appear

### Scenario: Data freshness date is computed from transaction data in Layer 1

Given ComputedAnalytics is calculated from raw property data
And properties have lastSaleDate values
When market-analytics computes the analytics
Then it extracts the most recent lastSaleDate across all properties as `dataAsOfDate`
And `dataAsOfDate` is an ISO date string available in ComputedAnalytics

### Scenario: Report assembler passes data freshness to executive briefing content

Given the report assembler builds the executive_briefing section
And ComputedAnalytics includes a `dataAsOfDate` field
When the section content is assembled
Then the executive_briefing content includes `dataAsOfDate` in its content structure
And the PDF renderer can access it for display

## User Journey

1. Agent generates a report via the creation flow
2. **Executive Briefing (this section)** — the first content section after cover + at-a-glance
3. Agent reads headline tiles and immediately understands what each metric means (explainer text)
4. Agent sees "Data as of February 2026" and knows the intelligence is current
5. Agent scans section headers to jump to Timing Guidance for their next client call
6. Agent continues to Market Insights Index (Section 2)

## UI Mockup

```
┌─ Executive Briefing (bg: report-bg) ──────────────────────────────────────────┐
│                                                                                │
│  EXECUTIVE BRIEFING  (font: serif, text-3xl, font-bold, color: primary)       │
│  Data as of February 2026  (font: sans, text-xs, color: text-tertiary)        │
│                                                                                │
│  ┌─ Tile (bg: primary, radius: sm) ────┐  ┌─ Tile ────────────────────────┐  │
│  │  A+  (text-4xl, font-light, accent) │  │  $4.2M  (text-4xl, accent)   │  │
│  │  Market Rating  (text-sm, inverse)   │  │  Median Price  (text-sm)      │  │
│  │  Overall market health based on      │  │  50th percentile sale price   │  │
│  │  growth, liquidity, and risk         │  │  across luxury transactions   │  │
│  │  (text-xs, text-tertiary)            │  │  (text-xs, text-tertiary)     │  │
│  └──────────────────────────────────────┘  └───────────────────────────────┘  │
│                                                                                │
│  ┌─ Tile ──────────────────────────────┐  ┌─ Tile ────────────────────────┐  │
│  │  ↑ 12.3%  (text-4xl, success)       │  │  234  (text-4xl, accent)      │  │
│  │  YoY Change  (text-sm)              │  │  Properties  (text-sm)        │  │
│  │  Year-over-year change in median    │  │  Total luxury transactions    │  │
│  │  sale price vs same period last yr  │  │  included in this analysis    │  │
│  │  (text-xs, text-tertiary)            │  │  (text-xs, text-tertiary)     │  │
│  └──────────────────────────────────────┘  └───────────────────────────────┘  │
│                                                                                │
│  ── MARKET OVERVIEW ── (text-sm, font-semibold, text-secondary, uppercase)    │
│                                                                                │
│  The Naples luxury market demonstrated resilience in Q1 2026, with median     │
│  prices climbing 12.3% year-over-year driven by constrained inventory...      │
│  (font: sans, text-base, color: text)                                         │
│                                                                                │
│  ── DATA CONFIDENCE ── (text-sm, font-semibold, text-secondary, uppercase)    │
│                                                                                │
│  High confidence (n=234 transactions)                                         │
│  (font: sans, text-sm, color: text-secondary)                                 │
│                                                                                │
│  ── TIMING GUIDANCE ── (text-sm, font-semibold, text-secondary, uppercase)    │
│                                                                                │
│  **Buyers:** Opportunity window narrowing — waterfront inventory at 18-month  │
│  low. Act on pre-market listings before spring demand.                         │
│                                                                                │
│  **Sellers:** Premium positioning favored — list at 5-8% above Q4 comps.     │
│  Cash-offer momentum supports aggressive pricing in $6M+ segment.             │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
```

## Component References

- ExecutiveBriefingPdf: `lib/pdf/templates/renderers.tsx` (existing, to be updated)
- Design tokens: `.specs/design-system/tokens.md`

## Implementation Notes

### Layer 1 — market-analytics.ts
1. Compute `dataAsOfDate` from the most recent `lastSaleDate` across all properties in the dataset
2. Add `dataAsOfDate: string | null` to `ComputedAnalytics` interface
3. Fallback: if no sale dates are parseable, set to `null`

### Layer 3 — report-assembler.ts
1. Add `dataAsOfDate` to executive_briefing content structure
2. Add `metricExplainers` object with static text for each tile (Market Rating, Median Price, YoY Change, Properties)
3. Pass `dataAsOfDate` from `ComputedAnalytics` into content

### PDF — renderers.tsx
1. Update `ExecutiveBriefingPdf` to render explainer text below each tile value+label
2. Add "Data as of [Month YYYY]" line below section title
3. Add uppercase section headers before narrative, confidence, and timing blocks
4. Handle missing optional data gracefully (no empty headers if section is absent)

### Styles — styles.ts
1. Add `metricExplainer` style (font-sans, ~10px, color-text-secondary/tertiary)
2. Add `subsectionHeader` style (font-sans, ~12px, font-semibold, uppercase, color-text-secondary)
3. Add `dataFreshness` style (font-sans, ~10px, color-text-tertiary)

### Backward Compatibility
- Existing reports without `dataAsOfDate` or `metricExplainers` render without those elements (no errors, no blank space)
- The headline tile layout does not change — explainers are additive below existing content

## Learnings

- `formatDataFreshnessDate` uses UTC month to avoid timezone-shifted month boundaries when parsing ISO date strings
- The insight-generator's `executiveSummary.timing.buyers/sellers` is accessed via the metadata `insights` object — needs deep casting through `Record<string, unknown>` since agent metadata is untyped
- Subsection headers (Market Overview, Data Confidence, Timing Guidance) are conditionally rendered — they only appear when their content exists, preventing empty sections
- The `metricExplainers` object uses static text (not agent-generated) to ensure consistency across reports
