---
feature: Data Freshness Indicators + Staleness Fallback
domain: data-infrastructure
source: lib/services/data-freshness.ts
tests:
  - __tests__/cache/data-freshness.test.ts
components: []
personas:
  - rising-star-agent
  - competitive-veteran
status: implemented
created: 2026-03-09
updated: 2026-03-09
---

# Data Freshness Indicators + Staleness Fallback

**Source File**: `lib/services/data-freshness.ts`
**Design System**: N/A (service layer)
**Personas**: Competitive Veteran (demands data credibility), Rising Star (trusts the system)

## Feature: Data Freshness Service

Provides a unified view of cached data freshness across all connectors. Given a set of cache keys (or sources), returns freshness metadata: age, TTL remaining, staleness status, and confidence level. This powers the data pipeline status dashboard and methodology section of reports.

### Scenario: Check freshness of a single cache entry
Given a cache entry for "fred:series:MORTGAGE30US" exists
And the entry was cached 6 hours ago with a 12h TTL
When the freshness service checks that key
Then it returns age (6h), TTL remaining (6h), and status "fresh"

### Scenario: Detect stale data
Given a cache entry that expired 2 hours ago
When the freshness service checks that key
Then it returns status "stale" with negative TTL remaining

### Scenario: Detect missing data
Given no cache entry exists for a key
When the freshness service checks that key
Then it returns status "missing"

### Scenario: Get freshness summary for a report
Given a report needs data from FRED, RealEstateAPI, and ScrapingDog
When the freshness service checks all sources
Then it returns a summary with per-source freshness
And an overall confidence level (all fresh = high, some stale = medium, missing = low)

### Scenario: Freshness confidence levels
Given freshness data for multiple sources
When confidence is calculated
Then "high" means all data is fresh (within TTL)
And "medium" means some data is stale but available
And "low" means some data is missing entirely

## Technical Notes

### Service API

```typescript
type FreshnessStatus = "fresh" | "stale" | "missing";
type ConfidenceLevel = "high" | "medium" | "low";

interface FreshnessInfo {
  key: string;
  source: string;
  status: FreshnessStatus;
  ageSeconds: number | null;
  ttlRemainingSeconds: number | null;
  cachedAt: Date | null;
  expiresAt: Date | null;
}

interface FreshnessSummary {
  entries: FreshnessInfo[];
  confidence: ConfidenceLevel;
  freshCount: number;
  staleCount: number;
  missingCount: number;
}

checkFreshness(key: string): Promise<FreshnessInfo>
checkMultiple(keys: string[]): Promise<FreshnessSummary>
checkSourceFreshness(source: string): Promise<FreshnessSummary>
```

## User Journey

1. Report generation pipeline fetches data from all sources
2. **Freshness service checks all cache entries for the report**
3. Pipeline status dashboard shows data age per source
4. Report methodology section includes data freshness disclosure

## Learnings

(To be filled after implementation)
