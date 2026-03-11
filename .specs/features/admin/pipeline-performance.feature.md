---
feature: Pipeline Performance Metrics
domain: admin
source: app/admin/analytics/performance/page.tsx, components/admin/pipeline-performance-dashboard.tsx, app/api/admin/analytics/performance/route.ts
tests:
  - __tests__/admin/pipeline-performance-dashboard.test.tsx
components:
  - PipelinePerformanceDashboard
personas:
  - internal-admin
status: implemented
created: 2026-03-11
updated: 2026-03-11
---

# Pipeline Performance Metrics

**Source Files**: `app/admin/analytics/performance/page.tsx`, `components/admin/pipeline-performance-dashboard.tsx`, `app/api/admin/analytics/performance/route.ts`
**Design System**: `.specs/design-system/tokens.md`
**Depends On**: Analytics API Endpoints (#130), API Cost Tracking (#23), Pipeline Execution Service (#80)

## Feature: Pipeline Performance Metrics

Admin analytics view showing pipeline operational health: average report generation time (with trend), cache hit rate from API usage records, average API cost per report, and error rates broken down by agent. Uses real data from the `reports`, `apiUsage`, and `reportSections` tables. Adds a "Performance" tab to the analytics navigation.

### Scenario: Dashboard loads with four KPI cards
Given an admin navigates to `/admin/analytics/performance`
When the page loads
Then the performance analytics API is called with `period=30d&granularity=daily`
And four KPI cards are displayed: Avg Generation Time, Cache Hit Rate, Avg Cost / Report, Error Rate

### Scenario: Generation time trend chart renders
Given an admin is on the pipeline performance page
When data loads
Then a line chart shows average generation time per time bucket

### Scenario: Admin changes period filter
Given an admin is on the pipeline performance page
When they click the "90d" period tab
Then the API is called with `period=90d`

### Scenario: Admin changes granularity
Given an admin is on the pipeline performance page
When they select "Weekly" granularity
Then the API is called with `granularity=weekly`

### Scenario: Agent error breakdown table
Given an admin is on the pipeline performance page
When data loads
Then an "Errors by Agent" table shows each agent with failure count sorted descending

### Scenario: Cost breakdown section
Given an admin is on the pipeline performance page
When data loads
Then a "Cost Breakdown by Provider" section shows cost grouped by provider with requests, total cost, and avg cost per request columns

### Scenario: Empty state
Given no completed reports exist
When admin loads the page
Then KPI cards show zero values and tables show empty messages

### Scenario: Loading state
Given admin navigates to pipeline performance
When data is being fetched
Then a loading spinner is displayed

### Scenario: Error state with retry
Given the API is unreachable
When admin loads the page
Then an error message with Retry button is shown

### Scenario: Navigation includes Performance tab
Given admin is on any analytics sub-page
Then tab bar includes Volume, Geographic, Users, and Performance

## API Design

### `/api/admin/analytics/performance`

**Params**: `period` (7d, 30d, 90d, 365d), `granularity` (daily, weekly, monthly)

**Response**: generationTimeSeries, summary (avgGenerationTime, cacheHitRate, avgCostPerReport, errorRate, totalReports, totalErrors), errorsByAgent, costByProvider

## Component References

- Pattern: follows `UserAnalyticsDashboard` layout
- Navigation: extends `analytics-nav.tsx` with "Performance" tab
