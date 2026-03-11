---
feature: Geographic Analytics
domain: admin
source: app/api/admin/analytics/geographic/route.ts, components/admin/geographic-analytics-dashboard.tsx
tests:
  - __tests__/admin/geographic-analytics.test.ts
components:
  - GeographicAnalyticsDashboard
personas:
  - internal-admin
status: implemented
created: 2026-03-11
updated: 2026-03-11
---

# Geographic Analytics

**Source Files**: `app/api/admin/analytics/geographic/route.ts`, `components/admin/geographic-analytics-dashboard.tsx`, `app/admin/analytics/geographic/page.tsx`
**Design System**: `.specs/design-system/tokens.md`
**Depends On**: Analytics API Endpoints (#130), Market Definition (#11)

## Feature: Geographic Analytics

Admin dashboard showing geographic distribution of reports across the platform. Displays reports aggregated by state and city, with ranked lists showing market concentration. Data comes from joining reports to markets to extract geography. Helps admin understand where demand is concentrated.

### Scenario: API returns geographic breakdown by state
Given an admin user calls GET /api/admin/analytics/geographic
When reports exist across multiple markets
Then the response includes a byState array with state name, report count, and percentage
And states are sorted by report count descending

### Scenario: API returns geographic breakdown by city
Given an admin user calls GET /api/admin/analytics/geographic
When reports exist across multiple markets
Then the response includes a byCity array with city, state, report count, and percentage
And cities are sorted by report count descending

### Scenario: API returns summary stats
Given an admin user calls GET /api/admin/analytics/geographic
Then the response includes summary with totalReports, uniqueStates, uniqueCities, and topState

### Scenario: API filters by period
Given an admin user calls GET /api/admin/analytics/geographic?period=90d
Then only reports created within the last 90 days are included in the aggregation

### Scenario: API returns 401 for non-admin
Given a non-admin user calls GET /api/admin/analytics/geographic
Then the response is 401 Unauthorized

### Scenario: API returns empty data gracefully
Given no reports exist on the platform
When an admin calls the geographic API
Then byState and byCity are empty arrays
And summary shows zero values

### Scenario: Dashboard loads with state and city tables
Given an admin navigates to /admin/analytics/geographic
When the page loads
Then a ranked table of states is displayed with report counts and bar indicators
And a ranked table of cities is displayed with report counts

### Scenario: Dashboard shows summary KPI cards
Given an admin is viewing the geographic analytics dashboard
Then KPI cards display total reports, unique states, unique cities, and top market

### Scenario: Dashboard shows empty state
Given no reports exist
When an admin loads the geographic dashboard
Then an empty state message is displayed

### Scenario: Dashboard handles API errors
Given the geographic API is unreachable
When the dashboard loads
Then an error message with retry option is displayed

## User Journey

1. Admin clicks Analytics in admin sidebar
2. Admin clicks Geographic tab on analytics page
3. Geographic Analytics Dashboard loads with state/city breakdowns
4. Admin identifies top markets and concentration patterns

## Component References

- Design tokens: .specs/design-system/tokens.md
- Pattern: follows VolumeMetricsDashboard layout (KPI cards + data sections)
- APIs: /api/admin/analytics/geographic (geographic breakdown)
