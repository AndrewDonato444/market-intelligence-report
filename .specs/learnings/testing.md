# Testing Learnings

Patterns for testing in this codebase.

---

## Mocking

<!-- Patterns for mocking dependencies, APIs, etc. -->

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
