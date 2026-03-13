---
feature: Market Insights Index Redesign
domain: report-output-v2
source: lib/pdf/templates/renderers.tsx
tests:
  - __tests__/pdf/market-insights-index-redesign.test.tsx
components:
  - MarketInsightsIndexPdf
personas:
  - primary
status: implemented
created: 2026-03-13
updated: 2026-03-13
---

# Market Insights Index Redesign

**Source File**: lib/pdf/templates/renderers.tsx (MarketInsightsIndexPdf)
**Design System**: .specs/design-system/tokens.md
**Roadmap**: #203

## Problem

The current Market Insights Index section renders 4 dimensions (Risk, Value, Timing, Liquidity) as vertically stacked rectangular cards. Three issues:
1. No context for how to read/interpret the index scores
2. Some dimensions can render with blank/null scores
3. The vertical rectangle layout wastes horizontal space

## Feature: Market Insights Index Redesign

### Scenario: Usage context is displayed
Given a report with a market_insights_index section
When the PDF renders the Market Insights Index page
Then a "How to Read This Index" explanatory block appears at the top
And it explains the 1-10 scoring scale and what each dimension measures

### Scenario: 2x2 square tile layout
Given a report with 4 insights index dimensions
When the PDF renders the Market Insights Index page
Then dimensions are arranged in a 2x2 grid (2 columns, 2 rows)
And each tile shows the dimension name, score, label, and interpretation

### Scenario: Every dimension always has a rating
Given insights index data where some component values are null
When computeInsightsIndex calculates dimension scores
Then every dimension returns a numeric score between 1 and 10
And every dimension returns a non-empty label string

### Scenario: Tile color coding by score
Given a dimension with a score
When the tile renders
Then scores 7+ get a success/green accent
And scores 4-6 get a warning/amber accent
And scores below 4 get an error/red accent

### Scenario: Interpretation text in each tile
Given a dimension with an interpretation string
When the tile renders
Then the interpretation text appears below the score

### Scenario: Component breakdown in each tile
Given a dimension with component metrics
When the tile renders
Then each component metric is displayed with a human-readable label and formatted value

## Changes Required

### Layer 4: PDF Renderer (lib/pdf/templates/renderers.tsx)
- Redesign MarketInsightsIndexPdf:
  - Add "How to Read This Index" explanatory block
  - Change layout from vertical stack to 2x2 grid
  - Add score-based color coding to tile borders
  - Show interpretation text in each tile
  - Show component breakdown in each tile

### Layer 1: Computation (lib/services/market-analytics.ts)
- No changes needed - scores already use clamp(1,10), always non-null
