---
feature: Market Intelligence Summary
domain: report-output-v2
source: lib/pdf/templates/insights-index.tsx
tests:
  - __tests__/pdf/market-intelligence-summary.test.tsx (38 tests)
components:
  - InsightsIndex
  - HorizontalBarChart
  - SegmentDistributionBar
  - TrendIndicator
  - MetricCard
personas:
  - report-reader
  - established-practitioner
  - rising-star-agent
status: implemented
created: 2026-03-13
updated: 2026-03-13
---

# Market Intelligence Summary — "At a Glance"

**Source Files**: `lib/pdf/templates/insights-index.tsx`, `lib/pdf/components/data-viz.tsx`, `lib/pdf/document.tsx`, `lib/pdf/styles.ts`
**Design System**: `.specs/design-system/tokens.md`
**Personas**: `.specs/personas/report-reader.md`, `.specs/personas/established-practitioner.md`

## Feature: Market Intelligence Summary Redesign

Redesign the existing "Market Intelligence Summary" page (currently just confidence badge, sample size, report date, and a highlights list) into a visual "At a Glance" section that uses charts and visual data representations — not just text and metric cards. This is the first content page after the cover and TOC, and it must instantly arm the reader with the report's key intelligence before they dive into detailed sections.

The report reader persona says: *"I should be able to open this report to any page and find something worth saying."* This page must deliver that in the first 10 seconds of reading. It's the executive briefing visual — the page agents photograph and text to clients.

### What Changes

The current `InsightsIndex` component is replaced with a richer layout that includes:

1. **Headline metric strip** — 4 metric cards in a row (total transactions, total volume, median price, YoY change)
2. **Market Insights Index bar visualization** — the 4 dimension scores (Liquidity, Timing, Risk, Value) shown as a horizontal bar chart with 0-10 scale, not just numbers
3. **Segment distribution chart** — horizontal bars showing transaction count by segment (e.g., $1-3M: 45%, $3-5M: 30%, $5-10M: 18%, $10M+: 7%)
4. **YoY trend indicators** — compact visual trend indicators for key metrics (median price, volume, transaction count) showing direction and magnitude
5. **Confidence & data freshness** — retained from current design but moved to a compact footer strip
6. **Key highlights** — 3 bullet points from the executive briefing narrative, each with a gold accent bullet

### What Does NOT Change

- Page position in the document (after cover + TOC, before section pages)
- The page is still rendered by `InsightsIndex` component (refactored in place)
- Confidence/staleness warnings still display when relevant
- The component still receives `metadata` and `sections` props

---

## Scenario: Headline metric strip renders 4 key metrics

Given a report with computed analytics containing market data
When the Market Intelligence Summary page renders
Then a row of 4 metric cards appears at the top:
  | Metric | Source | Format |
  | Total Transactions | headline.totalProperties | "2,234" |
  | Total Volume | headline.totalVolume | "$6.58B" |
  | Median Price | headline.medianPrice | "$2.95M" |
  | YoY Price Change | headline.yoyPriceChange | "+8.2%" with green/red color |
And metrics are read from the nested `executive_briefing.content.headline` object (not flat fields)
And each metric card uses `font-serif` for the value and `font-sans` for the label
And the YoY metric is colored `color-success` for positive, `color-error` for negative

## Scenario: Market Insights Index renders as horizontal bar chart

Given the insights index contains 4 dimension scores (liquidity, timing, risk, value)
When the Market Intelligence Summary page renders
Then a horizontal bar chart shows each dimension as a labeled row:
  | Dimension | Score | Bar Fill |
  | Liquidity Strength | 8.4 | 84% width, color-primary |
  | Market Timing | 7.1 | 71% width, color-primary |
  | Risk Management | 6.8 | 68% width, color-primary |
  | Opportunity Value | 9.2 | 92% width, color-primary |
And each bar has the score displayed at the right end in `font-semibold`
And a 0-10 scale axis is shown at the bottom with gridlines at 2, 4, 6, 8, 10
And the overall composite score (average of 4 dimensions) is shown as a large number beside the chart title

## Scenario: Segment distribution renders as horizontal bars

Given the report contains segment metrics with transaction counts
When the Market Intelligence Summary page renders
Then horizontal bars show each segment's share of total transactions
And each segment has a distinct color from the chart palette (`chart-primary`, `chart-secondary`, `chart-tertiary`, `chart-accent`)
And a legend row for each bar shows segment name and percentage
And segments with less than 3% share are grouped into "Other"

## Scenario: YoY trend indicators show direction and magnitude

Given the report contains YoY metrics (medianPriceChange, volumeChange, transactionCountChange)
When the Market Intelligence Summary page renders
Then a compact row of 3 trend indicators appears:
  | Metric | Value | Direction |
  | Median Price | +8.2% | up arrow, green |
  | Transaction Volume | -12.4% | down arrow, red |
  | Transaction Count | +3.1% | up arrow, green |
And each indicator shows the metric name, percentage change, and a directional arrow
And positive changes use `color-success`, negative use `color-error`, flat (within 1%) uses `color-text-secondary`

## Scenario: Key highlights display with gold accent bullets

Given the executive briefing section contains a narrative
When the Market Intelligence Summary page renders
Then up to 3 key highlights are displayed as bullet points
And each bullet uses a gold accent dot (`color-accent`) instead of a plain bullet
And highlight text uses `font-sans`, `text-sm`, `color-text`
And highlights are sourced from the executive_briefing section's narrative or key metrics

## Scenario: Confidence footer strip renders compactly

Given the report metadata contains confidence level, sample size, and generation date
When the Market Intelligence Summary page renders
Then a compact footer strip at the bottom shows:
  | Item | Display |
  | Confidence | "High" in green / "Medium" in amber / "Low" in red |
  | Sample Size | "2,234 transactions" |
  | Report Date | "March 13, 2026" |
And the strip uses a single row with pipe separators, `text-xs` font size
And the strip does NOT dominate the page (it's metadata, not content)

## Scenario: Stale data warning appears when data sources are stale

Given the report metadata lists stale data sources
When the Market Intelligence Summary page renders
Then a compact warning banner appears above the confidence strip
And the banner uses `color-warning` border and text
And it lists the stale data sources

## Scenario: Empty segments degrade gracefully

Given the report contains fewer than 2 segments
When the Market Intelligence Summary page renders
Then the segment distribution chart is omitted entirely
And the layout rebalances to fill the space with remaining components

## Scenario: Page fits on a single PDF page

Given all components are rendered
When the Market Intelligence Summary is generated
Then the entire content fits within a single US Letter page (612x792pt with 64pt margins)
And no content overflows to a second page
And component sizing is constrained to prevent overflow

---

## User Journey

1. Agent opens the generated PDF report
2. Sees the cover page with title, key themes, and branding
3. Sees the table of contents
4. **Lands on "At a Glance"** — instantly absorbs: how big is this market, what are the key scores, where is the activity concentrated, which way are things trending
5. Dives into Executive Briefing for the full narrative
6. Continues through detailed sections

This page is what agents screenshot and send to clients before a meeting. It must be instantly parseable and visually impressive.

---

## UI Mockup

```
+-- Page: Market Intelligence Summary -----------------------------------------+
|                                                                              |
|  AT A GLANCE (font: serif, text: 2xl, weight: bold, color: primary)         |
|  ======================== (accent line, color: accent)                        |
|                                                                              |
|  +-------------+ +-------------+ +-------------+ +-------------+            |
|  |  2,234      | |  $6.58B     | |  $2.95M     | |  +8.2%      |            |
|  |  Transactions| |  Volume     | |  Median     | |  YoY Price  |            |
|  +-------------+ +-------------+ +-------------+ +-------------+            |
|   (4 metric cards: bg: surface, radius: sm, border: border)                 |
|                                                                              |
|  +-- Market Posture -----------------------------------------------+        |
|  |                                                          7.9     |        |
|  |  COMPOSITE SCORE (text: 3xl, weight: light, color: accent)      |        |
|  |                                                                   |        |
|  |  Liquidity   ====================------  8.4                      |        |
|  |  Timing      ==============------------  7.1                      |        |
|  |  Risk        =============-------------  6.8                      |        |
|  |  Value       ========================--  9.2                      |        |
|  |              |    2    |    4    |    6    |    8    |   10        |        |
|  |  (bars: bg: primary, track: primary-light, scores: font-semibold)|        |
|  +------------------------------------------------------------------+        |
|                                                                              |
|  +-- Transaction Distribution -----+  +-- Year-over-Year ----------+        |
|  |                                  |  |                             |        |
|  |  ====================  $1-3M 45% |  |  Median Price    +8.2%  ^  |        |
|  |  ============         $3-5M 30%  |  |  Volume         -12.4%  v  |        |
|  |  ========             $5-10M 18% |  |  Transactions    +3.1%  ^  |        |
|  |  ===                  $10M+   7% |  |                             |        |
|  |                                  |  |  (color: success/error)     |        |
|  |  (horiz bars: chart palette)     |  |  (font: sans, text: sm)     |        |
|  +----------------------------------+  +-----------------------------+        |
|                                                                              |
|  KEY INTELLIGENCE (font: sans, text: xs, weight: bold, color: accent)       |
|  * Ultra-luxury waterfront outperformed broader market by 23%               |
|  * Cash transactions dominated at 67% -- highest in 3 years                |
|  * Supply constraints tightening: 2.1 months inventory vs 3.8 regional     |
|  (bullets: color-accent dot, text: font-sans, text-sm, color: text)         |
|                                                                              |
|  -------------------------------------------------------------------        |
|  High Confidence  |  2,234 transactions  |  March 13, 2026                  |
|  (footer: text-xs, color: text-tertiary, single row)                        |
|                                                                              |
|  --- Market Intelligence Summary ------------------- 3 / 24 --------        |
+------------------------------------------------------------------------------+
```

---

## Component References

- MetricCard: `lib/pdf/components/data-viz.tsx` — existing, may need compact size variant
- HorizontalBarChart: `lib/pdf/components/data-viz.tsx` — **NEW** component for dimension scores
- SegmentDistributionBar: `lib/pdf/components/data-viz.tsx` — **NEW** component for transaction distribution
- TrendIndicator: `lib/pdf/components/data-viz.tsx` — **NEW** compact metric + percentage + arrow
- ConfidenceDots: `lib/pdf/components/data-viz.tsx` — existing, not used here (replaced by text)
- RatingBadge: `lib/pdf/components/data-viz.tsx` — existing, not used here
- InsightsIndex: `lib/pdf/templates/insights-index.tsx` — **REFACTORED** in place

### New Components Needed

| Component | File | Purpose |
|-----------|------|---------|
| `HorizontalBarChart` | `lib/pdf/components/data-viz.tsx` | Horizontal bar chart for 0-10 dimension scores with gridlines |
| `SegmentDistributionBar` | `lib/pdf/components/data-viz.tsx` | Horizontal bars with legend for segment breakdown |
| `TrendIndicator` | `lib/pdf/components/data-viz.tsx` | Compact metric + percentage + directional arrow |
| `HeadlineMetricStrip` | `lib/pdf/templates/insights-index.tsx` | Row of 4 compact metric cards (internal to InsightsIndex) |

### Component Stubs Needed

- `.specs/design-system/components/horizontal-bar-chart.md`
- `.specs/design-system/components/segment-distribution-bar.md`
- `.specs/design-system/components/trend-indicator.md`

---

## Data Flow

The `InsightsIndex` component currently receives `metadata` and `sections`. To render the new charts, it extracts data from existing section content:

```
ReportData.sections (already passed as props)
  +-- executive_briefing.content
  |     +-- headline.rating                    -> Headline: overall rating
  |     +-- headline.medianPrice               -> Headline: Median Price
  |     +-- headline.totalVolume               -> Headline: Total Volume
  |     +-- headline.totalProperties           -> Headline: Total Transactions
  |     +-- headline.yoyPriceChange            -> Headline: YoY Price Change
  |     +-- headline.yoyVolumeChange           -> YoY trend: Volume
  |     +-- headline.yoyTransactionCountChange -> YoY trend: Transaction Count
  |     +-- highlights[]                       -> Key Intelligence bullets
  |
  +-- market_insights_index.content
  |     +-- liquidity.score  -> Bar chart row 1
  |     +-- timing.score     -> Bar chart row 2
  |     +-- risk.score       -> Bar chart row 3
  |     +-- value.score      -> Bar chart row 4
  |
  +-- luxury_market_dashboard.content
        +-- segments[]       -> Segment distribution chart
             +-- name, count -> bar widths + legend

ReportData.metadata (already passed as props)
  +-- confidence.level             -> Footer confidence
  +-- confidence.sampleSize        -> Footer sample size
  +-- generatedAt                  -> Footer report date
  +-- confidence.staleDataSources  -> Stale data warning
```

### Props Change

No interface change needed for `document.tsx`. The `InsightsIndex` component already receives both `metadata` and `sections`. The new visualizations extract data from the existing `executive_briefing`, `market_insights_index`, and `luxury_market_dashboard` section content objects that are already in the `sections` array.

---

## Implementation Notes

### React-PDF Constraints

React-PDF does not support SVG `<circle>` or `<arc>` paths natively. All chart visualizations must be built from `View` and `Text` primitives:

- **Horizontal bars**: `View` with percentage-based width and `backgroundColor`
- **Stacked bars**: Nested `View` elements with `flexDirection: "row"` and proportional `flex` values
- **No actual donut/pie charts**: Use horizontal bars as the primary visualization
- **No sparklines**: Use `TrendIndicator` (percentage + arrow) instead of actual line charts

### Print Considerations

- All content must fit on a single US Letter page (612x792pt) with 64pt margins = 484x664pt content area
- Font sizes should not go below 9px for readability at 300dpi
- Bar chart track backgrounds should be `color-primary-light` (#F1F5F9) for sufficient contrast when printed

---

## Persona Revision Notes

**Report Reader lens**: "At a Glance" directly addresses their need to "open to any page and find something worth saying." The headline metrics strip gives them 4 quotable numbers instantly. The insights index bar chart visualizes market posture — a term they use naturally. Key intelligence bullets arm them with contrarian insights.

**Established Practitioner lens**: The composite score (7.9/10) gives Jordan a single conviction number to lead with in client meetings. The segment distribution shows where the action is concentrated — "45% of luxury transactions are in the $1-3M tier" is a positioning insight. YoY trends show market direction at a glance.

**Rising Star lens**: Alex can screenshot this page and text it to a prospect. The visual density (charts, not walls of text) signals institutional quality. The 4 metric cards are the "executive briefing" Alex's finance-background vocabulary expects.

---

## Learnings

- React-PDF mock renders `Text` as `span` and `View` as `div`, so tests use `screen.getByText` / `getAllByText` against rendered text content
- When the same metric value appears in multiple components (e.g., YoY change in both headline strip and trend indicator), tests must use `getAllByText` instead of `getByText`
- UTC date strings like `2026-03-13T00:00:00Z` render as the previous day in US timezones via `toLocaleDateString`; use midday timestamps (T12:00:00Z) in tests to avoid timezone-dependent date display
- Horizontal bar charts in React-PDF must use `View` with percentage-based widths — no SVG or canvas support
- The `SegmentDistributionBar` component groups segments below 3% threshold into "Other" to prevent visual clutter in the distribution chart
