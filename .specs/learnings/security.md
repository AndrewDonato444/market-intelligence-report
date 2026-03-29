# Security Learnings

Security patterns for this codebase.

---

## Authentication

<!-- Auth flows, session management -->

### 2026-03-09
- **Pattern**: Role-based admin access uses a two-step check: `getAuthUserId()` (Supabase auth) → `getProfile(authId)` (local DB) → check `role === 'admin'`. This is encapsulated in `requireAdmin()` at `lib/supabase/admin-auth.ts`.
- **Decision**: Admin role check is enforced at both the page level (`app/admin/eval/page.tsx`) and API level (`app/api/eval/*`). Both use `requireAdmin()` to ensure only admins can access eval functionality. Returns 403 Forbidden for non-admin API requests.

---

### 2026-03-11 — User Status Auth Gate
- **Gotcha**: Next.js Edge middleware cannot import Drizzle ORM or `postgres-js` — they rely on Node.js-specific APIs unavailable in the Edge runtime. For the user status check in middleware, use the Supabase REST API directly (`fetch` to `/rest/v1/users`) with the `SUPABASE_SERVICE_ROLE_KEY`. This is Edge-compatible.
- **Decision**: Fail-open on status check errors. If the REST API call fails (network, missing env var), return `null` and allow access. Rationale: locking ALL users out due to a transient status-check failure is worse than briefly allowing a suspended user through. The auth gate is defense-in-depth, not the only barrier.
- **Gotcha**: Status pages (`/suspended`, `/account-inactive`) must be marked as `isStatusPage` and exempted from the status redirect check. Otherwise, a suspended user gets redirected to `/suspended`, which triggers the middleware again, which redirects to `/suspended` — infinite loop. Same pattern as `isPublicRoute` for `/sign-in`.

### 2026-03-16 — ToS Acceptance on Signup
- **Pattern**: Store `tos_accepted_at` in Supabase `user_metadata` during `signUp()` call, then read it from `authUser.user_metadata` in `ensureUserProfile()` when creating the DB user row. This bridges the gap between client-side acceptance and server-side persistence without an extra API call — the timestamp flows through Supabase's built-in metadata system.
- **Decision**: Validate ToS checkbox client-side before calling `supabase.auth.signUp()`. This prevents account creation entirely without acceptance. The timestamp is set at form submission time (not backend time) for accurate audit trails.
- **Decision**: `getAuthUser()` was updated to return `user_metadata` alongside `id` and `email`. This is a backward-compatible addition — existing callers that destructure `{ id, email }` still work. The metadata is forwarded to `ensureUserProfile()` as an optional third parameter.

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
