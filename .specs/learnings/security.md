# Security Learnings

Security patterns for this codebase.

---

## Authentication

<!-- Auth flows, session management -->

### 2026-03-09
- **Pattern**: Role-based admin access uses a two-step check: `getAuthUserId()` (Supabase auth) → `getProfile(authId)` (local DB) → check `role === 'admin'`. This is encapsulated in `requireAdmin()` at `lib/supabase/admin-auth.ts`.
- **Decision**: Admin role check is at the page level (`app/admin/eval/page.tsx`), not at the API level. API routes (`app/api/eval/*`) still use `getAuthUserId()` for any authenticated user. This keeps the API usable for future integrations while restricting the UI to admins.

---

## Cookies & Tokens

<!-- Cookie settings, token storage, refresh patterns -->

_No learnings yet._

---

## Input Validation

<!-- Sanitization, validation libraries, patterns -->

_No learnings yet._

---

## API Security

<!-- CORS, rate limiting, authorization -->

_No learnings yet._

---

## Secrets Management

<!-- Environment variables, secret storage -->

_No learnings yet._
