---
feature: Persona Intelligence Agent
domain: buyer-personas
source: lib/agents/persona-intelligence.ts
tests:
  - __tests__/agents/persona-intelligence.test.ts
components: []
personas:
  - rising-star-agent
  - established-practitioner
  - team-leader
status: implemented
created: 2026-03-10
updated: 2026-03-10
---

# Persona Intelligence Agent

**Source File**: `lib/agents/persona-intelligence.ts`
**Design System**: N/A (backend agent)
**Personas**: `.specs/personas/rising-star-agent.md` (needs credibility tools), `.specs/personas/established-practitioner.md` (values advisory depth), `.specs/personas/team-leader.md` (needs scalable output)
**Depends On**: Feature #30 (Orchestration), #31 (Data Analyst), #32 (Insight Generator), #33 (Competitive Analyst), #34 (Forecast Modeler), #90 (Buyer Persona Data Model)

## Feature: Persona Intelligence Agent

The Persona Intelligence Agent is a new Claude-powered agent in the Layer 2 pipeline. It receives the selected buyer persona specs from the database and all upstream outputs (computedAnalytics + insight-generator, forecast-modeler, and polish-agent narratives), then reframes the market intelligence through each persona's lens — generating persona-specific talking points, narrative overlays, metric emphasis, and vocabulary-adapted content.

**These buyer personas are the agent's clients, not our users.** The luxury real estate agent (our user) selects 1-3 buyer personas during report setup. This agent generates content that helps the agent speak directly to those buyer types using their vocabulary, addressing their decision drivers, and emphasizing the metrics they care about.

**Why it matters**: A report tailored to "The Business Mogul" emphasizes CAGR, price per square foot trends, and tax strategy in financial vocabulary. A report for "The Coastal Escape Seeker" emphasizes lifestyle, waterfront premiums, and design quality in experiential language. Without persona intelligence, every report reads the same regardless of who the agent is advising.

### Scenario: Agent is registered in the pipeline
Given the persona-intelligence agent definition
Then it has name "persona-intelligence"
And it has dependencies ["insight-generator", "forecast-modeler", "polish-agent"]
And its execute function accepts AgentContext
And its execute function returns AgentResult with sections and metadata
And it is registered in the ALL_AGENTS array in pipeline-executor.ts

### Scenario: Agent loads selected personas from database
Given a report has 2 personas selected (e.g., "The Business Mogul" and "The Coastal Escape Seeker")
When the persona-intelligence agent executes
Then it fetches the persona records from the database using getReportPersonas(reportId)
And it receives each persona's full data: decision_drivers, report_metrics, property_filters, narrative_framing, talking_point_templates, sample_benchmarks
And the personas are ordered by selection_order (first = primary tone)

### Scenario: Agent skips execution when no personas selected
Given a report has 0 personas selected (legacy reports, or empty persona table)
When the persona-intelligence agent executes
Then it returns an empty AgentResult with no sections
And metadata contains { skipped: true, reason: "no_personas_selected" }
And the pipeline continues normally without persona content

### Scenario: Agent generates persona-specific talking points from market data
Given the report has "The Business Mogul" selected (primary)
And computedAnalytics contains median price $8.2M, YoY price change +12.4%, 87% cash transactions
When the agent generates talking points
Then it produces 5-7 data-backed talking points using the persona's vocabulary
And talking points reference actual numbers from computedAnalytics (not fabricated)
And talking points use Business Mogul vocabulary: "basis," "alpha," "total return," "cap rate"
And talking points address the persona's decision drivers (ROI, tax optimization, liquidity)
And each talking point has a headline (1 line) and supporting detail (2-3 sentences)

### Scenario: Agent generates narrative overlay for each persona
Given the report has "The Coastal Escape Seeker" selected
And the insight-generator has produced market narrative themes
When the agent generates narrative overlay
Then it reframes key themes through the persona's lens
And the narrative uses Coastal Escape vocabulary: "sanctuary," "retreat," "coastal living," "turnkey"
And it avoids language the persona dislikes (per narrative_framing.avoid)
And the overlay is structured as { perspective: string, emphasis: string[], deEmphasis: string[] }

### Scenario: Agent applies metric emphasis based on persona specs
Given the report has "The Business Mogul" selected
And the persona's report_metrics include ["CAGR by Micro-Market", "Price Per Square Foot Trends", "Days on Market vs Sold Price"]
When the agent produces metric emphasis
Then it identifies which metrics from computedAnalytics match the persona's report_metrics
And it ranks them by relevance to the persona's decision drivers
And it generates a brief interpretation of each metric through the persona's lens
And metrics not in the persona's report_metrics are listed as secondary context

### Scenario: Agent handles multiple personas with blending rules
Given the report has 3 personas selected in order: Business Mogul (1), Coastal Escape Seeker (2), Legacy Builder (3)
When the agent generates content for all personas
Then it produces per-persona output for each (talking points, narrative overlay, metric emphasis)
And it produces a blended summary following Knox Brothers rules:
  - Metric Union: includes all primary metrics from all selected personas
  - Filter Intersection: notes the most restrictive filter overlap
  - Narrative Hierarchy: Business Mogul (first) sets primary tone
  - Blended Talking Points: maximum 7 talking points addressing overlapping concerns
  - De-Emphasis Conflicts: metrics emphasized by one but de-emphasized by another are flagged as secondary

### Scenario: Agent uses Claude to generate persona content
Given the agent has assembled persona specs + market data + upstream narratives
When it calls the Claude API
Then the system prompt establishes the role: "luxury real estate intelligence advisor specializing in persona-targeted market briefings"
And the user prompt includes: market data summary, upstream narrative excerpts, and full persona specs
And the prompt instructs Claude to use the persona's exact vocabulary (keyVocabulary) and avoid their avoid list
And the response is structured JSON parsed into PersonaIntelligenceOutput
And the model used is claude-sonnet-4-6 (same as other narrative agents)

### Scenario: Agent produces structured output for downstream consumption
Given the persona-intelligence agent has completed
Then its sections array contains one SectionOutput with sectionType "persona_intelligence"
And the section content is a PersonaIntelligenceOutput object
And metadata contains the full persona output for Layer 3 assembly
And downstream consumers (report-assembler, PDF template) can access per-persona content

### Scenario: Agent handles upstream failures gracefully
Given the insight-generator agent failed but forecast-modeler succeeded
When the persona-intelligence agent executes
Then it works with whatever upstream results are available
And it notes missing context in its output metadata: { missingUpstream: ["insight-generator"] }
And it still generates persona content from computedAnalytics + available narratives

### Scenario: Agent respects abort signal for cancellation
Given the pipeline sends an abort signal
When the persona-intelligence agent is executing
Then it checks the abort signal before making the Claude API call
And it throws an error with retriable: false if aborted

### Scenario: Agent handles API rate limits with retriable errors
Given the Claude API returns a 429 rate limit error
When the orchestrator detects the failure
Then the error is tagged as retriable: true
And the orchestrator retries with exponential backoff
And 500/503 errors are also retriable; other errors are not

## Output Schema

```typescript
interface PersonaIntelligenceOutput {
  // Per-persona content (1-3 entries, ordered by selection priority)
  personas: PersonaContent[];

  // Blended output (only when 2+ personas selected)
  blended: BlendedContent | null;

  // Processing metadata
  meta: {
    personaCount: number;
    primaryPersona: string; // slug of first-selected
    modelUsed: string;
    promptTokens: number;
    completionTokens: number;
  };
}

interface PersonaContent {
  personaSlug: string;
  personaName: string;
  selectionOrder: number; // 1 = primary

  // Talking points — data-backed conversation starters
  talkingPoints: TalkingPoint[];

  // Narrative overlay — how to reframe themes for this persona
  narrativeOverlay: {
    perspective: string;  // 1-2 sentence framing statement
    emphasis: string[];   // metrics/themes to highlight
    deEmphasis: string[]; // metrics/themes to downplay
    toneGuidance: string; // e.g., "Direct, data-forward, institutional language"
  };

  // Metric emphasis — persona-relevant metrics with interpretations
  metricEmphasis: MetricInterpretation[];

  // Vocabulary — actual words to use in the report
  vocabulary: {
    preferred: string[];  // from narrative_framing.keyVocabulary
    avoid: string[];      // from narrative_framing.avoid
  };
}

interface TalkingPoint {
  headline: string;     // 1-line hook (e.g., "Ultra-luxury volume surged 23% YoY")
  detail: string;       // 2-3 sentences with data + persona framing
  dataSource: string;   // which metric backs this (e.g., "yoy.volumeChange")
  relevance: string;    // why this matters to this persona
}

interface MetricInterpretation {
  metricName: string;         // from persona's report_metrics
  currentValue: string;       // from computedAnalytics
  interpretation: string;     // persona-lens reading of this metric
  priority: "primary" | "secondary";
}

interface BlendedContent {
  // Union of all persona metrics (most detailed spec wins overlaps)
  metricUnion: string[];

  // Intersection of property filters (most restrictive)
  filterIntersection: {
    priceRange: { min: number; max: number | null };
    propertyTypes: string[];
    communityTypes: string[];
  };

  // Blended talking points (max 7, addressing overlapping concerns)
  blendedTalkingPoints: TalkingPoint[];

  // Conflicts — metrics emphasized by one, de-emphasized by another
  conflicts: Array<{
    metric: string;
    emphasizedBy: string;   // persona slug
    deEmphasizedBy: string; // persona slug
    resolution: string;     // "included as secondary context"
  }>;
}
```

## Data Flow

```
┌───────────────────────────────────────────────────────────────────┐
│  Inputs                                                           │
│                                                                   │
│  1. computedAnalytics (Layer 1) ─── market metrics, segments,     │
│     YoY, ratings, peer comparisons                                │
│                                                                   │
│  2. upstreamResults (Layer 2)                                     │
│     ├── insight-generator: narratives, themes, editorial          │
│     ├── forecast-modeler: forecasts, guidance                     │
│     └── polish-agent: strategic brief, methodology                │
│                                                                   │
│  3. Database: getReportPersonas(reportId)                         │
│     └── [{selectionOrder, persona: {full JSONB fields}}]          │
└───────────────────────┬───────────────────────────────────────────┘
                        │
                        ▼
           ┌─────────────────────────┐
           │  Persona Intelligence   │
           │       Agent             │
           │    (Claude API)         │
           │                         │
           │  For each persona:      │
           │  - Match report_metrics │
           │    to computedAnalytics │
           │  - Use narrative_framing│
           │    vocabulary + avoid   │
           │  - Apply talking_point  │
           │    templates with real  │
           │    data                 │
           │  - Reframe upstream     │
           │    themes through lens  │
           │                         │
           │  If 2+ personas:        │
           │  - Apply Knox Brothers  │
           │    blending rules       │
           └─────────────┬───────────┘
                         │
                         ▼
  AgentResult
  ├── sections: [{
  │     sectionType: "persona_intelligence",
  │     title: "Persona Intelligence",
  │     content: PersonaIntelligenceOutput
  │   }]
  └── metadata: {
        personaIntelligence: PersonaIntelligenceOutput
      }
                         │
                         ▼
  Layer 3 (report-assembler)
  └── Consumes persona content for:
      - Feature #93: Multi-persona output strategy (TBD)
      - Feature #94: Persona content in PDF template
```

## Pipeline Integration

### Updated Pipeline Architecture (v2 + persona agent)

```
                    ┌─────────────────┐
                    │  Pipeline Start  │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼──────┐ ┌────▼────────┐ ┌──▼──────────────┐
     │  Insight       │ │  Forecast   │ │  Polish Agent    │
     │  Generator     │ │  Modeler    │ │  (tone, method)  │
     │  (narratives)  │ │ (forecasts) │ │                  │
     └────────┬──────┘ └────┬────────┘ └──┬──────────────┘
              │              │              │
              └──────────────┼──────────────┘
                             │
                    ┌────────▼────────┐
                    │    Persona      │
                    │  Intelligence   │
                    │  (reframe all)  │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ Pipeline Done    │
                    └─────────────────┘
```

### Registration Changes

In `lib/services/pipeline-executor.ts`:
```typescript
import { personaIntelligenceAgent } from "@/lib/agents/persona-intelligence";

const ALL_AGENTS = [
  insightGeneratorAgent,
  forecastModelerAgent,
  polishAgent,
  personaIntelligenceAgent,  // NEW — runs after all 3 complete
];
```

### Context Changes

The agent needs access to `reportId` to fetch personas from DB. This is already available in `AgentContext.reportId`. No changes to the context interface are needed.

### Section Registry Changes

In `lib/agents/schema.ts`, add to SECTION_REGISTRY_V2:
```typescript
{
  sectionType: "persona_intelligence",
  sourceAgent: "persona-intelligence",
  required: false,  // optional — report works without personas
  reportOrder: 10,  // after the 9 existing sections (or injected per #93 decision)
}
```

### Assembly Changes

In `lib/agents/report-assembler.ts`, add persona content extraction:
```typescript
const personaNarrative = extractNarrative(agentResults, "persona-intelligence");

// Section 10: Persona Intelligence (persona-intelligence agent output)
// Exact placement TBD in feature #93 (multi-persona output strategy)
if (personaNarrative?.personaIntelligence) {
  sections.push({
    sectionNumber: 10,
    sectionType: "persona_intelligence",
    title: "Persona Intelligence",
    content: personaNarrative.personaIntelligence,
  });
}
```

## Claude Integration

### System Prompt

```
You are a luxury real estate intelligence advisor specializing in persona-targeted
market briefings. You transform market data and analysis into content tailored for
specific buyer archetypes.

Your output must:
1. Use each persona's EXACT vocabulary (provided in keyVocabulary) — these are
   the words their wealth managers, attorneys, and advisors use
2. AVOID words in each persona's avoid list — these trigger skepticism
3. Reference REAL numbers from the provided market data — never fabricate metrics
4. Address each persona's specific decision drivers in priority order
5. Frame insights through the persona's buying lens

You are writing FOR a luxury real estate agent, not TO the buyer. The agent will
use these talking points and narrative framings in conversations with their clients.
```

### User Prompt Structure

```
## Market Data Summary
[Compact summary of computedAnalytics: key metrics, segments, YoY, ratings]

## Upstream Narratives
[Excerpts from insight-generator themes, forecast guidance, polish strategic brief]

## Selected Personas (in priority order)

### Persona 1 (PRIMARY): {name}
- Decision Drivers: {from decision_drivers, ordered by weight}
- Report Metrics: {from report_metrics}
- Key Vocabulary: {from narrative_framing.keyVocabulary}
- Avoid: {from narrative_framing.avoid}
- Language Tone: {from narrative_framing.languageTone}
- Talking Point Templates: {from talking_point_templates}

### Persona 2: {name}
[Same structure]

## Instructions
For each persona, generate:
1. 5-7 talking points with headline + detail + data source
2. Narrative overlay (perspective, emphasis, de-emphasis, tone guidance)
3. Metric emphasis (match report_metrics to actual data, interpret through lens)

If 2+ personas: generate blended content following these rules:
[Knox Brothers blending rules]

Return JSON in this exact structure:
{PersonaIntelligenceOutput schema}
```

### Model & Parameters

- Model: `claude-sonnet-4-6` (consistent with other narrative agents)
- Temperature: 0.6 (slightly lower than insight-generator — persona vocabulary must be precise)
- Max tokens: 8000 (multi-persona output is larger than single-narrative agents)

## User Journey

1. Agent selects buyer personas in report builder wizard (feature #91)
2. Pipeline starts — Layer 0 fetches data, Layer 1 computes analytics
3. Layer 2: insight-generator, forecast-modeler, polish-agent run in parallel
4. **Layer 2 (sequential): persona-intelligence agent runs after all three complete**
5. Agent receives talking points, narrative framing, and metric emphasis per persona
6. Layer 3: report-assembler merges persona content into report structure
7. Persona content appears in PDF (feature #94 — format TBD by #93)

## Persona Revision Notes

**Reviewed through user persona lenses**:

- **Rising Star Agent (Alex)**: Alex sees persona intelligence as the credibility differentiator — "I'm not just showing data, I'm showing data through the lens of what my HNWI actually cares about." The talking points give Alex ready-made conversation starters backed by real metrics. Alex will use "executive briefing" to describe persona-tailored content to clients. The vocabulary precision (using "basis" and "alpha" for Business Mogul clients) positions Alex as fluent in the client's world.

- **Established Practitioner (Jordan)**: Jordan values the narrative overlay most — the advisory perspective that reframes themes for specific client types. Jordan already thinks about "conviction" and "positioning" — persona intelligence quantifies what Jordan previously did intuitively. The metric emphasis validates Jordan's instincts with data: "I always told Legacy Builder clients to focus on long-term hold value — now I can show them the CAGR by micro-market to prove it."

- **Team Leader (Taylor)**: Taylor needs this to be consistent and trainable. The structured output (per-persona talking points, vocabulary lists, emphasis/de-emphasis) becomes a training tool: "When presenting to a Business Mogul, lead with these metrics and use this vocabulary." The blending rules ensure that when team members select the same personas, they get the same quality output. Taylor will call this "the persona playbook."

**Vocabulary adjustments made**: Used "talking points" (not "conversation starters" — agents already use this term). Used "intelligence brief" (Alex's vocabulary) when describing the output. Used "conviction" and "advisory" (Jordan's vocabulary) when describing narrative overlays. Used "playbook" framing in team leader context.

## Learnings

### 2026-03-10
- **Pattern**: Agent follows the same structure as insight-generator: output types → helpers → buildSystemPrompt() → buildUserPrompt() → executeX() → agent definition export. This pattern is the canonical agent template.
- **Decision**: Temperature 0.6 (vs 0.7 for insight-generator) — persona content needs to be faithful to persona specs (vocabulary, avoid lists), so slightly less creative variance.
- **Decision**: max_tokens 8000 (vs 4096 for insight-generator) — persona agent outputs per-persona content for up to 3 personas plus blended content, roughly 2x the output volume.
- **Pattern**: When an agent depends on upstream agents but upstream may fail, check for missing upstreams and note them in the prompt rather than throwing. The agent can still generate useful output with partial context.
- **Decision**: `blended` is null for single-persona reports (no blending needed). The spec defines 5 blending rules (Metric Union, Filter Intersection, Narrative Hierarchy, Blended Talking Points max 7, De-Emphasis Conflicts) but these are instructions to Claude, not code-level logic.
- **Gotcha**: The `getReportPersonas()` function returns `{ selectionOrder, persona }[]` — the persona object is nested under `.persona`, not at the top level. Must destructure correctly when building the prompt.
