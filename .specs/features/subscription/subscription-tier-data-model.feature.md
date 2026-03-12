---
feature: Subscription Tier Data Model
domain: subscription
source: lib/db/schema.ts
tests:
  - __tests__/db/subscription-tiers-schema.test.ts
  - __tests__/lib/subscription/seed-tiers.test.ts
components: []
personas:
  - team-leader
  - rising-star-agent
status: implemented
created: 2026-03-11
updated: 2026-03-12
---

# Subscription Tier Data Model

**Source File**: lib/db/schema.ts
**Seed Script**: lib/db/seed-subscription-tiers.ts
**Design System**: .specs/design-system/tokens.md
**Personas**: .specs/personas/team-leader.md, .specs/personas/rising-star-agent.md

## Feature: Subscription Tier Data Model

The platform needs a `subscription_tiers` table that defines what each plan includes — report caps, market limits, social media kit access, and persona limits. Tiers are admin-managed (no self-service checkout yet). This table is the foundation for the entire entitlement system: every gated action (#173+) will check a user's tier to decide what they can do.

The existing `subscriptions` table has a `plan` varchar column that stores "free" by default. This feature adds a proper tier registry that the `plan` field can reference, plus makes Stripe columns nullable (Stripe isn't connected yet).

### Scenario: subscription_tiers table exists with correct columns
Given the database schema is applied
When I inspect the subscription_tiers table
Then it has columns: id (uuid PK), name (varchar, unique), slug (varchar, unique), description (text), entitlements (jsonb), displayPrice (varchar), monthlyPriceInCents (integer, nullable), isActive (boolean, default true), sortOrder (integer), createdAt (timestamp), updatedAt (timestamp)
And the entitlements JSONB has a typed shape for reports_per_month, markets_created, social_media_kits, personas_per_report

### Scenario: entitlements JSONB supports numeric caps and unlimited
Given a subscription tier with entitlements
When I define reports_per_month as 10
Then the value is stored as { "reports_per_month": 10 }
When I define reports_per_month as unlimited
Then the value is stored as { "reports_per_month": -1 }

### Scenario: entitlements JSONB supports feature flags
Given a subscription tier with entitlements
When I define social_media_kits as 0
Then the feature is not included in the plan
When I define social_media_kits as 1
Then the feature is included (1 kit per report)
When I define social_media_kits as -1
Then the feature is unlimited

### Scenario: three default tiers are seeded
Given a fresh database with the subscription_tiers table
When I run the seed script
Then 3 tiers exist: Starter, Professional, Enterprise
And Starter has: reports_per_month=2, markets_created=1, social_media_kits=1, personas_per_report=1, displayPrice="Free", sortOrder=1
And Professional has: reports_per_month=10, markets_created=3, social_media_kits=1, personas_per_report=3, displayPrice="$199/mo", sortOrder=2
And Enterprise has: reports_per_month=-1, markets_created=-1, social_media_kits=-1, personas_per_report=3, displayPrice="Custom", sortOrder=3

### Scenario: seed script is idempotent
Given the seed script has already been run
When I run the seed script again
Then no duplicate tiers are created
And existing tier data is not overwritten

### Scenario: tier slugs are unique and URL-safe
Given I create a tier with name "Professional"
Then its slug is "professional"
And attempting to create another tier with slug "professional" fails with a unique constraint error

### Scenario: sortOrder controls display ordering
Given tiers exist with sortOrder 1, 2, 3
When I query tiers ordered by sortOrder ascending
Then Starter appears first, Professional second, Enterprise third

### Scenario: isActive controls tier visibility
Given a tier with isActive = false
When I query active tiers
Then the inactive tier is excluded
And existing users on that tier are not affected (their entitlements still resolve)

### Scenario: existing subscriptions table gets Stripe columns made nullable
Given the current subscriptions table has stripeCustomerId as NOT NULL
When the migration runs
Then stripeCustomerId becomes nullable
And stripeSubscriptionId remains nullable
And a new tierId column (uuid FK to subscription_tiers) is added, nullable
And the existing plan varchar column is preserved for backward compatibility

### Scenario: tierId on subscriptions references subscription_tiers
Given a user has a subscription with tierId pointing to the Professional tier
When I join subscriptions with subscription_tiers on tierId
Then I get the Professional tier's entitlements JSONB

## User Journey

1. Admin creates/edits subscription tiers in the admin panel (#178)
2. **This feature: tier definitions exist in the database**
3. New users get assigned Starter tier on signup (#180)
4. Entitlement check utility reads tier entitlements before gated actions (#173)
5. Account page shows the user their current plan and what's included (#177)

## Data Model

### subscription_tiers table

```
subscription_tiers
----------------------------------------------------------------------
id                   | uuid (PK, default random)
name                 | varchar(100), unique, NOT NULL
slug                 | varchar(100), unique, NOT NULL
description          | text, nullable
entitlements         | jsonb, NOT NULL
displayPrice         | varchar(50), NOT NULL
monthlyPriceInCents  | integer, nullable (for Stripe later)
isActive             | boolean, default true, NOT NULL
sortOrder            | integer, NOT NULL
createdAt            | timestamptz, default now()
updatedAt            | timestamptz, default now()
----------------------------------------------------------------------
INDEXES: slug (unique), sortOrder
```

### Entitlements JSONB Shape

```typescript
type TierEntitlements = {
  reports_per_month: number;    // -1 = unlimited
  markets_created: number;      // -1 = unlimited
  social_media_kits: number;    // 0 = not included, 1 = per-report, -1 = unlimited
  personas_per_report: number;  // always numeric (1 or 3)
};
```

### subscriptions table changes

```
subscriptions (MODIFIED)
----------------------------------------------------------------------
...existing columns...
stripeCustomerId     | varchar(255), NOW NULLABLE
tierId               | uuid, FK to subscription_tiers.id,
                     | nullable, ON DELETE SET NULL
```

### Seed Data

```
Starter      | Free    | 2 reports/mo  | 1 market  | 1 kit/mo  | 1 persona
Professional | $199/mo | 10 reports/mo | 3 markets | 1/report  | 3 personas
Enterprise   | Custom  | Unlimited     | Unlimited | Unlimited | 3 personas
```

## Implementation Notes

- Use Drizzle boolean type for isActive (not integer 0/1) -- Postgres supports native boolean
- The entitlements JSONB is extensible: new entitlement types can be added without schema changes
- Convention: -1 means unlimited, 0 means not included, positive integer means the cap
- The seed script should use ON CONFLICT (slug) DO NOTHING for idempotency
- The plan varchar on subscriptions is kept for backward compatibility -- existing code that checks plan === "free" continues to work
- tierId on subscriptions is nullable so existing rows don't break -- #180 (signup assignment) will ensure new users always have a tierId
- monthlyPriceInCents is nullable -- only populated when Stripe is connected and tiers have real pricing

## Component References

None -- this is a backend/schema feature. Admin UI for managing tiers is #178.

## Learnings

### 2026-03-11
- **Decision**: Used Drizzle `boolean()` for `isActive` instead of integer 0/1 — Postgres supports native boolean and the spec called for it
- **Decision**: `stripeCustomerId` changed from `.notNull()` to nullable in the Drizzle schema definition (not just the migration) since Stripe isn't connected yet and the spec requires it
- **Pattern**: Exported `TierEntitlements` type directly from schema.ts alongside the table definition, and `SubscriptionTiersTable` as a select type alias — keeps types co-located with the table they describe
- **Pattern**: Seed script exports `DEFAULT_TIERS` as a named constant for test validation, and `seedSubscriptionTiers()` as the executable function. Tests validate data shape without touching the DB
- **Gotcha**: The `subscriptionTiers` table must be defined before `subscriptions` in schema.ts because `subscriptions.tierId` references it via `.references(() => subscriptionTiers.id)`. Drizzle resolves references lazily via arrow functions, but the table variable must be in scope
