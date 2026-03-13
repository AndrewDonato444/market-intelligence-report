---
feature: Eliminate Cash Buyers from Liquidity Metrics
domain: report-output-v2
source: lib/services/market-analytics.ts
tests:
  - __tests__/services/market-analytics.test.ts
components: []
personas: [primary]
status: implemented
created: 2026-03-13
updated: 2026-03-13
---

# Eliminate Cash Buyers from Liquidity Metrics

**Source Files**: `lib/services/market-analytics.ts`, `lib/agents/insight-generator.ts`, `lib/pdf/templates/renderers.tsx`
**Design System**: .specs/design-system/tokens.md

## Feature: Remove cash buyer data from all liquidity calculations and report display

Cash buyer percentage is unreliable in luxury markets — most transactions involve cash or trusts regardless. Removing it produces cleaner liquidity scoring and avoids misleading metrics.

### Scenario: Liquidity score computed without cash buyer component
Given a market with property details including cash buyer flags
When the liquidity score is computed
Then the score uses only transaction volume and free & clear percentage
And the components object does not include cashBuyerPct

### Scenario: Dashboard excludes Cash Buyer % indicator
Given detail metrics with cashBuyerPercentage data
When the dashboard is computed
Then tierTwo indicators do not include "Cash Buyer %"
And tierTwo has 3 indicators (not 4)

### Scenario: Insight generator prompt omits cash buyer data
Given computed analytics with cash buyer percentage
When the insight generator builds the agent prompt
Then the prompt does not contain "cash buyer" or "cashBuyer" references

### Scenario: PDF renderer does not format Cash Buyer % as percentage
Given the PERCENTAGE_METRICS set in renderers
Then "Cash Buyer %" is not in the set

### Scenario: DetailDerivedMetrics still computes cashBuyerPercentage
Given property details with cashBuyer flags
When computeDetailMetrics is called
Then cashBuyerPercentage is still computed and available
And the field is retained for potential future use

## Cross-Cutting Changes

1. **Layer 1 (market-analytics.ts)**:
   - `computeLiquidityScore()`: Remove cashScore component, score = avg(volumeScore, freeClearScore)
   - `computeDashboard()`: Remove "Cash Buyer %" from tierTwo array

2. **Layer 2 (insight-generator.ts)**:
   - Remove cash buyer data from agent prompt template

3. **PDF (renderers.tsx)**:
   - Remove "Cash Buyer %" from PERCENTAGE_METRICS set

4. **Eval fixtures (fixtures.ts)**:
   - Remove "Cash Buyer %" from dashboard fixture data
