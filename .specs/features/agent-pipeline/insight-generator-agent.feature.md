---
feature: Insight Generator Agent
domain: agent-pipeline
source: lib/agents/insight-generator.ts
tests:
  - __tests__/agents/insight-generator.test.ts
components: []
personas:
  - primary
status: implemented
created: 2026-03-09
updated: 2026-03-10
---

# Insight Generator Agent

**Source File**: `lib/agents/insight-generator.ts`
**Design System**: N/A (backend agent)
**Personas**: `.specs/personas/primary.md` (luxury real estate agent)

## Feature: Insight Generator Agent

The Insight Generator is the second stage in the agent pipeline. It receives structured analysis from the Data Analyst (metrics, segments, YoY, ratings) and transforms them into strategic narratives that luxury agents can use to advise clients.

This is the first agent to use Claude. It takes pure numbers and produces prose — market commentary, key theme identification, risk assessments, and actionable recommendations.

### Scenario: Generates strategic narratives from data analyst output
Given the pipeline has completed the data-analyst stage
And the data analyst output contains market metrics, segments, YoY, and ratings
When the insight-generator agent executes
Then it produces narrative sections for "market_overview" and "key_drivers"
And each narrative section contains text, highlights, and recommendations
And the agent returns within the pipeline's AgentResult format

### Scenario: Identifies key market themes from segment data
Given the data analyst output contains multiple segments with varied ratings
When the insight-generator produces the key_drivers section
Then it identifies 3-5 strategic themes from the data
And each theme has a name, impact level, trend direction, and narrative
And themes reference specific metrics from the data analyst output

### Scenario: Produces executive summary narrative
Given the data analyst output contains overall market rating and YoY metrics
When the insight-generator produces the executive_summary section
Then it contains a strategic overview paragraph
And it includes performance highlights (3-5 bullet points)
And it provides timing recommendations for buyers/sellers

### Scenario: Handles insufficient data gracefully
Given the data analyst output has insufficientData: true in metadata
When the insight-generator agent executes
Then it produces narrative sections with appropriate caveats
And it flags low confidence in its metadata
And it does NOT fabricate data or specific numbers

### Scenario: Respects abort signal for cancellation
Given the pipeline sends an abort signal
When the insight-generator is executing
Then it checks the abort signal before making Claude API calls
And it throws an error with retriable: false if aborted

### Scenario: Conforms to pipeline agent interface
Given the insight-generator agent definition
Then it has name "insight-generator"
And it has dependencies []
And its execute function accepts AgentContext
And its execute function returns AgentResult with sections and metadata
# Note: Data arrives via `computedAnalytics` in the agent context (v2 architecture)

### Scenario: Includes market context in Claude prompt
Given the agent context contains market geography and luxury tier
When constructing the Claude prompt
Then the prompt includes the market name, city, state
And the prompt includes the luxury tier label
And the prompt includes the specific segment and YoY data

### Scenario: Includes X social sentiment in Claude prompt when available
Given the agent context contains xSentiment data from Grok x_search
When constructing the Claude prompt
Then the prompt includes an "X SOCIAL SENTIMENT" section
And the section contains overall sentiment direction
And the section contains bull themes and bear signals
And the section contains notable quotes (up to 5)
And the system prompt instructs Claude to use X sentiment to validate or challenge themes from news and data

### Scenario: Omits X social sentiment section when data is null
Given the agent context does NOT contain xSentiment data (XAI_API_KEY not set)
When constructing the Claude prompt
Then the prompt does NOT include an "X SOCIAL SENTIMENT" section
And the agent produces output without X sentiment influence

### Scenario: Structures output for downstream consumption
Given the insight-generator has completed
Then its metadata contains the full narrative output
And its sections array contains typed SectionOutput entries
And downstream agents (polish, competitive) can access the narratives via upstreamResults

## Data Flow

```
Data Analyst Output (upstreamResults["data-analyst"].metadata.analysis)
  ├── market: { totalProperties, medianPrice, rating, ... }
  ├── segments: [{ name, count, medianPrice, rating, ... }]
  ├── yoy: { medianPriceChange, volumeChange, ... }
  └── confidence: { level, sampleSize, ... }

X Social Sentiment (optional, from Grok x_search)
  ├── summary: synthesis of X posts
  ├── bullThemes: ["strong demand", ...]
  ├── bearSignals: ["insurance costs", ...]
  ├── notableQuotes: [{ text, attribution }]
  └── sentiment: positive|negative|mixed|neutral
                    │
                    ▼
         ┌─────────────────────┐
         │  Insight Generator  │
         │   (Claude API)      │
         │                     │
         │  Prompt = market +  │
         │  data + news +      │
         │  X sentiment +      │
         │  instructions       │
         └─────────┬───────────┘
                    │
                    ▼
  InsightGeneratorOutput
  ├── overview: { narrative, highlights, recommendations }
  ├── themes: [{ name, impact, trend, narrative }]
  └── executiveSummary: { narrative, highlights, timing }
                    │
                    ▼
  AgentResult.sections = [
    { sectionType: "market_overview", title, content: overview },
    { sectionType: "key_drivers",    title, content: { themes } },
    { sectionType: "executive_summary", title, content: executiveSummary },
  ]
  AgentResult.metadata = { insights: InsightGeneratorOutput }
```

## Claude Integration

The Insight Generator calls the Anthropic Claude API via the existing SDK:
- Model: claude-sonnet-4-20250514 (fast, cost-effective for narrative generation)
- Temperature: 0.7 (creative but grounded)
- System prompt: establishes the luxury real estate analyst persona
- User prompt: structured data + specific instructions for each section
- Response: JSON structured output parsed into InsightGeneratorOutput

## Learnings

(To be filled after implementation)
