---
feature: YoY Analysis Period Transparency
domain: data-infrastructure
source: lib/services/market-analytics.ts
tests:
  - __tests__/services/yoy-analysis-period.test.ts
components: []
personas:
  - report-reader
  - anti-persona-report
design_refs:
  - .specs/design-system/tokens.md
status: implemented
created: 2026-03-17
updated: 2026-03-17
---

# YoY Analysis Period Transparency

**Source Files**:
- `lib/services/market-analytics.ts` — `splitByYear()`, `computeMarketAnalytics()`
- `lib/services/data-fetcher.ts` — `computePeriodBounds()`, period-bounded searches
- `lib/agents/report-assembler.ts` — headline assembly, methodology footnote
- `lib/pdf/templates/insights-index.tsx` — "At a Glance" page rendering

**Design System**: .specs/design-system/tokens.md
**Personas**: .specs/personas/report-reader.md

## Problem Statement

The report has three data cleanliness issues that undermine credibility:

1. **Period misalignment**: The data fetcher pulls rolling 12-month windows (e.g., Mar 2025–Mar 2026 vs Mar 2024–Mar 2025), but `splitByYear()` re-groups by calendar year. Properties from Jan–Mar 2025 fetched as "current period" get grouped into "prior year" by the calendar-year logic, producing misleading YoY metrics (-90.9% transaction change, -95.2% volume change).

2. **Opaque transaction count**: The "At a Glance" page shows "200 Transactions" — the combined total across both periods (current + prior). The reader assumes this is the current market size, not a 24-month aggregate.

3. **No analysis window disclosure**: The report shows `dataAsOfDate` (most recent transaction) but never states the full analysis window (start–end dates for current and prior periods). The reader cannot evaluate what time range produced these numbers.

## Feature: YoY Analysis Period Transparency

For luxury real estate agents preparing client presentations, this feature ensures every YoY metric in the report is traceable to a specific, stated time period with disclosed sample sizes — so the agent never gets caught flat-footed when a client asks "where did that number come from?"

### Scenario: Period-aligned YoY computation
Given the data fetcher retrieves properties using rolling 12-month windows
When `computeMarketAnalytics` computes YoY metrics
Then YoY splits properties using the same rolling period bounds (not calendar years)
And properties sold between `periods.current.min` and `periods.current.max` are the "current" cohort
And properties sold between `periods.prior.min` and `periods.prior.max` are the "prior" cohort

### Scenario: Analysis period metadata flows through the pipeline
Given the data fetcher computes period bounds
When `CompiledMarketData` is assembled
Then it includes `analysisPeriod` with `current.min`, `current.max`, `prior.min`, `prior.max` date strings
And `ComputedAnalytics` includes `analysisPeriod` with both date ranges and per-period sample sizes

### Scenario: Transaction count reflects current period only
Given the analytics are computed with period-aligned cohorts
When the headline `totalProperties` is set
Then it reflects the **current period** transaction count (not the 24-month combined total)
And the prior period count is available separately as `priorPeriodCount`

### Scenario: At a Glance page displays analysis window
Given a report is rendered with analysis period metadata
When the "At a Glance" page is generated
Then below the headline metrics, a label reads e.g. "Mar 2025 – Mar 2026 vs. Mar 2024 – Mar 2025"
And the YoY section header includes the comparison periods
And the transaction count label clarifies the period (e.g. "Transactions (12 mo)")

### Scenario: Methodology footnote includes period and sample sizes
Given a report includes analysis period metadata
When the methodology/data sources section is rendered
Then it states the exact date ranges analyzed
And it states the sample size per period (e.g. "87 current-period transactions, 113 prior-period transactions")

### Scenario: Edge case — fewer than 3 transactions in current period
Given the current rolling 12-month window has fewer than 3 transactions
When YoY is computed
Then all YoY metrics are set to `null` (not computed from insufficient data)
And the report displays "Insufficient data for YoY comparison" instead of misleading percentages

### Scenario: Edge case — no prior period data
Given the prior rolling 12-month window returns 0 transactions
When YoY is computed
Then all YoY metrics are set to `null`
And the report notes "No prior-period transactions available for comparison"

## User Journey

1. Agent creates a report via the wizard
2. Pipeline fetches data with date-bounded searches
3. **Analytics compute YoY using rolling period bounds (this feature)**
4. **Report renders with visible analysis window and per-period counts**
5. Agent opens PDF, sees "87 transactions (Mar 2025 – Mar 2026)" — knows exactly what they're citing
6. Client asks "what time period?" — agent has the answer on the page

## UI Mockup — At a Glance (revised)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  At a Glance  (font: serif, text: 2xl, weight: bold)           │
│  ─── (color: accent, 2px)                                      │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │    87    │ │ $371.2M  │ │  $1.68M  │ │  -4.2%   │          │
│  │Trans.   │ │ Volume    │ │Med. Price│ │ YoY Price│          │
│  │(12 mo)  │ │ (12 mo)   │ │          │ │          │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                 │
│  ┌─ YEAR-OVER-YEAR ────────────────────────────────────────┐   │
│  │  Mar 2025 – Mar 2026 vs. Mar 2024 – Mar 2025           │   │
│  │  (font: sans, text-xs, color: text-tertiary)            │   │
│  │                                                          │   │
│  │  Median Price                              -4.2% ▼      │   │
│  │  Volume                                    -12.3% ▼     │   │
│  │  Transactions                   87 vs. 113  -23.0% ▼    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Mar 2025 – Mar 2026  ·  87 transactions analyzed              │
│  (font: sans, text-xs, color: text-tertiary)                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Key changes from current design:**
- Transaction count = current period only (87), not combined (200)
- "(12 mo)" qualifier on Transactions and Volume cards
- YoY section shows explicit comparison periods
- Transactions row shows absolute counts ("87 vs. 113")
- Footer states the analysis window and sample size

## Technical Approach

### 1. Thread `analysisPeriod` through the data pipeline

Add to `CompiledMarketData`:
```typescript
analysisPeriod: {
  current: { min: string; max: string };
  prior: { min: string; max: string };
}
```

Add to `ComputedAnalytics`:
```typescript
analysisPeriod: {
  current: { min: string; max: string; count: number };
  prior: { min: string; max: string; count: number };
}
```

### 2. Replace `splitByYear()` with period-bound splitting

Instead of grouping by calendar year, use the actual period bounds already computed by `computePeriodBounds()`. The data is already fetched in two cohorts — pass them through separately rather than merging and re-splitting.

### 3. Update report assembler

Add `analysisPeriod` to the `executive_briefing` section content so the PDF renderer has access.

### 4. Update At a Glance PDF

- Show current-period transaction count (not combined)
- Add period comparison label to YoY section
- Add analysis window to footer

## Component References

No new components. Modified existing:
- `InsightsIndex` in `lib/pdf/templates/insights-index.tsx`

## Learnings

(To be filled after implementation)
