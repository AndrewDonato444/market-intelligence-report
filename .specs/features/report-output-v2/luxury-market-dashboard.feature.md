---
feature: Luxury Market Dashboard Restructuring
domain: report-output-v2
source: lib/services/market-analytics.ts, lib/pdf/templates/renderers.tsx, lib/agents/insight-generator.ts, lib/agents/report-assembler.ts
tests:
  - __tests__/services/market-analytics.test.ts
  - __tests__/pdf/document.test.tsx
  - __tests__/agents/report-assembler.test.ts
components: []
personas:
  - established-practitioner
  - report-reader
status: specced
created: 2026-03-13
updated: 2026-03-13
---

# Luxury Market Dashboard Restructuring

**Source Files**: `lib/services/market-analytics.ts`, `lib/pdf/templates/renderers.tsx`, `lib/agents/insight-generator.ts`, `lib/agents/report-assembler.ts`

## Feature: Luxury Market Dashboard Restructuring (#204)

Restructure the Luxury Market Dashboard section (Section 3) of the report. Remove low-value metrics, combine Tier Two and Tier Three into a single Supporting Metrics tier, keep Investor Activity Rate with a definition, and add a 3-sentence narrative headline about the last 100 sales.

### Scenario: Power Five removes Transaction Volume
Given a computed dashboard from market analytics
When the Power Five indicators are generated
Then Transaction Volume is NOT included
And exactly 4 indicators remain: Median Sold Price, Median Price/SqFt, Median Days on Market, List-to-Sale Ratio

### Scenario: Tier Two and Tier Three are combined into Supporting Metrics
Given a computed dashboard from market analytics
When the dashboard tiers are generated
Then there is no separate tierThree array
And a supportingMetrics array exists
And it contains: Total Sales Volume, Average Price, Property Type Split, Investor Activity Rate

### Scenario: Flood Zone Exposure is removed
Given a computed dashboard from market analytics
When supporting metrics are generated
Then Flood Zone Exposure is NOT included

### Scenario: Free and Clear percent is removed
Given a computed dashboard from market analytics
When supporting metrics are generated
Then Free and Clear percent is NOT included

### Scenario: Investor Activity Rate has a definition
Given a computed dashboard with Investor Activity Rate
When the PDF renders the dashboard section
Then the metric includes a definition footnote

### Scenario: Dashboard narrative headline is generated
Given a finalized report with computed analytics
When the insight generator runs
Then it produces a dashboardNarrative field (2-3 sentences)

### Scenario: Dashboard narrative appears in PDF
Given a report section of type luxury_market_dashboard
When the PDF renders the dashboard
Then the narrative headline appears above the metric tiers

### Scenario: Report assembler wires dashboard narrative
Given insight generator output with dashboardNarrative
When the report assembler builds the luxury_market_dashboard section
Then the section content includes the narrative

## Changes by Layer

### Layer 1: computeDashboard in market-analytics.ts
- Remove Transaction Volume from powerFive (now 4 items)
- Merge tierTwo + tierThree into supportingMetrics
- Remove Flood Zone Exposure and Free & Clear %
- Keep Investor Activity Rate

### Layer 2: insight-generator.ts
- Add dashboardNarrative to InsightGeneratorOutput
- Generate 2-3 sentence narrative headline

### Layer 3: report-assembler.ts
- Wire dashboardNarrative into luxury_market_dashboard section content

### PDF: renderers.tsx
- Update interface for new tier names
- Render narrative headline above tiers
- Render POWER FOUR INDICATORS and SUPPORTING METRICS
- Add Investor Activity Rate definition footnote
