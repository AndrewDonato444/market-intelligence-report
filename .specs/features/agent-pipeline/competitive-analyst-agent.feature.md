---
feature: Competitive Analyst Agent
domain: agent-pipeline
source: lib/agents/competitive-analyst.ts
tests:
  - __tests__/agents/competitive-analyst.test.ts
components: []
personas:
  - primary
status: deprecated
created: 2026-03-09
updated: 2026-03-10
---

# Competitive Analyst Agent

**Source File**: `lib/agents/competitive-analyst.ts`
**Design System**: N/A (backend agent)
**Personas**: `.specs/personas/primary.md` (luxury real estate agent)

## Feature: Competitive Analyst Agent

> **⚠️ DEPRECATED (v2 pipeline):** This agent was part of the v1 7-agent pipeline. In the v2 4-layer architecture, peer market comparison is handled by the report-assembler (Layer 3) using pre-fetched data from Layer 0. The source file exists but is marked `@deprecated` and is not registered in the v2 pipeline's `ALL_AGENTS` array. Kept for reference only.

The Competitive Analyst compares the target market against peer luxury markets. It fetches property data for each peer market, computes comparable metrics using the same functions as the Data Analyst, then uses Claude to generate strategic positioning narratives.

This was the third agent in the v1 pipeline (ran in parallel with Insight Generator after Data Analyst completed). Depends on feature #12 (peer market selection) for the peer market definitions stored on each market record.

### Scenario: Fetches and analyzes peer market data
Given the pipeline has completed the data-analyst stage
And the market has peer markets defined (e.g. Palm Beach, Aspen, Hamptons)
When the competitive-analyst agent executes
Then it fetches property data for each peer market via RealEstateAPI
And it computes segment metrics and YoY for each peer
And it produces a structured comparison against the target market

### Scenario: Generates competitive positioning narrative via Claude
Given peer market metrics have been computed
When the competitive-analyst calls Claude
Then it produces a competitive positioning section with narrative, strengths, and weaknesses
And it produces per-peer comparison entries with relative performance
And it identifies market ranking across key metrics

### Scenario: Handles market with no peer markets defined
Given the market has no peerMarkets (empty array or null)
When the competitive-analyst agent executes
Then it returns a result with a narrative noting no peer comparison is available
And it does NOT call Claude
And it does NOT fetch any property data

### Scenario: Handles peer market data fetch failures gracefully
Given the market has peer markets defined
When fetching property data for a peer market fails
Then the agent continues with available peer data
And it notes the missing peer in its metadata
And it does NOT fail the entire pipeline

### Scenario: Respects abort signal for cancellation
Given the pipeline sends an abort signal
When the competitive-analyst is executing
Then it checks the abort signal before each peer data fetch and before Claude call
And it throws an error with retriable: false if aborted

### Scenario: Conforms to pipeline agent interface
Given the competitive-analyst agent definition
Then it has name "competitive-analyst"
And it has dependencies ["data-analyst"]
And its execute function accepts AgentContext
And its execute function returns AgentResult with sections and metadata

### Scenario: Reuses Data Analyst computation functions
Given peer market property data has been fetched
When computing peer market metrics
Then it uses computeSegmentMetrics from data-analyst for each peer
And it uses computeYoY from data-analyst for each peer
And it uses assignRating from data-analyst for each peer

## Data Flow

```
context.market.peerMarkets  →  For each peer:
                                 ├── buildSearchParamsFromMarket(peer)
                                 ├── searchProperties(params)
                                 ├── computeSegmentMetrics(properties)
                                 └── computeYoY(currentYear, priorYear)
                                          │
target market analysis ─────────┐         │
(from data-analyst upstream)    │         │
                                ▼         ▼
                        ┌─────────────────────────┐
                        │  Competitive Analyst     │
                        │  (Claude API)            │
                        │                          │
                        │  Target metrics +        │
                        │  Peer metrics →          │
                        │  Positioning narrative   │
                        └────────────┬────────────┘
                                     │
                                     ▼
  AgentResult.sections = [
    { sectionType: "competitive_market_analysis",
      title: "Competitive Market Analysis",
      content: { positioning, peerComparisons, rankings } }
  ]
  AgentResult.metadata = { competitiveAnalysis, peersFetched, peersSkipped }
```

## Learnings

(To be filled after implementation)
