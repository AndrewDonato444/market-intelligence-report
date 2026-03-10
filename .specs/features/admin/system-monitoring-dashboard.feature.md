---
feature: System Monitoring Dashboard
domain: admin
source: app/admin/monitoring/page.tsx, components/admin/system-monitoring-dashboard.tsx, app/api/admin/monitoring/route.ts
tests:
  - __tests__/admin/system-monitoring-dashboard.test.tsx
components:
  - SystemMonitoringDashboard
personas:
  - internal-developer
status: implemented
created: 2026-03-10
updated: 2026-03-10
---

# System Monitoring Dashboard

**Source Files**: `app/admin/monitoring/page.tsx`, `components/admin/system-monitoring-dashboard.tsx`, `app/api/admin/monitoring/route.ts`
**Design System**: `.specs/design-system/tokens.md`
**Depends On**: API Cost Tracking (#23), Pipeline Execution (#80), Cache Layer (#20), Data Source Registry (#81)

## Feature: System Monitoring Dashboard

A unified admin view showing cache statistics, API cost aggregates, and pipeline health metrics across all users at `/admin/monitoring`.

### Scenario: Admin views system monitoring dashboard
Given an admin user is signed in
When they navigate to `/admin/monitoring`
Then they see summary cards labeled "API Calls", "Total Cost", "Cache Hit Rate", "Pipeline Success"

### Scenario: Admin refreshes dashboard data
Given the dashboard is loaded
When they click the "Refresh" button
Then the monitoring data is re-fetched for the current period

### Scenario: Dashboard shows loading state
Given the admin navigates to `/admin/monitoring`
While data is being fetched
Then they see a loading spinner and "Loading monitoring data..." message

### Scenario: Dashboard shows error state
Given the monitoring API returns an error
Then the admin sees an error message with the failure details

### Scenario: Admin filters by time period
Given an admin is on the monitoring dashboard
When they select a time period (24h, 7d, 30d)
Then all metrics refresh to show data from that period only

### Scenario: API cost breakdown by provider
Given the dashboard is loaded
Then the admin sees a provider breakdown table with call count, cost, cache hits, avg response time

### Scenario: Cache health section
Given the dashboard is loaded
Then the admin sees cache entries by source, expiring soon count, and expired count

### Scenario: Pipeline health section
Given the dashboard is loaded
Then the admin sees total runs by status, average duration, and recent failures

### Scenario: Data source status
Given the dashboard is loaded
Then the admin sees each data source health status and can trigger health checks

### Scenario: Admin triggers health check
Given the dashboard is loaded
When the admin clicks "Check All"
Then a POST request is sent to `/api/admin/monitoring` with `{ action: "health-check" }`
And the data source statuses update with fresh results

### Scenario: Non-admin user is rejected
Given a user with role 'user' navigates to `/admin/monitoring`
Then they are redirected to `/dashboard`
