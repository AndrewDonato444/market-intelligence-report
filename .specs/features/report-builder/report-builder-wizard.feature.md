---
feature: Report Builder Wizard
domain: report-builder
source: components/reports/report-wizard.tsx
tests:
  - __tests__/reports/report-wizard.test.tsx
  - __tests__/reports/report-service.test.ts
components:
  - ReportWizard
  - StepIndicator
personas:
  - primary
status: implemented
created: 2026-03-09
updated: 2026-03-09
---

# Report Builder Wizard

**Source Files**: `components/reports/report-wizard.tsx`, `lib/services/report.ts`, `app/api/reports/route.ts`
**Design System**: `.specs/design-system/tokens.md`

## Feature: Report Builder Wizard

Guided 3-step wizard that takes agents from "I want a report" to "generating now." Collects market selection, section preferences, and report title before creating a report record and redirecting to the reports list.

### Scenario: Select a market for the report
Given the agent has at least one configured market
When they open the Report Builder
Then they see a list of their markets to choose from
And each market shows name, city/state, and luxury tier
And the default market is pre-selected

### Scenario: Choose report sections
Given the agent has selected a market
When they advance to the Sections step
Then all 8 section types are shown with descriptions
And required sections (market_overview, executive_summary, key_drivers) are pre-checked and cannot be unchecked
And optional sections (competitive_market_analysis, forecasts, strategic_summary, polished_report, methodology) are pre-checked but can be unchecked
And competitive_market_analysis shows a note if the market has no peer markets configured

### Scenario: Review and create the report
Given sections have been selected
When the agent advances to the Review step
Then they see a summary: market name, selected sections count, report title
And the report title defaults to "{market name} Intelligence Report"
And they can edit the title
And clicking "Generate Report" creates the report and redirects to /reports

### Scenario: Validate market selection
Given no market is selected
When the agent clicks Next
Then an error appears: "Select a market to continue"

### Scenario: Handle no markets available
Given the agent has no configured markets
When they open the Report Builder
Then they see a message directing them to create a market first
And a link to /markets/new

### Scenario: API creates report record
Given valid report configuration
When POST /api/reports is called
Then a report record is created with status "queued"
And the config JSONB stores selected sections
And the response includes the report ID

### Scenario: API lists user reports
Given the agent has created reports
When GET /api/reports is called
Then it returns all reports for the authenticated user
And each report includes id, title, status, market name, createdAt

## Section Registry (for wizard display)

| Section Type | Label | Description | Required |
|-------------|-------|-------------|----------|
| market_overview | Market Overview | Strategic overview with key metrics and ratings | Yes |
| executive_summary | Executive Summary | High-level narrative with highlights and timing | Yes |
| key_drivers | Key Market Drivers | Thematic analysis of market forces | Yes |
| competitive_market_analysis | Competitive Analysis | Peer market comparisons and positioning | No |
| forecasts | Forecasts & Projections | 6/12-month projections with scenarios | No |
| strategic_summary | Strategic Summary | Timing guidance and outlook | No |
| polished_report | Editorial Polish | Consistency check and pull quotes | No |
| methodology | Methodology | Data sources and confidence levels | No |

## User Journey

1. Agent navigates to /reports/new (from sidebar or reports list)
2. **Step 1: Select Market** — pick from configured markets
3. **Step 2: Sections** — choose which sections to include
4. **Step 3: Review** — confirm title and generate
5. Redirected to /reports with new report in "queued" status

## Learnings

- Reuse `StepIndicator` from markets — no need to duplicate wizard infrastructure
- `getReports` joins markets table to include market name in list results
- Required sections use `disabled` checkbox pattern — visually locked but always included
- Empty state (no markets) shows a clear CTA linking to /markets/new
