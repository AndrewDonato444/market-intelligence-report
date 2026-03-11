---
feature: Analytics API Endpoints
domain: admin
source: app/api/admin/analytics/route.ts, app/api/admin/analytics/volume/route.ts, app/api/admin/analytics/users/route.ts, app/api/admin/analytics/errors/route.ts
tests:
  - __tests__/admin/analytics-api.test.ts
components: []
personas:
  - internal-admin
status: implemented
created: 2026-03-11
updated: 2026-03-12
---

# Analytics API Endpoints

**Source Files**: `app/api/admin/analytics/route.ts`, `app/api/admin/analytics/volume/route.ts`, `app/api/admin/analytics/users/route.ts`, `app/api/admin/analytics/errors/route.ts`
**Design System**: `.specs/design-system/tokens.md`
**Depends On**: Database Schema (#2), Report Error Tracking Schema (#120)

## Feature: Analytics API Endpoints

Aggregate query endpoints that power the admin analytics dashboard (Phase 15). These endpoints return report volume metrics (daily/weekly/monthly), user signup and activity trends, and error rate breakdowns — the operational intelligence the MSA team needs to understand platform health and usage patterns.

The admin persona here is the MSA operations team member who thinks in terms of "platform throughput," "growth trends," and "pipeline reliability." They need to answer: "How many reports are we generating? Where is demand concentrated? Are error rates climbing?"

These endpoints are **read-only** and sit behind `requireAdmin()`. They aggregate data from existing tables (`reports`, `users`, `apiUsage`, `userActivity`) — no schema changes required.

### Scenario: Admin fetches the analytics overview
Given an admin user is authenticated
When they call `GET /api/admin/analytics`
Then they receive a JSON response with:
  - `reportVolume`: total reports generated, by period (last 24h, 7d, 30d, all-time)
  - `userCount`: total users, active users (generated a report in last 30d), new signups (last 30d)
  - `errorRate`: failed reports / total reports, by period (7d, 30d)
  - `avgGenerationTime`: average pipeline duration in seconds, by period (7d, 30d)
And all counts reflect real database state

### Scenario: Admin fetches report volume over time
Given an admin user is authenticated
When they call `GET /api/admin/analytics/volume?period=30d&granularity=daily`
Then they receive a time series array with one entry per day
And each entry contains: `date` (ISO date string), `total` (count), `completed` (count), `failed` (count)
And days with zero reports are included as zero-value entries (no gaps)

### Scenario: Admin fetches report volume with weekly granularity
Given an admin user is authenticated
When they call `GET /api/admin/analytics/volume?period=90d&granularity=weekly`
Then they receive a time series array with one entry per week
And each entry contains: `date` (ISO date string for week start, Monday), `total`, `completed`, `failed`

### Scenario: Admin fetches report volume with monthly granularity
Given an admin user is authenticated
When they call `GET /api/admin/analytics/volume?period=365d&granularity=monthly`
Then they receive a time series array with one entry per month
And each entry contains: `date` (ISO date string for month start), `total`, `completed`, `failed`

### Scenario: Admin fetches user signup trends
Given an admin user is authenticated
When they call `GET /api/admin/analytics/users?period=30d&granularity=daily`
Then they receive:
  - `signups`: time series of new user registrations per day
  - `summary`: `totalUsers`, `activeUsers` (report in last 30d), `newSignups` (in period), `inactiveOver60d` (users with no report in last 60d)

### Scenario: Admin fetches error rate trends
Given an admin user is authenticated
When they call `GET /api/admin/analytics/errors?period=30d&granularity=daily`
Then they receive:
  - `errorTimeSeries`: daily counts of failed reports
  - `errorsByAgent`: breakdown of failures by agent name (from `errorDetails->>'agent'`)
  - `summary`: `totalErrors` (in period), `errorRate` (failed/total as percentage), `mostFailingAgent` (name + count), `retriedCount`

### Scenario: Unauthenticated user cannot access analytics
Given a request without valid admin credentials
When they call any `/api/admin/analytics/*` endpoint
Then they receive a `401 Unauthorized` or `403 Forbidden` response
And no data is returned

### Scenario: Non-admin user cannot access analytics
Given an authenticated user with role "user" (not "admin")
When they call any `/api/admin/analytics/*` endpoint
Then they receive a `403 Forbidden` response

### Scenario: Period parameter validation on volume endpoint
Given an admin user is authenticated
When they call `GET /api/admin/analytics/volume?period=invalid`
Then they receive a `400 Bad Request` with a message indicating valid periods: `24h`, `7d`, `30d`, `90d`, `365d`

### Scenario: Period parameter validation on users and errors endpoints
Given an admin user is authenticated
When they call `GET /api/admin/analytics/users?period=invalid` or `GET /api/admin/analytics/errors?period=invalid`
Then they receive a `400 Bad Request` with a message indicating valid periods: `7d`, `30d`, `90d`, `365d`
Note: These endpoints do not support `24h` — only the volume endpoint accepts `24h`

### Scenario: Granularity parameter validation
Given an admin user is authenticated
When they call `GET /api/admin/analytics/volume?granularity=invalid`
Then they receive a `400 Bad Request` with a message indicating valid granularities: `daily`, `weekly`, `monthly`

### Scenario: No errors returns null mostFailingAgent
Given an admin user is authenticated
And the platform has no failed reports in the requested period
When they call `GET /api/admin/analytics/errors`
Then `summary.mostFailingAgent` is `null` (not an empty object)
And `summary.totalErrors` is `0`
And `summary.errorRate` is `0`

### Scenario: Empty platform returns zero-value responses
Given an admin user is authenticated
And the platform has no reports or users
When they call `GET /api/admin/analytics`
Then they receive a valid JSON response with all counts at zero
And no errors are thrown

## API Design

### `GET /api/admin/analytics` — Overview

Returns a summary snapshot for the admin dashboard hero cards.

**Query Parameters:**
- None (fixed periods: 24h, 7d, 30d, all-time)

**Response:**
```json
{
  "reportVolume": {
    "last24h": 12,
    "last7d": 67,
    "last30d": 234,
    "allTime": 1089
  },
  "userCount": {
    "total": 45,
    "active": 28,
    "newLast30d": 6
  },
  "errorRate": {
    "last7d": { "failed": 3, "total": 67, "rate": 0.0448 },
    "last30d": { "failed": 9, "total": 234, "rate": 0.0385 }
  },
  "avgGenerationTime": {
    "last7d": 142.5,
    "last30d": 138.2
  }
}
```

### `GET /api/admin/analytics/volume` — Report Volume Time Series

**Query Parameters:**
| Param | Required | Values | Default |
|-------|----------|--------|---------|
| `period` | No | `24h`, `7d`, `30d`, `90d`, `365d` | `30d` |
| `granularity` | No | `daily`, `weekly`, `monthly` | `daily` |

**Response:**
```json
{
  "timeSeries": [
    { "date": "2026-03-01", "total": 8, "completed": 7, "failed": 1 },
    { "date": "2026-03-02", "total": 5, "completed": 5, "failed": 0 }
  ],
  "period": "30d",
  "granularity": "daily"
}
```

### `GET /api/admin/analytics/users` — User Analytics

**Query Parameters:**
| Param | Required | Values | Default |
|-------|----------|--------|---------|
| `period` | No | `7d`, `30d`, `90d`, `365d` | `30d` |
| `granularity` | No | `daily`, `weekly`, `monthly` | `daily` |

**Response:**
```json
{
  "signups": [
    { "date": "2026-03-01", "count": 2 },
    { "date": "2026-03-02", "count": 0 }
  ],
  "summary": {
    "totalUsers": 45,
    "activeUsers": 28,
    "newSignups": 6,
    "inactiveOver60d": 8
  },
  "period": "30d",
  "granularity": "daily"
}
```

### `GET /api/admin/analytics/errors` — Error Rate Analytics

**Query Parameters:**
| Param | Required | Values | Default |
|-------|----------|--------|---------|
| `period` | No | `7d`, `30d`, `90d`, `365d` | `30d` |
| `granularity` | No | `daily`, `weekly`, `monthly` | `daily` |

**Response:**
```json
{
  "errorTimeSeries": [
    { "date": "2026-03-01", "count": 1 },
    { "date": "2026-03-02", "count": 0 }
  ],
  "errorsByAgent": [
    { "agent": "data-analyst", "count": 4 },
    { "agent": "insight-generator", "count": 2 }
  ],
  "summary": {
    "totalErrors": 9,
    "errorRate": 0.0385,
    "mostFailingAgent": { "agent": "data-analyst", "count": 4 },  // null when no errors
    "retriedCount": 5
  },
  "period": "30d",
  "granularity": "daily"
}
```

## Implementation Notes

### Data Sources (all existing tables, no schema changes)

| Metric | Table | Query Pattern |
|--------|-------|--------------|
| Report volume | `reports` | `count(*)` grouped by `date_trunc(granularity, createdAt)`, filtered by `status` |
| User signups | `users` | `count(*)` grouped by `date_trunc(granularity, createdAt)` |
| Active users | `reports` | `count(distinct userId)` where `createdAt` in last 30d |
| Error rates | `reports` | `count(*)` where `status = 'failed'`, grouped by date |
| Errors by agent | `reports` | `errorDetails->>'agent'` extraction, grouped |
| Avg gen time | `reports` | `avg(generationCompletedAt - generationStartedAt)` where both non-null |
| Retry count | `reports` | `count(*)` where `retriedAt is not null` |
| Inactive users | `users` + `reports` | Users with no report in last 60d via left join or subquery |

### Query Patterns (align with existing admin routes)

Follow the Drizzle patterns established in `/api/admin/monitoring`:
- Use `sql` template literals for `date_trunc`, `count(*)`, `extract(epoch from ...)`
- Period filtering with `gte(createdAt, sinceDate)` where `sinceDate = new Date(now - periodMs)`
- Return zero-filled time series by generating date buckets in JS and left-merging DB results
- Parallel queries with `Promise.all()` for independent aggregations

### Auth

All endpoints use `requireAdmin()` from `lib/supabase/admin-auth.ts` — same pattern as all existing admin routes.

### Error Handling

- Invalid period/granularity: return `400` with descriptive message
- DB query failures: return `500` with generic error, log details server-side
- Empty results: return valid response with zero values, never error on empty data

## User Journey

1. Admin navigates to analytics dashboard (Phase 15, #131+)
2. **Dashboard loads and calls these API endpoints to populate charts and metrics**
3. Admin adjusts period/granularity controls → new API calls with updated params
4. Admin drills into specific metrics → navigates to report registry or user list for details

## Component References

- No new UI components in this feature (API-only)
- Consumed by: Volume Metrics Dashboard (#131), Geographic Analytics (#132), User Analytics (#133), Pipeline Performance (#134), Analytics Export (#135)

## Learnings

- The existing `/api/admin/monitoring` endpoint already handles period-based aggregation with a `since` query parameter — reuse the same `parsePeriod()` pattern
- JSONB extraction (`errorDetails->>'agent'`) is already proven in the error triage API
- Zero-filling time series must happen in application code (Postgres `generate_series` is an option but JS-side fill is simpler and already established)
