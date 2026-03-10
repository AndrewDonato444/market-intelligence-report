# Regression Tests — Drift Audit 2026-03-10

Tests added to prevent recurrence of 5 critical bugs found during the full drift audit.

---

## Bug 1: Stale Cache Fallback Dead Code

**Root Cause**: Both connectors (`realestateapi.ts`, `scrapingdog.ts`) wrote to `cacheKey` on successful API response, but stale fallback read from `cacheKey + ":stale"` — which was never written to. Stale fallback was dead code.

**Fix**: Added `cache.set(cacheKey + ":stale", source, result, 604800)` after every normal cache write (7-day stale TTL).

| ID | Test | File |
|----|------|------|
| — | Regression: writes stale fallback copy alongside normal cache (searchProperties) | `__tests__/connectors/realestateapi.test.ts` |
| — | Regression: writes stale fallback copy alongside normal cache (searchLocal) | `__tests__/connectors/scrapingdog.test.ts` |

---

## Bug 2: Usage Dashboard authId vs DB userId

**Root Cause**: `settings/usage/page.tsx` passed Supabase auth ID directly to `getUsageSummary()` and `getUsageLog()`, but these functions query `api_usage.user_id` which is the internal DB user ID (UUID from `users.id`), not the Supabase auth ID.

**Fix**: Added `getProfile(authId)` resolution, then pass `profile.id` to usage functions.

| ID | Test | File |
|----|------|------|
| PG-USG-R1 | Regression: usage page imports getProfile for userId resolution | `__tests__/account/usage-dashboard.test.tsx` |
| PG-USG-R2 | Regression: usage page passes profile.id (not authId) to getUsageSummary | `__tests__/account/usage-dashboard.test.tsx` |
| PG-USG-R3 | Regression: usage page passes profile.id (not authId) to getUsageLog | `__tests__/account/usage-dashboard.test.tsx` |

---

## Bug 3: Account Settings Hardcoded Stats

**Root Cause**: `settings/account/page.tsx` passed `stats={{ reportCount: 0, marketCount: 0 }}` — hardcoded zeros instead of querying the database.

**Fix**: Added DB queries against `reports` and `markets` tables using the user's profile ID.

| ID | Test | File |
|----|------|------|
| PG-ACC-R1 | Regression: account page queries reports table for count | `__tests__/account/account-settings.test.tsx` |
| PG-ACC-R2 | Regression: account page queries markets table for count | `__tests__/account/account-settings.test.tsx` |
| PG-ACC-R3 | Regression: account page does NOT hardcode zero stats | `__tests__/account/account-settings.test.tsx` |

---

## Bug 4: reportMetrics Type Mismatch

**Root Cause**: `PersonaPreviewPanel` and `ReportWizard` interfaces defined `reportMetrics` as `Array<{metric: string; priority?: string}>` and `talkingPointTemplates` as `Array<{template: string}>`, but the Drizzle schema types them as `string[]`. UI accessed `m.metric` and `t.template` on plain strings, producing `undefined`.

**Fix**: Changed types to `string[] | null` and updated rendering to use strings directly.

| ID | Test | File |
|----|------|------|
| CMP-PSU-R1 | Regression: reportMetrics as string[] renders without crash | `__tests__/buyer-personas/persona-selection-ui.test.tsx` |
| CMP-PSU-R2 | Regression: talkingPointTemplates as string[] renders without crash | `__tests__/buyer-personas/persona-selection-ui.test.tsx` |

---

## Bug 5: Admin Data Sources Route Missing Auth

**Root Cause**: `app/api/admin/data-sources/route.ts` had no `requireAdmin()` check on either GET or POST handlers. Any user (or unauthenticated request) could list data sources and trigger health checks.

**Fix**: Added `requireAdmin()` check to both handlers, returning 403 Forbidden for non-admins.

| ID | Test | File |
|----|------|------|
| API-DSR-R1 | Route file exists | `__tests__/admin/admin-data-sources-route.test.ts` |
| API-DSR-R2 | Regression: route imports requireAdmin | `__tests__/admin/admin-data-sources-route.test.ts` |
| API-DSR-R3 | Regression: GET handler calls requireAdmin | `__tests__/admin/admin-data-sources-route.test.ts` |
| API-DSR-R4 | Regression: GET handler returns 403 for non-admin | `__tests__/admin/admin-data-sources-route.test.ts` |
| API-DSR-R5 | Regression: POST handler calls requireAdmin | `__tests__/admin/admin-data-sources-route.test.ts` |
| API-DSR-R6 | Regression: POST handler returns 403 for non-admin | `__tests__/admin/admin-data-sources-route.test.ts` |

---

## Summary

| Bug | Regression Tests | Status |
|-----|-----------------|--------|
| Stale cache fallback dead code | 2 tests | All pass |
| Usage dashboard userId mismatch | 3 tests | All pass |
| Account settings hardcoded stats | 3 tests | All pass |
| reportMetrics type mismatch | 2 tests | All pass |
| Admin data-sources missing auth | 6 tests | All pass |
| **Total** | **16 regression tests** | **All pass** |
