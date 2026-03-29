---
feature: Deal Brief Agent
domain: deal-analyzer
source: lib/agents/deal-brief.ts
tests:
  - __tests__/deal-analyzer/deal-brief-agent.test.ts
components: []
personas:
  - rising-star-agent
  - established-practitioner
design_refs: []
status: implemented
created: 2026-03-15
updated: 2026-03-15
---

# Deal Brief Agent

**Source File**: `lib/agents/deal-brief.ts`
**API Endpoint**: `app/api/deal-analyzer/brief/route.ts`
**Design System**: N/A (backend agent + API)
**Personas**: `.specs/personas/rising-star-agent.md`, `.specs/personas/established-practitioner.md`

## Feature: Deal Brief Agent

A Claude agent that receives enriched property data (from Feature #221) plus the agent's stored market analytics (segment medians, YoY trends, persona specs, forecast outputs already computed for the report) and generates a structured Deal Brief. The brief gives the real estate agent instant AI-backed context they can use in a buyer meeting: where the property sits relative to the market, which buyer persona it fits and why, negotiation leverage points, and whether now is the right time to move.

### How it fits in the pipeline

The Deal Brief Agent is **not** part of the report generation pipeline. It runs on-demand when an agent analyzes a specific property from within a completed report. It follows the same `AgentDefinition` pattern (system prompt → user prompt → JSON response → validation) but is invoked directly, not through the orchestrator's dependency graph.

### Data contract

**Inputs:**
1. `propertyData` (DealPropertyData) — enriched REAPI data from lookup endpoint
2. `sellerSignals` (MotivatedSellerSignals) — computed in lookup
3. `computedAnalytics` (ComputedAnalytics) — pre-computed Layer 1 analytics stored on the report
4. `reportPersonas` — 1-3 buyer personas linked to the report
5. `market` — market metadata (name, geography, tier, price floor)

**Output:**
`DealBriefContent` — structured JSON matching the type in `schema.ts`:
```typescript
{
  summary: string,                    // 2-3 sentence executive summary
  pricingAssessment: {
    narrative: string,                // How this property is priced relative to market
    vsMedian: string,                 // "+12% above segment median"
    vsSegmentComps: string,           // "In line with waterfront SFR comps"
    pricePerSqFtContext: string       // "$2,024/sqft vs $1,850 segment median"
  },
  personaMatch: {
    bestFitPersona: string,           // persona slug
    matchRationale: string,           // Why this persona fits
    talkingPoints: string[]           // 3-5 points to use with this buyer type
  },
  negotiationPoints: {
    leverageItems: string[],          // What gives the buyer negotiation power
    dataBackedArguments: string[],    // Specific data points to cite
    riskFactors: string[]             // What could go wrong
  },
  marketTiming: {
    signal: "buy" | "wait" | "neutral",
    rationale: string,                // Why this signal now
    forecastContext: string            // What the forecast says about this segment
  }
}
```

### Prompt design

The system prompt establishes the agent as a deal analyst for luxury real estate. Key constraints:

1. **Data grounding**: Every claim must reference a specific number from the input. No invented metrics.
2. **Persona vocabulary**: Use the matched persona's `keyVocabulary` words and avoid their `avoid` list.
3. **Conviction**: Take a stance on buy/wait/neutral — don't hedge with "it depends."
4. **Brevity**: Summary is 2-3 sentences. Narratives are 1-2 paragraphs max. Talking points are single sentences.
5. **Motivated seller integration**: If the seller score is high (≥50), weave it into negotiation leverage.

### API endpoint

`POST /api/deal-analyzer/brief` receives `{ dealAnalysisId }`, loads the deal analysis record (which has `propertyData` and `motivatedSellerSignals` from the lookup step), fetches the report's `computedAnalytics` and `reportPersonas`, invokes the agent, writes `briefContent` back to the `deal_analyses` row, and returns the result.

The endpoint handles the full lifecycle:
1. Set status to `generating`
2. Call the agent
3. On success: write `briefContent`, set `motivatedSellerScore`, set `generatedAt`, status → `completed`
4. On failure: write `errorMessage`, status → `failed`

---

## Scenarios

### Scenario 1: Happy path — Deal Brief generated successfully
```gherkin
Given a deal analysis record exists with status "queued" and valid propertyData
  And the associated report has computedAnalytics stored
  And the report has 2 buyer personas linked (business-mogul, coastal-escape-seeker)
When POST /api/deal-analyzer/brief is called with { dealAnalysisId }
Then status is set to "generating" during execution
  And Claude is called with property data + market analytics + persona specs
  And the response is parsed as DealBriefContent
  And briefContent is written to the deal_analyses row
  And status is set to "completed"
  And generatedAt is set to current timestamp
  And the API returns 200 with the DealBriefContent
```

### Scenario 2: Pricing assessment references real market data
```gherkin
Given propertyData has lastSaleAmount = 8,500,000 and pricePerSqFt = 2,024
  And computedAnalytics has segment median price = 7,200,000 and median price/sqft = 1,850
When the Deal Brief is generated
Then pricingAssessment.vsMedian contains a percentage comparison (e.g., "+18% above")
  And pricingAssessment.pricePerSqFtContext references both property and market $/sqft
  And pricingAssessment.narrative is grounded in specific numbers from the input
```

### Scenario 3: Persona match selects best-fit from report personas
```gherkin
Given the report has personas: business-mogul, coastal-escape-seeker
  And propertyData shows: waterfront, 4BR, pool, built 2005, $8.5M
When the Deal Brief is generated
Then personaMatch.bestFitPersona is one of the linked persona slugs
  And personaMatch.matchRationale explains why (references property features + persona preferences)
  And personaMatch.talkingPoints has 3-5 items using the persona's vocabulary
```

### Scenario 4: Negotiation points include motivated seller leverage
```gherkin
Given motivatedSellerScore = 65 (inherited + non-owner-occupied + high equity)
  And motivatedSellerSignals show inherited.fired = true, highEquity.fired = true
When the Deal Brief is generated
Then negotiationPoints.leverageItems includes seller motivation signals
  And negotiationPoints.dataBackedArguments references the specific fired signals
```

### Scenario 5: Negotiation points without motivated seller leverage
```gherkin
Given motivatedSellerScore = 0 (no signals fired)
When the Deal Brief is generated
Then negotiationPoints.leverageItems focuses on market data only
  And negotiationPoints does NOT fabricate seller motivation
```

### Scenario 6: Market timing uses forecast data
```gherkin
Given computedAnalytics includes forecast projections for the property's segment
  And the segment shows 6-month projected median price increase of 8%
When the Deal Brief is generated
Then marketTiming.signal is "buy" or "neutral" (not "wait" in a rising market)
  And marketTiming.forecastContext references the 6-month projection
  And marketTiming.rationale explains the signal with data
```

### Scenario 7: Market timing in declining market
```gherkin
Given the segment shows 6-month projected median price decline of -5%
When the Deal Brief is generated
Then marketTiming.signal is "wait" or "neutral"
  And marketTiming.rationale references the declining forecast
```

### Scenario 8: No personas linked to report — uses general framing
```gherkin
Given the report has 0 buyer personas linked
When the Deal Brief is generated
Then personaMatch.bestFitPersona is "general"
  And personaMatch.matchRationale provides general buyer appeal
  And personaMatch.talkingPoints are not persona-specific
```

### Scenario 9: Deal analysis not found
```gherkin
When POST /api/deal-analyzer/brief is called with a non-existent dealAnalysisId
Then the response status is 404
  And the error message is "Deal analysis not found"
```

### Scenario 10: Deal analysis belongs to different user
```gherkin
Given deal analysis belongs to user A
When user B POSTs to /api/deal-analyzer/brief
Then the response status is 403
```

### Scenario 11: Unauthenticated request
```gherkin
When an unauthenticated user POSTs to /api/deal-analyzer/brief
Then the response status is 401
```

### Scenario 12: Deal analysis missing propertyData
```gherkin
Given a deal analysis exists but propertyData is null (lookup not completed)
When POST /api/deal-analyzer/brief is called
Then the response status is 422
  And the error message is "Property data not available — run lookup first"
```

### Scenario 13: Report has no computedAnalytics
```gherkin
Given the deal analysis links to a report with no stored analytics
When POST /api/deal-analyzer/brief is called
Then the response status is 422
  And the error message is "Report analytics not available"
```

### Scenario 14: Claude API error — status set to failed
```gherkin
Given all inputs are valid
When the Claude API returns an error (500, rate limit, etc.)
Then the deal analysis status is set to "failed"
  And errorMessage is set (e.g., "Brief generation failed: API error")
  And the response status is 502
```

### Scenario 15: Claude returns malformed JSON
```gherkin
Given all inputs are valid
When Claude returns a response that doesn't parse as valid DealBriefContent
Then the agent retries once with a corrective prompt
  And if retry fails, status is set to "failed" with errorMessage
```

### Scenario 16: Deal analysis already completed — re-generates
```gherkin
Given a deal analysis with status "completed" and existing briefContent
When POST /api/deal-analyzer/brief is called
Then the existing briefContent is overwritten with the new generation
  And generatedAt is updated
  And status remains "completed"
```

### Scenario 17: Deal analysis in "generating" state — rejected
```gherkin
Given a deal analysis with status "generating" (another request in progress)
When POST /api/deal-analyzer/brief is called
Then the response status is 409
  And the error message is "Brief generation already in progress"
```

### Scenario 18: Summary is concise (2-3 sentences)
```gherkin
Given a successful generation
Then summary contains 2-3 sentences (not a paragraph)
  And summary mentions the property address, a key metric, and a positioning statement
```

### Scenario 19: DealBriefContent matches schema type exactly
```gherkin
Given a successful generation
Then the returned JSON has exactly these top-level keys:
  | summary | pricingAssessment | personaMatch | negotiationPoints | marketTiming |
  And pricingAssessment has: narrative, vsMedian, vsSegmentComps, pricePerSqFtContext
  And personaMatch has: bestFitPersona, matchRationale, talkingPoints (array)
  And negotiationPoints has: leverageItems (array), dataBackedArguments (array), riskFactors (array)
  And marketTiming has: signal (enum), rationale, forecastContext
```

### Scenario 20: Model and token usage
```gherkin
Given a successful generation
Then the agent uses claude-sonnet-4-6 model
  And max_tokens is 4096
  And temperature is 0.5 (lower than forecast modeler — more focused/consistent)
```

### Scenario 21: API usage logged
```gherkin
Given a successful generation
Then an API usage record is created:
  | provider  | endpoint              |
  | anthropic | deal-brief-agent      |
  And the record includes userId, responseTimeMs
```

---

## User Journey

1. Agent opens completed report
2. Agent types property address → lookup endpoint called (#221)
3. Property card appears with enriched data + seller score
4. **Agent clicks "Generate Deal Brief" → this endpoint is called**
5. Brief appears with pricing, persona match, negotiation points, timing
6. Agent can copy sections to clipboard, export as PDF (#225)

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  POST /api/deal-analyzer/brief                               │
│  { dealAnalysisId: string }                                  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Auth check                                               │
│  2. Load deal_analyses row → verify ownership                │
│  3. Validate: propertyData exists, status ≠ "generating"     │
│  4. Set status → "generating"                                │
│                                                              │
│  5. Load report → get computedAnalytics from report_sections │
│  6. Load report personas → get persona specs                 │
│                                                              │
│  7. ┌─ Deal Brief Agent ────────────────────────────────┐    │
│     │  System prompt: deal analyst role + constraints    │    │
│     │  User prompt: property + analytics + personas      │    │
│     │  Model: claude-sonnet-4-6, temp 0.5, 4096 tokens   │    │
│     │  Output: DealBriefContent JSON                     │    │
│     └────────────────────────────────────────────────────┘    │
│                                                              │
│  8. Validate JSON structure                                  │
│  9. Write briefContent + generatedAt → deal_analyses         │
│ 10. Set status → "completed"                                 │
│ 11. Return DealBriefContent                                  │
│                                                              │
│  On error:                                                   │
│  - Write errorMessage → deal_analyses                        │
│  - Set status → "failed"                                     │
│  - Return 502                                                │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## File Structure

```
lib/agents/
  deal-brief.ts               ← Agent: system prompt, user prompt, execute function

app/api/deal-analyzer/brief/
  route.ts                     ← Thin route handler: load data, invoke agent, write result
```

## Learnings

(To be filled after implementation)
