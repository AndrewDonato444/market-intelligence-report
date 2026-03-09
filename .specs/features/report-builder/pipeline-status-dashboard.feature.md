---
feature: Pipeline Status Dashboard
domain: report-builder
source: app/(protected)/reports/[id]/page.tsx
tests:
  - __tests__/reports/pipeline-status.test.tsx
components:
  - PipelineStatusDashboard
personas:
  - primary
status: implemented
created: 2026-03-09
updated: 2026-03-09
---

# Pipeline Status Dashboard

**Source Files**: `app/(protected)/reports/[id]/page.tsx`, `components/reports/pipeline-status.tsx`, `app/api/reports/[id]/status/route.ts`
**Design System**: `.specs/design-system/tokens.md`

## Feature: Pipeline Status Dashboard

Real-time dashboard showing agent pipeline progress during report generation. Shows which agents are running, completed, or failed, with a progress bar and event timeline.

### Scenario: Display report generation progress
Given a report is in "generating" status
When the agent views the report detail page
Then they see a progress bar showing percent complete
And they see the list of pipeline agents with their status (pending, running, completed, failed)
And completed agents show their duration
And currently running agents show an animated indicator

### Scenario: Display report queued state
Given a report is in "queued" status
When the agent views the report detail page
Then they see a message that the report is waiting to begin generation
And the progress bar shows 0%

### Scenario: Display completed report
Given a report is in "completed" status
When the agent views the report detail page
Then they see a success message with total generation time
And all agents show as completed with their durations
And the progress bar shows 100%

### Scenario: Display failed report
Given a report is in "failed" status
When the agent views the report detail page
Then they see an error message with the failure reason
And the failed agent is highlighted
And a "Retry" option is available

### Scenario: API returns report with status info
Given a report exists
When GET /api/reports/[id]/status is called
Then it returns the report record with status, title, config
And it includes the report's creation and completion timestamps

### Scenario: Report detail page loads report data
Given the agent navigates to /reports/[id]
When the page loads
Then it fetches the report record from the API
And displays the report title, market, and status
And shows the pipeline stage list

## Pipeline Stages (display order)

| Agent | Label | Description |
|-------|-------|-------------|
| data-analyst | Data Analysis | Segment metrics, ratings, YoY calculations |
| insight-generator | Insight Generation | Strategic narratives and market themes |
| competitive-analyst | Competitive Analysis | Peer market comparisons |
| forecast-modeler | Forecast Modeling | Projections and scenario analysis |
| polish-agent | Editorial Polish | Consistency, pull quotes, methodology |

## User Journey

1. Agent creates report via Report Builder Wizard
2. Redirected to /reports
3. Clicks on queued/generating report
4. **This page** — sees real-time pipeline progress
5. On completion, sees success state with link to view/download report

## Learnings

(To be filled after implementation)
