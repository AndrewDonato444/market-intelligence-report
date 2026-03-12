---
feature: Entitlement Check Utility
domain: subscription
source: lib/services/entitlement-check.ts
tests:
  - __tests__/lib/subscription/entitlement-check.test.ts
components: []
personas:
  - team-leader
  - rising-star-agent
status: implemented
created: 2026-03-11
updated: 2026-03-12
---

# Entitlement Check Utility

**Source File**: lib/services/entitlement-check.ts
**Design System**: .specs/design-system/tokens.md
**Personas**: .specs/personas/team-leader.md, .specs/personas/rising-star-agent.md

## Feature: Entitlement Check Utility

A single `checkEntitlement(userId, entitlementType)` function that resolves a user's effective entitlement by combining three layers:

1. **Tier entitlements** — what the user's subscription tier includes (from `subscription_tiers.entitlements` JSONB via `subscriptions.tierId`)
2. **Entitlement overrides** — per-user boosts or unlocks granted by admins (from `entitlement_overrides`, filtering expired ones, picking the most favorable active override)
3. **Current usage** — how much the user has consumed in the current period (from `usage_records` via `getCurrentUsage()`)

The resolution formula: `effective cap = max(tier cap, best active override) - current usage = remaining`. If remaining > 0 (or cap is unlimited), the action is allowed.

This is the single chokepoint for all gated actions (#174-#176). No feature should implement its own entitlement logic — everything calls `checkEntitlement()`.

### Scenario: checkEntitlement returns allowed when user has remaining quota
Given a user on the Professional tier with reports_per_month cap of 10
And the user has no entitlement overrides
And the user has created 5 reports this month
When I call checkEntitlement(userId, "reports_per_month")
Then the result is { allowed: true, limit: 10, used: 5, remaining: 5 }

### Scenario: checkEntitlement returns denied when user has hit their cap
Given a user on the Starter tier with reports_per_month cap of 2
And the user has no entitlement overrides
And the user has created 2 reports this month
When I call checkEntitlement(userId, "reports_per_month")
Then the result is { allowed: false, limit: 2, used: 2, remaining: 0 }

### Scenario: checkEntitlement handles unlimited tier entitlements
Given a user on the Enterprise tier with reports_per_month cap of -1 (unlimited)
And the user has created 50 reports this month
When I call checkEntitlement(userId, "reports_per_month")
Then the result is { allowed: true, limit: -1, used: 50, remaining: -1 }
And remaining is -1 (sentinel for unlimited)

### Scenario: entitlement overrides boost the effective cap beyond the tier
Given a user on the Starter tier with reports_per_month cap of 2
And an active entitlement override exists for reports_per_month with value 10
And the user has created 3 reports this month
When I call checkEntitlement(userId, "reports_per_month")
Then the result is { allowed: true, limit: 10, used: 3, remaining: 7 }
And the override's value (10) is used because it exceeds the tier cap (2)

### Scenario: the most favorable active override wins when multiple exist
Given a user on the Starter tier with reports_per_month cap of 2
And two overrides exist for reports_per_month: value 5 (no expiry) and value 15 (expires next week)
And the user has created 4 reports this month
When I call checkEntitlement(userId, "reports_per_month")
Then the effective cap is 15 (the highest active override)
And the result is { allowed: true, limit: 15, used: 4, remaining: 11 }

### Scenario: expired overrides are ignored
Given a user on the Starter tier with reports_per_month cap of 2
And an entitlement override exists for reports_per_month with value 20 but expiresAt is yesterday
And the user has created 2 reports this month
When I call checkEntitlement(userId, "reports_per_month")
Then the result is { allowed: false, limit: 2, used: 2, remaining: 0 }
And the expired override is not considered

### Scenario: an override with null expiresAt never expires
Given a user with an entitlement override with expiresAt = null
When I call checkEntitlement for that entitlement type
Then the override is always considered active

### Scenario: an override granting unlimited access (-1) overrides any tier cap
Given a user on the Starter tier with reports_per_month cap of 2
And an active entitlement override exists with value -1 (unlimited)
And the user has created 100 reports this month
When I call checkEntitlement(userId, "reports_per_month")
Then the result is { allowed: true, limit: -1, used: 100, remaining: -1 }

### Scenario: checkEntitlement works for cumulative entitlements (markets_created)
Given a user on the Professional tier with markets_created cap of 3
And the user has created 2 markets total (cumulative, no period reset)
When I call checkEntitlement(userId, "markets_created")
Then the result is { allowed: true, limit: 3, used: 2, remaining: 1 }

### Scenario: feature not included in plan returns denied with limit 0
Given a user on the Starter tier with social_media_kits cap of 0 (not included)
And the user has no overrides for social_media_kits
When I call checkEntitlement(userId, "social_media_kits")
Then the result is { allowed: false, limit: 0, used: 0, remaining: 0 }

### Scenario: override can unlock a feature not included in the tier
Given a user on the Starter tier with social_media_kits cap of 0 (not included)
And an active entitlement override exists for social_media_kits with value 5
And the user has generated 1 social media kit this month
When I call checkEntitlement(userId, "social_media_kits")
Then the result is { allowed: true, limit: 5, used: 1, remaining: 4 }

### Scenario: user with no subscription defaults to Starter-like behavior
Given a user whose subscription has no tierId (null)
When I call checkEntitlement(userId, "reports_per_month")
Then the system uses a hardcoded default entitlement (Starter tier values)
And the result reflects the default cap, not an error

### Scenario: user with no subscription record at all is handled gracefully
Given a userId that has no row in the subscriptions table
When I call checkEntitlement(userId, "reports_per_month")
Then the system uses the hardcoded default entitlement (Starter tier values)
And does not throw an error

### Scenario: unknown entitlement type returns denied
Given a user on any tier
When I call checkEntitlement(userId, "nonexistent_entitlement")
Then the result is { allowed: false, limit: 0, used: 0, remaining: 0 }
And no error is thrown

### Scenario: database errors degrade gracefully to "allowed"
Given a user attempts a gated action
When the database is unreachable during the entitlement check
Then the function returns { allowed: true, limit: -1, used: 0, remaining: -1 }
And the error is logged
And the user's action is not blocked (fail-open for availability)

### Scenario: personas_per_report is checked against a provided count, not usage records
Given a user on the Starter tier with personas_per_report cap of 1
When I call checkEntitlement(userId, "personas_per_report")
Then the result includes limit: 1
And used and remaining reflect current usage from usage_records (0 if no tracking)
And the caller compares the persona count they want to use against the limit

---

## Return Type

```typescript
type EntitlementCheckResult = {
  allowed: boolean;        // Can the user take this action?
  limit: number;           // Effective cap (-1 = unlimited, 0 = not included)
  used: number;            // Current usage in the active period
  remaining: number;       // limit - used (-1 = unlimited)
};
```

---

## Function Signature

```typescript
/**
 * Single entitlement check used app-wide before every gated action.
 * Resolves: tier entitlements + active overrides + current usage -> allowed/denied.
 *
 * Fails open on DB errors (returns allowed: true) to avoid blocking users
 * due to infrastructure issues. Logs all errors.
 */
export async function checkEntitlement(
  userId: string,
  entitlementType: string
): Promise<EntitlementCheckResult>;
```

---

## Resolution Algorithm

```
1. Fetch user's subscription -> get tierId
2. If tierId exists, fetch tier -> get entitlements JSONB
3. Look up entitlementType in tier entitlements -> tierCap (default 0 if missing)
4. Fetch all active overrides for (userId, entitlementType)
   - Active = expiresAt IS NULL OR expiresAt > now()
5. Pick the most favorable override -> overrideCap (highest value, or -1 if any is unlimited)
6. effectiveCap = max(tierCap, overrideCap)
   - Special case: if either is -1, effectiveCap = -1 (unlimited wins)
7. Fetch current usage via getCurrentUsage(userId, entitlementType)
8. If effectiveCap === -1: allowed = true, remaining = -1
9. Else: remaining = effectiveCap - used, allowed = remaining > 0
10. Return { allowed, limit: effectiveCap, used, remaining }
```

---

## User Journey

1. Agent clicks "Generate Report" in the creation flow (#156)
2. **This feature: checkEntitlement(userId, "reports_per_month") is called**
3. If allowed: report generation proceeds (#174)
4. If denied: soft gate with upgrade messaging is shown (#174)
5. Agent sees their usage on the Account & Billing page (#177): "You've used 8 of 10 reports this month"

---

## UI Mockup

No UI in this feature — this is a pure service utility. It powers the gating UX in #174-#176 and the usage display in #177.

### How the result drives UI (preview for context)

**When allowed (reports remaining)**:
```
+-- Report Creation Flow (Step 5: Review & Generate) ----------------------+
|                                                                           |
|  [Generate Report]  (bg: accent, color: primary, radius: sm)             |
|                                                                           |
|  8 of 10 reports used this month                                          |
|  (font: sans, text: xs, color: text-tertiary)                            |
+--------------------------------------------------------------------------+
```

**When denied (cap reached)**:
```
+-- Soft Gate Modal (bg: surface, radius: lg, shadow: lg) -----------------+
|                                                                           |
|  YOU'VE REACHED YOUR MONTHLY LIMIT                                        |
|  (font: serif, text: xl, weight: bold, color: text)                      |
|                                                                           |
|  You've used 2 of 2 reports this month on the Starter plan.              |
|  Upgrade to Professional for 10 reports per month.                        |
|  (font: sans, text: base, color: text-secondary)                         |
|                                                                           |
|  [View Plans]  (bg: accent, color: primary, radius: sm)                  |
|  [Maybe Later]  (color: text-secondary, text: sm)                        |
+--------------------------------------------------------------------------+
```

---

## Dependencies

| Dep | Feature | What it provides |
|-----|---------|-----------------|
| #170 | Subscription Tier Data Model | `subscription_tiers` table, `TierEntitlements` type, entitlements JSONB |
| #171 | User Entitlement Model | `entitlement_overrides` table, per-user override records |
| #172 | Usage Tracking | `usage_records` table, `getCurrentUsage()` function |

---

## Implementation Notes

- **Single function, single file**: `lib/services/entitlement-check.ts` exports `checkEntitlement()` and the `EntitlementCheckResult` type. No class, no singleton — just a function.
- **Reads from three tables**: `subscriptions` (to get tierId) -> `subscription_tiers` (to get entitlements) -> `entitlement_overrides` (active overrides) + `usage_records` (via `getCurrentUsage()`). Consider batching the DB queries where possible (e.g., parallel fetch of overrides and usage).
- **Override resolution**: When multiple active overrides exist for the same (userId, entitlementType), pick the one with the highest `value`. If any override has value = -1, that wins (unlimited). Expired overrides (expiresAt < now) are filtered out.
- **Fail-open**: On any DB error, return `{ allowed: true, limit: -1, used: 0, remaining: -1 }` and log the error. Usage tracking is important but not worth blocking a user's action over. This matches the graceful degradation pattern from #172.
- **Default entitlements**: If a user has no subscription or no tierId, use hardcoded Starter defaults: `{ reports_per_month: 2, markets_created: 1, social_media_kits: 0, personas_per_report: 1 }`. This ensures new users without a tier assignment still have sensible caps.
- **No caching**: Entitlement checks hit the DB every time. These are called infrequently (before gated actions, not on every page load) and must reflect the latest state (admin might have just granted an override). If performance becomes an issue, a short TTL cache can be added later.
- **Reuses existing service**: Uses `getCurrentUsage()` from `lib/services/usage-tracking.ts` rather than querying `usage_records` directly.
- **personas_per_report**: This entitlement is per-action (how many personas can be selected for a single report), not per-period. The check utility returns the limit; the caller (report creation flow) compares the count of selected personas against this limit. No usage_records row is needed — `getCurrentUsage` will return 0 for this type since it's never incremented.

---

## Learnings

### 2026-03-11
- **Gotcha**: The test mock used a call counter to distinguish subscription/tier/overrides queries. When `tierId` is null, the implementation skips the tier lookup, shifting all subsequent call numbers. Fix: compute `hasTierId` at mock setup time and map call numbers dynamically.
- **Pattern**: The resolution algorithm has 16 distinct scenarios (quota remaining, cap hit, unlimited, overrides, expired overrides, defaults, unknown types, fail-open). Each maps 1:1 to a Gherkin scenario in the spec — good spec coverage means good test coverage.
- **Decision**: Fail-open on DB errors (return `allowed: true`) per spec. Availability > correctness for entitlement checks — a user should never be blocked by infrastructure issues.

---

## Component References

None — this is a backend service utility. It's consumed by:
- Report creation gating (#174)
- Market creation gating (#175)
- Social media kit gating (#176)
- Account & Billing page usage display (#177)
