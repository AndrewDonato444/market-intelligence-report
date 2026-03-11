---
feature: Error Triage View
domain: admin
source: app/admin/error-triage/page.tsx, components/admin/error-triage-dashboard.tsx, app/api/admin/reports/errors/route.ts
tests:
  - __tests__/admin/error-triage-api.test.ts
  - __tests__/admin/error-triage-dashboard.test.tsx
components:
  - ErrorTriageDashboard
personas:
  - internal-admin
status: implemented
created: 2026-03-11
updated: 2026-03-11
---

# Error Triage View

**Source Files**: `app/admin/error-triage/page.tsx`, `components/admin/error-triage-dashboard.tsx`, `app/api/admin/reports/errors/route.ts`
**Design System**: `.specs/design-system/tokens.md`
**Depends On**: Report Error Tracking Schema (#120), Admin Report List (#121)

## Feature: Error Triage View

Dedicated filtered view of failed/errored reports with rich error details, agent failure info, and input data.

### Scenario: Admin views the error triage page
Given an admin user is signed in
When they navigate to `/admin/error-triage`
Then they see a page titled "Error Triage" with subtitle "Failed reports requiring attention"
And they see summary cards showing: Total Errors, Errors Today, Most Failing Agent, Retry Rate

### Scenario: Admin sees failed reports with error details
Given there are failed reports on the platform
When the admin views the error triage page
Then they see a table of failed reports with columns: Title, Agent, Failing Agent, Error, Failed At, Retried
And reports are sorted by most recently failed first

### Scenario: Admin filters by failing pipeline agent
Given the admin is on the error triage page
When they select a pipeline agent from the "Failing Agent" dropdown
Then the table shows only reports that failed at that agent

### Scenario: Admin filters by date range
Given the admin is on the error triage page
When they select "Last 7 days" from the date range filter
Then the table shows only reports that failed within the last 7 days

### Scenario: Admin searches failed reports
Given the admin is on the error triage page
When they type a search term
Then after a 300ms debounce the table filters matching reports

### Scenario: Admin expands error details inline
Given the admin sees a failed report row
When they click the expand toggle on the row
Then they see full error message, stack trace, stage info, previous errors

### Scenario: Admin clicks through to report detail
Given the admin sees a failed report
When they click "View Report"
Then they navigate to `/admin/reports/[id]`

### Scenario: Non-admin user is rejected
Given a user with role "user" navigates to `/admin/error-triage`
Then they are redirected to `/dashboard`

### Scenario: Empty state
Given there are no failed reports
Then the admin sees "No failed reports" message

### Scenario: Pagination
Given there are more than 20 failed reports
Then the admin sees pagination controls

## API Endpoint

`GET /api/admin/reports/errors` - Returns failed reports with full error details and aggregate summary.
