---
feature: Usage Tracking
domain: subscription
source: lib/db/schema.ts
tests:
  - __tests__/db/usage-records-schema.test.ts
  - __tests__/lib/subscription/usage-tracking.test.ts
components: []
personas:
  - team-leader
  - rising-star-agent
status: implemented
created: 2026-03-11
updated: 2026-03-11
---

# Usage Tracking

**Source Files**: lib/db/schema.ts, lib/services/usage-tracking.ts
**Migration**: lib/db/migrations/0007_add_usage_records.sql
**Design System**: .specs/design-system/tokens.md
**Personas**: .specs/personas/team-leader.md, .specs/personas/rising-star-agent.md

## Feature: Usage Tracking

Tracks how many gated actions a user has consumed within their billing period. The `usage_records` table stores per-user, per-entitlement counts with period boundaries. A service layer provides increment and query functions that the entitlement check utility (#173) will use to resolve: tier entitlements + overrides - usage = remaining.

This is the counting layer between "what the user is allowed" (#170 tiers + #171 overrides) and "should this action be permitted" (#173 entitlement check). Without usage tracking, the system knows what a user's caps are but not how much they've consumed.

### Entitlement types tracked

| Entitlement Type | Cap Type | Reset Behavior | Count Trigger |
|-----------------|----------|----------------|---------------|
| `reports_per_month` | Monthly cap | Resets each billing period | Report created (status = "queued") |
| `markets_created` | Cumulative (lifetime) | Never resets | Market created |
| `social_media_kits` | Monthly cap | Resets each billing period | Kit generation triggered |

`personas_per_report` is enforced at report creation time by counting the selected personas — it doesn't need a usage_records row since it's per-action, not per-period.

---

## Scenarios

### Scenario: usage_records table exists with correct columns
Given the database schema is applied
When I inspect the usage_records table
Then it has columns: id (uuid PK), userId (uuid FK to users), entitlementType (varchar), periodStart (timestamptz), periodEnd (timestamptz, nullable), count (integer, default 0), createdAt (timestamptz)
And userId references users.id with ON DELETE CASCADE
And there is an index on (userId, entitlementType, periodStart)

### Scenario: periodStart and periodEnd define the billing window
Given a user on a monthly billing cycle
When a usage record is created for reports_per_month
Then periodStart is the first day of the current calendar month (00:00:00 UTC)
And periodEnd is the first day of the next calendar month (00:00:00 UTC)

### Scenario: cumulative entitlements use null periodEnd
Given a user creates a market
When a usage record is created for markets_created
Then periodStart is the user's account creation date (or a fixed epoch)
And periodEnd is null (indicating no reset)

### Scenario: incrementing usage for a monthly-capped entitlement
Given a user with a usage record for reports_per_month in the current period with count = 3
When the user creates another report
Then the count is incremented to 4
And no new usage record is created (existing row is updated)

### Scenario: incrementing usage creates a record if none exists for the period
Given a user with no usage record for reports_per_month in the current period
When the user creates a report
Then a new usage record is created with count = 1
And periodStart is the start of the current billing month
And periodEnd is the start of the next month

### Scenario: incrementing usage for a cumulative entitlement
Given a user with a usage record for markets_created with count = 2
When the user creates a new market
Then the count is incremented to 3
And the same row is used (cumulative records are never reset)

### Scenario: querying current usage for a monthly entitlement
Given a user with reports_per_month usage of 5 in the current period
When I call getCurrentUsage(userId, "reports_per_month")
Then it returns 5

### Scenario: querying current usage returns 0 when no record exists
Given a user with no usage record for social_media_kits in the current period
When I call getCurrentUsage(userId, "social_media_kits")
Then it returns 0

### Scenario: querying current usage for a cumulative entitlement
Given a user with markets_created usage of 2 (cumulative, no period end)
When I call getCurrentUsage(userId, "markets_created")
Then it returns 2

### Scenario: monthly period rolls over automatically
Given a user with reports_per_month usage of 8 from last month (periodEnd has passed)
When the user creates a report in the new month
Then a new usage record is created for the new period with count = 1
And the old record remains unchanged (historical data preserved)

### Scenario: incrementUsage is atomic
Given two concurrent requests to increment reports_per_month for the same user
When both execute simultaneously
Then the final count reflects both increments (no lost updates)
And this is achieved via an upsert with atomic increment (SET count = count + 1)

### Scenario: type exports are available
Given the schema module is imported
When I check the exports
Then UsageRecordsTable (select type) is exported
And NewUsageRecord (insert type) is exported

### Scenario: service functions are exported
Given the usage tracking service module is imported
When I check the exports
Then incrementUsage(userId, entitlementType) is available
And getCurrentUsage(userId, entitlementType) is available
And getUsageForPeriod(userId, entitlementType, periodStart) is available

---

## User Journey

1. Admin defines tier caps in subscription_tiers (#170) — e.g., Starter: 2 reports/month
2. Admin optionally boosts a user's entitlements via overrides (#171)
3. **This feature: usage is tracked as the user takes gated actions**
4. Entitlement check utility (#173) reads tier + overrides + usage to decide: allowed or denied
5. User sees their usage vs. caps on the Account & Billing page (#177)

---

## Data Model

### usage_records table

```
usage_records
----------------------------------------------------------------------
id               | uuid (PK, default random)
userId           | uuid, FK to users.id, ON DELETE CASCADE, NOT NULL
entitlementType  | varchar(100), NOT NULL
periodStart      | timestamptz, NOT NULL
periodEnd        | timestamptz, nullable (null = cumulative/no reset)
count            | integer, NOT NULL, default 0
createdAt        | timestamptz, default now(), NOT NULL
----------------------------------------------------------------------
INDEXES: (userId, entitlementType, periodStart) — unique composite
```

The unique composite index on (userId, entitlementType, periodStart) ensures one record per user per entitlement per period and enables the atomic upsert pattern.

### Period Conventions

| Entitlement | periodStart | periodEnd | Reset |
|------------|-------------|-----------|-------|
| `reports_per_month` | 1st of current month, 00:00 UTC | 1st of next month, 00:00 UTC | Monthly |
| `social_media_kits` | 1st of current month, 00:00 UTC | 1st of next month, 00:00 UTC | Monthly |
| `markets_created` | Fixed epoch (2024-01-01T00:00:00Z) | null | Never |

---

## Service Layer

### lib/services/usage-tracking.ts

```typescript
// Increment usage for a gated action. Creates a record if none exists for the period.
// Uses INSERT ... ON CONFLICT (userId, entitlementType, periodStart) DO UPDATE SET count = count + 1
// for atomic increments.
incrementUsage(userId: string, entitlementType: string): Promise<void>

// Get current usage count for an entitlement type.
// For monthly: finds the record matching the current billing period.
// For cumulative: finds the record with null periodEnd.
// Returns 0 if no record exists.
getCurrentUsage(userId: string, entitlementType: string): Promise<number>

// Get usage for a specific period (for historical display, account page).
getUsageForPeriod(userId: string, entitlementType: string, periodStart: Date): Promise<number>
```

### Period Resolution

```typescript
// Helper: determine the current billing period for an entitlement type
function getEntitlementPeriod(entitlementType: string): { periodStart: Date; periodEnd: Date | null }

// Monthly entitlements: periodStart = 1st of current month UTC, periodEnd = 1st of next month UTC
// Cumulative entitlements: periodStart = fixed epoch, periodEnd = null
```

### Entitlement Classification

```typescript
// Which entitlements are monthly vs cumulative
const MONTHLY_ENTITLEMENTS = ['reports_per_month', 'social_media_kits'] as const;
const CUMULATIVE_ENTITLEMENTS = ['markets_created'] as const;
```

---

## UI Mockup

No UI in this feature — usage tracking is a backend/service layer. The data surfaces in:
- Account & Billing page (#177): "You've used 3 of 10 reports this month"
- Entitlement gating modals (#174-176): "You've reached your monthly report limit"

### How it will appear to agents (preview for context)

```
+-- Account & Billing (bg: surface, radius: md, shadow: sm) --------------+
|                                                                          |
|  YOUR PLAN (font: sans, text: sm, weight: semibold, color: text-secondary)
|                                                                          |
|  +-- Plan Card (bg: primary-light, radius: sm) ----------------------+  |
|  |  Professional (font: serif, text: xl, weight: bold)               |  |
|  |  $199/mo (font: sans, text: sm, color: accent)                    |  |
|  +-------------------------------------------------------------------+  |
|                                                                          |
|  USAGE THIS MONTH (font: sans, text: sm, weight: semibold)              |
|                                                                          |
|  Reports    ████████░░  8 of 10 (font: sans, text: sm)                  |
|  Markets    ██░░░░░░░░  2 of 3  (font: sans, text: sm)                  |
|  Media Kits ██████░░░░  6 of 10 (font: sans, text: sm)                  |
|                                                                          |
+--------------------------------------------------------------------------+
```

---

## Implementation Notes

- **Atomic upsert pattern**: Use Drizzle's `onConflictDoUpdate` with raw SQL for atomic increment to avoid race conditions. The unique composite index on (userId, entitlementType, periodStart) is the conflict target.
- **Calendar month periods**: Use UTC calendar months (1st to 1st) for simplicity. When Stripe is connected, this can be aligned to the user's billing anchor date — but for admin-managed tiers, calendar month is the right default.
- **Cumulative entitlements**: markets_created uses a fixed epoch as periodStart and null periodEnd. This means one row per user per cumulative entitlement, ever. The count grows forever.
- **No cron job for resets**: Monthly "resets" are implicit — when a new month starts, there's simply no record for that period yet. The first gated action creates one with count=1. Old records stay for historical reference.
- **Historical data**: Old usage records are never deleted. They power the Account & Billing page's historical usage display and any analytics the admin wants.
- **entitlementType is a varchar**, not an enum — matches the convention from #170 and #171. New entitlement types can be added without schema changes.
- **The increment function should be called by the existing service functions** (report.ts createReport(), market.ts createMarket(), social-media-kit.ts generateSocialMediaKit()), but those integration points are wired in #174-#176, not here. This feature only builds the table and the service layer.
- **Graceful degradation**: If the usage_records table is unavailable (DB error), the increment should log the error but not block the user's action. Usage tracking is important but not worth failing a report generation over. The entitlement check (#173) will handle the "can't read usage -> assume allowed" fallback.

---

## Learnings

### 2026-03-11
- **Pattern**: Atomic upsert via Drizzle `onConflictDoUpdate` with `sql\`count + 1\`` — no read-then-write race. The unique composite index doubles as conflict target.
- **Pattern**: Implicit monthly reset — no cron needed. New month = no record = first action creates with count=1.
- **Decision**: Unknown entitlement types default to monthly billing period (safe default).
- **Decision**: Graceful degradation — increment/query failures log errors but don't throw, returning 0 for reads and silently failing for writes.

---

## Component References

None — this is a backend/schema + service feature. Usage data surfaces in:
- Account & Billing page (#177)
- Entitlement gating modals (#174-#176)
- Admin analytics (#130)
