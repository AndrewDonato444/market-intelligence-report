# API & Data Learnings

Patterns for API and data handling in this codebase.

---

## Email Campaign Content Structure

### 2026-03-12 — Bulk Email Campaign Viewer (#167)
- **Pattern**: Newsletter is a singular object (`NewsletterContent`), not an array — it has `headline`, `subheadline`, `contentBlocks[]`, and `footerCta`. The "Copy Full Newsletter" action composes: `headline\nsubheadline\n\n[blocks joined by \n\n]\n\nfooterCta` where each block is `heading\nkeyMetric\nbody`. This formatted text preserves the newsletter's structure when pasted into an email tool.
- **Pattern**: The status API endpoint returns `data.campaign.content` (not `data.kit.content` like the social media kit). When refreshing a section, the email viewer polls `/api/reports/${id}/email-campaign/status` and reads `data.campaign?.content`.

---

## RealEstateAPI Credit Optimization

The RealEstateAPI has free/cheap query modes to use before full data pulls:

1. **Count query** (`"count": true`) — FREE. Returns number of matching properties.
2. **IDs only** (`"ids_only": true`) — FREE. Returns all matching property IDs. Cross-ref against cache.
3. **Last update filter** (`"last_update_date_min": "YYYYMMDD"`) — Skip stale records.
4. **Exists filter** (`"exists": [{ fieldname: true }]`) — Audit data coverage.
5. **Default size is 50** — set `"size"` explicitly for larger result sets.
6. **Input IDs** (`"ids": []`) — Search through predefined list of properties.

### Optimal fetch flow:
```
1. count: true (free) → know universe size
2. ids_only: true (free) → get all property IDs
3. Cross-ref IDs against cached data → identify new/stale
4. Fetch only new/stale with last_update_date_min → minimize credit usage
```

### Auth: `x-api-key` header. All endpoints POST to `https://api.realestateapi.com`.

---

## Endpoints

### RealEstateAPI
- `/v2/PropertySearch` — find properties by market criteria
- `/v2/PropertyDetail` — single property full details
- `/v3/PropertyComps` — comparable properties + AVM valuation

### ScrapingDog
- `/google_local` — local businesses/amenities via Google Local API
- `/scrape` — raw URL scraping for neighborhood content

---

## Caching & State

- All connectors use cache-first architecture (check cache → call API on miss → store)
- Stale fallback: if API fails, serve expired cache with `stale: true`
- All API calls logged to `api_usage` table for cost tracking
- Cost stored as numeric(10,6)

---

## Error Handling

- Connector wraps fetch errors and logs to api_usage with statusCode
- Stale cache fallback on API errors (graceful degradation)
- Rate limit errors (429) should trigger backoff

### 2026-03-10 — Claude Agent Error Tagging
- **Pattern**: All Claude agents tag errors with `retriable: boolean` before throwing. HTTP 429/500/503 → `retriable: true`. JSON parse failures → `retriable: true` (LLM may produce valid JSON on retry). Abort signals and 400-class errors → `retriable: false`. The orchestrator's `executeWithRetry` reads this flag to decide whether to retry with exponential backoff.

### 2026-03-11 — Structured Error Recording (#120)
- **Pattern**: Pipeline errors now recorded as structured JSONB (`errorDetails`) with agent identity, stack trace, input snapshot, and retry history. Backward compat maintained by also writing flat `errorMessage`.
- **Gotcha**: `PipelineResult` doesn't expose `failedAgent` — use `Object.keys(agentTimings).pop()` as proxy (last timed agent was running at failure time).
- **Pattern**: Never-throw error recording — nested try/catch with fallback chain: full errorDetails → errorMessage only → console.error. Pipeline status must always be updated.

---

### 2026-03-12 — Entitlement Gating Server-Side (#174)
- **Pattern**: Two-layer entitlement enforcement — client-side check on step mount (UX gate, preemptive soft gate) + server-side check before `createReport()` (authoritative 403). The client check is advisory; the server check is the real gate. This means bypassing the UI (e.g., direct POST) still enforces limits.
- **Pattern**: Usage increment is post-success only — call `incrementUsage(userId, "reports_per_month")` after `createReport()` returns successfully, not before. Fire-and-forget via `.catch()`. If creation fails, quota is not consumed. If increment fails, the report still succeeds (graceful degradation).
- **Pattern**: Fail-open with timeout — client-side entitlement check uses `AbortController` with 5-second timeout. On network error, abort, or timeout, enable the button and hide usage indicator. The server-side `checkEntitlement()` also fails open (returns `allowed: true, limit: -1`), so both layers degrade to permissive.
- **Decision**: `GET /api/entitlements/check?type=reports_per_month` is a thin wrapper around `checkEntitlement()`. Needed because the creation flow is client-side and can't call server functions directly. Returns the full `{ allowed, limit, used, remaining }` shape so the client can derive all UI states.

### 2026-03-11 — Usage Tracking Atomic Upsert (#172)
- **Pattern**: Drizzle's `onConflictDoUpdate` with `sql\`${table.count} + 1\`` achieves atomic increment without a read-then-write race. The unique composite index `(userId, entitlementType, periodStart)` serves as both the conflict target and the query index. This maps to `INSERT ... ON CONFLICT (user_id, entitlement_type, period_start) DO UPDATE SET count = count + 1` in SQL.
- **Decision**: Graceful degradation — if the usage_records table is unavailable, `incrementUsage` logs the error but doesn't throw. Usage tracking is important but not worth failing a report generation over.

### 2026-03-11 — Per-Section Kit Regeneration (#164)
- **Pattern**: For partial-resource regeneration endpoints (regenerate one section of a kit), validate the target section name against a whitelist of valid keys. Return 400 for invalid types, 404 if the parent resource doesn't exist, 409 if the parent is currently being generated. The endpoint returns 202 immediately and runs the regeneration async.
- **Decision**: The agent receives all report context (market, analytics, sections, personas) even for single-section regeneration. This ensures generated content is contextually consistent with the rest of the kit. The prompt adds a "SECTION-ONLY" suffix instructing the LLM to populate only the target array.

## Data Shapes

### 2026-03-11 — Report Eval Dashboard (#142)
- **Pattern**: When an API strips a large object from its response (e.g., the full `report` from eval results) and adds derived fields (`reportSectionCount`, `reportConfidence`), define a separate client-side interface (`ReportEvalDashboardResult`) that matches the API response shape. Don't try to reuse the server-side type (`ReportEvalRunResult`) which includes the stripped field.

- RealEstateAPI returns nested objects: `data[].address.full`, `data[].summary.sqft`, etc.
- Connector normalizes to flat `PropertySummary` interface
- ScrapingDog Google Local returns business objects with name, category, rating, reviewCount

---

## Fetching Patterns

- POST for all RealEstateAPI calls, GET for ScrapingDog
- Cache keys built from query params for deduplication
- ConnectorOptions carries userId/reportId for usage attribution
