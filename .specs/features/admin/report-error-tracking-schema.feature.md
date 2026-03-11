---
feature: Report Error Tracking Schema
domain: admin
source: lib/db/schema.ts
tests:
  - __tests__/lib/db/report-error-tracking-schema.test.ts
components: []
personas:
  - team-leader
  - established-practitioner
status: implemented
created: 2026-03-11
updated: 2026-03-11
---

# Report Error Tracking Schema

**Source File**: lib/db/schema.ts
**Migration**: lib/db/migrations/ (new migration file)
**Design System**: .specs/design-system/tokens.md
**Personas**: .specs/personas/team-leader.md, .specs/personas/established-practitioner.md

## Feature: Report Error Tracking Schema

Extend the `reports` table with structured error tracking — replace the flat `errorMessage` text column with a rich `errorDetails` JSONB column that captures which agent failed, the error message, stack trace, and an input data snapshot. Add `retriedAt` and `retriedBy` columns to support admin pipeline re-trigger workflows. This is the schema foundation for Phase 14 (Report Registry & Error Triage).

### Why This Matters

When a report pipeline fails, admin currently sees only a flat text `errorMessage` — no way to know which agent broke, what input caused the failure, or whether someone already attempted a fix. The MSA operations team needs structured error data to triage failures efficiently and re-trigger pipelines with confidence. Without this, every failed report requires manual investigation by a developer.

From an agent's perspective: when Jordan's intelligence brief fails mid-generation, admin needs to diagnose and fix it fast — Jordan's client meeting is tomorrow. Taylor's team of 10 generates reports weekly; a single pipeline failure can cascade into missed deliverables across the team.

## Schema Changes

### New Columns on `reports` Table

| Column | Type | Default | Nullable | Index | Purpose |
|--------|------|---------|----------|-------|---------|
| `errorDetails` | `jsonb` | null | Yes | No | Structured error data — agent name, message, stack, input snapshot |
| `retriedAt` | `timestamp with time zone` | null | Yes | No | When the pipeline was last re-triggered |
| `retriedBy` | `text` | null | Yes | No | Auth ID of the admin who triggered the retry |

### `errorDetails` JSONB Shape

```typescript
interface ReportErrorDetails {
  /** Which pipeline agent failed (e.g., "data-analyst", "insight-generator", "forecast-modeler") */
  agent: string;
  /** Human-readable error message */
  message: string;
  /** Stack trace for developer debugging (truncated to 4000 chars) */
  stack?: string;
  /** Snapshot of the input data the agent received when it failed */
  inputSnapshot?: Record<string, unknown>;
  /** ISO timestamp when the error occurred */
  occurredAt: string;
  /** Pipeline stage number (1-based) where the failure happened */
  stageIndex?: number;
  /** Total number of pipeline stages */
  totalStages?: number;
  /** Previous errors if the pipeline was retried and failed again */
  previousErrors?: Array<{
    agent: string;
    message: string;
    occurredAt: string;
  }>;
}
```

### Drizzle Schema Addition

```typescript
// Add to existing reports table definition:
errorDetails: jsonb("error_details").$type<{
  agent: string;
  message: string;
  stack?: string;
  inputSnapshot?: Record<string, unknown>;
  occurredAt: string;
  stageIndex?: number;
  totalStages?: number;
  previousErrors?: Array<{
    agent: string;
    message: string;
    occurredAt: string;
  }>;
}>(),
retriedAt: timestamp("retried_at", { withTimezone: true }),
retriedBy: text("retried_by"),
```

### Migration Strategy

1. Add `error_details` JSONB column (nullable, no default)
2. Add `retried_at` and `retried_by` columns (nullable)
3. Migrate existing `error_message` data: for any report where `error_message IS NOT NULL`, populate `error_details` with `{ agent: "unknown", message: <error_message>, occurredAt: <created_at> }`
4. Keep `error_message` column for backward compatibility (existing monitoring dashboard reads it) — mark as deprecated in schema comments
5. No new indexes needed — admin queries will filter by `status = 'failed'` (already indexed) and then read `error_details` from the result set

### Scenario: Pipeline failure records structured error details
Given a report pipeline is running for an agent's intelligence brief
When the data analyst agent fails with an error
Then the report's `status` is set to `failed`
And `errorDetails` is populated with the agent name, error message, stack trace, and input snapshot
And `errorDetails.occurredAt` records the exact failure timestamp
And `errorDetails.stageIndex` records which stage failed

### Scenario: Error details include the failing agent's identity
Given a report has failed during pipeline execution
When admin views the error details
Then `errorDetails.agent` identifies exactly which agent failed (e.g., "data-analyst", "insight-generator", "forecast-modeler", "competitive-analyst", "polish-agent")
And admin does not need to parse log files to determine the failure point

### Scenario: Input snapshot captures what the agent received
Given a pipeline agent fails
When error details are recorded
Then `errorDetails.inputSnapshot` contains a serialized copy of the input data the agent received
And the snapshot is truncated if it exceeds 50KB to prevent database bloat
And the snapshot enables admin to reproduce the failure

### Scenario: Existing error messages are migrated to structured format
Given reports exist with a flat `errorMessage` but no `errorDetails`
When the migration runs
Then those reports receive `errorDetails` with `agent: "unknown"` and `message` set to the existing `errorMessage`
And the original `errorMessage` column is preserved (not dropped)
And no data is lost

### Scenario: Admin re-triggers a failed pipeline
Given a report has `status = 'failed'` with populated `errorDetails`
When an admin triggers a pipeline retry
Then `retriedAt` is set to the current timestamp
And `retriedBy` is set to the admin's auth ID
And the current `errorDetails` are moved to `errorDetails.previousErrors`
And `status` is set back to `queued`

### Scenario: Retry preserves error history
Given a report was retried once but failed again
When admin views the error details
Then `errorDetails.previousErrors` contains the first failure's agent, message, and timestamp
And the current `errorDetails` top-level fields reflect the most recent failure
And admin can see the full failure history without querying external logs

### Scenario: Reports without errors have null error fields
Given a report completes successfully
When the report record is queried
Then `errorDetails` is null
And `retriedAt` is null
And `retriedBy` is null
And no storage overhead is incurred for successful reports

### Scenario: Error recording does not block pipeline execution
Given a pipeline agent fails
When the system attempts to record error details
Then the error recording itself does not throw or block the pipeline status update
And if JSONB serialization fails (e.g., circular reference in input), a fallback `errorDetails` with just `agent` and `message` is stored

## Pipeline Integration Points

### Where error details are written

The pipeline execution service (`lib/services/pipeline-execution.ts` or equivalent) needs to catch agent failures and write structured error details:

```typescript
// In the pipeline runner's catch block:
await db
  .update(reports)
  .set({
    status: "failed",
    errorMessage: error.message, // backward compat
    errorDetails: {
      agent: currentAgent.name,
      message: error.message,
      stack: error.stack?.substring(0, 4000),
      inputSnapshot: truncateSnapshot(currentAgent.input, 50_000),
      occurredAt: new Date().toISOString(),
      stageIndex: currentStageIndex,
      totalStages: pipeline.stages.length,
    },
  })
  .where(eq(reports.id, reportId));
```

### Where retry is triggered

The admin retry endpoint (built in #124) will:

```typescript
// Move current error to history, reset status
const currentError = report.errorDetails;
await db
  .update(reports)
  .set({
    status: "queued",
    errorMessage: null,
    errorDetails: null,
    retriedAt: new Date(),
    retriedBy: adminAuthId,
  })
  .where(eq(reports.id, reportId));
// previousErrors accumulation happens on the next failure
```

## User Journey

1. **Agent generates a report** → pipeline starts, `status: 'generating'`
2. **Pipeline agent fails** → `status: 'failed'`, `errorDetails` populated with agent identity, message, stack, input
3. **Admin opens Error Triage view** (#123) → sees failed reports with structured error data
4. **Admin investigates** → reads `errorDetails.agent` to know which agent broke, checks `inputSnapshot` to understand the data
5. **Admin fixes underlying issue** (data source, config, etc.)
6. **Admin re-triggers pipeline** (#124) → `retriedAt` + `retriedBy` recorded, `status` back to `queued`
7. **Pipeline succeeds** → `errorDetails` stays null, `retriedAt` shows the report was once retried

## Dependencies

- **Depends on**: #2 (Database schema + Supabase setup) — ✅ Completed
- **Depended on by**: #121 (Admin report list page), #123 (Error triage view), #124 (Pipeline re-trigger), #130 (Analytics API — error rates)

## Component References

No new UI components in this feature (schema-only + pipeline integration). UI comes in #121–#125.

## Persona Lens

**Taylor (Team Leader)**: Taylor's team generates reports weekly across multiple markets. When a pipeline fails, Taylor needs to know _fast_ — is it one broken report or a systemic issue affecting the whole team? The `agent` field in `errorDetails` lets admin quickly determine if the same agent is failing across multiple reports (systemic) vs. a one-off data issue. Taylor's patience is low-medium — the triage experience must be instant, not investigative.

**Jordan (Established Practitioner)**: Jordan generates one report at a time, carefully. When Jordan's intelligence brief fails the night before a client meeting, it's critical. The `retriedAt` / `retriedBy` fields give admin an audit trail — was this already looked at? The `inputSnapshot` lets admin reproduce Jordan's exact failure without asking Jordan to re-submit. Jordan should never have to debug the pipeline — that's MSA's job.

## Backward Compatibility

The existing `errorMessage` text column is **preserved, not dropped**. Existing code that reads `errorMessage` (the system monitoring dashboard at `/admin/monitoring`) continues to work. New code should read `errorDetails` for structured data. The `errorMessage` column will be deprecated and eventually removed once all consumers migrate to `errorDetails`.

## Learnings

- **Snapshot truncation**: Naive `JSON.parse(json.substring(...))` fails on truncated JSON. Use key-by-key accumulation with size budget instead.
- **Retry error history**: Store `_previousErrors` in the errorDetails JSONB during retry prep, then extract and carry forward on next failure. This avoids needing a separate column.
- **Never-throw pattern**: Error recording must never throw — use nested try/catch with progressively simpler fallbacks (full errorDetails → errorMessage only → log to console).
- **PipelineResult limitations**: The orchestrator's `PipelineResult` type doesn't expose `failedAgent` directly. Use `agentTimings` keys as a proxy — the last timed agent was running when it failed.
