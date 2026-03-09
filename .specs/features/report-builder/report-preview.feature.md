---
feature: Report Preview
domain: report-builder
source: components/reports/report-preview.tsx
tests:
  - __tests__/reports/report-preview.test.tsx
components:
  - ReportPreview
  - SectionRenderer
personas:
  - primary
status: implemented
created: 2026-03-09
updated: 2026-03-09
---

# Report Preview

**Source Files**: `components/reports/report-preview.tsx`, `app/api/reports/[id]/sections/route.ts`
**Design System**: `.specs/design-system/tokens.md`

## Feature: Report Preview

Renders completed report sections as a structured preview. Shows assembled sections from the agent pipeline in report order, with formatted content for each section type. Displays on the report detail page when the report is completed.

### Scenario: Display completed report sections
Given a report has status "completed"
And report sections have been stored in the database
When the report detail page loads
Then each section is rendered in report order
And each section shows its title and formatted content

### Scenario: Render market overview section
Given the market_overview section exists
When it is rendered
Then it shows the narrative text
And it shows highlights as a list
And it shows recommendations as a list

### Scenario: Render key drivers section
Given the key_drivers section exists
When it is rendered
Then it shows each theme with name, impact level, and trend direction
And it shows the theme narrative

### Scenario: Render forecasts section
Given the forecasts section exists
When it is rendered
Then it shows projections for each segment
And it shows base/bull/bear scenarios

### Scenario: Handle empty sections gracefully
Given a report is completed but has no stored sections
When the preview loads
Then it shows a message that sections are being assembled

### Scenario: API returns report sections
Given a completed report exists
When GET /api/reports/[id]/sections is called
Then it returns all report sections ordered by sortOrder
And each section includes sectionType, title, and content

### Scenario: Show preview only when completed
Given a report is in "queued" or "generating" status
When the report detail page loads
Then the preview section is not shown
And only the pipeline status dashboard is visible

## Section Display Order

Follows SECTION_REGISTRY from lib/agents/schema.ts:
1. market_overview
2. executive_summary
3. key_drivers
4. competitive_market_analysis
5. forecasts
6. strategic_summary
7. polished_report
8. methodology

## Learnings

(To be filled after implementation)
