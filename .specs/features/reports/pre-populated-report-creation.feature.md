---
feature: Pre-populated Report Creation
domain: reports
source:
  - components/reports/creation-flow-shell.tsx
  - app/(protected)/reports/create/page.tsx
tests:
  - __tests__/reports/creation-flow-prepopulate.test.tsx
components:
  - CreationFlowShell
personas:
  - rising-star-agent
  - established-practitioner
status: implemented
created: 2026-03-29
updated: 2026-03-29
---

# Pre-populated Report Creation

**Source File**: `components/reports/creation-flow-shell.tsx`
**Design System**: `.specs/design-system/tokens.md`
**Personas**: `.specs/personas/rising-star-agent.md`

## Problem

When a user clicks "Generate New Report" on a market tile in the dashboard, they're taken to `/reports/create?marketId={id}` — but the creation form ignores the `marketId` query parameter and always starts at step 1 (market selection). This creates unnecessary friction: the user already told us which market they want by clicking on it. The form should auto-trigger the existing quick-start path, skipping market and tier selection and landing on the Audience step.

## Feature: Pre-populated Report Creation from Dashboard

When the report creation page loads with a `?marketId=` query parameter matching a saved market, it should automatically pre-populate market and tier data and skip to the Audience step — the same behavior as clicking "Use This" on a market in step 1, but triggered automatically on mount.

### Scenario: User clicks Generate New Report on a dashboard market tile
```gherkin
Given I am on the dashboard and I have a saved market "Los Angeles Luxury" with id "mkt-la"
When I click the "Los Angeles Luxury" market tile
Then I am navigated to /reports/create?marketId=mkt-la
And the creation flow auto-selects the "Los Angeles Luxury" market
And the creation flow pre-fills the tier based on the market's luxury tier
And I land on step 3 "Your Audience" (skipping market and tier selection)
```

### Scenario: User navigates to create page without marketId
```gherkin
Given I navigate directly to /reports/create (no query params)
When the page loads
Then I see step 1 "Your Market" as usual
And no auto-selection occurs
```

### Scenario: User navigates with invalid marketId
```gherkin
Given I navigate to /reports/create?marketId=nonexistent-id
When the page loads
Then the marketId does not match any of my saved markets
And I see step 1 "Your Market" as usual
And no error is shown
```

### Scenario: User navigates with marketId but has a saved draft
```gherkin
Given I have a draft saved at step 3 (Audience) from a previous session
And I navigate to /reports/create?marketId=mkt-la
When the page loads
Then the marketId takes priority over the draft
And I land on step 3 with the market from the query param pre-selected
```

### Scenario: Pre-populated tier defaults match the market's luxury tier
```gherkin
Given a market "Naples Ultra Luxury" with luxuryTier "ultra_luxury"
When the creation flow auto-selects this market via marketId
Then the tier is set to "ultra_luxury"
And the price floor defaults to $10,000,000
```

## User Journey

1. User is on **Dashboard** → sees market tiles
2. Clicks a market tile → **Report Creation** with `?marketId=`
3. Lands directly on **Step 3: Your Audience** (market + tier pre-filled)
4. Selects personas → **Step 4: Review** → **Step 5: Generate**

Alternatively:
1. User clicks "Generate New Report" from Reports page (no marketId) → starts at Step 1 as usual

## Technical Approach

### Changes needed

**`CreationFlowShell`** (`components/reports/creation-flow-shell.tsx`):
- Accept optional `preselectedMarketId?: string` prop
- In the existing `useEffect` that restores drafts, check for `preselectedMarketId` first
- If `preselectedMarketId` matches a market in the `markets` array, call the existing `handleQuickStart` logic (set market data, tier data, jump to step 2)
- If no match, fall through to normal draft restore / step 1 behavior

**`CreateReportPage`** (`app/(protected)/reports/create/page.tsx`):
- Read `searchParams.marketId` from the page props
- Pass it to `CreationFlowShell` as `preselectedMarketId`

### What does NOT change
- The `handleQuickStart` callback logic (already correct)
- The dashboard `MarketCard` link (already passes `?marketId=`)
- The step components themselves
- The draft persistence system (just priority ordering changes)

## Component References

- CreationFlowShell: `components/reports/creation-flow-shell.tsx`
- MarketCard (existing, no changes): `components/dashboard/market-card.tsx`
- StepYourMarket (existing, no changes): `components/reports/steps/step-your-market.tsx`

## Learnings
