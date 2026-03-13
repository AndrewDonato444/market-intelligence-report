---
feature: Entitlement Gating for Expanded Transaction Scope
domain: subscription
source: lib/services/pipeline-executor.ts
tests:
  - __tests__/lib/subscription/entitlement-gating-transaction-scope.test.ts
  - __tests__/db/subscription-tiers-schema.test.ts
  - __tests__/db/user-entitlement-model.test.ts
components: []
personas:
  - rising-star-agent
  - established-practitioner
status: implemented
created: 2026-03-12
updated: 2026-03-12
---

# Entitlement Gating for Expanded Transaction Scope

**Source Files**: `lib/db/schema.ts`, `lib/db/seed-subscription-tiers.ts`, `lib/services/entitlement-check.ts`, `lib/services/pipeline-executor.ts`, `lib/services/data-fetcher.ts`, `components/reports/steps/step-your-review.tsx`
**Design System**: .specs/design-system/tokens.md
**Depends On**: #173 (Entitlement Check Utility)

## Feature: Pro users can analyze beyond last 100 transactions

Transaction scope determines how many property transactions the data fetcher retrieves from RealEstateAPI per search period. Starter tier users are capped at 100 transactions (the current default). Professional tier users can analyze up to 500 transactions. Enterprise tier users have unlimited scope.

This is a **per-report config limit** (like `personas_per_report`), not a monthly usage counter. No usage tracking increment is needed.

### Scenario: Starter user generates report with 100 transaction limit
Given an agent on the Starter plan (transaction_limit = 100)
When the agent generates a report
Then the data fetcher passes limit=100 to each RealEstateAPI property search call
And the review step shows "Analyzing up to 100 transactions per period"

### Scenario: Professional user generates report with 500 transaction limit
Given an agent on the Professional plan (transaction_limit = 500)
When the agent generates a report
Then the data fetcher passes limit=500 to each RealEstateAPI property search call
And the review step shows "Analyzing up to 500 transactions per period"

### Scenario: Enterprise user generates report with unlimited transactions
Given an agent on the Enterprise plan (transaction_limit = -1)
When the agent generates a report
Then the data fetcher does NOT pass a limit (uses API default)
And the review step shows "Unlimited transaction scope"

### Scenario: Review step shows transaction scope indicator
Given a user on any tier viewing the Review step
When the step loads
Then it fetches GET /api/entitlements/check?type=transaction_limit
And displays the transaction scope based on their tier
And Starter users see an upgrade nudge about expanded scope

### Scenario: Pipeline executor resolves transaction limit before data fetch
Given a report is being generated for a user
When the pipeline executor runs Layer 0 (data fetch)
Then it calls checkEntitlement(userId, "transaction_limit") to get the cap
And passes the resolved limit as transactionLimit in DataFetchOptions
And the data fetcher applies this limit to searchProperties calls

### Scenario: Fail-open on entitlement check error
Given the entitlement check fails due to a DB error
When the pipeline runs
Then the data fetcher uses the default limit (100) instead of blocking

### Scenario: No transactionLimit passed to data fetcher
Given transactionLimit is not provided in DataFetchOptions
When the data fetcher runs property searches
Then it does NOT set a limit on search params (uses API default)

---

## Technical Design

### Schema changes
1. Add transaction_limit to TierEntitlements type in lib/db/schema.ts
2. Add transaction_limit: 100 to DEFAULT_ENTITLEMENTS in lib/services/entitlement-check.ts
3. Update seed data: Starter=100, Professional=500, Enterprise=-1

### Pipeline executor changes
1. Import checkEntitlement
2. Before fetchAllMarketData, resolve transaction_limit entitlement
3. Pass transactionLimit to DataFetchOptions

### Data fetcher changes
1. Add transactionLimit to DataFetchOptions
2. Apply as limit on PropertySearchParams

### Review step changes
1. Fetch transaction_limit entitlement on mount
2. Show transaction scope indicator with tier-appropriate messaging

### Entitlement classification
transaction_limit is a per-action entitlement (like personas_per_report). No usage tracking needed.

---

## Edge Cases

| Edge Case | Behavior |
|-----------|----------|
| Entitlement check fails in pipeline | Use default limit (100) |
| Entitlement check fails in UI | Hide transaction scope indicator |
| Admin override grants higher limit | Override respected |
| User upgrades mid-session | Next report uses new tier limit |

