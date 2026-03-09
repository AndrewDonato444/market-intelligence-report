---
feature: Market Configuration Persistence + Edit
domain: user-setup
source: app/(protected)/markets/[id]/edit/page.tsx, app/api/markets/[id]/route.ts, lib/services/market.ts
tests:
  - __tests__/markets/market-edit.test.tsx
components:
  - MarketWizard (reused in edit mode)
personas:
  - established-practitioner
status: implemented
created: 2026-03-09
updated: 2026-03-09
---

# Market Configuration Persistence + Edit

**Source Files**: `app/(protected)/markets/[id]/edit/page.tsx`, `app/api/markets/[id]/route.ts`
**Design System**: `.specs/design-system/tokens.md`

## Feature: Market Configuration Persistence + Edit

Agents can view and edit existing market definitions. The MarketWizard component is reused in "edit mode" with pre-populated fields. A dedicated API endpoint handles fetching a single market and updating it.

### Scenario: Agent views market details
Given an agent has a defined market
When they click on a market card
Then they navigate to the edit page with all fields pre-populated

### Scenario: Agent edits market configuration
Given an agent is on the market edit page
When they modify any field (name, geography, pricing, segments)
And click "Save Changes"
Then the market record is updated in the database
And a success message appears

### Scenario: API returns single market
Given a valid market ID owned by the current user
When GET /api/markets/[id] is called
Then the full market object is returned

### Scenario: API updates market
Given valid updated market data
When PUT /api/markets/[id] is called
Then the market is updated and the updated record returned

### Scenario: API returns 404 for non-existent market
Given an invalid market ID
When GET /api/markets/[id] is called
Then a 404 response is returned

### Scenario: Edit form validates like create form
Given the agent is editing a market
When they clear required fields (name, city, state)
Then validation errors appear inline
And the update is not submitted

### Scenario: Markets list links to edit
Given an agent has markets
When they view the markets list
Then each market card has an edit link

## User Journey

1. Agent creates market via wizard (Feature #11)
2. Agent adds peer markets (Feature #12)
3. **Agent edits market configuration** (this feature)
4. Market definition drives report generation (Features #40+)

## API Design

### GET /api/markets/[id]
- Returns the full market object
- Auth: requires Clerk session
- Returns 404 if not found or not owned by user

### PUT /api/markets/[id]
- Updates market fields
- Validates with validateMarketData
- Auth: requires Clerk session
- Returns 422 for validation errors, 404 if not found
