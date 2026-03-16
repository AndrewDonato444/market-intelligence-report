---
feature: Market Segments Rating Transparency
domain: report-output-v2
source: lib/pdf/templates/renderers.tsx
tests:
  - __tests__/pdf/market-segments-rating-transparency.test.tsx
components: []
personas:
  - report-reader
status: implemented
created: 2026-03-16
updated: 2026-03-16
---

# Market Segments Rating Transparency

**Source File**: lib/pdf/templates/renderers.tsx
**Design System**: .specs/design-system/tokens.md
**Personas**: .specs/personas/report-reader.md

## Feature: Inline Rating Methodology for Market Segments

Luxury agents presenting to high-net-worth clients need to explain *why* a segment got its rating. Without methodology, ratings look arbitrary and undermine credibility. This feature adds a concise methodology explanation directly below the Market Segments table in the PDF — both in The Narrative section and the Executive Summary section.

### Scenario: Market Segments table includes methodology explanation
Given a report PDF is generated with market segment data
When the Market Segments table is rendered in The Narrative section
Then a methodology explanation appears below the segment table
And the explanation describes the rating scale (A+ through C)
And the explanation states that ratings are based on YoY median price change
And the explanation mentions the minimum sample size threshold of 3

### Scenario: Executive Summary Market Analysis Matrix includes methodology
Given a report PDF is generated with segment data in the Executive Summary
When the Market Analysis Matrix table is rendered
Then a methodology explanation appears below the matrix table
And the content matches the same rating scale explanation

### Scenario: Methodology explains each rating tier
Given the methodology explanation is displayed
Then it describes what A+ means (>10% YoY price growth)
And it describes what A means (5-10% growth)
And it describes what B+ means (0-5% growth)
And it describes what B means (flat/slight decline)
And it describes what C+ means (price and volume both declining)
And it describes what C means (insufficient data, <3 transactions)

### Scenario: Methodology is not shown when no segments exist
Given a report has no market segment data
When the section is rendered
Then no methodology explanation is shown

## User Journey

1. Agent opens the generated PDF report
2. Scrolls to The Narrative or Executive Summary section
3. Sees Market Segments table with ratings
4. **Reads methodology explanation below the table**
5. Understands exactly how each rating was derived
6. Can confidently explain ratings to clients

## UI Mockup (PDF Layout)

```
┌─────────────────────────────────────────────────┐
│  Market Segments                                │
│  ┌──────────┬───────┬─────────┬────────┐       │
│  │ Segment  │ Count │ Median  │ Rating │       │
│  ├──────────┼───────┼─────────┼────────┤       │
│  │ Waterfrnt│  124  │ $5.1M   │  A     │       │
│  │ Golf     │  215  │ $3.2M   │  B+    │       │
│  │ Historic │  178  │ $3.8M   │  A-    │       │
│  └──────────┴───────┴─────────┴────────┘       │
│                                                 │
│  How Ratings Are Calculated                     │
│  Segment ratings reflect year-over-year median  │
│  price momentum:                                │
│  A+ >10% growth · A 5-10% · B+ 0-5% ·         │
│  B flat/decline · C+ price & volume declining · │
│  C insufficient data (<3 sales)                 │
└─────────────────────────────────────────────────┘
```

## Learnings

(To be filled after implementation)
