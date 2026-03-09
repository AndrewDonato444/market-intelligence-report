---
feature: Agent Output Schema + Validation
domain: agent-pipeline
source: lib/agents/schema.ts
tests:
  - __tests__/agents/schema.test.ts
components: []
personas:
  - primary
status: implemented
created: 2026-03-09
updated: 2026-03-09
---

# Agent Output Schema + Validation

**Source File**: `lib/agents/schema.ts`

## Feature: Agent Output Schema + Validation

Defines a unified schema for all agent outputs and validates them before report assembly. This ensures the pipeline produces structured, type-safe JSON that downstream consumers (report templates, PDF renderer) can rely on.

### Scenario: Validates a complete pipeline result
Given a full pipeline has completed with all agents
When validatePipelineOutput is called with the combined results
Then it returns a validated ReportData object
And every required section is present
And all section content matches expected shapes

### Scenario: Detects missing required sections
Given a pipeline result is missing the "market_overview" section
When validatePipelineOutput is called
Then it throws a validation error listing the missing sections

### Scenario: Section content shapes enforced via TypeScript types
Given a pipeline result contains all sections
When each section is produced by its source agent
Then content shapes are enforced at compile time via TypeScript interfaces
And market_overview has narrative, highlights, recommendations (InsightGeneratorOutput)
And key_drivers has themes array (InsightGeneratorOutput)
And competitive_market_analysis has positioning, peerComparisons, rankings (CompetitiveAnalystOutput)
And forecasts has projections, scenarios (ForecastModelerOutput)
Note: Runtime validation checks section presence; content shapes are compile-time guarantees

### Scenario: Assembles sections into ordered ReportData
Given all sections have been validated
When assembleReport is called
Then it produces a ReportData object with sections in report order
And it includes metadata (generated timestamp, confidence, agent durations)
And it includes pull quotes from the polish agent

### Scenario: Handles optional sections gracefully
Given competitive_market_analysis or forecasts sections are missing
When validatePipelineOutput is called with allowPartial: true
Then it succeeds with warnings about missing optional sections
And it assembles available sections into ReportData

### Scenario: Collects agent metadata into report metadata
Given all agents have completed
When assembleReport is called
Then metadata includes total pipeline duration
And metadata includes per-agent durations
And metadata includes data confidence level and sample size
And metadata includes list of stale data sources

## Section Registry

| Section Type | Source Agent | Required | Report Order |
|-------------|-------------|----------|-------------|
| market_overview | insight-generator | yes | 1 |
| executive_summary | insight-generator | yes | 2 |
| key_drivers | insight-generator | yes | 3 |
| competitive_market_analysis | competitive-analyst | no | 4 |
| forecasts | forecast-modeler | no | 5 |
| strategic_summary | forecast-modeler | no | 6 |
| polished_report | polish-agent | no | 7 |
| methodology | polish-agent | no | 8 |

## Learnings

- Runtime validation checks section presence/absence; content shape validation is handled by TypeScript's type system at compile time rather than duplicating checks at runtime
- When deduplicating sections, prefer the primary source agent (from SECTION_REGISTRY) over secondary producers (e.g., insight-generator's market_overview over data-analyst's)
- Pull quotes are extracted from the polish agent's `polished_report` section content, not from metadata
