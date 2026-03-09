---
feature: Trending Insights + Forecasts + Methodology + Strategic Summary
domain: report-template
source: lib/pdf/templates/renderers.tsx
tests:
  - __tests__/pdf/forecasts-methodology-strategic.test.tsx
components:
  - ForecastsPdf
  - NarrativeSectionPdf
  - MethodologySectionPdf
personas:
  - rising-star-agent
status: implemented
created: 2026-03-09
updated: 2026-03-09
---

# Trending Insights + Forecasts + Methodology + Strategic Summary

**Source Files**: `lib/pdf/templates/renderers.tsx`, `lib/pdf/document.tsx`
**Design System**: `.specs/design-system/tokens.md`

## Feature: Forecasts, Methodology, and Strategic Summary PDF Sections

Validates and enhances the forecasts renderer with projections table and scenario cards, the strategic summary renderer with timing guidance, and the methodology renderer with data sources. All 8 section types in SECTION_REGISTRY now have dedicated PDF renderers.

### Scenario: Forecasts shows projections table
Given a forecasts section with segment projections
When rendered in PDF
Then it shows a table with segment, 6-month, and 12-month columns
And prices are formatted as dollar amounts

### Scenario: Forecasts shows scenario cards
Given a forecasts section with base/bull/bear scenarios
When rendered
Then each scenario appears as a card
And shows the scenario narrative and price change percentage

### Scenario: Strategic summary shows narrative with timing
Given a strategic_summary section
When rendered
Then it uses the NarrativeSectionPdf renderer
And shows narrative text and timing guidance

### Scenario: All 8 section types have dedicated renderers
Given the renderer dispatch map
When each SECTION_REGISTRY type is checked
Then none fall through to GenericSectionPdf

### Scenario: Full report document renders all section types
Given ReportData with all 8 section types
When the document assembles
Then all sections render without errors

## Learnings

(To be filled after implementation)
