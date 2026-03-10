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
