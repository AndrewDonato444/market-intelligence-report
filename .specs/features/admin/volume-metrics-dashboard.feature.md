---
feature: Volume Metrics Dashboard
domain: admin
source: app/admin/analytics/page.tsx, components/admin/volume-metrics-dashboard.tsx
tests:
  - __tests__/admin/volume-metrics-dashboard.test.tsx
components:
  - VolumeMetricsDashboard
personas:
  - internal-admin
status: implemented
created: 2026-03-11
updated: 2026-03-12
---

# Volume Metrics Dashboard

**Source Files**: `app/admin/analytics/page.tsx`, `components/admin/volume-metrics-dashboard.tsx`
**Design System**: `.specs/design-system/tokens.md`
**Depends On**: Analytics API Endpoints (#130), Database Schema (#2)

## Feature: Volume Metrics Dashboard

Admin dashboard showing report generation volume over time. Displays KPI summary cards (total reports, completed, failed, error rate), a line chart of report volume by day/week/month, and controls for period and granularity. All data comes from the real `/api/admin/analytics` and `/api/admin/analytics/volume` endpoints.

### Scenario: Dashboard loads with overview KPI cards
Given an admin user navigates to `/admin/analytics`
When the page loads
Then the overview API is called to fetch summary data
And four KPI cards are displayed: total reports (all time), reports last 30d, error rate (last 30d), avg generation time (last 30d)

### Scenario: Volume chart loads with default period
Given an admin user is on the analytics dashboard
When the page loads
Then the volume API is called with `period=30d&granularity=daily`
And a line chart is rendered showing total, completed, and failed reports per day

### Scenario: Admin changes period
Given an admin user is on the analytics dashboard
When they click the "90d" period tab
Then the volume API is called with `period=90d` and the current granularity
And the chart updates with the new time series data

### Scenario: Admin changes granularity
Given an admin user is on the analytics dashboard
When they select "weekly" granularity
Then the volume API is called with `granularity=weekly` and the current period
And the chart updates with weekly-bucketed data

### Scenario: Empty state with no reports
Given the platform has no reports
When an admin loads the analytics dashboard
Then KPI cards show zero values
And the chart area shows an empty state message

### Scenario: Loading state
Given an admin navigates to the analytics dashboard
When data is being fetched
Then a loading spinner is displayed

### Scenario: Error state
Given the analytics API is unreachable
When an admin loads the dashboard
Then an error message is displayed with a retry option

### Scenario: Admin refreshes data manually
Given an admin user is on the analytics dashboard with data loaded
When they click the "Refresh" button
Then the overview and volume APIs are called again
And the dashboard updates with the latest data

### Scenario: Admin sidebar includes Analytics link
Given an admin is viewing any admin page
Then the sidebar includes an "Analytics" nav item linking to `/admin/analytics`

## User Journey

1. Admin clicks "Analytics" in the admin sidebar
2. **Volume Metrics Dashboard loads with KPI cards and chart**
3. Admin adjusts period/granularity to explore trends

## Component References

- Design tokens: `.specs/design-system/tokens.md`
- Pattern: follows SystemMonitoringDashboard layout (KPI cards + sections)
- APIs: `/api/admin/analytics` (overview), `/api/admin/analytics/volume` (time series)
