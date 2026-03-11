---
feature: Agent Output Cache
domain: data-infrastructure
source: lib/services/agent-cache.ts
tests:
  - __tests__/services/agent-cache.test.ts
  - __tests__/services/agent-cache-integration.test.ts
components: []
personas:
  - rising-star-agent
  - legacy-agent
status: implemented
created: 2026-03-10
updated: 2026-03-10
---

# Agent Output Cache

**Source File**: `lib/services/agent-cache.ts`
**Design System**: N/A (backend service layer)
**Personas**: All (invisible - agents experience faster regeneration and lower costs)

## Feature: Hash-Based Agent Output Deduplication

Claude agent calls are the most expensive part of report generation (~$0.15-0.50 per agent call). When re-running a report for the same market with unchanged source data, the Claude agents will produce identical output. This feature caches agent outputs keyed by a hash of their input data, so re-runs skip Claude entirely when the source data hasn't changed.

### Scenario: Cache miss on first run
Given a report is being generated for the first time
And the agent "insight-generator" has never run with this input data
When the agent executes
Then Claude is called normally
And the agent result is stored in the cache with a hash of the input data
And the cache source is "agent-output"

### Scenario: Cache hit on re-run with same data
Given a report was previously generated for "Naples, FL" ultra-luxury market
And the underlying market data has not changed (same ComputedAnalytics hash)
When the same report is regenerated
Then the cached agent result is returned without calling Claude
And the original result metadata is preserved as-is
And the pipeline emits an agent_completed event with durationMs: 0

### Scenario: Cache miss when data changes
Given a cached agent result exists for "Naples, FL" with hash H1
And new property transactions have been added (ComputedAnalytics produces hash H2)
When the report is regenerated
Then the cache key does not match (H1 != H2)
And Claude is called with the new data
And the new result replaces the old cache entry

### Scenario: Per-agent caching
Given the pipeline has 4 agents (insight-generator, forecast-modeler, polish, persona-intelligence)
When each agent executes
Then each agent has its own cache entry keyed by agent name + input hash
And agents with different upstream dependencies produce different hashes
And a change in one agent's input does not invalidate other agents' caches

### Scenario: Cache key includes upstream results
Given the polish agent depends on insight-generator and forecast-modeler outputs
When computing the polish agent's cache key
Then the hash includes the upstream agent results (not just computedAnalytics)
And a change in insight-generator's output invalidates the polish cache
But does NOT invalidate the forecast-modeler cache

### Scenario: Cache TTL for agent outputs
Given agent output is cached
When the cache entry is stored
Then it uses a configurable TTL (default: 7 days)
And expired entries are treated as cache misses
And the existing cache cleanup function removes expired agent cache entries

### Scenario: Cache bypass option
Given a user wants to force-regenerate a report with fresh Claude calls
When the pipeline is run with `bypassAgentCache: true`
Then all agents call Claude regardless of cache state
And new results overwrite existing cache entries

### Scenario: Hash stability
Given identical ComputedAnalytics objects
When the hash is computed multiple times
Then the hash is deterministic (same input always produces same hash)
And the hash ignores property ordering in objects (keys are sorted)
And the hash ignores non-semantic differences (whitespace, undefined vs missing)

### Scenario: Pipeline executor integration
Given the pipeline executor runs Layer 2 (Claude agents)
When the orchestrator calls each agent
Then it checks the agent cache before calling the agent's execute function
And on cache hit, it skips execute and returns the cached result
And the pipeline progress events still fire (with a "cached" indicator)
And the pipeline timing records cache lookups as near-zero duration

## Technical Notes

### Architecture

The agent cache sits between the orchestrator and the agent execute functions:

```
Pipeline Executor
    │
    ├── Layer 0: fetchAllMarketData()     → CompiledMarketData
    ├── Layer 1: computeMarketAnalytics() → ComputedAnalytics
    │
    ├── Layer 2: orchestrator.run()
    │       │
    │       ├── For each agent:
    │       │     1. Compute input hash (analytics + upstream results + market)
    │       │     2. Check agent cache (hash lookup)
    │       │     3. On HIT → return cached AgentResult
    │       │     4. On MISS → call agent.execute()
    │       │     5. Store result in cache with hash key
    │       │
    │       └── Return all agent results
    │
    └── Layer 3: assembleReport()
```

### Hash Function

```typescript
// lib/services/agent-cache.ts

/**
 * Compute a deterministic hash of the agent's input data.
 * Uses SHA-256 of JSON.stringify with sorted keys.
 */
function computeInputHash(
  agentName: string,
  market: MarketData,
  computedAnalytics: ComputedAnalytics | undefined,
  upstreamResults: Record<string, AgentResult>
): string

/**
 * Check cache for a previously computed agent result.
 */
async function getCachedAgentResult(
  agentName: string,
  inputHash: string
): Promise<AgentResult | null>

/**
 * Store an agent result in the cache.
 */
async function cacheAgentResult(
  agentName: string,
  inputHash: string,
  result: AgentResult,
  ttlSeconds?: number
): Promise<void>
```

### Cache Key Format

`agent-output:{agentName}:{inputHash}`

Examples:
- `agent-output:insight-generator:a1b2c3d4...`
- `agent-output:forecast-modeler:e5f6g7h8...`
- `agent-output:polish:i9j0k1l2...`

### Hash Input Composition

| Agent | Hash Includes |
|-------|---------------|
| insight-generator | market + computedAnalytics |
| forecast-modeler | market + computedAnalytics |
| polish | market + computedAnalytics + upstream(insight-generator, forecast-modeler) |
| persona-intelligence | market + computedAnalytics + upstream(insight-generator) |

### TTL Configuration

```typescript
SOURCE_TTLS["agent-output"] = 604800; // 7 days
```

Agent outputs are stable for much longer than raw API data — they only change when source data changes (new hash) or when we update agent prompts (rare, requires cache invalidation).

### Integration Points

1. **Orchestrator** (`lib/agents/orchestrator.ts`): Wrap `executeWithRetry` to check cache first
2. **Cache service** (`lib/services/cache.ts`): Add "agent-output" to SOURCE_TTLS
3. **Pipeline options** (`PipelineOptions`): Add `bypassAgentCache?: boolean`
4. **API usage** (`lib/services/api-usage.ts`): Log cached agent calls with cost 0

## User Journey

1. Agent generates first report for "Naples, FL" → full Claude calls (~$1.50, ~60s)
2. Agent regenerates same report 2 hours later → cache hit, no Claude calls (~2s)
3. New property data arrives overnight → cache miss on next run, fresh Claude calls
4. Agent tweaks report config → market data unchanged, cache still valid

## Learnings

- **Mock `mockImplementation` over `mockReturnValueOnce`**: When a mock is called multiple times per test (e.g., `computeInputHash` called once for cache lookup, once for cache store), use `mockImplementation` with conditional logic rather than `mockReturnValueOnce` chains — avoids silent fallthrough to default values.
- **Integration point deferred**: API usage logging for cached calls (cost: 0) is a natural follow-up but was out of scope for the cache service itself. The orchestrator emits events that could drive this downstream.
- **`sortKeys()` recursive helper**: Essential for hash determinism — without it, `{ a: 1, b: 2 }` and `{ b: 2, a: 1 }` would produce different SHA-256 hashes despite being semantically identical.
