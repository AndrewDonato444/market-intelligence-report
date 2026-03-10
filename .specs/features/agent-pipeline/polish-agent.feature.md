---
feature: Polish Agent
domain: agent-pipeline
source: lib/agents/polish-agent.ts
tests:
  - __tests__/agents/polish-agent.test.ts
components: []
personas:
  - primary
status: implemented
created: 2026-03-09
updated: 2026-03-09
---

# Polish Agent

**Source File**: `lib/agents/polish-agent.ts`
**Design System**: N/A (backend agent)
**Personas**: `.specs/personas/primary.md`

## Feature: Polish Agent

The Polish Agent is the final stage in the AI pipeline. It receives all upstream narratives (from Insight Generator, Competitive Analyst, Forecast Modeler) and performs an editorial pass: ensuring consistency in tone, generating pull quotes for visual highlights, checking for contradictions between sections, and producing a unified strategic voice.

Dependencies: data-analyst, insight-generator (must complete before polish runs).
Optional upstream: competitive-analyst, forecast-modeler (used if available).

### Scenario: Performs editorial polish on all upstream narratives
Given all upstream agents have completed
When the polish agent executes
Then it reads narratives from insight-generator, competitive-analyst, and forecast-modeler
And it produces polished versions with consistent tone and voice
And it identifies contradictions or inconsistencies between sections

### Scenario: Generates pull quotes for report highlights
Given upstream narratives contain key findings
When the polish agent produces output
Then it extracts 3-5 pull quotes suitable for visual callouts
And each pull quote has source section attribution
And pull quotes are concise (under 30 words each)

### Scenario: Produces methodology and sources section
Given all upstream agents have completed with metadata
When the polish agent produces output
Then it generates a methodology section describing data sources and approach
And it lists confidence levels and sample sizes from upstream metadata
And it notes any data gaps or stale sources

### Scenario: Works with partial upstream data
Given only insight-generator has completed (competitive/forecast missing)
When the polish agent executes
Then it polishes available narratives without errors
And it notes missing sections in metadata
And it still produces pull quotes and methodology from available data

### Scenario: Respects abort signal for cancellation
Given the pipeline sends an abort signal
When the polish agent is executing
Then it checks the abort signal before Claude API call
And it throws with retriable: false if aborted

### Scenario: Conforms to pipeline agent interface
Given the polish-agent definition
Then it has name "polish-agent"
And it has dependencies ["data-analyst", "insight-generator"]
And its execute function returns AgentResult with sections and metadata

## Data Flow

```
insight-generator output ──┐
competitive-analyst output ─┼──▶ Polish Agent (Claude)
forecast-modeler output ───┘         │
                                     ▼
  PolishAgentOutput
  ├── polishedSections: revised narratives
  ├── pullQuotes: [{ text, source }]
  ├── methodology: { narrative, sources, confidenceLevels }
  └── consistency: { contradictions, notes }
```

## Learnings

(To be filled after implementation)
