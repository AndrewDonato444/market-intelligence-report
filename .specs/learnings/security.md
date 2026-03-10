# Security Learnings

Security patterns for this codebase.

---

## Authentication

<!-- Auth flows, session management -->

### 2026-03-09
- **Pattern**: Role-based admin access uses a two-step check: `getAuthUserId()` (Supabase auth) → `getProfile(authId)` (local DB) → check `role === 'admin'`. This is encapsulated in `requireAdmin()` at `lib/supabase/admin-auth.ts`.
- **Decision**: Admin role check is enforced at both the page level (`app/admin/eval/page.tsx`) and API level (`app/api/eval/*`). Both use `requireAdmin()` to ensure only admins can access eval functionality. Returns 403 Forbidden for non-admin API requests.

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
