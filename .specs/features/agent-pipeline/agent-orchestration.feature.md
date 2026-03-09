---
feature: Agent Orchestration Framework
domain: agent-pipeline
source: lib/agents/orchestrator.ts
tests:
  - __tests__/agents/orchestrator.test.ts
components: []
personas:
  - rising-star-agent
  - competitive-veteran
status: implemented
created: 2026-03-09
updated: 2026-03-09
---

# Agent Orchestration Framework

**Source File**: `lib/agents/orchestrator.ts`
**Design System**: N/A (service layer)
**Personas**: Rising Star Agent (trusts the system, wants clear progress), Competitive Veteran (demands credibility, expects thoroughness)

## Feature: Pipeline Runner + State Machine

The agent orchestration framework coordinates specialized AI agents (Claude-powered) through a defined pipeline to generate market intelligence reports. It manages the execution order, state transitions, error handling, retries, and progress tracking. Each agent receives typed input and produces typed output that flows to downstream agents.

### Scenario: Run a full pipeline successfully
Given a report is queued with a valid market definition
And all required data sources are cached
When the pipeline runner starts the report
Then it transitions the report status to "generating"
And it executes agents in dependency order: data-analyst → insight-generator, competitive-analyst, forecast-modeler (parallel) → polish
And each agent receives output from its upstream dependencies
And the report status transitions to "completed" when all agents finish

### Scenario: Agent fails with retryable error
Given the pipeline is running and an agent fails with a retryable error (e.g., API rate limit)
When the orchestrator detects the failure
Then it retries the agent up to the configured max retries
And it applies exponential backoff between retries
And if the retry succeeds, the pipeline continues normally

### Scenario: Agent fails with non-retryable error
Given the pipeline is running and an agent fails permanently (e.g., invalid data)
When the orchestrator detects the non-retryable failure
Then it marks the report as "failed" with the error message
And it records which agent failed and why

### Scenario: Track pipeline progress
Given the pipeline is running
When an agent completes its work
Then the pipeline emits a progress event with agent name, status, and timing
And the overall progress percentage is updated based on completed agents

### Scenario: Pipeline respects agent dependencies
Given agents have defined dependencies (data-analyst must run before insight-generator)
When the pipeline schedules execution
Then agents with no unmet dependencies run in parallel where possible
And agents wait for their dependencies to complete before starting

### Scenario: Pipeline context carries market and report data
Given a pipeline is started for a specific report and market
When each agent executes
Then it receives the market definition, report config, and outputs from upstream agents
And it has access to the data connectors (FRED, RealEstateAPI, ScrapingDog)

### Scenario: Cancel a running pipeline
Given a pipeline is in progress
When a cancellation is requested
Then currently running agents are allowed to complete (no mid-execution kill)
And no new agents are started
And the report status is set to "failed" with a cancellation message

## Technical Notes

### Pipeline Architecture

```
                    ┌─────────────────┐
                    │  Pipeline Start  │
                    │  (report queued) │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Data Analyst    │
                    │  (metrics, YoY)  │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼──────┐ ┌────▼────────┐ ┌──▼──────────────┐
     │  Insight       │ │ Competitive │ │ Forecast Modeler │
     │  Generator     │ │ Analyst     │ │ (projections)    │
     │  (narratives)  │ │ (vs peers)  │ │                  │
     └────────┬──────┘ └────┬────────┘ └──┬──────────────┘
              │              │              │
              └──────────────┼──────────────┘
                             │
                    ┌────────▼────────┐
                    │  Polish Agent    │
                    │  (tone, quotes)  │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ Pipeline Done    │
                    │ (report complete)│
                    └─────────────────┘
```

### Service API

```typescript
// Agent definition
interface AgentDefinition {
  name: string;
  description: string;
  dependencies: string[];  // names of agents that must complete first
  execute: (context: AgentContext) => Promise<AgentResult>;
}

// Context passed to each agent
interface AgentContext {
  reportId: string;
  userId: string;
  market: MarketData;
  reportConfig: ReportConfig;
  upstreamResults: Record<string, AgentResult>;
  abortSignal: AbortSignal;
}

// Result from each agent
interface AgentResult {
  agentName: string;
  sections: SectionOutput[];
  metadata: Record<string, unknown>;
  durationMs: number;
}

interface SectionOutput {
  sectionType: string;
  title: string;
  content: unknown;  // JSONB-compatible
}

// Pipeline events
type PipelineEvent =
  | { type: "agent_started"; agentName: string; timestamp: Date }
  | { type: "agent_completed"; agentName: string; durationMs: number; timestamp: Date }
  | { type: "agent_failed"; agentName: string; error: string; retriable: boolean; timestamp: Date }
  | { type: "agent_retrying"; agentName: string; attempt: number; maxRetries: number; timestamp: Date }
  | { type: "pipeline_completed"; totalDurationMs: number; timestamp: Date }
  | { type: "pipeline_failed"; error: string; failedAgent: string; timestamp: Date };

// Pipeline runner
interface PipelineRunner {
  run(reportId: string, options?: PipelineOptions): Promise<PipelineResult>;
  cancel(reportId: string): void;
  getProgress(reportId: string): PipelineProgress;
}

interface PipelineOptions {
  maxRetries?: number;       // default: 2
  retryDelayMs?: number;     // default: 1000 (base for exponential backoff)
  onEvent?: (event: PipelineEvent) => void;
}

interface PipelineProgress {
  reportId: string;
  status: "idle" | "running" | "completed" | "failed" | "cancelled";
  totalAgents: number;
  completedAgents: number;
  currentAgents: string[];
  percentComplete: number;
  events: PipelineEvent[];
}

interface PipelineResult {
  reportId: string;
  status: "completed" | "failed";
  sections: SectionOutput[];
  totalDurationMs: number;
  agentTimings: Record<string, number>;
  error?: string;
}
```

### Default Agent Registry

The framework provides a registry of agent definitions. Individual agent implementations (#31-#35) are separate features — this framework provides placeholder/stub agents for testing the orchestration.

```typescript
const DEFAULT_AGENTS: AgentDefinition[] = [
  { name: "data-analyst", dependencies: [], execute: ... },
  { name: "insight-generator", dependencies: ["data-analyst"], execute: ... },
  { name: "competitive-analyst", dependencies: ["data-analyst"], execute: ... },
  { name: "forecast-modeler", dependencies: ["data-analyst"], execute: ... },
  { name: "polish", dependencies: ["insight-generator", "competitive-analyst", "forecast-modeler"], execute: ... },
];
```

### Error Handling

- Retryable errors: API rate limits, timeouts, transient network failures
- Non-retryable errors: Invalid data, missing required fields, schema validation failures
- Exponential backoff: delay * 2^attempt (1s, 2s, 4s)
- Max retries configurable per pipeline run (default: 2)

## User Journey

1. Agent configures market and starts report generation (Phase 5)
2. **Pipeline runner orchestrates all agents in dependency order**
3. Pipeline status dashboard shows real-time progress (Phase 5)
4. Completed sections are assembled into the report (Phase 6)

## Learnings

(To be filled after implementation)
