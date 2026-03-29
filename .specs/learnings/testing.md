# Testing Learnings

Patterns for testing in this codebase.

---

## Mocking

<!-- Patterns for mocking dependencies, APIs, etc. -->

### 2026-03-13 — Pipeline Test Suite (#PTS)
- **Pattern**: For fire-and-forget pipeline routes (POST starts run, updates DB on completion), test the synchronous path only — verify the run record is created with `status: "running"` and returned immediately. The async `.then()` / `.catch()` executes after the response; testing it requires flushing promises or integration tests.
- **Pattern**: When POST API routes require multiple fields (e.g., `compiledData`, `marketName`, `geography`), tests must send ALL required fields — not just the ID. A test that only sends `snapshotId` will get 400 from the snapshot creation route, not 200. Match the API contract exactly in test fixtures.
- **Pattern**: For admin test suite features with multiple API routes (snapshots CRUD, runs CRUD, PDF generation), organize tests in a single file grouped by `describe` blocks per route. Each block gets its own mock setup/reset. This mirrors the `pipeline-retrigger-api.test.ts` pattern.

### 2026-03-12 — Entitlement Gating Route Tests (#174)
- **Gotcha**: `next/server` module imports `Request` from Node internals which isn't available in jsdom. Instead of switching to `@jest-environment node` (which breaks React component imports), mock `next/server` entirely with a lightweight `MockNextResponse` class that has `status`, `json()`, and a static `json()` factory. Add a `MinimalRequest` polyfill with `url`, `method`, `headers`, `_body`, and `json()` to `globalThis.Request` if undefined. This avoids both the jsdom polyfill gap and the undici/TextDecoder dependency chain.
- **Gotcha**: Adding `fetch` on mount to an existing component (e.g., entitlement check in StepYourReview) breaks every test that renders that component or its parents. Existing `mockFetchSuccess`/`mockFetchReportError` helpers and parent shell tests all need updating to handle the new endpoint. After adding a mount-time fetch, grep for `renderReview\|step-your-review\|StepYourReview` across all test files.
- **Pattern**: For tests that click a button that's initially disabled during a loading fetch, use `await act(async () => render(...))` + `await waitFor(() => expect(btn).not.toBeDisabled())` before the click. This ensures the async mount fetch resolves and enables the button before user interaction is simulated.

### 2026-03-11 — Entitlement Check Utility (#173)
- **Gotcha**: When mocking sequential Drizzle queries with a call counter (`callCount++`), conditional branches in the implementation that skip a query (e.g., skipping tier lookup when `tierId` is null) shift all subsequent mock call numbers. The fix: compute at mock setup time whether the branch will be taken (e.g., `const hasTierId = subscription?.tierId !== null`), then map call numbers to queries dynamically (`isOverridesCall = hasTierId ? callCount === 3 : callCount === 2`). This is a general gotcha for any call-counter mock pattern where the implementation has conditional DB queries.
- **Pattern**: For entitlement-style services with layered resolution (tier → overrides → usage), test the full matrix: quota remaining, cap hit, unlimited tier, override boost, multiple overrides (most favorable wins), expired overrides, null expiresAt, unlimited override, cumulative entitlements, feature not included (cap 0), override unlocking excluded feature, no subscription (defaults), unknown entitlement type, and DB error (fail-open). This 16-test matrix covers the entire resolution algorithm.

### 2026-03-11 — Kit Regeneration (#164)
- **Pattern**: For fire-and-forget API routes, test synchronous errors with `mockImplementation(() => { throw new Error(...) })` instead of `mockRejectedValue()`. A rejected promise from an unawaited call won't be caught by the route's try/catch — only synchronous throws will. This distinction matters for testing error handling in async endpoints that return 202.
- **Pattern**: The Request polyfill for API route tests needs a `_body` field and `json()` method that parses it. Add body support: `constructor(url, init) { this._body = init?.body ?? null; }` and `json() { return Promise.resolve(this._body ? JSON.parse(this._body) : {}); }`.

### 2026-03-11 — Usage Tracking (#172)
- **Pattern**: For Drizzle `insert().values().onConflictDoUpdate()` chains, set up three chained mock fns (insert → values → onConflictDoUpdate). Each mock returns an object with the next method. Reset all three in `beforeEach` to avoid stale state. Assert `onConflictDoUpdate` was called with `target` (array of columns) and `set` (object with SQL expression).
- **Pattern**: For services with graceful degradation (try/catch returning default), test by making the mock throw synchronously, then assert the function resolves to the default value (0 for queries, undefined for mutations). Spy on `console.error` to suppress noise and optionally verify error logging.

### 2026-03-11 — Subscription Tier Data Model (#170)
- **Pattern**: For schema-only features (no UI), tests split into two files: (1) schema structure tests verifying column existence, constraints, migration SQL, and type exports via `Object.keys(table)` and `.notNull` checks; (2) seed data tests verifying tier values, entitlement conventions, and idempotency via mocked DB insert with `onConflictDoNothing` assertion. This two-file pattern (schema + seed) is reusable for any table + seed pair.
- **Pattern**: Export seed data as a named constant (`DEFAULT_TIERS`) alongside the seed function. Tests can import and validate the data directly without calling the DB, while the seed function handles the actual insert.

### 2026-03-11 — Report Eval Dashboard (#142)
- **Gotcha**: `(4.2 / 5) * 100` evaluates to `84.00000000000001` due to floating-point arithmetic. Always use `toBeCloseTo()` instead of `toBe()` when asserting on division-derived percentages in tests.
- **Pattern**: For admin page server component tests with `requireAdmin()`, the three-mock pattern is reliable: mock `next/navigation` (redirect throws), mock `@/lib/supabase/admin-auth` (returns admin ID or null), mock the client component (returns string). This pattern is now used identically for `/admin/eval` and `/admin/eval/report` pages.

### 2026-03-11 — Admin Report List API + Component (#121)
- **Pattern**: For Next.js API route tests that import `NextRequest`, use `@jest-environment node` docblock at the top of the test file. The default jsdom environment doesn't define `Request` globally, causing import failures.
- **Pattern**: When the Drizzle query chain is complex (many joins, where, orderBy, limit, offset), use a JS `Proxy` object that returns itself for any method call and implements a `then` method to make it thenable. This avoids maintaining brittle mock chains that break when the query structure changes. Set `mockDbSelectResult` and `mockDbError` module-level variables to control what the proxy resolves to.
- **Gotcha**: Table column headers ("Agent", "Market") also appear in filter dropdown `<option>` elements, causing `getByText` to throw "multiple elements found". Use `getAllByRole("columnheader")` to scope column header assertions, or `getAllByText(...).length >= 1` for presence checks.
- **Gotcha**: `window.location.href` assignment in jsdom doesn't actually navigate. Instead of asserting the URL changed, verify the clickable row has `cursor: pointer` style and that `window.location.href` was written to (or mock it in `beforeEach`).

### 2026-03-11 — Error tracking service tests (#120)
- **Pattern**: For services with multiple DB operations (read + write), build the mock chain with separate clear/reset functions per operation. `resetMocks()` in `beforeEach` clears all mock call history without resetting implementations. Use `mockDbLimit.mockResolvedValueOnce(...)` for per-test data, `mockDbWhere.mockRejectedValueOnce(...)` for simulating DB failures.
- **Pattern**: Test never-throw guarantees by mocking sequential failures (first attempt + fallback both reject) and asserting `resolves.toBeUndefined()`. Spy on `console.error` to verify error logging without noise.

### 2026-03-11 — Drizzle DB mock for service unit tests
- **Pattern**: To test Drizzle service functions without a DB, mock `@/lib/db` with chained mock functions that mirror the fluent API: `db.select() → .from() → .where() → .limit()` and `db.update() → .set() → .where() → .returning()`. Use `jest.requireActual("@/lib/db/schema")` for the schema export so column definitions and enum values are real. Control return values via `mockDbReturning.mockReturnValue([...])` or `mockDbLimit.mockReturnValue([...])` per test.
- **Gotcha**: When using `jest.useFakeTimers({ now })` in Drizzle service tests, remember to call `jest.useRealTimers()` in cleanup. Otherwise, subsequent tests that use `Date` may get stale timestamps.

### 2026-03-11 — Fetch-driven component testing
- **Pattern**: For components that fetch data on mount, create `mockFetchSuccess`/`mockFetchEmpty`/`mockFetchError` helpers that configure `global.fetch` per test. Use `await act(async () => { render(...) })` + `await waitFor(() => { expect(screen.getByText("...")).toBeInTheDocument() })` to wait for the fetch-then-render cycle. This pattern avoids `act()` warnings from async state updates.
- **Gotcha**: When a preview panel shows the same persona name as the card grid, `screen.getByText("Name")` throws on multiple matches. Use `screen.getAllByTestId("audience-persona-card")[0]` to target the card directly instead of finding by text content.

### 2026-03-11 — Framer Motion mock completeness
- **Gotcha**: When a new component uses `motion.button` (or any `motion.X` element not yet in the mock), ALL test files that render that component — including parent component tests like `creation-flow-shell.test.tsx` — must add that element to their framer-motion mock. Otherwise the mock returns `undefined` for the missing element, causing "Element type is invalid: got undefined" in `ToggleCard`. Always check parent test mocks when adding new `motion.*` elements.

### 2026-03-10 — Framer Motion mocking
- **Pattern**: Mock `framer-motion` for JSDOM tests by replacing `motion.div` with a plain `div` via `React.forwardRef`. Destructure and discard animation props (`initial`, `animate`, `exit`, `variants`, `whileTap`) from rest-props to prevent React DOM warnings. Wrap `AnimatePresence` as a pass-through `Fragment`. This lets tests verify rendered content, attributes, and data-testids without a real animation engine.

### 2026-03-10
- **Pattern**: For Claude agent tests, mock `@anthropic-ai/sdk` at the module level with `jest.mock` returning a class whose `messages.create` method is a `jest.fn()`. Store the mock create fn as a module-level variable for per-test response control. Also mock `@/lib/config/env` with a test API key.
- **Pattern**: When an agent calls a DB service (e.g., `getReportPersonas`), mock the service module (`jest.mock("@/lib/services/buyer-personas")`). Build realistic mock persona objects matching the full DB schema shape (all JSONB fields) — tests catch schema mismatches early.
- **Pattern**: Build a `buildMockClaudeResponse(personaCount)` helper that generates a valid `PersonaIntelligenceOutput` JSON string. This lets tests verify parse logic, multi-persona blending, and edge cases by varying the count parameter.

### 2026-03-09
- **Gotcha**: `jest.mock("@/path/to/module")` fails with "Could not locate module" if the file doesn't exist yet on disk. When writing tests before implementation (TDD), use local mock functions instead of `jest.mock` for modules that haven't been created yet.
- **Pattern**: For admin auth testing, mock `getAuthUserId` and `getProfile` separately, then test the composed `requireAdmin()` function. This lets you test all combinations (unauth, auth but no profile, auth but non-admin, admin).

---

## Source File Inspection Tests

<!-- Patterns for tests that read source files directly -->

### 2026-03-28 — Design Refresh Token Migration Tests
- **Pattern**: Use `fs.readFileSync` to read component source files and assert token presence/absence. This is more reliable than DOM-based assertions for CSS custom property migration since class names with `var()` references are hard to query via `querySelector`.
- **Pattern**: Negative-lookahead regex `var\(--color-(?!app-)` asserts cold tokens are absent while allowing warm `--color-app-*` variants to pass. Wrap in a helper (`assertNoColdColorTokens`) that iterates a cold token list and calls `fail()` with the filename for clear error messages.
- **Gotcha**: Existing tests using `document.querySelector` with CSS variable class names (e.g., `.bg-\\[var\\(--color-accent\\)\\]`) break silently when tokens are migrated. After any token migration, grep all test files for the old token names and update selectors. Pattern: `grep -r "color-accent\|color-primary\|font-serif\|font-sans" __tests__/`.

### 2026-03-28 — Settings & Account Design Refresh (className assertion approach)
- **Pattern**: An alternative to `fs.readFileSync` source inspection is `element.className.toContain("--token-name")` which asserts on the rendered DOM class string. Works well when tests render components via `@testing-library/react` — simpler setup, catches actual runtime class application, and no need for path resolution. Best for components where the token names appear directly in className strings.
- **Pattern**: Helper functions `hasVar(el, varName)` and `findByVar(container, varName)` that recursively search the DOM tree for elements whose className contains a CSS variable name. Useful for finding accent lines, card backgrounds, and other elements without dedicated test IDs.
- **Gotcha**: When using `replace_all` for bulk token migration in source files, order matters — replace longer token names first (e.g., `--color-text-tertiary` before `--color-text-secondary` before `--color-text`) and use boundary delimiters (e.g., match `--color-text)]` not just `--color-text`) to prevent substring conflicts.

---

## Assertions

<!-- Common assertion patterns, custom matchers -->

### 2026-03-11 — Landing Page v2 test scoping
- **Gotcha**: When a mock report card in the hero shares text with other sections (e.g., "Ultra-Luxury" label appears in both metric card and segment grade row, "10" appears in credibility strip and report section numbering), `getByText` throws "multiple elements found". Fix with `within(screen.getByTestId("data-callouts"))` for section scoping, or `getAllByText(/^The Narrative$/i)` with exact-match anchors + length assertion.
- **Pattern**: For pages with many sections sharing vocabulary (e.g., report card preview + report breakdown), assign `data-testid` to every section container and always use `within()` for assertions. This is more resilient than text-based queries as content evolves.

### 2026-03-10
- **Gotcha**: `screen.getByText(/CAGR/)` throws when multiple elements match the regex (e.g., CAGR appears in talking points, metric names, and emphasis lists). Use `screen.getAllByText(/CAGR/).length` with `toBeGreaterThan(0)` for presence checks when duplicates are expected.
- **Pattern**: For PDF renderer tests with rich content, use factory functions (`makePersonaContent()`, `makeBlendedContent()`) with `overrides` parameter. This keeps test data realistic while allowing per-test customization via spread.

### 2026-03-10
- **Gotcha**: When testing pages where the same text appears in multiple sections (e.g., "Request a Sample Report" in hero AND closing), scope queries using `within(screen.getByTestId("hero-section"))` rather than global `screen.getByText()`. Same for `getAllByText().length` when checking footer branding that repeats.
- **Pattern**: For marketing pages, include a guardrail test that checks `main.textContent` against a regex (e.g., `/!/` for no exclamation points). Cheap way to enforce creative brief rules in CI.

### 2026-03-09
- **Gotcha**: `@testing-library/jest-dom` must be explicitly imported (`import "@testing-library/jest-dom"`) in test files that use DOM matchers like `toHaveTextContent`, `toHaveAttribute`, `toBeInTheDocument`. Without it, these matchers throw "not a function" errors.

---

## Test Structure

<!-- Describe/it patterns, setup/teardown, fixtures -->

### 2026-03-10
- **Pattern**: For wizard-style multi-step components, extract a `renderAtStepN()` helper that clicks through to the target step. This reduces duplication across dozens of tests that all need to be on the same step. Used successfully in persona-selection-ui tests (32 tests, each needing to be on step 2 or 3).
- **Pattern**: When testing fetch-driven UI, set up `mockFetch` in `beforeEach` with `setupFetchMock()` helper that handles all URL routes. Override in specific tests by calling `setupFetchMock([])` or `mockFetch.mockImplementation()` for error cases.
- **Gotcha**: `screen.getAllByText(/Market|Sections|Review/)` regex matches partial strings too — "Select Market *" matches because it contains "Market". Use `^` and `$` anchors: `/^(Market|Sections|Review)$/` for exact matches.
- **Pattern**: For selection-order UI testing, use `data-testid="selection-badge-{n}"` on numbered badges. Test badge presence with `screen.getByTestId("selection-badge-1")` rather than trying to find numbers in the DOM text.

---

## Integration Tests

<!-- End-to-end patterns, test databases, etc. -->

_No learnings yet._

---

## Edge Cases

<!-- Common edge cases to always test -->

_No learnings yet._
