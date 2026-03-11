---
feature: Analytics Data Export
domain: admin
source: lib/utils/analytics-export.ts, components/admin/export-button.tsx
tests:
  - __tests__/admin/analytics-export.test.ts
  - __tests__/admin/analytics-export-button.test.tsx
components:
  - ExportButton
personas:
  - internal-admin
status: implemented
created: 2026-03-11
updated: 2026-03-11
---

# Analytics Data Export

**Source File**: `app/api/admin/analytics/export/route.ts`
**Design System**: `.specs/design-system/tokens.md`
**Depends On**: Analytics API Endpoints (#130)

## Feature: Analytics Data Export

Admin can export data from any analytics view (volume, geographic, users, performance) as CSV or JSON for external analysis in spreadsheets or BI tools.

### Scenario: Admin exports volume data as CSV
Given an admin user is on the Volume Metrics dashboard
When they click the "Export CSV" button
Then a CSV file downloads containing the volume time series data
And the filename includes the view name and current date (e.g., `volume-metrics-2026-03-11.csv`)
And the CSV includes headers: date, total, completed, failed

### Scenario: Admin exports volume data as JSON
Given an admin user is on the Volume Metrics dashboard
When they click the "Export JSON" button
Then a JSON file downloads containing the full API response
And the filename includes the view name and current date

### Scenario: Admin exports geographic data as CSV
Given an admin user is on the Geographic Analytics dashboard
When they click "Export CSV"
Then a CSV file downloads with columns: state, city, count, percentage

### Scenario: Admin exports user analytics as CSV
Given an admin user is on the User Analytics dashboard
When they click "Export CSV"
Then a CSV file downloads with signup time series AND a separate section for power users

### Scenario: Admin exports performance data as CSV
Given an admin user is on the Pipeline Performance dashboard
When they click "Export CSV"
Then a CSV file downloads with generation time series AND cost breakdown

### Scenario: Export API validates format parameter
Given an admin user calls the export endpoint
When they provide an invalid format (not csv or json)
Then the API returns 400 with an error message

### Scenario: Export API requires admin authentication
Given a non-admin user
When they call the export endpoint
Then the API returns 401 Unauthorized

## User Journey

1. Admin navigates to any analytics dashboard tab
2. **Clicks Export CSV or Export JSON button**
3. Browser downloads the file automatically
4. Admin opens file in Excel, Google Sheets, or BI tool

## UI Mockup

```
┌─────────────────────────────────────────────────────────────┐
│ Volume Metrics                          [Export ▾] [Refresh]│
│ Report generation trends and volume metrics                 │
├─────────────────────────────────────────────────────────────┤
│                                         ┌──────────────┐    │
│                                         │ Export CSV    │    │
│                                         │ Export JSON   │    │
│                                         └──────────────┘    │
│  (existing dashboard content unchanged)                     │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Approach

**Server-side**: Single `GET /api/admin/analytics/export` endpoint that:
- Accepts `view` param (volume, geographic, users, performance)
- Accepts `format` param (csv, json)
- Accepts the same period/granularity params as existing endpoints
- Calls the same DB queries as existing analytics endpoints
- Returns appropriate Content-Type and Content-Disposition headers

**Client-side**: Reusable `ExportButton` component added to each dashboard header that:
- Shows a dropdown with CSV and JSON options
- Triggers a fetch to the export endpoint
- Creates a blob download link

## Component References

- ExportButton: new shared component for analytics dashboards
