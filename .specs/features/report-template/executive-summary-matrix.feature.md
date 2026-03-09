---
feature: Executive Summary + Market Analysis Matrix
domain: report-template
source: lib/pdf/templates/renderers.tsx
tests:
  - __tests__/pdf/executive-summary-matrix.test.tsx
components:
  - ExecutiveSummaryPdf
  - MarketAnalysisMatrixPdf
personas:
  - rising-star-agent
status: implemented
created: 2026-03-09
updated: 2026-03-09
---

# Executive Summary + Market Analysis Matrix

**Source Files**: `lib/pdf/templates/renderers.tsx`
**Design System**: `.specs/design-system/tokens.md`

## Feature: Executive Summary + Market Analysis Matrix PDF Sections

Adds dedicated PDF renderers for the executive summary section (replacing the generic NarrativeSectionPdf) and a market analysis matrix showing segment-by-segment performance with intelligence ratings.

### Scenario: Render executive summary with narrative and timing
Given an executive_summary section with narrative, highlights, and timing
When the PDF renderer processes it
Then it shows the narrative text
And it shows highlights as a bullet list
And it shows buyer and seller timing guidance

### Scenario: Render executive summary with segment metrics
Given an executive_summary section that includes segments data
When the PDF renderer processes it
Then it shows a segment table with headers
And each segment row shows name, count, median price, and rating
And ratings are color-coded (A=green, B=amber, C=red)

### Scenario: Render market analysis matrix as standalone section
Given a competitive_market_analysis section with matrix data
When the PDF renderer processes it
Then it shows matrix rows with market comparison data
And each row includes the market name and key metrics

### Scenario: Executive summary renderer replaces NarrativeSectionPdf
Given the renderer dispatch map
When executive_summary type is requested
Then it returns ExecutiveSummaryPdf (not NarrativeSectionPdf)

### Scenario: Competitive analysis renderer replaces GenericSectionPdf
Given the renderer dispatch map
When competitive_market_analysis type is requested
Then it returns CompetitiveAnalysisPdf (not GenericSectionPdf)

### Scenario: Handle executive summary without segments gracefully
Given an executive_summary section with only narrative (no segments)
When rendered
Then it shows the narrative and highlights
And no segment table is shown
And no errors occur

## Learnings

(To be filled after implementation)
