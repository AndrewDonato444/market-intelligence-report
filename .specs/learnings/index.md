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
