---
feature: FRED API Connector
domain: data-infrastructure
source: lib/connectors/fred.ts
tests:
  - __tests__/connectors/fred.test.ts
components: []
personas:
  - rising-star-agent
  - legacy-agent
status: implemented
created: 2026-03-09
updated: 2026-03-09
---

# FRED API Connector

**Source File**: `lib/connectors/fred.ts`
**Design System**: N/A (backend connector)
**Personas**: All (invisible — agents see economic insights in their reports, not raw API calls)

## Feature: FRED Economic Data Connector

Fetches economic indicators from the Federal Reserve Economic Data (FRED) API that inform the luxury real estate market intelligence reports. Uses the cache layer (#20) to avoid redundant API calls. Every call is logged via the API usage service for cost tracking.

The connector wraps the FRED `series/observations` endpoint and provides typed access to key economic series relevant to luxury real estate: mortgage rates, home price indices, housing starts, employment, inflation, and GDP growth.

### Scenario: Fetch mortgage rate data
Given FRED_API_KEY is configured
When the connector fetches the 30-year mortgage rate (MORTGAGE30US)
Then it returns an array of dated observations with numeric values
And the data includes the most recent observation date and value

### Scenario: Fetch data with cache integration
Given the cache layer is available
When the connector fetches series data for "MORTGAGE30US"
Then it first checks the cache for key "fred:series:MORTGAGE30US"
And on cache miss, it calls the FRED API
And stores the response in cache with source "fred" (12h TTL)
And logs the API call via the usage service

### Scenario: Cache hit skips API call
Given cached data exists for "fred:series:MORTGAGE30US"
And the cache entry has not expired
When the connector fetches mortgage rate data
Then the cached data is returned without calling the FRED API
And usage is logged as a cache hit (cost = 0)

### Scenario: Fetch with date range
Given a report needs data for the past 12 months
When the connector fetches with observation_start and observation_end
Then only observations within that date range are returned

### Scenario: Fetch multiple economic series
Given the report needs mortgage rates, home prices, and unemployment
When the connector fetches multiple series in parallel
Then all series data is returned as a combined result
And each series is cached independently

### Scenario: Handle FRED API error gracefully
Given the FRED API returns an error (rate limit, 500, invalid key)
When the connector encounters the error
Then it throws a typed error with the provider and status code
And usage is logged with the error status code

### Scenario: Serve stale data on API failure
Given expired cached data exists for a series
And the FRED API is currently unavailable
When the connector attempts to fetch fresh data
Then the expired cached data is returned as a fallback
And the response is marked as stale

## Key FRED Series for Luxury Real Estate

| Series ID | Name | Relevance |
|-----------|------|-----------|
| `MORTGAGE30US` | 30-Year Fixed Rate Mortgage | Financing cost benchmark |
| `MORTGAGE15US` | 15-Year Fixed Rate Mortgage | Alternative financing benchmark |
| `CSUSHPINSA` | Case-Shiller National Home Price Index | National price trend |
| `MSPUS` | Median Sales Price of Houses Sold | National pricing context |
| `HOUST` | Housing Starts: Total New Privately Owned | Supply pipeline indicator |
| `UNRATE` | Unemployment Rate | Economic health signal |
| `CPIAUCSL` | Consumer Price Index (All Urban) | Inflation context |
| `GDP` | Gross Domestic Product | Macro economic backdrop |
| `DFF` | Federal Funds Effective Rate | Rate environment |

## Technical Notes

### API Details

- Base URL: `https://api.stlouisfed.org/fred/series/observations`
- Auth: `api_key` query parameter
- Response format: JSON (`file_type=json`)
- Rate limit: 120 requests per minute
- Key params: `series_id`, `observation_start`, `observation_end`, `units`, `frequency`, `sort_order`

### Connector API

```typescript
// lib/connectors/fred.ts
interface FredObservation {
  date: string;       // "YYYY-MM-DD"
  value: number | null; // null when FRED returns "."
}

interface FredSeriesResult {
  seriesId: string;
  observations: FredObservation[];
  stale: boolean;      // true if served from expired cache
}

fetchSeries(seriesId: string, options?: { start?: string; end?: string; userId?: string; reportId?: string }): Promise<FredSeriesResult>
fetchMultipleSeries(seriesIds: string[], options?: { start?: string; end?: string; userId?: string; reportId?: string }): Promise<FredSeriesResult[]>
```

### Caching Strategy

- Cache key: `fred:series:{SERIES_ID}:{start}:{end}` (date range included)
- TTL: 43200s (12h) per SOURCE_TTLS config
- Stale fallback: on API error, return expired cache with `stale: true`

## User Journey

1. Agent configures market and triggers report generation
2. Data pipeline calls FRED connector for economic context
3. **Connector checks cache → fetches if needed → returns typed data**
4. Data Analyst agent uses economic data to contextualize market analysis

## Learnings

(To be filled after implementation)
