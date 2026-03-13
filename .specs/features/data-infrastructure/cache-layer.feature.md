---
feature: Cache Layer — DB-backed with TTL by Data Type
domain: data-infrastructure
source: lib/services/cache.ts, lib/services/api-usage.ts
tests:
  - __tests__/cache/cache-service.test.ts
  - __tests__/cache/api-usage-service.test.ts
components: []
personas:
  - rising-star-agent
  - legacy-agent
status: implemented
created: 2026-03-09
updated: 2026-03-10
---

# Cache Layer — DB-backed with TTL by Data Type

**Source Files**: `lib/services/cache.ts`, `lib/services/api-usage.ts`
**Design System**: N/A (backend service layer)
**Personas**: All (invisible — agents never see the cache, they just experience fast data)

## Feature: Cache-First Data Access

Every external API call (RealEstateAPI, ScrapingDog) is expensive. The cache layer sits between the application and external APIs, storing responses in the `cache` table with source-specific TTLs. When data is requested, cache is checked first. On miss, the caller fetches from the API and stores the result. Every API call — cached or not — is logged in `api_usage` for cost tracking.

### Scenario: Cache hit returns stored data
Given a cache entry exists for key "reapi:property-search:naples-fl" with source "realestateapi"
And the entry has not expired
When the cache service is queried for that key
Then the stored data is returned
And no external API call is made

### Scenario: Cache miss returns null
Given no cache entry exists for key "reapi:property-search:naples-fl-6m"
When the cache service is queried for that key
Then null is returned
And the caller knows to fetch from the external API

### Scenario: Expired entry is treated as a miss
Given a cache entry exists for key "reapi:property-detail:12345" with source "realestateapi"
And the entry's expires_at is in the past
When the cache service is queried for that key
Then null is returned (expired entries are not served)

### Scenario: Cache set stores data with correct TTL
Given the caller has fetched fresh data from RealEstateAPI
When the cache service stores the data with source "realestateapi"
Then the entry is saved with the configured TTL for that source
And expires_at is calculated as now + TTL seconds

### Scenario: Cache set upserts on duplicate key
Given a cache entry already exists for key "reapi:property-search:naples-fl"
When the cache service stores new data for the same key
Then the existing entry is updated (not duplicated)
And expires_at is recalculated from the new TTL
And updated_at reflects the current time

### Scenario: Cache invalidation deletes by key
Given a cache entry exists for key "reapi:property-detail:12345"
When the cache service deletes that key
Then the entry is removed from the cache table

### Scenario: Cache invalidation deletes by source
Given multiple cache entries exist with source "scrapingdog"
When the cache service invalidates all entries for source "scrapingdog"
Then all entries with that source are removed

### Scenario: Cache cleanup removes expired entries
Given the cache table contains entries with various expiration times
And some entries have expired
When the cleanup function is called
Then all entries where expires_at < now are deleted
And non-expired entries remain untouched

### Scenario: TTL varies by data source
Given the TTL configuration defines different durations per source
When data from different sources is cached
Then RealEstateAPI data uses 24h TTL (transaction data)
And ScrapingDog data uses 7d TTL (neighborhood context is stable)
And Grok data uses 7d TTL (social sentiment + grok-4 is expensive)
And Anthropic data uses 0 TTL (never cached)
And agent-output data uses 7d TTL (only changes when source data hash changes)

### Scenario: API usage is logged on external call
Given an API call is made to RealEstateAPI
When the response is received
Then an api_usage record is created with provider, endpoint, cost, response_time_ms, status_code
And cached is set to 0 (false)

### Scenario: API usage logs cache hits
Given a cache hit occurs for a RealEstateAPI data request
When the usage is logged
Then an api_usage record is created with the provider
And cached is set to 1 (true)
And cost is set to 0

### Scenario: Cache key builder produces deterministic keys
Given a data source "realestateapi" and parameters {city: "Naples", state: "FL", priceFloor: 6000000}
When the cache key is built
Then the key is deterministic (same params always produce same key)
And the key includes the source prefix for namespace separation
And the key is human-readable for debugging

## Technical Notes

### TTL Configuration

| Source | TTL | Rationale |
|--------|-----|-----------|
| `realestateapi` | 86400s (24h) | Transaction data is stable within a day |
| `scrapingdog` | 604800s (7d) | Neighborhood context changes slowly |
| `grok` | 604800s (7d) | Social sentiment via x_search — expensive API, data valid for ~1 week |
| `anthropic` | 0 (never) | AI outputs should always be fresh |
| `agent-output` | 604800s (7d) | Agent outputs only change when source data changes (new hash) |

### Cache Key Format

`{source}:{endpoint}:{sorted-params-hash}`

Examples:
- `reapi:property-search:naples-fl-6m-ultra`
- `reapi:property-detail:12345`
- `scrapingdog:local:naples-fl-restaurants`
- `grok:x_sentiment:city=Naples&state=FL`

### Service API

```typescript
// lib/services/cache.ts
get(key: string): Promise<unknown | null>
set(key: string, source: string, data: unknown, ttlSeconds?: number): Promise<void>
del(key: string): Promise<void>
deleteBySource(source: string): Promise<void>
cleanup(): Promise<void>
buildKey(source: string, endpoint: string, params: Record<string, unknown>): string

// lib/services/api-usage.ts
logApiCall(entry: { userId: string; reportId?: string; provider: string; endpoint: string; cost?: number; tokensUsed?: number; responseTimeMs?: number; statusCode?: number; cached?: boolean }): Promise<void>
getUsageSummary(userId: string, since?: Date): Promise<UsageSummary>
```

### Schema (already exists)

Uses the `cache` and `api_usage` tables defined in `lib/db/schema.ts`. No migrations needed.

## User Journey

1. Agent configures market (Phase 2 ✅)
2. Agent triggers report generation (Phase 5)
3. **Data pipeline checks cache before every API call** (this feature)
4. Fresh data is fetched only on cache miss
5. All calls logged for cost transparency (Phase 8)

## Learnings

(To be filled after implementation)
