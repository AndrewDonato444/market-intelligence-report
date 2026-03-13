---
feature: Grok x_search Connector
domain: data-infrastructure
source: lib/connectors/grok.ts
tests:
  - __tests__/connectors/grok.test.ts
components: []
personas:
  - rising-star-agent
  - legacy-agent
status: implemented
created: 2026-03-12
updated: 2026-03-12
---

# Grok x_search Connector

**Source File**: `lib/connectors/grok.ts`
**Design System**: N/A (backend connector)
**Personas**: All (invisible — agents see X social sentiment in Trending Insights and Forecast narratives)

## Feature: Grok X Social Sentiment Connector

Fetches synthesized social sentiment from X (Twitter) posts about a luxury real estate market using the xAI Responses API with the `x_search` tool. Grok synthesizes across posts and returns an `XSentimentBrief` — not raw posts. Provides bull/bear signals, notable broker quotes, and overall sentiment direction that enriches agent prompts (Insight Generator and Forecast Modeler).

**Fully optional**: returns `null` if `XAI_API_KEY` is not set. Pipeline works identically without it.

### Scenario: Return null when XAI_API_KEY is missing
Given the XAI_API_KEY environment variable is not set
When the connector is called for any market
Then it returns null immediately (no throw)
And no API call or cache lookup is performed

### Scenario: Fetch X social sentiment for a market
Given the XAI_API_KEY environment variable is set
And no cached sentiment exists for the market
When the connector queries Grok x_search for "Palm Beach, FL"
Then it calls POST https://api.x.ai/v1/responses with model "grok-4"
And the request includes tools: [{ type: "x_search", from_date, to_date }]
And the prompt instructs Grok to search X for luxury real estate posts
And it returns an XSentimentBrief with summary, bullThemes, bearSignals, notableQuotes, sentiment

### Scenario: Cache integration with 7-day TTL
Given the cache layer is available
When the connector fetches X sentiment
Then it checks cache first (key: grok:x_sentiment:city={city}&state={state})
And on cache miss, calls xAI API
And stores response with source "grok" (7d TTL)
And writes a stale fallback copy with 14d TTL (key + ":stale")
And logs the API call via usage service

### Scenario: Cache hit returns cached data
Given cached sentiment data exists for "Naples, FL"
And the cache entry has not expired
When the connector is called for "Naples, FL"
Then the cached data is returned with stale: false
And no API call is made

### Scenario: Serve stale data on API failure
Given expired cached sentiment data exists (stale copy)
And the API returns an error
When the connector attempts to fetch fresh data
Then the stale cached data is returned with stale: true
And a warning is logged

### Scenario: Return null on API failure with no stale cache
Given no cached sentiment data exists (no stale copy either)
And the API returns an error
When the connector attempts to fetch data
Then it returns null (no throw)
And the pipeline continues without X sentiment

### Scenario: Parse Grok response structure
Given the xAI API returns a valid response
When the connector parses the output
Then it extracts text from output[].type="message".content[].type="output_text".text
And it strips any accidental markdown code fences
And it JSON.parses the text into XSentimentBrief fields
And missing fields default to empty arrays or "neutral"

### Scenario: Build search query from market geography
Given a market with city "Palm Beach" and state "FL"
When buildXSentimentQuery is called
Then the query instructs Grok to search X for luxury real estate posts
And the query specifies the market geography
And the query requests JSON output matching XSentimentBrief schema

## Technical Notes

### API Details

- Base URL: `https://api.x.ai/v1/responses`
- Auth: `Authorization: Bearer {XAI_API_KEY}`
- Model: `grok-4`
- Tool: `x_search` with `from_date` and `to_date` (last 30 days)

### Connector API

```typescript
interface XSentimentBrief {
  summary: string;
  bullThemes: string[];
  bearSignals: string[];
  notableQuotes: Array<{ text: string; attribution: string }>;
  sentiment: "positive" | "negative" | "mixed" | "neutral";
  query: string;
  stale: boolean;
}

interface GrokConnectorOptions {
  userId?: string;
  reportId?: string;
}

searchXSentiment(market: { city: string; state: string }, options?: GrokConnectorOptions): Promise<XSentimentBrief | null>
buildXSentimentQuery(market: { city: string; state: string }): string
```

### Caching Strategy

- Cache key: `grok:x_sentiment:city={city}&state={state}`
- Stale fallback key: `grok:x_sentiment:city={city}&state={state}:stale`
- TTL: 604800s (7d) per SOURCE_TTLS config
- Stale TTL: 1209600s (14d) — extended window for fallback

### Response Parsing

The xAI Responses API returns a nested structure:
```
output[] → type: "message" → content[] → type: "output_text" → text → JSON.parse
```

## User Journey

1. Agent defines market (Phase 2)
2. Report generation triggers data pipeline
3. **Pipeline calls Grok x_search for X social sentiment (optional)**
4. Insight Generator uses sentiment in Trending Insights narratives
5. Forecast Modeler uses bull/bear themes in scenario assumptions

## Learnings

- Grok x_search returns synthesized intelligence, not raw posts — much more useful for pipeline consumption
- grok-4 is expensive; 7d TTL is appropriate since social sentiment evolves slowly for real estate
- The optional pattern (return null, no throw) keeps the pipeline robust when the key is absent
