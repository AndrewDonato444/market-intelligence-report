---
feature: Pipeline Execution Service
domain: pipeline
source: lib/services/pipeline-executor.ts
tests:
  - __tests__/pipeline/pipeline-executor.test.ts
components: []
personas:
  - primary
status: specced
created: 2026-03-09
updated: 2026-03-09
---

# Pipeline Execution Service

**Source File**: lib/services/pipeline-executor.ts
**Design System**: N/A (backend service)

## Feature: Pipeline Execution

The execution glue that connects report creation to the agent pipeline.
When a report is created (status: "queued"), this service fetches the market
data, builds agent context, runs the pipeline, saves sections to DB, and
updates report status.

### Scenario: Successful report generation
Given a report exists with status "queued"
And the report has a valid market with geography data
When the pipeline executor is triggered for the report
Then the report status changes to "generating"
And the generation start timestamp is set
And the agent pipeline runs with the market data
And each section output is saved to report_sections
And the report status changes to "completed"
And the generation completed timestamp is set

### Scenario: Pipeline failure
Given a report exists with status "queued"
When the pipeline executor is triggered and the pipeline fails
Then the report status changes to "failed"
And the error message is stored on the report
And the generation completed timestamp is set

### Scenario: Market not found
Given a report references a non-existent market
When the pipeline executor is triggered
Then the report status changes to "failed"
And the error message indicates "Market not found"

### Scenario: Section persistence
Given the pipeline produces sections with sectionType, title, content
When sections are saved to the database
Then each section gets the correct sortOrder from SECTION_REGISTRY
And each section has the agentName that produced it
And the generatedAt timestamp is set

### Scenario: Progress tracking
Given a pipeline is running
When progress events are emitted
Then in-memory progress is available via getProgress()
And the progress includes percent complete and current agents

### Scenario: API trigger endpoint
Given an authenticated user owns the report
When POST /api/reports/[id]/generate is called
Then the pipeline executor starts asynchronously
And the response returns 202 with status "generating"

### Scenario: Duplicate generation prevention
Given a report already has status "generating"
When POST /api/reports/[id]/generate is called
Then the response returns 409 with "already generating"

## Architecture

```
POST /api/reports/[id]/generate
  │
  ├─ Validate auth + ownership
  ├─ Check report status (must be "queued" or "failed")
  ├─ Update status → "generating"
  │
  └─ executePipeline(reportId) [async, fire-and-forget]
       │
       ├─ Fetch report + market from DB
       ├─ Convert market DB row → MarketData
       ├─ Build PipelineOptions
       │
       ├─ createPipelineRunner(ALL_AGENTS)
       ├─ runner.run(reportId, options)
       │     │
       │     ├─ Layer 1: data-analyst
       │     ├─ Layer 2: insight-generator, competitive-analyst, forecast-modeler
       │     └─ Layer 3: polish-agent
       │
       ├─ For each section in result:
       │     INSERT INTO report_sections (reportId, sectionType, title, content, agentName, sortOrder)
       │
       └─ Update report status → "completed" or "failed"
```
