---
feature: Pipeline Test Suite
domain: admin
source: app/admin/test-suite/page.tsx
tests:
  - __tests__/admin/pipeline-test-suite.test.tsx
components:
  - TestSuiteDashboard
  - SnapshotSelector
  - PipelineRunner
  - PdfPreview
design_refs:
  - lib/pdf/document.tsx
  - lib/services/pipeline-executor.ts
  - lib/eval/fixtures.ts
personas:
  - team-leader
  - anti-persona-report
status: implemented
created: 2026-03-13
updated: 2026-03-13
---

# Pipeline Test Suite

**Source Files**: `app/admin/test-suite/page.tsx`, `lib/services/pipeline-test-runner.ts`
**Design System**: `.specs/design-system/tokens.md`
**Personas**: Admin user (you — the founder testing pipeline quality)

## Context

The report generation pipeline makes ~200 API calls per market (RealEstateAPI property search + details, ScrapingDog news + local, Grok X sentiment). When testing PDF output quality or pipeline changes, creating new markets burns real API credits every time.

The solution: **snapshot real Layer 0 data from previously-generated markets**, then replay it through Layers 1→2→3 on demand — zero API calls. The admin gets an end-to-end test suite that produces real PDFs from real data, instantly.

### What Already Exists

| Component | Location | What It Does |
|-----------|----------|-------------|
| Test pipeline CLI | `scripts/test-pipeline.ts` | Runs layers 0/1/2 independently, outputs JSON |
| Eval fixtures | `lib/eval/fixtures.ts` | 11 synthetic `ComputedAnalytics` objects for agent testing |
| Eval dashboard | `/admin/eval` | Scores individual agent outputs with LLM judge |
| Report eval | `/admin/eval/report` | Evaluates full assembled reports |
| Pipeline executor | `lib/services/pipeline-executor.ts` | Production 4-layer pipeline |
| Cache table | `cache` in Supabase | Stores API responses with TTL |

### What's Missing

1. **No way to freeze Layer 0 output** from a real market run and replay it later
2. **No admin UI** to select cached data and run pipeline without API calls
3. **No PDF preview** from test runs — you have to create a real report to see the PDF
4. **No comparison** — can't diff two pipeline runs side-by-side

---

## Problem Statement

Every time the admin wants to test:
- "Did my pipeline code change break anything?" → creates new market → ~200 API calls → $$$
- "Does the PDF look right after my formatting fix?" → same thing
- "How does the report look for a thin-data market?" → same thing

With ~2000 test credits and ~200 calls per market, that's only 10 test runs before credits are exhausted.

---

## Feature: Pipeline Test Suite

### Scenario: Admin views the test suite dashboard
Given the admin navigates to `/admin/test-suite`
When the page loads
Then they see a list of available data snapshots (markets with cached Layer 0 data)
And each snapshot shows: market name, geography, property count, snapshot date, data freshness
And there is a "Run Pipeline" button for each snapshot

### Scenario: Admin creates a data snapshot from an existing report
Given a report has been successfully generated for a market (status = "completed")
When the admin clicks "Save Snapshot" on that report
Then the system captures the Layer 0 `CompiledMarketData` for that market
And stores it as a named snapshot in the `pipeline_snapshots` table
And the snapshot appears in the test suite dashboard

### Scenario: Admin creates a snapshot from cached API data
Given a market has cached API responses in the `cache` table
When the admin clicks "Create Snapshot from Cache" for that market
Then the system reconstructs `CompiledMarketData` from cached responses
And stores it as a named snapshot
And the snapshot includes metadata: property count, news count, has X sentiment, peer market count

### Scenario: Admin runs the pipeline from a snapshot (no API calls)
Given a data snapshot exists for "Palm Beach, FL"
When the admin clicks "Run Pipeline" on that snapshot
Then the system runs Layer 1 (computation) from the snapshot's CompiledMarketData
And runs Layer 2 (agents) from the computed analytics
And runs Layer 3 (assembly) to produce report sections
And zero external API calls are made
And the run progress is shown in real-time (Layer 1 ✓ → Layer 2 running → ...)
And the completed run shows: duration per layer, section count, confidence level

### Scenario: Admin previews the PDF from a test run
Given a pipeline test run has completed successfully
When the admin clicks "Preview PDF"
Then the system generates a PDF from the assembled report sections
And displays it in an inline PDF viewer
And provides a download link
And the PDF uses the same renderer as production (`renderReportPdf`)

### Scenario: Admin compares two test runs
Given two pipeline runs exist for the same snapshot
When the admin selects both runs for comparison
Then a side-by-side view shows: section-by-section diff of content length, key metrics changes, confidence levels
And highlights which sections changed between runs

### Scenario: Admin runs pipeline with modified agent prompts
Given a data snapshot exists
When the admin toggles "Use Draft Prompts" before running
Then the system uses agent prompt overrides from a draft config (if any exist)
And the run is tagged as "draft" in results
And the admin can compare draft vs production prompts on the same data

### Scenario: Pipeline test run fails gracefully
Given a data snapshot exists
When the admin runs the pipeline and Layer 2 (agents) fails
Then the error is displayed with the specific agent that failed
And Layer 1 results are still available for inspection
And the admin can retry from the failed layer

### Scenario: Admin manages snapshots
Given multiple snapshots exist
When the admin wants to clean up
Then they can rename, delete, or mark snapshots as "golden" (never auto-delete)
And golden snapshots are highlighted in the list
And non-golden snapshots can be bulk-deleted

### Scenario: Admin seeds test suite from scripts/output
Given JSON files exist in `scripts/output/` from `test-pipeline.ts` runs
When the admin clicks "Import from CLI Output"
Then the system reads `layer-0-compiled-market-data.json`
And creates a snapshot from it
And the snapshot is available for pipeline runs

---

## Data Model

### `pipeline_snapshots` table

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `name` | text | Human-readable name (e.g., "Palm Beach — Jan 2026") |
| `market_name` | text | Market name |
| `geography` | jsonb | `{ city, state, county }` |
| `compiled_data` | jsonb | Full `CompiledMarketData` (Layer 0 output) |
| `property_count` | integer | Number of properties in snapshot |
| `has_x_sentiment` | boolean | Whether X sentiment data is included |
| `peer_market_count` | integer | Number of peer markets |
| `is_golden` | boolean | Protected from deletion |
| `source_report_id` | uuid (nullable) | Report this was snapshotted from |
| `created_at` | timestamptz | When snapshot was created |

### `pipeline_test_runs` table

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `snapshot_id` | uuid | FK → pipeline_snapshots |
| `status` | text | `running`, `completed`, `failed` |
| `layer_1_result` | jsonb | ComputedAnalytics output |
| `layer_2_result` | jsonb | Agent results |
| `layer_3_result` | jsonb | Assembled report sections |
| `layer_durations` | jsonb | `{ layer1Ms, layer2Ms, layer3Ms }` |
| `error` | jsonb | Error details if failed |
| `is_draft` | boolean | Used draft prompts |
| `created_at` | timestamptz | Run timestamp |

---

## UI Mockup

### Test Suite Dashboard (`/admin/test-suite`)

```
┌──────────────────────────────────────────────────────────────────────┐
│  Pipeline Test Suite                                    [Import CLI] │
│  ━━━━━━━━━━━━━━━━━━                                                 │
│                                                                      │
│  Data Snapshots                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ ★ Palm Beach, FL          │ 187 props │ 2 peers │ X sentiment │  │
│  │   Snapshotted: Mar 11     │ Source: Report #a3f2              │  │
│  │                           │ [Run Pipeline]  [Preview Last PDF] │  │
│  ├────────────────────────────────────────────────────────────────┤  │
│  │   Aspen, CO               │ 42 props  │ 1 peer  │ No X       │  │
│  │   Snapshotted: Mar 9      │ Source: CLI import                │  │
│  │                           │ [Run Pipeline]  [Preview Last PDF] │  │
│  ├────────────────────────────────────────────────────────────────┤  │
│  │   NYC Ultra-Luxury         │ 200 props │ 3 peers │ X sentiment│  │
│  │   Snapshotted: Mar 12     │ Source: Report #b7c4              │  │
│  │                           │ [Run Pipeline]  [Preview Last PDF] │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  Recent Test Runs                                                    │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ Run #1  │ Palm Beach  │ ✓ Complete │ 12.4s │ 9 sections │ PDF │  │
│  │ Run #2  │ Palm Beach  │ ✓ Complete │ 11.8s │ 9 sections │ PDF │  │
│  │ Run #3  │ Aspen       │ ✗ Failed   │ L2 err│ retry      │     │  │
│  │ Run #4  │ NYC         │ ● Running  │ L2... │            │     │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  [Compare Runs ▼]                                                    │
└──────────────────────────────────────────────────────────────────────┘
```

### Pipeline Run Progress (inline, replaces button)

```
┌────────────────────────────────────────────────────┐
│  Running: Palm Beach, FL                           │
│                                                    │
│  Layer 1 — Computation    ✓ 0.3s                   │
│  Layer 2 — Agents         ● 8.2s  (3/4 agents)    │
│  Layer 3 — Assembly       ○ waiting                │
│                                                    │
│  ━━━━━━━━━━━━━━━━━━━━░░░░░░░░  68%                │
│                                        [Cancel]    │
└────────────────────────────────────────────────────┘
```

### PDF Preview (modal or panel)

```
┌──────────────────────────────────────────────────────────────────────┐
│  PDF Preview — Palm Beach, FL (Run #1)             [Download] [✕]   │
│  ─────────────────────────────────────────────────────────────       │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │                                                         │        │
│  │   ┌───────────────────────────────────┐                 │        │
│  │   │         COVER PAGE                │                 │        │
│  │   │   Palm Beach Luxury Market        │                 │        │
│  │   │   Intelligence Report             │                 │        │
│  │   └───────────────────────────────────┘                 │        │
│  │                                                         │        │
│  │   Page 1 of 18                                          │        │
│  │   [◀ prev]  [next ▶]                                   │        │
│  └─────────────────────────────────────────────────────────┘        │
│                                                                      │
│  Run Stats: 9 sections │ 12.4s total │ High confidence              │
└──────────────────────────────────────────────────────────────────────┘
```

---

## User Journey

1. Admin makes a code change to pipeline or PDF templates
2. Admin navigates to `/admin/test-suite`
3. **This feature** — clicks "Run Pipeline" on a golden snapshot
4. Pipeline runs Layers 1→2→3 from frozen data (no API calls)
5. Admin clicks "Preview PDF" to see the output
6. Admin iterates: fix code → re-run → preview → until satisfied
7. Confident the change works, admin pushes code

---

## Architecture

### Pipeline Test Runner (`lib/services/pipeline-test-runner.ts`)

A slimmed-down version of `pipeline-executor.ts` that:
1. Takes `CompiledMarketData` as input (skips Layer 0 entirely)
2. Runs Layer 1 → Layer 2 → Layer 3 sequentially
3. Returns all intermediate results (not just final sections)
4. Does NOT write to `reports` or `report_sections` tables
5. Stores results in `pipeline_test_runs` table instead

```typescript
interface TestRunInput {
  snapshotId: string;
  compiledData: CompiledMarketData;
  marketName: string;
  geography: Geography;
  useDraftPrompts?: boolean;
}

interface TestRunResult {
  runId: string;
  status: "completed" | "failed";
  computedAnalytics: ComputedAnalytics;
  agentResults: AgentResults;
  reportSections: ReportSection[];
  layerDurations: { layer1Ms: number; layer2Ms: number; layer3Ms: number };
  error?: { layer: number; message: string; agent?: string };
}
```

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/admin/test-suite/snapshots` | GET | List all snapshots |
| `/api/admin/test-suite/snapshots` | POST | Create snapshot (from report or cache) |
| `/api/admin/test-suite/snapshots/[id]` | PATCH/DELETE | Update/delete snapshot |
| `/api/admin/test-suite/snapshots/import` | POST | Import from CLI JSON |
| `/api/admin/test-suite/runs` | GET | List test runs |
| `/api/admin/test-suite/runs` | POST | Start pipeline test run |
| `/api/admin/test-suite/runs/[id]` | GET | Get run details + results |
| `/api/admin/test-suite/runs/[id]/pdf` | POST | Generate PDF from run results |

### PDF Generation

The test suite reuses the production PDF path:
1. Take `reportSections` from test run result
2. Build a `ReportData` object with sections + metadata
3. Call `renderReportPdf(reportData, branding)` — same function production uses
4. Return PDF bytes for preview/download

This ensures the test PDF is identical to what a real user would see.

---

## Component References

- Admin layout: `app/admin/layout.tsx`
- Pipeline executor: `lib/services/pipeline-executor.ts`
- PDF renderer: `lib/pdf/renderer.ts`
- Report document: `lib/pdf/document.tsx`
- Eval dashboard (pattern reference): `components/eval/eval-dashboard.tsx`

---

## Implementation Notes

### Priority Order
1. **Data model** — `pipeline_snapshots` + `pipeline_test_runs` tables
2. **Snapshot creation** — from existing reports + CLI import
3. **Pipeline test runner** — Layer 1→2→3 without DB side effects
4. **Admin UI** — dashboard, run progress, snapshot management
5. **PDF preview** — generate + inline viewer
6. **Comparison view** — side-by-side diff (stretch goal)
7. **Draft prompts** — agent prompt overrides (stretch goal)

### Key Decision: Snapshot Storage

**Option A: Store full CompiledMarketData in `pipeline_snapshots.compiled_data` (JSONB)**
- Pro: Self-contained, no external dependencies
- Con: Large (~2-5 MB per snapshot for 200 properties)
- Verdict: Fine for admin-only table with <50 rows

**Option B: Store pointer to cache keys**
- Pro: Smaller table
- Con: Cache entries expire, snapshot becomes invalid
- Verdict: Too fragile

**Recommendation: Option A** — store full data. Admin table, low row count, reliability matters.

### Snapshot Size Estimation
- 200 properties × ~2KB each = ~400KB
- 10 property details × ~5KB each = ~50KB
- News + local + X sentiment = ~100KB
- Peer markets (2) = ~200KB
- **Total: ~750KB per snapshot** — well within Postgres JSONB limits

---

## Learnings

### Implementation (2026-03-13)
- Fire-and-forget pattern works well for pipeline runs — POST returns immediately with `status: "running"`, async execution updates the record. Client polls for updates.
- Proxy-based DB mock from `pipeline-retrigger-api.test.ts` was reusable for all 6 route handlers without modification.
- Test fixture helpers (`buildMinimalCompiledData`, `buildMinimalComputedAnalytics`, etc.) should include ALL required fields to avoid 400 errors from routes that validate input.
- PDF generation from test runs reuses production `renderReportPdf()` — no separate rendering path needed.
- 3 stretch scenarios deferred: comparison view, CLI import route, snapshot-from-cache reconstruction. Core value (run pipeline + preview PDF) is complete.
