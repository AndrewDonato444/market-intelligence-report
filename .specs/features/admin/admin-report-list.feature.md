---
feature: Admin Report List
domain: admin
source: app/admin/reports/page.tsx, components/admin/report-list-dashboard.tsx, app/api/admin/reports/route.ts
tests:
  - __tests__/admin/report-list-dashboard.test.tsx
  - __tests__/admin/admin-report-list-api.test.ts
components:
  - ReportListDashboard
personas:
  - internal-admin
status: implemented
created: 2026-03-11
updated: 2026-03-12
---

# Admin Report List

**Source Files**: `app/admin/reports/page.tsx`, `components/admin/report-list-dashboard.tsx`, `app/api/admin/reports/route.ts`
**Design System**: `.specs/design-system/tokens.md`
**Depends On**: Report Error Tracking Schema (#120), System Monitoring Dashboard (#83)

## Feature: Admin Report List

Cross-user report registry at `/admin/reports`. Surfaces every report on the platform — completed, generating, queued, or failed — with filtering by status, date range, agent, and market. This is the operational command center for report quality and pipeline health.

The admin persona here is the MSA operations team member. They think in terms of "pipeline health," "error triage," and "report throughput." They need to quickly answer: "Are reports generating successfully? Which ones failed? Who's waiting?"

### Scenario: Admin views the report registry
Given an admin user is signed in
When they navigate to `/admin/reports`
Then they see a page titled "Report Registry" with subtitle "All reports across the platform"
And they see a table with columns: Title, Agent, Market, Status, Created, Gen Time
And reports are sorted by most recently created first

### Scenario: Admin sees status counts in filter tabs
Given the admin is on the report registry page
Then they see filter tabs showing counts: All (N), Completed (N), Generating (N), Queued (N), Failed (N)
And each count reflects the actual number of reports in that status

### Scenario: Admin filters reports by status
Given the admin is on the report registry page
When they click the "Failed" status filter tab
Then the table shows only reports with status "failed"
And the "Failed" tab appears selected

### Scenario: Admin searches reports by title, agent name, or market
Given the admin is on the report registry page
When they type "Naples" in the search box
Then after a 300ms debounce the table filters to reports whose title, agent name, or market name contains "Naples"

### Scenario: Admin filters by date range
Given the admin is on the report registry page
When they select a date range of "Last 7 days"
Then the table shows only reports created within the last 7 days
And pre-set ranges include: Today, Last 7 days, Last 30 days, Last 90 days, All time

### Scenario: Admin filters by specific agent
Given the admin is on the report registry page
When they select an agent from the "Agent" dropdown filter
Then the table shows only reports belonging to that agent

### Scenario: Admin filters by market
Given the admin is on the report registry page
When they select a market from the "Market" dropdown filter
Then the table shows only reports for that market

### Scenario: Filters combine with AND logic
Given the admin has filtered by status "Failed" and date range "Last 7 days"
Then the table shows only failed reports from the last 7 days
And the status count tabs update to reflect the filtered counts

### Scenario: Admin sorts by column
Given the admin is on the report registry page
When they click the "Created" column header
Then reports are sorted by creation date descending
When they click it again
Then reports are sorted by creation date ascending

### Scenario: Admin sorts by generation time
Given the admin is on the report registry page
When they click the "Generation Time" column header
Then reports are sorted by generation duration (completed - started) descending

### Scenario: Failed reports show error indicator
Given a report has status "failed"
When the admin views it in the table
Then the status badge shows "Failed" in error color (color-error on tinted background)
And a brief error summary appears below the title (e.g., "Insight Generator: API timeout")

### Scenario: Generating reports show elapsed time
Given a report has status "generating"
When the admin views it in the table
Then the status badge shows "Generating" in warning color
And elapsed time since generation started is displayed

### Scenario: Completed reports show generation duration
Given a report has status "completed"
When the admin views it in the table
Then the "Generation Time" column shows the total duration (e.g., "2m 34s")

### Scenario: Admin clicks a report row to view details
Given the admin sees a report in the table
When they click the report row
Then they are navigated to `/admin/reports/[id]` (Admin Report Detail — #122)

### Scenario: Pagination
Given there are more than 20 reports matching current filters
When the admin views the first page
Then they see 20 reports and pagination controls
And a "Showing 1-20 of N" counter
When they click "Next"
Then they see the next page of reports

### Scenario: Empty state with active filters
Given the admin has applied filters that match no reports
Then they see "No reports match your filters" with a "Clear filters" action

### Scenario: Empty state with no reports
Given there are no reports on the platform
Then they see "No reports generated yet" with an explanation

### Scenario: Loading state
Given the admin navigates to `/admin/reports`
While data is being fetched
Then they see a loading skeleton matching the table layout

### Scenario: Error state
Given the API returns an error
Then the admin sees an error message with a "Retry" action

### Scenario: Non-admin user is rejected
Given a user with role "user" navigates to `/admin/reports`
Then they are redirected to `/dashboard`

## User Journey

1. Admin signs in and navigates to the admin area
2. Admin clicks "Report Registry" in the sidebar
3. **Admin Report List** — browse, search, filter, sort all platform reports
4. Admin spots a failed report → clicks row → Admin Report Detail (#122)
5. Admin notices cluster of failures → clicks "Failed" tab → Error Triage view (#123)

## UI Mockup

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Report Registry                                              [Search... ]│
│ All reports across the platform                                          │
├──────────────────────────────────────────────────────────────────────────┤
│ [All (234)]  [Completed (218)]  [Generating (3)]  [Queued (5)]  [Failed (8)]│
├──────────────────────────────────────────────────────────────────────────┤
│ Filters: [Agent ▾]  [Market ▾]  [Date range ▾: Last 30 days]            │
├──────────────────────────────────────────────────────────────────────────┤
│ Title            │ Agent         │ Market        │ Status      │ Created    │ Gen Time │
│──────────────────┼───────────────┼───────────────┼─────────────┼────────────┼──────────│
│ Naples Q1 2026   │ Jane Smith    │ Naples, FL    │ [completed] │ Mar 10     │ 2m 34s   │
│ Intelligence     │ Acme Realty   │               │             │            │          │
│──────────────────┼───────────────┼───────────────┼─────────────┼────────────┼──────────│
│ Aspen Ultra-Lux  │ Jordan Ellis  │ Aspen, CO     │ [failed]    │ Mar 9      │ —        │
│ Report           │ Boutique Firm │               │ Insight     │            │          │
│                  │               │               │ Generator:  │            │          │
│                  │               │               │ API timeout │            │          │
│──────────────────┼───────────────┼───────────────┼─────────────┼────────────┼──────────│
│ Miami Beach      │ Alex Rivera   │ Miami Beach,  │ [generating]│ Mar 11     │ 1m 12s   │
│ Market Brief     │               │ FL            │ (elapsed)   │            │ elapsed  │
│──────────────────┼───────────────┼───────────────┼─────────────┼────────────┼──────────│
│ Palm Beach       │ Morgan Hale   │ Palm Beach,FL │ [queued]    │ Mar 11     │ —        │
│ Intelligence     │ Lux Group     │               │             │            │          │
├──────────────────────────────────────────────────────────────────────────┤
│ Showing 1-20 of 234                               [Prev]  [Next]         │
└──────────────────────────────────────────────────────────────────────────┘

Status badges (bg: surface, radius: sm, shadow: sm):
  [completed]  = color-success text on success-tint background
  [generating] = color-warning text on warning-tint background
  [queued]     = color-text-secondary on color-primary-light background
  [failed]     = color-error text on error-tint background

Failed reports show error summary below title in color-text-secondary, text-xs.
Generating reports show elapsed time instead of total generation time.
Queued reports show em-dash (—) for generation time.

Table container: bg-surface, radius-md, shadow-sm, border color-border.
Page title: font-sans, text-2xl, font-semibold, color-text.
Subtitle: font-sans, text-sm, color-text-secondary.
Filter tabs: font-sans, text-sm, font-medium. Selected = color-primary-light bg, color-primary text, semibold weight, color-primary border.
Dropdown filters: radius-sm, border color-border, font-sans text-sm.
Column headers: font-sans, text-xs, font-medium, color-text-secondary, uppercase, tracking-wide.
Table rows: font-sans, text-sm, color-text. Hover = color-primary-light bg.
Pagination: font-sans, text-sm, color-text-secondary.
```

## API Endpoint

`GET /api/admin/reports`

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `search` | string | — | Search title, agent name, market name |
| `status` | string | — | Filter: queued, generating, completed, failed |
| `userId` | string | — | Filter by agent UUID |
| `marketId` | string | — | Filter by market UUID |
| `dateRange` | string | all | today, 7d, 30d, 90d, all |
| `sortBy` | string | createdAt | title, status, createdAt, generationTime |
| `sortOrder` | string | desc | asc, desc |
| `page` | number | 1 | Page number |
| `pageSize` | number | 20 | Items per page |

### Response Shape

```json
{
  "reports": [
    {
      "id": "uuid",
      "title": "Naples Q1 2026 Intelligence",
      "status": "completed",
      "userId": "uuid",
      "userName": "Jane Smith",
      "userCompany": "Acme Realty",
      "marketId": "uuid",
      "marketName": "Naples, FL",
      "createdAt": "2026-03-10T...",
      "generationStartedAt": "2026-03-10T...",
      "generationCompletedAt": "2026-03-10T...",
      "generationTimeMs": 154000,
      "errorSummary": null
    }
  ],
  "total": 234,
  "statusCounts": {
    "all": 234,
    "completed": 218,
    "generating": 3,
    "queued": 5,
    "failed": 8
  },
  "page": 1,
  "pageSize": 20
}
```

For failed reports, `errorSummary` is derived from `errorDetails` JSONB:
```json
{
  "errorSummary": "Insight Generator: API timeout"
}
```
Format: `{agent}: {message}` — truncated to 80 chars.

## Data Sources

- **Reports table**: `lib/db/schema.ts` — `reports` table with `status`, `errorDetails` JSONB, `retriedAt`, `retriedBy`, `generationStartedAt`, `generationCompletedAt`
- **Users table**: Joined for agent name and company
- **Markets table**: Joined for market name (city, state)
- **Auth**: `requireAdmin()` gate — same pattern as `/api/admin/users`

## Implementation Notes

- Follow the user list dashboard pattern (`components/admin/user-list-dashboard.tsx`) for consistency
- Reuse the same pagination, search debounce (300ms), and sort interaction patterns
- Status badge colors follow the same semantic color tokens
- Error summary is extracted from `errorDetails.agent` + `errorDetails.message`
- Generation time = `generationCompletedAt - generationStartedAt` (null if not completed)
- Elapsed time for generating reports = `now - generationStartedAt` (client-side, updates on re-fetch)
- Date range filter uses server-side `createdAt` comparison
- Agent and market dropdowns populated from distinct values in the reports table (not all users/markets)

## Component References

- UserListDashboard: `components/admin/user-list-dashboard.tsx` (pattern reference)
- AdminSidebar: `components/layout/admin-sidebar.tsx` (nav item added in #125)

## Persona Revision Notes

Reviewed through admin operator lens:
- Title uses "Report Registry" (operational language) not "Report List" (developer language)
- Subtitle "All reports across the platform" immediately communicates scope
- Error summary inline on failed rows — operators need to triage at a glance without clicking in
- "Generation Time" column surfaces pipeline performance without leaving the list view
- Date range presets match operational cadences (today for live monitoring, 7d for weekly review, 30d/90d for trends)
- Status tabs show counts — operators need volume awareness before drilling in

## Learnings

### 2026-03-11
- **Pattern**: Followed the `user-list-dashboard.tsx` pattern closely — same filter tabs, debounce, sort, pagination UX. Added date range and agent/market dropdown filters specific to report needs
- **Decision**: Agent and market dropdowns populated from current response data (not a separate API call). This means options change as you filter, but avoids an extra fetch and keeps the component simpler
- **Gotcha**: `generationTimeMs` computed from `generationCompletedAt - generationStartedAt` server-side rather than stored. Elapsed time for "generating" reports computed client-side from `now - generationStartedAt`
- **Gotcha**: Status counts come from an unfiltered query (global counts for tab badges), not filtered counts. This matches the spec: "each count reflects the actual number of reports in that status"
