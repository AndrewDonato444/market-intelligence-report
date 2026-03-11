---
feature: Pipeline Re-trigger
domain: admin
source: app/api/admin/reports/[id]/retry/route.ts
tests:
  - __tests__/admin/pipeline-retrigger-api.test.ts
components:
  - ErrorTriageDashboard
  - ReportDetailPanel
personas:
  - primary
  - anti-persona
status: implemented
created: 2026-03-11
updated: 2026-03-11
---

# Pipeline Re-trigger

**Source Files**: `app/api/admin/reports/[id]/retry/route.ts`, `components/admin/error-triage-dashboard.tsx`, `components/admin/report-detail-panel.tsx`
**Design System**: .specs/design-system/tokens.md

## Feature: Admin Pipeline Re-trigger (#124)

Admin can re-run a failed report's pipeline (full re-run), with audit trail.
Depends on #123 (Error Triage View) and #80 (Pipeline Execution Service).

### Scenario: Admin triggers full pipeline re-run from report detail page
Given an admin is viewing a failed report's detail page
When the admin clicks "Re-run Pipeline"
Then a confirmation dialog appears showing the report title and last error
When the admin confirms
Then the report status resets to "queued"
And retriedAt and retriedBy are recorded
And the pipeline executor is triggered asynchronously
And an activity log entry is created for the retry action

### Scenario: Admin triggers re-run from error triage dashboard
Given an admin is viewing the error triage dashboard
When the admin expands a failed report row and clicks "Re-run Pipeline"
Then the same confirmation + retry flow executes
And the error triage list refreshes to show updated status

### Scenario: Re-run not available for non-failed reports
Given a report with status "completed" or "generating" or "queued"
When the admin views the report detail
Then no "Re-run Pipeline" button is shown

### Scenario: Retry preserves error history
Given a report that has failed and been retried before
When the admin triggers another re-run
Then previous errors are accumulated in the previousErrors array
And the audit trail shows all retry timestamps

### Scenario: Concurrent retry prevention
Given a report is already queued or generating
When an admin attempts to trigger a retry
Then the API returns 409 Conflict
And no duplicate pipeline execution starts

### Scenario: Retry API requires admin authentication
Given a non-admin user
When they call POST /api/admin/reports/[id]/retry
Then the API returns 401 Unauthorized

## User Journey

1. Admin sees failed reports in Error Triage (#123) or Report Detail (#122)
2. **Admin triggers pipeline re-run**
3. Report returns to queued -> generating -> completed/failed

## API Design

### POST /api/admin/reports/[id]/retry

**Request**: No body required
**Auth**: Admin only (via requireAdmin())

**Response 200**: { success, reportId, status, retriedAt, retriedBy }
**Response 401**: Unauthorized
**Response 404**: Report not found
**Response 409**: Report is not in a retryable state (not failed)

## Component References

- ErrorTriageDashboard: components/admin/error-triage-dashboard.tsx
- ReportDetailPanel: components/admin/report-detail-panel.tsx
