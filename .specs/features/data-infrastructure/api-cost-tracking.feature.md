---
feature: API Cost Tracking + Usage Logging
domain: data-infrastructure
source: app/api/usage/route.ts, lib/services/api-usage.ts
tests:
  - __tests__/cache/api-usage-service.test.ts
  - __tests__/usage/usage-api.test.ts
components: []
personas:
  - rising-star-agent
  - team-leader
status: implemented
created: 2026-03-09
updated: 2026-03-09
---

# API Cost Tracking + Usage Logging

**Source Files**: `app/api/usage/route.ts`, `lib/services/api-usage.ts`
**Design System**: N/A (API endpoint)
**Personas**: Team Leader (tracks costs), Rising Star (budget-conscious)

## Feature: API Usage Tracking API

Exposes the api_usage service through a REST endpoint. Every API call to external providers (RealEstateAPI, FRED, ScrapingDog) is already logged by the connectors. This feature adds a GET endpoint to retrieve usage summaries for the authenticated user, filterable by date range. Also adds a detailed usage log endpoint.

### Scenario: Get usage summary for current user
Given the user is authenticated
And they have made API calls through the connectors
When they GET /api/usage
Then they receive an aggregated summary by provider
And the summary includes total cost, total calls, and cache hit rate

### Scenario: Filter usage by date range
Given the user is authenticated
When they GET /api/usage?since=2026-03-01
Then only usage records from that date forward are included

### Scenario: Get detailed usage log
Given the user is authenticated
When they GET /api/usage/log
Then they receive individual API call records
With provider, endpoint, cost, response time, cached status, and timestamp

### Scenario: Unauthenticated request is rejected
Given no valid auth session
When any usage endpoint is called
Then a 401 Unauthorized response is returned

### Scenario: New user sees empty usage
Given the user is authenticated
And they have never generated a report
When they GET /api/usage
Then they receive a summary with zero costs and zero calls

## Technical Notes

### API Endpoints

```
GET /api/usage          — aggregated summary by provider
GET /api/usage?since=   — filtered by date
GET /api/usage/log      — detailed call log (paginated)
GET /api/usage/log?provider=fred&limit=50&offset=0
```

### Response Shapes

```typescript
// GET /api/usage
{
  summary: {
    byProvider: [{ provider, totalCost, callCount, cacheHits }],
    totalCost: number,
    totalCalls: number,
    cacheHitRate: number
  }
}

// GET /api/usage/log
{
  entries: [{ id, provider, endpoint, cost, responseTimeMs, statusCode, cached, createdAt }],
  total: number
}
```

## User Journey

1. Agent generates reports over time
2. **Agent checks /api/usage to see their spending** (this feature)
3. Usage dashboard (Phase 8) visualizes this data

## Learnings

(To be filled after implementation)
