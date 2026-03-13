---
feature: Key Drivers + Second Homes + Competitive Analysis Sections
domain: report-template
source: lib/pdf/templates/renderers.tsx
tests:
  - __tests__/pdf/key-drivers-competitive.test.tsx
components:
  - KeyDriversPdf
  - CompetitiveAnalysisPdf
personas:
  - rising-star-agent
status: implemented
created: 2026-03-09
updated: 2026-03-09
---

# Key Drivers + Second Homes + Competitive Analysis Sections

**Source Files**: `lib/pdf/templates/renderers.tsx`
**Design System**: `.specs/design-system/tokens.md`

## Feature: Enhanced Key Drivers and Competitive Analysis PDF Sections

Enhances the Key Drivers renderer with impact level badges and trend indicators, adds a Second Homes subsection renderer, and enhances the Competitive Analysis renderer with peer market comparison tables.

### Scenario: Key Drivers shows themes with impact and trend badges
Given a key_drivers section with themes
When rendered in PDF
Then each theme shows name, narrative text, impact badge, and trend indicator
And high impact is green, medium is amber, low is gray
And trend up shows ↑, down shows ↓, neutral shows →

### Scenario: Key Drivers shows overall theme count
Given key_drivers with 5 themes
When rendered
Then it shows the number of themes analyzed

### Scenario: Competitive Analysis shows peer market table
Given competitive_market_analysis with comparisons
When rendered
Then each peer market shows in a card
And cards show market name, median price, and advantage text

### Scenario: Competitive Analysis shows narrative summary
Given competitive_market_analysis with a narrative
When rendered
Then the narrative text appears before the comparison cards

### Scenario: Polished report section renders methodology and pull quotes
Given a polished_report section with pullQuotes and methodology
When rendered
Then it shows pull quotes in styled blocks
And it shows methodology text

### Scenario: Methodology section renders data sources
Given a methodology section with content
When rendered
Then it shows methodology text content

### Scenario: Peer rankings hidden when only one market
Given competitive_market_analysis with peerRankings where totalMarkets <= 1
When rendered
Then the "Market Rankings" section is not shown
And peer comparison cards still render normally

## Learnings

(To be filled after implementation)
