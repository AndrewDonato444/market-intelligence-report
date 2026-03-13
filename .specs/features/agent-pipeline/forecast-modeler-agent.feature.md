---
feature: Forecast Modeler Agent
domain: agent-pipeline
source: lib/agents/forecast-modeler.ts
tests:
  - __tests__/agents/forecast-modeler.test.ts
components: []
personas:
  - primary
status: implemented
created: 2026-03-09
updated: 2026-03-10
---

# Forecast Modeler Agent

**Source File**: `lib/agents/forecast-modeler.ts`
**Design System**: N/A (backend agent)
**Personas**: `.specs/personas/primary.md` (luxury real estate agent)

## Feature: Forecast Modeler Agent

The Forecast Modeler produces forward-looking projections, confidence ratings, and base/bull/bear case scenarios. It combines the Data Analyst's structured metrics with Claude's analytical capabilities to generate calibrated forecasts.

Runs in parallel with Insight Generator and Competitive Analyst after Data Analyst completes.

### Scenario: Generates segment-level price projections
Given the pipeline has completed the data-analyst stage
And the data analyst output contains segment metrics and YoY data
When the forecast-modeler agent executes
Then it produces projections for each segment (6-month, 12-month)
And each projection has a point estimate and confidence range
And projections are grounded in the YoY trend data

### Scenario: Produces base, bull, and bear case scenarios
Given the data analyst output contains overall market metrics
When the forecast-modeler produces scenarios
Then it includes a base case (most likely), bull case (upside), and bear case (downside)
And each case has a narrative description and key assumptions
And each case has projected median price and volume changes

### Scenario: Assigns confidence ratings to forecasts
Given the data analyst output contains confidence levels
When the forecast-modeler produces forecasts
Then each forecast has a confidence rating (high, medium, low)
And confidence accounts for data sample size and freshness
And low-confidence forecasts include explicit caveats

### Scenario: Produces timing recommendations
Given forecasts have been generated
When the forecast-modeler produces the outlook section
Then it includes timing recommendations for buyers and sellers
And recommendations reference specific forecast data points
And recommendations vary by segment where relevant

### Scenario: Handles insufficient data gracefully
Given the data analyst output has low confidence or no YoY data
When the forecast-modeler agent executes
Then it produces qualitative forecasts with broad ranges
And it flags all projections as low confidence
And it does NOT produce specific point estimates

### Scenario: Respects abort signal for cancellation
Given the pipeline sends an abort signal
When the forecast-modeler is executing
Then it checks the abort signal before making Claude API calls
And it throws an error with retriable: false if aborted

### Scenario: Includes X social sentiment in forecast assumptions when available
Given the agent context contains xSentiment data from Grok x_search
When constructing the Claude prompt
Then the prompt includes an "X SOCIAL SENTIMENT" section
And the system prompt instructs Claude to use bull/bear themes to inform scenario assumptions
And bear signals may strengthen the bear case scenario
And bull themes may strengthen the bull case scenario

### Scenario: Omits X social sentiment section when data is null
Given the agent context does NOT contain xSentiment data (XAI_API_KEY not set)
When constructing the Claude prompt
Then the prompt does NOT include an "X SOCIAL SENTIMENT" section
And the agent produces forecasts without X sentiment influence

### Scenario: Conforms to pipeline agent interface
Given the forecast-modeler agent definition
Then it has name "forecast-modeler"
And it has dependencies []
And its execute function accepts AgentContext
And its execute function returns AgentResult with sections and metadata
# Note: Data arrives via `computedAnalytics` in the agent context (v2 architecture)

## Data Flow

```
Data Analyst Output (upstreamResults["data-analyst"].metadata.analysis)
  ├── market: { medianPrice, totalVolume, rating, ... }
  ├── segments: [{ name, medianPrice, rating, ... }]
  ├── yoy: { medianPriceChange, volumeChange, ... }
  └── confidence: { level, sampleSize, ... }

X Social Sentiment (optional, from Grok x_search)
  ├── bullThemes: ["strong demand", ...]
  ├── bearSignals: ["insurance costs", ...]
  └── sentiment: positive|negative|mixed|neutral
                    │
                    ▼
         ┌──────────────────────┐
         │  Forecast Modeler    │
         │  (Claude API)        │
         │                      │
         │  Historical data +   │
         │  YoY trends +        │
         │  X sentiment →       │
         │  Projections         │
         └──────────┬───────────┘
                    │
                    ▼
  ForecastModelerOutput
  ├── projections: [{ segment, sixMonth, twelveMonth, confidence }]
  ├── scenarios: { base, bull, bear }
  ├── timing: { buyers, sellers }
  └── outlook: { narrative, monitoringAreas }
                    │
                    ▼
  AgentResult.sections = [
    { sectionType: "forecasts", title, content: projections + scenarios },
    { sectionType: "strategic_summary", title, content: timing + outlook },
  ]
```

## Learnings

(To be filled after implementation)
