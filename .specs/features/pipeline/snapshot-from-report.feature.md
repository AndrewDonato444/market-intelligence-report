---
feature: Snapshot from Report
domain: pipeline
source: app/api/admin/test-suite/snapshots/from-report/route.ts
tests:
  - __tests__/admin/snapshot-from-report.test.ts
components:
  - TestSuiteDashboard
  - ReportDetailPanel
personas:
  - anti-persona-report
status: implemented
created: 2026-03-14
updated: 2026-03-14
---

# Snapshot from Report

**Source File**: `app/api/admin/test-suite/snapshots/from-report/route.ts`
**Design System**: `.specs/design-system/tokens.md`
**Personas**: Admin user (internal MSA team — not a luxury agent persona)

## Feature: Create Pipeline Test Snapshot from Completed Report

Admin users can create a pipeline test suite snapshot from any completed report.
This re-runs Layer 0 (data fetch) using the report's market parameters — hitting
the cache so no new API calls are made — and saves the compiled data as a frozen
snapshot for replay testing through Layers 1–3.

This is the primary way to seed production with test data, since the CLI script
(`scripts/create-snapshot-from-cache.ts`) requires local DB access.

### Scenario: Happy path — create snapshot from completed report
Given a report with status "completed" exists
And the report's market has geography, luxury tier, and price floor defined
When the admin clicks "Save as Snapshot" on the report detail page
Then the system re-fetches market data using the report's market parameters
And the compiled data is saved as a new pipeline snapshot
And the snapshot's `sourceReportId` links back to the original report
And the snapshot appears in the test suite dashboard
And a success toast confirms "Snapshot created from {report title}"

### Scenario: Snapshot captures metadata correctly
Given a completed report for "Naples, FL" with 50 properties
When a snapshot is created from that report
Then the snapshot name is "{market name} — from Report {report title truncated}"
And `propertyCount` reflects the actual property count in compiled data
And `hasXSentiment` reflects whether X sentiment data was fetched
And `peerMarketCount` reflects the number of peer markets in compiled data
And `geography` matches the report's market geography

### Scenario: Report is not completed — button hidden
Given a report with status "generating" or "failed" or "queued"
When the admin views the report detail page
Then the "Save as Snapshot" button is not visible

### Scenario: Duplicate snapshot from same report
Given a snapshot already exists with `sourceReportId` matching this report
When the admin clicks "Save as Snapshot" again
Then a new snapshot is created (duplicates are allowed)
And the snapshot name appends a count: "{name} (2)"

### Scenario: API error during data re-fetch
Given a completed report exists
But the cache has expired and the external API is unreachable
When the admin clicks "Save as Snapshot"
Then the button shows a loading spinner during the fetch
And if the fetch fails, an error toast shows "Failed to create snapshot: {error}"
And no snapshot row is created

### Scenario: Large compiled data set
Given a completed report with 200+ properties and 5 peer markets
When a snapshot is created
Then the full compiled data is stored as JSONB (no truncation)
And the snapshot can be used to run the pipeline test suite

## User Journey

1. Admin navigates to **Admin → Reports → Report Detail**
2. **[This feature]** — Admin clicks "Save as Snapshot" on a completed report
3. Admin navigates to **Admin → Test Suite** to see the new snapshot and run pipeline tests

## UI Mockup

### Report Detail Page — Snapshot Button

```
┌─ Report Detail (bg: surface, shadow: sm) ────────────────────────────┐
│                                                                       │
│  Naples Luxury Market Intelligence Report                             │
│  (font: serif, text: 2xl, weight: bold, color: text)                 │
│                                                                       │
│  Status: ● Completed (color: success)     3m 42s                     │
│  Market: Naples, FL — Ultra-Luxury ($10M+)                           │
│  Generated: Mar 12, 2026                                              │
│                                                                       │
│  ┌─ Actions (flex, gap: spacing-2) ──────────────────────────────┐   │
│  │ [Retry] [View PDF] [Save as Snapshot (bg: primary, color:     │   │
│  │                      text-inverse, radius: sm)]               │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ... sections, API usage, etc ...                                     │
└───────────────────────────────────────────────────────────────────────┘
```

### Loading State

```
┌─ Actions ────────────────────────────────────────────────────────────┐
│ [Retry] [View PDF] [⟳ Creating Snapshot... (bg: primary/50,         │
│                      disabled, cursor: wait)]                        │
└──────────────────────────────────────────────────────────────────────┘
```

### Success Toast

```
┌─ Toast (bg: surface, border-l: 4px accent, shadow: md) ─────────────┐
│  ✓ Snapshot created from "Naples Luxury Market..."                    │
│  View in Test Suite →                                                 │
└──────────────────────────────────────────────────────────────────────┘
```

## Technical Design

### API Endpoint

`POST /api/admin/test-suite/snapshots/from-report`

**Request body:**
```json
{
  "reportId": "uuid"
}
```

**Response (201):**
```json
{
  "snapshot": { "id": "...", "name": "...", "propertyCount": 50, ... }
}
```

**Error responses:**
- `400` — missing reportId
- `404` — report not found
- `422` — report status is not "completed"
- `500` — data fetch failed

### Implementation Flow

1. Validate admin auth
2. Fetch report + market data from DB
3. Reject if report status ≠ "completed"
4. Call `fetchAllMarketData()` with the market's parameters (should hit cache)
5. Extract metadata: propertyCount, hasXSentiment, peerMarketCount
6. Generate snapshot name from market name + report title
7. Insert into `pipeline_snapshots` with `sourceReportId`
8. Return created snapshot

### Key Constraint

The compiled data is **not stored on the report** — it's computed in-memory during
pipeline execution. This endpoint re-runs Layer 0 (`fetchAllMarketData`) which should
hit the DB cache for recently completed reports. If cache has expired, it will make
fresh API calls (which costs credits).

## Component References

- TestSuiteDashboard: `.specs/design-system/components/test-suite-dashboard.md` (stub)
- Report Detail Page: `app/admin/reports/[id]/page.tsx`

## Learnings

_(to be filled after implementation)_
