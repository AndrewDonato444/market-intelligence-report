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

## Bug 6: REAPI Property Type Validation Error

**Root Cause**: The pipeline sends app-level property types (e.g., "estate", "single_family", "penthouse") to RealEstateAPI, which expects enum values `[SFR, MFR, LAND, CONDO, OTHER, MOBILE]`. The `toReapiPropertyTypes()` mapping function existed but was missing entries for luxury property types ("penthouse" → CONDO, "chalet" → SFR, "villa" → SFR). Additionally, Turbopack served stale compiled code after the mapping was added, preventing it from taking effect.

**Fix**: Added missing property type entries to `PROPERTY_TYPE_MAP`. Cleared `.next` cache and restarted dev server.

| ID | Test | File |
|----|------|------|
| CONN-PT-01 | Regression: maps app property types to REAPI enums in request body | `__tests__/connectors/realestateapi.test.ts` |
| CONN-PT-02 | Regression: maps penthouse to CONDO | `__tests__/connectors/realestateapi.test.ts` |
| CONN-PT-03 | Regression: maps chalet to SFR | `__tests__/connectors/realestateapi.test.ts` |
| CONN-PT-04 | Regression: unknown property types map to OTHER | `__tests__/connectors/realestateapi.test.ts` |
| CONN-PT-05 | Regression: deduplicates mapped property types | `__tests__/connectors/realestateapi.test.ts` |
| CONN-PT-06 | Regression: omits property_type when no types provided | `__tests__/connectors/realestateapi.test.ts` |
| CONN-STA-01 | Regression: converts full state names to 2-letter codes | `__tests__/connectors/realestateapi.test.ts` |
| CONN-STA-02 | Regression: preserves 2-letter state codes | `__tests__/connectors/realestateapi.test.ts` |
| CONN-STA-03 | Regression: sends 2-letter state code in API body even when given full name | `__tests__/connectors/realestateapi.test.ts` |

---

## Bug 7: "At a Glance" Shows All Zeros (PDF Template Path Mismatch)

**Root Cause**: `insights-index.tsx` PDF template read flat fields like `execContent?.medianPrice`, but `report-assembler.ts` nests them under `headline` object (`execContent?.headline?.medianPrice`). Also missing `totalVolume`, `yoyVolumeChange`, `yoyTransactionCountChange` fields from assembler.

**Fix**: Updated PDF template to read from `headline` nested object. Added missing fields to report-assembler headline output.

| ID | Test | File |
|----|------|------|
| SVC-RA-01 | Regression: headline includes totalVolume, yoyVolumeChange, yoyTransactionCountChange | `__tests__/agents/report-assembler.test.ts` |

---

## Bug 8: Neighborhood Names Show Raw Zip Codes

**Root Cause**: `buildZipToNeighborhoodMap()` falls back to the raw zip code when the API doesn't return `neighborhood.name`. Many luxury zips (90210, 90077, etc.) had no neighborhood resolution.

**Fix**: Added `WELL_KNOWN_ZIP_NEIGHBORHOODS` static map (~70 entries for LA, Naples, Miami, Palm Beach, NYC) as intermediate fallback before raw zip.

| ID | Test | File |
|----|------|------|
| SVC-MA-01 | Regression: well-known zip returns neighborhood name (Beverly Hills, Bel Air) | `__tests__/services/market-analytics.test.ts` |
| SVC-MA-02 | Regression: unknown zip falls back to zip code | `__tests__/services/market-analytics.test.ts` |

---

## Bug 9: Days on Market / List-to-Sale = N/A (Empty Detail Cohorts)

**Root Cause**: Small detail samples with uneven period splits cause null `percentChange` when one cohort is empty. `computeDetailYoY` didn't guard against empty arrays before computing averages.

**Fix**: Added early return with `{ domChange: null, listToSaleChange: null }` when either cohort is empty.

| ID | Test | File |
|----|------|------|
| SVC-MA-03 | Regression: returns null domChange/listToSaleChange when prior cohort is empty | `__tests__/services/market-analytics.test.ts` |
| SVC-MA-04 | Regression: returns null when current cohort is empty | `__tests__/services/market-analytics.test.ts` |

---

## Bug 10: Wild Outlier Prices ($403M on 1 Transaction)

**Root Cause**: No outlier filtering in the computation pipeline. Single anomalous records (e.g. $403M) distort median, average, and volume calculations.

**Fix**: Added `removeOutliers()` IQR-based filter to `lib/utils/math.ts` (Tukey fences with k=2.0 for luxury markets). Applied in `computeOverallMetrics` and per-neighborhood price/PSF calculations.

| ID | Test | File |
|----|------|------|
| UT-MATH-01 | returns input unchanged when fewer than 4 values | `__tests__/utils/math.test.ts` |
| UT-MATH-02 | removes extreme outliers from dataset | `__tests__/utils/math.test.ts` |
| UT-MATH-03 | keeps all values when no outliers exist | `__tests__/utils/math.test.ts` |
| UT-MATH-04 | respects custom k parameter for wider/narrower fences | `__tests__/utils/math.test.ts` |
| UT-MATH-05 | handles luxury real estate price outliers ($403M) | `__tests__/utils/math.test.ts` |
| SVC-MA-05 | Regression: outlier prices do not skew median | `__tests__/services/market-analytics.test.ts` |

---

## Bug 11: -100.0% YoY on Many Neighborhoods (MIN_SAMPLE Not Enforced)

**Root Cause**: Per-neighborhood YoY was computed even with 1 transaction in one year and 0 in another, producing misleading -100% changes. No minimum sample size was enforced at the neighborhood level.

**Fix**: Added `NEIGHBORHOOD_MIN_SAMPLE = 3` check before calling `computeYoY` per-neighborhood. Insufficient samples return `yoyPriceChange: null` instead of -100%.

| ID | Test | File |
|----|------|------|
| SVC-MA-06 | Regression: tiny samples show null YoY instead of -100% | `__tests__/services/market-analytics.test.ts` |
| SVC-MA-07 | Regression: sufficient samples (3+3) compute YoY normally | `__tests__/services/market-analytics.test.ts` |

---

## Bug 12: Vercel Function Timeout Kills Pipeline Mid-Execution

**Root Cause**: Three related issues caused reports to hang in "generating" status forever:
1. `POST /api/reports` and `POST /api/admin/reports/[id]/retry` had no `maxDuration` export, so Vercel killed the serverless function at the default timeout (15-60s) before Layer 2 (Claude agents) could complete. The fire-and-forget `executePipeline()` catch block never ran, so no error was recorded.
2. `reapStaleReports()` was only called from the user-facing reports page, not from the admin report detail route — so admins saw stale "generating" status.
3. `reapStaleReports()` compared against `createdAt` instead of `generationStartedAt`, meaning retried reports were immediately reaped since their `createdAt` was from the original creation time.

**Fix**: Added `maxDuration = 300` to both routes. Added `reapStaleReports()` call to admin report detail route. Changed stale threshold comparison from `createdAt` to `generationStartedAt`.

| ID | Test | File |
|----|------|------|
| SVC-REAP-001 | Regression: reapStaleReports uses generationStartedAt, not createdAt | `__tests__/pipeline/stale-report-reaping.test.ts` |
| SVC-REAP-002 | Regression: reapStaleReports sets correct error message on stale reports | `__tests__/pipeline/stale-report-reaping.test.ts` |
| SVC-REAP-003 | Regression: POST /api/reports exports maxDuration >= 300 | `__tests__/pipeline/route-max-duration.test.ts` |
| SVC-REAP-004 | Regression: POST /api/admin/reports/[id]/retry exports maxDuration >= 300 | `__tests__/pipeline/route-max-duration.test.ts` |
| SVC-REAP-005 | Regression: admin report detail route calls reapStaleReports | `__tests__/pipeline/route-max-duration.test.ts` |

---

## Summary

| Bug | Regression Tests | Status |
|-----|-----------------|--------|
| Stale cache fallback dead code | 2 tests | All pass |
| Usage dashboard userId mismatch | 3 tests | All pass |
| Account settings hardcoded stats | 3 tests | All pass |
| reportMetrics type mismatch | 2 tests | All pass |
| Admin data-sources missing auth | 6 tests | All pass |
| REAPI property type validation | 9 tests | All pass |
| At a Glance shows all zeros | 1 test | All pass |
| Neighborhood names show raw zips | 2 tests | All pass |
| Detail YoY empty cohorts | 2 tests | All pass |
| Wild outlier prices | 6 tests | All pass |
| Per-neighborhood MIN_SAMPLE | 2 tests | All pass |
| Vercel function timeout kills pipeline | 5 tests | All pass |
| **Total** | **43 regression tests** | **All pass** |
