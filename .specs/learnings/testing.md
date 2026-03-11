# Testing Learnings

Patterns for testing in this codebase.

---

## Mocking

<!-- Patterns for mocking dependencies, APIs, etc. -->

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

## Assertions

<!-- Common assertion patterns, custom matchers -->

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
