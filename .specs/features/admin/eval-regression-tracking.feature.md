---
feature: Eval Regression Tracking
domain: admin
source: app/admin/eval/report/page.tsx, components/eval/report-eval-dashboard.tsx, lib/eval/report-eval/history.ts
tests:
  - __tests__/eval/eval-regression-tracking.test.ts
components:
  - ReportEvalDashboard
  - ReportEvalTrendPanel
personas:
  - internal-developer
  - team-leader
status: implemented
created: 2026-03-11
updated: 2026-03-11
---

# Eval Regression Tracking

**Source Files**: `lib/eval/report-eval/history.ts`, `app/api/eval/report/history/route.ts`, `components/eval/report-eval-trend-panel.tsx`
**Design System**: .specs/design-system/tokens.md
**Depends On**: Report Eval Runner (#141), Report Eval Dashboard (#142)

## Feature: Eval Regression Tracking

Store report eval scores over time in the database, display quality trend charts, and surface regression alerts when scores degrade.

### Scenario: Eval results are persisted to database after each run
Given an admin runs a report eval test case via the dashboard
When the eval completes successfully
Then the result is saved to the report_eval_results DB table
And the result is also kept in localStorage for immediate UI use

### Scenario: Batch run results are persisted
Given an admin runs all 18 test cases via Run All
When each test case completes
Then each result is individually persisted to the database (append-only history)

### Scenario: Admin views the trend panel
Given at least 2 eval runs have been persisted
When the admin views the Report Eval Dashboard
Then a Quality Trends panel appears with a line chart of average score over time

### Scenario: Trend panel shows per-criterion lines
Given historical eval data exists for multiple runs
When the admin views the trend panel
Then 6 colored lines appear (one per criterion) with a legend

### Scenario: Regression alert surfaces when scores drop
Given the most recent run avg is 3.2 and previous was 4.1
When the admin views the dashboard
Then a regression alert banner appears with error styling

### Scenario: No regression alert when scores stable
Given the most recent run avg is 4.3 and previous was 4.1
Then no regression alert banner appears

### Scenario: Empty history state
Given no eval results exist in the database
Then the trend panel shows an empty state message

### Scenario: History API requires admin auth
Given a non-admin user
When they call GET or POST to /api/eval/report/history
Then they receive a 403 Forbidden response

## Technical Notes
- DB table: report_eval_results (id, runId, testCaseId, criterion, score, breakdown JSONB, judgeReason TEXT, durationMs INTEGER, error TEXT, createdAt)
- runId groups results from the same batch run
- `saveEvalResult` persists a single result; `saveBatchResults` persists an array in one INSERT
- Trend chart uses simple SVG line chart with 6 criterion lines
- Regression detection: alert if drop > 0.5 (strictly) between latest two runs
- History API GET returns max 90 days by default (configurable 1–365 via `?days=` param)
- History API POST saves a single result; 422 if required fields missing
