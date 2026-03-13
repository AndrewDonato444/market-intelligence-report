---
feature: Cover Page Redesign
domain: report-output-v2
source: lib/pdf/templates/cover-page.tsx
tests:
  - __tests__/pdf/cover-page-redesign.test.tsx
components:
  - CoverPage
personas:
  - established-practitioner
  - report-reader
status: implemented
created: 2026-03-12
updated: 2026-03-13
---

# Cover Page Redesign

**Source Files**: `lib/pdf/templates/cover-page.tsx`, `lib/pdf/document.tsx`, `lib/agents/report-assembler.ts`, `lib/pdf/styles.ts`

## Feature: Cover Page Redesign

Redesign the PDF report cover page with three improvements:
1. **Naming convention** - standardized report title format
2. **Key Themes on cover** - compact summary of key themes from the Narrative section
3. **Rating/data chip legend** - defines what rating chips and data indicators mean

## Scenario: Title naming convention generates standardized title

Given a market with city "Naples", state "FL", tier "Luxury"
And the report is generated in March 2026
When the system auto-generates a report title
Then the title follows the format "{City} {Tier} Market Intelligence - Q1 2026"
And the title is editable by the user before generation

## Scenario: Title naming convention uses correct quarter

Given a report generated in January 2026
Then the quarter is "Q1 2026"
Given a report generated in April 2026
Then the quarter is "Q2 2026"
Given a report generated in July 2026
Then the quarter is "Q3 2026"
Given a report generated in October 2026
Then the quarter is "Q4 2026"

## Scenario: Title falls back gracefully when tier is missing

Given a market with city "Naples" and no explicit tier label
When the system auto-generates a report title
Then the title uses "Luxury" as the default tier

## Scenario: Key Themes summary appears on cover page

Given a generated report with key themes from the insight-generator agent
When the PDF cover page renders
Then the cover page displays up to 3 key theme names below the market name
And each theme shows its impact level as a colored dot
And each theme shows its trend direction arrow

## Scenario: Cover page handles missing themes gracefully

Given a generated report where the insight-generator produced no themes
When the PDF cover page renders
Then the cover page renders without the Key Themes section

## Scenario: Rating chip legend appears on cover page

Given a PDF report with rating chips and data indicators
When the cover page renders
Then a How to Read This Report section appears at the bottom
And it defines market ratings: A = Strong, B = Stable, C = Watch
And it defines impact levels and trend arrows

## Scenario: Cover page maintains existing branding

Given an agent with custom brand colors logo and contact info
When the cover page renders with the redesign
Then all existing branding elements remain intact

## Implementation Notes

1. Title utility: Create generateReportTitle(city, tier, date) in lib/utils/report-title.ts
2. Cover page props: Add keyThemes to CoverPageProps
3. Document assembly: Pass themes from reportData.sections (the_narrative) to cover page
4. Styles: Add new styles for theme chips and legend in styles.ts
5. Backward compatible: Existing reports without themes still render correctly
