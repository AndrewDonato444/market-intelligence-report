---
feature: User Entitlement Model
domain: subscription
source: lib/db/schema.ts
tests:
  - __tests__/db/user-entitlement-model.test.ts
components: []
personas:
  - team-leader
  - rising-star-agent
status: implemented
created: 2026-03-11
updated: 2026-03-11
---

# User Entitlement Model

**Source File**: lib/db/schema.ts
**Migration**: lib/db/migrations/0006_add_entitlement_overrides.sql
**Design System**: .specs/design-system/tokens.md
**Personas**: .specs/personas/team-leader.md, .specs/personas/rising-star-agent.md

## Feature: User Entitlement Model

Extends the subscription system with per-user entitlement overrides. While #170 defined what each tier includes, this feature lets admins grant individual users extra entitlements beyond their tier — comped access, temporary boosts, or feature unlocks. Each override has an expiry date, a reason, and an audit trail (who granted it and when).

The `entitlement_overrides` table is the missing piece between "tiers exist" (#170) and "entitlements are checked" (#173). The check utility will resolve: tier entitlements + overrides + usage → allowed/denied.

### Scenario: entitlement_overrides table exists with correct columns
Given the database schema is applied
When I inspect the entitlement_overrides table
Then it has columns: id (uuid PK), userId (uuid FK to users), entitlementType (varchar), value (integer), expiresAt (timestamp, nullable), grantedBy (text), reason (text, nullable), createdAt (timestamp)
And userId references users.id with ON DELETE CASCADE
And there is an index on userId
And there is an index on (userId, entitlementType)

### Scenario: entitlementType stores the entitlement key being overridden
Given an admin grants a user extra reports
When I create an override with entitlementType "reports_per_month" and value 20
Then the override stores the entitlement key as a varchar
And the value represents the new cap for that entitlement

### Scenario: value uses the same conventions as TierEntitlements
Given an entitlement override
When value is a positive integer (e.g. 20)
Then the user gets that cap for the entitlement
When value is -1
Then the user gets unlimited access for that entitlement

### Scenario: expiresAt controls override duration
Given an admin grants a temporary entitlement boost
When expiresAt is set to a future date
Then the override is active until that date
When expiresAt is null
Then the override never expires (permanent)

### Scenario: grantedBy tracks which admin created the override
Given an admin grants an entitlement override
When the override is created
Then grantedBy stores the admin's identifier (auth ID or email)
And the value is NOT NULL (every override must have an attribution)

### Scenario: reason provides audit context
Given an admin grants an entitlement override
When they provide a reason like "Comped for beta feedback"
Then the reason is stored for audit purposes
When no reason is provided
Then reason is null (optional field)

### Scenario: multiple overrides per user are allowed
Given a user has an override for reports_per_month
When an admin adds another override for social_media_kits
Then both overrides exist independently
And the entitlement check utility (#173) will read all active overrides for a user

### Scenario: type exports are available
Given the schema module is imported
When I check the exports
Then EntitlementOverridesTable (select type) is exported
And NewEntitlementOverride (insert type) is exported

## User Journey

1. Admin views a user's detail page (#113)
2. Admin decides to grant extra entitlements (#179)
3. **This feature: override is stored in entitlement_overrides table**
4. Entitlement check utility reads tier + overrides to resolve access (#173)
5. User experiences the boosted entitlement in their next gated action (#174-#176)

## Data Model

### entitlement_overrides table

```
entitlement_overrides
----------------------------------------------------------------------
id               | uuid (PK, default random)
userId           | uuid, FK to users.id, ON DELETE CASCADE, NOT NULL
entitlementType  | varchar(100), NOT NULL
value            | integer, NOT NULL
expiresAt        | timestamptz, nullable (null = never expires)
grantedBy        | text, NOT NULL
reason           | text, nullable
createdAt        | timestamptz, default now(), NOT NULL
----------------------------------------------------------------------
INDEXES: userId, (userId + entitlementType)
```

## Implementation Notes

- entitlementType is a varchar, not an enum — extensible as new entitlement types are added
- value uses the same convention as TierEntitlements: positive = cap, -1 = unlimited
- No unique constraint on (userId, entitlementType) — a user can have multiple overrides for the same entitlement type (e.g., stacking or replacement). The check utility (#173) will use the most favorable active one
- grantedBy is text (not a FK) to handle admin users who may be deleted later — audit trail persists
- The migration is additive-only: creates a new table, no modifications to existing tables (tierId + Stripe columns were already handled in #170's migration)

## Component References

None — this is a backend/schema feature. Admin UI for managing overrides is #179.
