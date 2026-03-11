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

**Source Files**: `lib/utils/analytics-export.ts`, `components/admin/export-button.tsx`
**Design System**: `.specs/design-system/tokens.md`
**Depends On**: Analytics API Endpoints (#130)

## Feature: Analytics Data Export

Admin can export data from any analytics view (volume, geographic, users, performance) as CSV or JSON for external analysis in spreadsheets or BI tools.

All export is client-side: dashboards fetch their existing analytics endpoints and convert the response data locally using `exportCsv`, `exportMultiSectionCsv`, or `exportJson` from `lib/utils/analytics-export.ts`.

### Scenario: Admin exports volume data as CSV
Given an admin user is on the Volume Metrics dashboard
When they click the "Export" button and select "Export CSV"
Then a CSV file downloads containing the volume time series data
And the filename is `volume-metrics-{date}.csv`
And the CSV includes headers: date, total, completed, failed

### Scenario: Admin exports volume data as JSON
Given an admin user is on the Volume Metrics dashboard
When they click the "Export" button and select "Export JSON"
Then a JSON file downloads containing the overview and volume API response combined
And the filename is `volume-metrics-{date}.json`

### Scenario: Admin exports geographic data as CSV
Given an admin user is on the Geographic Analytics dashboard
When they click "Export" and select "Export CSV"
Then a multi-section CSV file downloads with two sections:
  - Section "By State" with headers: state, count, percentage
  - Section "By City" with headers: city, state, count, percentage

### Scenario: Admin exports user analytics as CSV
Given an admin user is on the User Analytics dashboard
When they click "Export" and select "Export CSV"
Then a multi-section CSV file downloads with three sections:
  - Section "Signups Over Time" with headers: date, count
  - Section "Power Users" with headers: name, email, reportCount, lastReportDate
  - Section "Churn Risk" with headers: name, email, lastReportDate, daysSinceLastReport

### Scenario: Admin exports performance data as CSV
Given an admin user is on the Pipeline Performance dashboard
When they click "Export" and select "Export CSV"
Then a multi-section CSV file downloads with three sections:
  - Section "Generation Time Series" with headers: date, avgSeconds, count
  - Section "Cost By Provider" with headers: provider, requests, totalCost, avgCostPerRequest
  - Section "Errors By Agent" with headers: agent, count

### Scenario: Export button is disabled while loading
Given an admin user is on any analytics dashboard
When the dashboard is still loading data
Then the Export button is disabled
And becomes enabled once data has loaded

### Scenario: Export dropdown closes after selection
Given an admin user has opened the Export dropdown
When they click any export option (CSV or JSON)
Then the dropdown closes automatically

## User Journey

1. Admin navigates to any analytics dashboard tab
2. **Clicks the "Export" dropdown button in the dashboard header**
3. Selects "Export CSV" or "Export JSON" from the dropdown
4. Browser downloads the file automatically
5. Admin opens file in Excel, Google Sheets, or BI tool

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

**Client-side only**: No server-side export endpoint exists. Each dashboard handles export locally:

- Fetches data via its existing analytics API endpoint(s)
- On Export CSV click: calls `exportCsv` (single table) or `exportMultiSectionCsv` (multiple tables)
- On Export JSON click: calls `exportJson` with the full fetched data object
- All three functions from `lib/utils/analytics-export.ts` build a Blob, create a temporary `<a>` element, trigger a click, then revoke the URL

**Filename format**: `{view-name}-{YYYY-MM-DD}.csv` or `{view-name}-{YYYY-MM-DD}.json`
- volume: `volume-metrics-2026-03-11.csv`
- geographic: `geographic-analytics-2026-03-11.csv`
- users: `user-analytics-2026-03-11.csv`
- performance: `pipeline-performance-2026-03-11.csv`

**Multi-section CSV format**: Each section is separated by a blank line and preceded by a title line.

## Component References

- ExportButton: `components/admin/export-button.tsx` — dropdown with "Export CSV" and "Export JSON" options
- exportCsv: `lib/utils/analytics-export.ts` — single-table CSV download
- exportMultiSectionCsv: `lib/utils/analytics-export.ts` — multi-section CSV download
- exportJson: `lib/utils/analytics-export.ts` — JSON download
