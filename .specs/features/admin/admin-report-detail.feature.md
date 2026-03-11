---
feature: Admin Report Detail
domain: admin
source: app/admin/reports/[id]/page.tsx, components/admin/report-detail-panel.tsx, app/api/admin/reports/[id]/route.ts
tests:
  - __tests__/admin/report-detail-panel.test.tsx
  - __tests__/admin/admin-report-detail-api.test.ts
components:
  - ReportDetailPanel
personas:
  - internal-admin
status: implemented
created: 2026-03-11
updated: 2026-03-11
---

# Admin Report Detail

**Source Files**: `app/admin/reports/[id]/page.tsx`, `components/admin/report-detail-panel.tsx`, `app/api/admin/reports/[id]/route.ts`
**Design System**: `.specs/design-system/tokens.md`
**Depends On**: Admin Report List (#121), Pipeline Execution Service (#80)

## Feature: Admin Report Detail

Full report detail view at `/admin/reports/[id]`. Shows report metadata, agent execution breakdown (which agents ran, timing, cache hits, API costs), section list, error details for failed reports, and user/market context.

### Scenario: Admin views a completed report detail
Given an admin user is signed in
And a report with status "completed" exists
When they navigate to `/admin/reports/[id]`
Then they see the report title, status badge, and creation date
And they see the agent (user) name, company, and market name
And they see generation timing: started at, completed at, total duration
And they see a list of report sections with agent name and generation timestamp

### Scenario: Admin views API cost breakdown
Given the admin is on a report detail page
Then they see an "API Usage" section with provider, endpoint, cost, response time, cached status
And they see a total cost summary

### Scenario: Admin views a failed report detail
Given a report with status "failed" exists with errorDetails
When the admin navigates to `/admin/reports/[id]`
Then they see the error details: failing agent name, error message, occurred at
And if a stack trace exists, it is shown in a collapsible section

### Scenario: Report not found
Given the admin navigates to `/admin/reports/[nonexistent-id]`
Then they see a "Report not found" message with a link back to the registry

### Scenario: Non-admin user is rejected
Given a user with role "user" navigates to `/admin/reports/[id]`
Then they are redirected to `/dashboard`

## API Endpoint

`GET /api/admin/reports/[id]`

## Data Sources

- **Reports table**: Core report data, status, timing, error details
- **Report Sections table**: Sections generated, by which agent, when
- **API Usage table**: Per-call cost, provider, timing, cache status
- **Users table**: Agent name, company, email
- **Markets table**: Market name, geography, tier, price floor
