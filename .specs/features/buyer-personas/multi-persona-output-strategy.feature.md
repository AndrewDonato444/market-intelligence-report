---
feature: Multi-Persona Output Strategy
domain: buyer-personas
source: lib/agents/report-assembler.ts
tests:
  - __tests__/agents/report-assembler.test.ts
components: []
personas:
  - rising-star-agent
  - established-practitioner
  - team-leader
status: implemented
created: 2026-03-10
updated: 2026-03-10
---

# Multi-Persona Output Strategy

**Source File**: `lib/agents/report-assembler.ts`
**Design System**: N/A (data assembly layer)
**Personas**: All user personas benefit — persona content makes reports actionable for client conversations.
**Depends On**: Feature #92 (Persona Intelligence Agent), Feature #50 (Report Template Engine)

## Feature: Multi-Persona Output Strategy

The report assembler integrates persona intelligence output into the final report using a **hybrid strategy**:

1. **Dedicated section** (Section 10: "Persona Intelligence Briefing") — the full per-persona output: talking points, narrative overlays, metric emphasis, vocabulary guides. This becomes a standalone section in the PDF (feature #94).
2. **Persona annotations on narrative sections** — Sections 1, 5, 6, and 8 (Executive Briefing, The Narrative, Forward Look, Strategic Benchmark) receive a `personaFraming` field containing the primary persona's narrative overlay. This lets the PDF template subtly adjust tone/emphasis in existing sections.

**Why hybrid?** Pure blended loses the per-persona detail that agents need for different client conversations. Pure appendix feels disconnected from the analysis. Hybrid gives both: the main report body carries the primary persona's lens, and a dedicated section provides the full persona playbook.

### Scenario: Report with persona intelligence includes Section 10
Given the persona-intelligence agent has produced a PersonaIntelligenceOutput
When the report assembler runs
Then the assembled report contains Section 10 with sectionType "persona_intelligence"
And the section title is "Persona Intelligence Briefing"
And the section content contains the full PersonaIntelligenceOutput (personas array, blended, meta)
And the total section count is 10

### Scenario: Report without persona intelligence produces 9 sections
Given the persona-intelligence agent result is not present in agentResults
When the report assembler runs
Then the assembled report contains exactly 9 sections (same as before)
And no persona_intelligence section is included
And metadata.sectionCount is 9

### Scenario: Report with skipped persona agent produces 9 sections
Given the persona-intelligence agent returned metadata { skipped: true }
When the report assembler runs
Then the assembled report contains exactly 9 sections
And no persona_intelligence section is included

### Scenario: Narrative sections receive personaFraming from primary persona
Given the persona-intelligence agent produced output with 2 personas
And the primary persona (selectionOrder=1) has narrativeOverlay { perspective, emphasis, deEmphasis, toneGuidance }
When the report assembler runs
Then Section 1 (executive_briefing) content has a personaFraming field
And Section 5 (the_narrative) content has a personaFraming field
And Section 6 (forward_look) content has a personaFraming field
And Section 8 (strategic_benchmark) content has a personaFraming field
And each personaFraming contains { personaName, perspective, emphasis, deEmphasis, toneGuidance }

### Scenario: PersonaFraming is null when no persona content
Given no persona-intelligence output is available
When the report assembler runs
Then sections 1, 5, 6, 8 have personaFraming: null

### Scenario: Section 10 content structure
Given persona intelligence output has 2 personas and blended content
When section 10 is assembled
Then content.personas is the array of PersonaContent objects
And content.blended is the BlendedContent object
And content.meta contains personaCount, primaryPersona, modelUsed
And content.strategy is "hybrid" (for downstream consumers to know the layout)

### Scenario: Metadata includes persona timing
Given the persona-intelligence agent ran with durationMs 6000
When the report assembler produces metadata
Then metadata.agentDurations includes "persona-intelligence": 6000
And totalDurationMs includes the persona agent time

## Output Structure

### Section 10 Content

```typescript
{
  sectionNumber: 10,
  sectionType: "persona_intelligence",
  title: "Persona Intelligence Briefing",
  content: {
    strategy: "hybrid",
    personas: PersonaContent[],
    blended: BlendedContent | null,
    meta: { personaCount, primaryPersona, modelUsed, promptTokens, completionTokens }
  }
}
```

### PersonaFraming Injection

```typescript
// Added to sections 1, 5, 6, 8 content objects
{
  ...existingContent,
  personaFraming: {
    personaName: string,
    perspective: string,
    emphasis: string[],
    deEmphasis: string[],
    toneGuidance: string,
  } | null
}
```

## User Journey

1. Agent selects 1-3 buyer personas during report builder wizard (feature #91)
2. Pipeline runs Layers 0-2, persona-intelligence agent generates output
3. **Layer 3: report-assembler integrates persona output (this feature)**
4. Main report sections carry primary persona's framing
5. Section 10 provides the full persona playbook for the agent
6. PDF template renders persona content (feature #94)

## Implementation Notes

- NEW_SECTION_TYPES array should be extended to 10 entries
- assembleReport() should check for persona-intelligence in agentResults
- PersonaFraming extraction is a helper function
- No schema/DB changes needed — section content is already unknown type
