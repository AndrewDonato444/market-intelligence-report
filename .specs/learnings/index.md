# Learnings Index

Cross-cutting patterns learned in this codebase. Updated via `/compound`.

## Quick Reference

| Category | File | Summary |
|----------|------|---------|
| Testing | [testing.md](./testing.md) | Mocking, assertions, test patterns |
| Performance | [performance.md](./performance.md) | Optimization, lazy loading, caching |
| Security | [security.md](./security.md) | Auth, cookies, validation |
| API & Data | [api.md](./api.md) | Endpoints, data handling, errors |
| Design System | [design.md](./design.md) | Tokens, components, accessibility |
| General | [general.md](./general.md) | Other patterns |

---

## Recent Learnings

<!-- /compound adds recent learnings here - newest first -->

### 2026-03-28 — Design Refresh: Settings & Account Pages Token Migration

- **BrandPreview dual-token boundary** (`design.md`): Report-facing component inside app-facing page — container border uses app tokens, interior uses report tokens. General rule: chrome = app, content preview = report.
- **Two-hop mkt→app migration** (`design.md`): ChangePasswordSection was already on warm fonts but wrong color family (mkt vs app). Button semantics shift: `--color-mkt-text` bg → `--color-app-accent` bg.
- **className assertion for token tests** (`testing.md`): `element.className.toContain("--token-name")` is simpler than `fs.readFileSync` source inspection and catches actual rendered class application.
- **replace_all ordering for token migration** (`testing.md`): Replace longest tokens first (`--color-text-tertiary` before `--color-text`) and use boundary delimiters (`)]`) to prevent substring conflicts.

### 2026-03-28 — Design Refresh: Report Creation Flow Token Migration

- **Bulk sed token migration ordering** (`design.md`): Replace longest tokens first (`--color-primary-light` before `--color-primary`) to prevent substring conflicts. Use `var()` closing paren as boundary delimiter.
- **Additive-only palette migration** (`design.md`): Never rename/delete/change existing CSS custom property values — just stop referencing cold tokens in components. Semantic tokens (`--color-success`, etc.) are never migrated.
- **Source file inspection test pattern** (`testing.md`): Use `fs.readFileSync` + string/regex assertions to verify token migration rather than DOM queries. Negative-lookahead regex `(?!app-)` distinguishes cold from warm tokens.
- **Token migration breaks existing querySelector tests** (`testing.md`): After migrating tokens, grep all test files for old token names — `querySelector` with CSS variable class names fails silently when the class changes.

### 2026-03-16 — ToS Acceptance on Signup (#Security)

- **Auth metadata as compliance bridge** (`security.md`): Store `tos_accepted_at` in Supabase `user_metadata` during signUp, read it in `ensureUserProfile` when creating the DB row. This bridges the client-side acceptance with server-side persistence without a separate API call.
- **Nullable column for backward compat** (`general.md`): New compliance columns (like `tos_accepted_at`) must be nullable — existing users get NULL, not blocked. Admin can filter by NULL to find non-accepting users for audit.
- **Client-side form gate for legal compliance** (`security.md`): Validate ToS checkbox before calling `supabase.auth.signUp()` — prevents account creation without acceptance. Error clears when checkbox is toggled on.

### 2026-03-13 — Pipeline Test Suite (#PTS)

- **Snapshot-and-replay pattern for pipeline testing** (`general.md`): Freeze Layer 0 `CompiledMarketData` as JSONB (~750KB), replay through Layers 1→2→3 without API calls. Separate test runner avoids production table pollution. Reuse production `renderReportPdf()` for pixel-identical PDF preview.
- **Fire-and-forget route testing** (`testing.md`): Test the synchronous response path (run record creation + 200) separately from the async pipeline execution. Ensure test fixtures send ALL required fields, not just IDs.

### 2026-03-13 — Remove Market Scorecard Section (#209)

- **Section removal blast radius** (`general.md`): Removing one report section required changes across 13 files — assembler, renderer, agent prompt, schema, validation, eval test-cases, and 6 test files. Keep DB enum for backward compatibility; `GenericSectionPdf` fallback handles old reports gracefully.
- **Section renumbering cascade** (`general.md`): When removing mid-sequence, all subsequent section numbers and test fixture indices must shift. Search `sections[N]` patterns across all tests.

### 2026-03-12 — Bulk Email Campaign Viewer (#167)

- **Mirror-and-adapt pattern for viewer components** (`general.md`): The email campaign viewer mirrors the social media kit viewer (kit-viewer.tsx → email-viewer.tsx, generate-kit-button.tsx → generate-email-button.tsx, kit/page.tsx → emails/page.tsx) but adds email-specific features: collapsible bodies, subject/preview text fields, drip sequence ordering, newsletter bulk copy, persona filter pills with accent-light styling, CTA button previews, and a regeneration confirmation dialog. Reading the reference implementation first and adapting saves time vs building from scratch.
- **Collapsible body pattern for long content** (`design.md`): Email bodies are longer than social media posts — collapsed by default with "View Full Email" toggle. Uses local `useState` per card (not lifted state) since there's no cross-card interaction needed.
- **Newsletter as singular object vs array** (`api.md`): Newsletter is a single `NewsletterContent` object (not an array) with `contentBlocks[]` inside it. Copy Full Newsletter composes headline + subheadline + all blocks + footer CTA as formatted text.
- **Confirmation dialog for destructive actions** (`design.md`): Regenerate Campaign shows a popover confirmation ("This will replace your current email campaign. Continue?") instead of acting immediately — uses absolute positioning relative to the button, not a full modal.

### 2026-03-12 — Entitlement Gating in Report Creation (#174)

- **MockNextResponse for route tests in jsdom** (`testing.md`): `next/server` imports fail in jsdom because `Request` is undefined. Mock `next/server` with a lightweight `MockNextResponse` class + `MinimalRequest` polyfill instead of switching to node environment.
- **Entitlement fetch on mount breaks existing tests** (`testing.md`): Adding a `fetch` call on component mount means ALL existing tests rendering that component must update their fetch mocks to handle the new endpoint. Always grep for test files rendering the modified component.
- **Two-layer entitlement enforcement** (`api.md`): Client-side check (UX — preemptive gate) + server-side check (authoritative 403). Client never trusted. Usage increment fires only after successful creation (fire-and-forget).
- **Soft gate > hard wall for entitlement UX** (`design.md`): Inline banner with "View Plans" CTA + "Maybe Later" dismiss. Agent can still see their configuration. `role="alert"` for screen readers, `aria-describedby` linking disabled button to gate banner.
- **Fail-open with AbortController timeout** (`api.md`): 5-second timeout on entitlement check via `AbortController`. On failure or timeout, enable the button and hide usage indicator. Server-side check is the real gate.

### 2026-03-11 — Entitlement Check Utility (#173)

- **Mock call counter vs conditional branches** (`testing.md`): When implementation conditionally skips DB queries, call-counter mocks break. Compute branch state at setup time and map call numbers dynamically.
- **Entitlement resolution test matrix** (`testing.md`): 16 scenarios covering tier caps, overrides, unlimited, expired, cumulative, defaults, unknown types, and fail-open.

### 2026-03-11 — Usage Tracking (#172)

- **Atomic upsert with Drizzle** (`api.md`): `onConflictDoUpdate` with `sql\`count + 1\`` achieves atomic increment without read-then-write races. Requires a unique composite index as conflict target.
- **Implicit monthly reset** (`general.md`): No cron job needed for monthly usage resets — each new month simply has no record yet. First action creates one with count=1. Old records preserved for history.
- **Cumulative vs monthly entitlement pattern** (`general.md`): Cumulative entitlements use fixed epoch + null periodEnd (one row forever). Monthly use calendar month boundaries. Classification via const arrays + type guards.
- **Chained Drizzle mock for upsert tests** (`testing.md`): For `insert().values().onConflictDoUpdate()`, chain three mock fns. Reset in `beforeEach` to avoid stale mock state between tests.

### 2026-03-11 — Social Media Kit Regeneration (#164)

- **Fire-and-forget vs sync error handling** (`api.md`): Per-section regeneration returns 202 immediately. Synchronous throws return 500; async rejections are caught by `.catch()` and logged.
- **sectionOnly agent prompt pattern** (`api.md`): Append "SECTION-ONLY REGENERATION" to the full prompt context — agent sees all data but populates only the target array. Service merges via spread.
- **Sync throw mock for fire-and-forget tests** (`testing.md`): Use `mockImplementation(() => { throw ... })` not `mockRejectedValue()` when testing error paths in async endpoints that don't await.
- **Request polyfill body support** (`testing.md`): The edge-runtime Request polyfill needs `_body` + `json()` parsing for POST route tests.

### 2026-03-11 — Subscription Tier Data Model (#170)

- **Drizzle boolean for Postgres** (`general.md`): Use `boolean()` from `drizzle-orm/pg-core` for native Postgres boolean columns, not `integer` with 0/1. Requires adding `boolean` to the import list
- **JSONB entitlements convention** (`general.md`): -1 = unlimited, 0 = not included, positive integer = cap. Extensible without schema changes — new entitlement types are just new keys
- **Idempotent seed with onConflictDoNothing** (`general.md`): Drizzle's `.onConflictDoNothing()` maps to `ON CONFLICT DO NOTHING` — safe to re-run without duplicate checks
- **Schema test pattern for new tables** (`testing.md`): Test column existence via `Object.keys(table)`, constraints via `.notNull`, migration SQL content via `fs.readFileSync` + string assertions. Matches existing user-status and activity-log test patterns

### 2026-03-11 — Landing Page v2 Redesign

- **Mock report card text collisions** (`testing.md`): Shared text between hero mock card and other sections (metrics, labels) causes `getByText` failures. Always scope with `within(screen.getByTestId(...))` or use exact-match regex anchors
- **Commission verb for luxury CTA** (`design.md`): "Commission a Report" outperforms "Request" or "Get Started" for advisory positioning — implies bespoke work
- **Split hero with product preview** (`design.md`): Copy left + mock report card right works for product-led pages without needing real screenshots
- **Anchor nav with scroll-mt-16** (feature spec): Only 3 nav links keeps header clean; `scroll-mt-16` clears the fixed nav on anchor scroll

### 2026-03-11 — Report Eval Dashboard (#142)

- **Eval dashboard mirroring pattern** (`general.md`): The report eval dashboard mirrors the agent eval dashboard architecture (localStorage, batch execution with concurrency pool, AbortController, JSON export) but adds criterion/fixture filter dropdowns and two new breakdown panels. Mirror-and-extend is faster than abstracting prematurely
- **Dashboard result type vs runner result type** (`api.md`): The API strips the full `report` object and adds `reportSectionCount` + `reportConfidence` fields. The dashboard uses its own `ReportEvalDashboardResult` interface that matches the API response shape, not the runner's `ReportEvalRunResult` type
- **Floating-point assertion gotcha** (`testing.md`): `(4.2 / 5) * 100` evaluates to `84.00000000000001` in JS, not `84`. Use `toBeCloseTo()` instead of `toBe()` for division-derived percentages

### 2026-03-11 — Admin Report List (#121)

- **Proxy-based Drizzle mock for API route tests** (`testing.md`): When the query chain is complex (select → from → innerJoin → innerJoin → where → orderBy → limit → offset), use a JS Proxy that returns itself for any method call and resolves as a thenable. Avoids maintaining brittle mock chains
- **`getAllByText` for shared labels** (`testing.md`): When table column headers share names with filter dropdown options (e.g., "Agent", "Market"), use `getAllByRole("columnheader")` to scope to table headers, or `getAllByText().length` for presence checks
- **`@jest-environment node` for Next.js API route tests** (`testing.md`): API routes that import `NextRequest` fail in jsdom because `Request` is undefined. Add `@jest-environment node` docblock to the test file
- **Admin list dashboard pattern** (`general.md`): Consistent pattern for admin list pages: API route with filters/sort/pagination → client component with fetch + debounced search + status filter tabs + dropdown filters + sortable table + pagination + empty/loading/error states

### 2026-03-11 — Report Error Tracking Schema (#120)

- **JSON snapshot truncation gotcha** (`general.md`): `JSON.parse(truncatedString)` always fails — iterate keys with byte budget instead
- **Retry error history via `_previousErrors`** (`general.md`): Store accumulated history in JSONB, extract on next failure
- **Never-throw error recording** (`api.md`): Nested try/catch fallback chain ensures pipeline status is always updated
- **PipelineResult proxy for failedAgent** (`general.md`): `Object.keys(agentTimings).pop()` identifies the running agent at failure time
- **Error tracking service test pattern** (`testing.md`): Mock sequential DB failures to test never-throw guarantees

### 2026-03-11 — User Status Schema (#110)

- **Edge middleware + Drizzle incompatibility** (`security.md`): Edge middleware can't import Drizzle/postgres-js. Use Supabase REST API with service role key for status checks in middleware
- **Fail-open for status checks** (`security.md`): If status query fails, allow access rather than locking everyone out. Availability > security for a non-critical check
- **Redirect loop prevention** (`security.md`): Status pages (`/suspended`, `/account-inactive`) must be excluded from the status check, otherwise suspended users get infinite redirects
- **Schema migration with safe defaults** (`general.md`): Add columns with `DEFAULT 'active'` and `NOT NULL` — existing rows get backfilled automatically, no multi-step migration needed
- **Drizzle DB mock pattern for service tests** (`testing.md`): Chain mock fns (`mockDbSelect → mockDbFrom → mockDbWhere → mockDbLimit`) to simulate Drizzle's fluent API. Use `jest.requireActual` for schema to get real column definitions while mocking `db`

### 2026-03-11 — Step 4: Your Audience (fetch-driven step with selection order)

- **Nested button gotcha** (`design.md`): HTML forbids `<button>` inside `<button>` — use `<span role="link" tabIndex={0}>` for interactive children inside `<motion.button>` cards
- **Fetch-driven step pattern** (`general.md`): For API-backed steps, fetch on mount, show loading skeleton, allow skipping on error/empty. Validation = `true` on error so wizard isn't blocked
- **Selection order via array index** (`general.md`): `selectedIds.indexOf(id) + 1` gives 1-based order; `filter()` on deselect auto-renumbers. No separate counter needed
- **Fetch mock helpers for tests** (`testing.md`): `mockFetchSuccess`/`mockFetchEmpty`/`mockFetchError` configure `global.fetch` per test. Use `act(async () => render(...))` + `waitFor` for the fetch-then-render cycle
- **getByText collision with preview** (`testing.md`): When preview panel duplicates card text, use `getAllByTestId("audience-persona-card")[0]` instead of `getByText("Name")`

### 2026-03-11 — Step 3: Your Focus (ToggleCard pattern)

- **Framer Motion mock must include all element types** (`testing.md`): When adding `motion.button` to a component, ALL test files that render that component (including parent shell tests) must include `motion.button` in their framer-motion mock. Missing element types cause "Element type is invalid: got undefined" errors
- **ToggleCard as unified toggle pattern** (`design.md`): A single `ToggleCard` component with `role="switch"` + `aria-checked` handles both segments and property types — no need for separate `SegmentCard` / `PropertyTypeCard` components. Props: `value`, `label`, `description?`, `icon`, `selected`, `popular`, `onToggle`
- **Smart defaults via static state mapping** (`general.md`): For v1, map state abbreviations to default selections rather than calling APIs. Compute once via `useMemo` on mount, initialize `useState` with the result. "Popular" badges use a stable `Set` from the defaults that doesn't change on toggle
- **Validation + emission pattern for multi-select steps** (`general.md`): Use two `useEffect` hooks — one for `onValidationChange(isValid)`, one for `onStepComplete(data)` that only fires when valid. For toggle-based steps, the empty state prompt shows only when `!isValid && defaultSegments.length === 0`

### 2026-03-10 — Animation & UX Infrastructure

- **Framer Motion v12 Easing type** (`design.md`): Use `import type { Easing }` and annotate constants — `as const` and `as number[]` both fail strict TS
- **Variant data vs components** (`design.md`): Keep animation variant objects in `lib/animations.ts` (no React) separate from `"use client"` components
- **Portal tooltip positioning** (`design.md`): `createPortal` + `useEffect` for portal target + `requestAnimationFrame` for position measurement
- **Framer Motion JSDOM mock** (`testing.md`): Replace `motion.div` with plain `div` via `forwardRef`, destructure away animation props, `AnimatePresence` → `Fragment`

### 2026-03-10 — Persona Content in PDF Template

- **PDF renderer dispatch pattern** (`design.md`): Register in RENDERER_MAP, export component, getSectionRenderer dispatches by sectionType string
- **Cross-cutting callout injection** (`design.md`): Add PersonaFramingCallout at SectionPage level (not per-renderer) — avoids duplicating logic across 4 renderers
- **Data source humanization** (`general.md`): camelCase dot-notation keys → title case via regex split + capitalize; special-case "yoy" → "YoY"
- **getAllByText for multi-match** (`testing.md`): When rendered content repeats across personas/sections, use `getAllByText().length > 0` instead of `getByText` which throws on multiple matches

### 2026-03-10 — Persona Intelligence Agent

- **Agent template pattern** (`general.md`): 4-step pipeline registration: agent file → ALL_AGENTS → SECTION_REGISTRY_V2 → section-grouping loop
- **Claude agent test mocking** (`testing.md`): Mock `@anthropic-ai/sdk` class, build `buildMockClaudeResponse(n)` helper, mock DB services with full schema shapes
- **Error tagging for retry** (`api.md`): Tag all agent errors with `retriable: boolean` — 429/500/503 and JSON parse → true, abort/400 → false
- **Graceful upstream degradation** (feature spec): Note missing upstreams in prompt instead of throwing — partial context still produces useful output

### 2026-03-10 — Persona Selection UI

- **Wizard step insertion pattern** (`general.md`): When inserting a step, update STEPS array and shift all step index conditionals
- **Pre-fetch on mount** (`general.md`): Fetch personas when wizard mounts, not on step transition — avoids loading spinners
- **Card selection with data attributes** (`design.md`): Use `data-selected="true|false"` for both styling and test assertions
- **Preview panel toggle pattern** (`design.md`): Single `previewPersonaSlug` state, toggle on click, switch on different card click
- **Regex exact matching** (`testing.md`): Use `^(A|B|C)$` anchors to avoid partial string matches in `getAllByText`
- **Multi-step wizard test helpers** (`testing.md`): Extract `renderAtStepN()` to reduce setup duplication

### 2026-03-09 — Admin Dashboard + Eval Suite

- **Route groups vs real directories** (`general.md`): `app/(admin)/` doesn't create a URL segment — use `app/admin/` instead
- **jest.mock fails on non-existent modules** (`testing.md`): Use local mock functions in TDD when target module doesn't exist yet
- **@testing-library/jest-dom import required** (`testing.md`): Must explicitly import for DOM matchers
- **Role-based admin auth pattern** (`security.md`): `requireAdmin()` composes auth ID + profile role check
- **Split environment gotchas** (`general.md`): Remote auth + local DB requires manual profile row insertion
- **Never `supabase db reset`** (`general.md`): Destroys all local data; use `node -e` or Studio SQL Editor

---

## How This Works

1. **Feature-specific learnings** → Go in the spec file's `## Learnings` section
2. **Cross-cutting learnings** → Go in category files below
3. **General patterns** → Go in `general.md`

The `/compound` command analyzes your session and routes learnings to the right place.
