---
feature: Market Definition Wizard
domain: user-setup
source: app/(protected)/markets/new/page.tsx, app/api/markets/route.ts, lib/services/market.ts, lib/services/market-validation.ts
tests:
  - __tests__/markets/market.test.tsx
components:
  - MarketWizard
  - StepIndicator
personas:
  - established-practitioner
  - rising-star-agent
status: implemented
created: 2026-03-09
updated: 2026-03-09
---

# Market Definition Wizard

**Source Files**: `app/(protected)/markets/new/page.tsx`, `app/(protected)/markets/page.tsx`, `app/api/markets/route.ts`, `lib/services/market.ts`
**Design System**: `.specs/design-system/tokens.md`
**Personas**: Established Practitioner (precise market definition), Rising Star (quick setup)

## Feature: Market Definition Wizard

Agents define their target luxury market — geography, luxury tier, price range, segments, and property types. This is the core input that drives every report. The wizard uses a multi-step form with progressive disclosure.

### Scenario: Agent creates a new market
Given an agent is on the Markets page
When they click "Define New Market"
Then they see a multi-step wizard form

### Scenario: Step 1 — Geography
Given the agent is on Step 1 of the wizard
When they enter city, state, and optionally county/region
Then the geography is validated (city + state required)

### Scenario: Step 2 — Luxury Tier and Price Range
Given the agent has completed Step 1
When they select a luxury tier (luxury, high_luxury, ultra_luxury)
And set a price floor (minimum $500K)
And optionally set a price ceiling
Then the tier and price range are validated

### Scenario: Step 3 — Segments and Property Types
Given the agent has completed Step 2
When they select market segments (e.g., waterfront, golf course, gated community)
And select property types (e.g., single_family, estate, condo)
Then the selections are stored

### Scenario: Agent saves the market
Given the agent has completed all wizard steps
When they click "Create Market"
Then the market is saved to the database
And they are redirected to /markets
And a success message appears

### Scenario: Market list shows all markets
Given an agent has created markets
When they visit /markets
Then they see a list of their markets with name, location, tier, and price range

### Scenario: Validation prevents invalid markets
Given the agent is filling out the wizard
When they try to submit without a city or state
Then inline validation errors appear
And the market is not saved

### Scenario: First market is set as default
Given an agent has no markets
When they create their first market
Then it is automatically set as the default market (is_default = 1)

## User Journey

1. Agent signs up and completes profile (Features #3, #10)
2. **Agent defines their target market** (this feature)
3. Agent can later edit or add peer markets (Features #12, #13)
4. Market definition drives report generation (Features #40+)

## UI Mockup

```
┌─ Markets / Define New Market ──────────────────────────────────────────┐
│                                                                         │
│  ┌─ Card (bg: surface, radius: md, shadow: sm) ──────────────────────┐ │
│  │                                                                     │ │
│  │  DEFINE YOUR MARKET (font: serif, text: 2xl, weight: bold)          │ │
│  │  The market definition drives every report. (text: sm, secondary)   │ │
│  │  ── gold line ──                                                    │ │
│  │                                                                     │ │
│  │  ┌─ Step indicator ─────────────────────────────────────────────┐  │ │
│  │  │  ● Geography  ─── ○ Pricing  ─── ○ Segments                  │  │ │
│  │  └──────────────────────────────────────────────────────────────┘  │ │
│  │                                                                     │ │
│  │  STEP 1: GEOGRAPHY                                                  │ │
│  │                                                                     │ │
│  │  Market Name*    [Naples Luxury                ]                     │ │
│  │  City*           [Naples                       ]                     │ │
│  │  State*          [Florida                      ]                     │ │
│  │  County          [Collier County               ]                     │ │
│  │  Region          [Southwest Florida            ]                     │ │
│  │                                                                     │ │
│  │                                    [Next → (bg: accent, radius: sm)]│ │
│  │                                                                     │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

Step 2:
│  STEP 2: PRICING & TIER                                                │
│                                                                        │
│  Luxury Tier*   (○) Luxury ($1M-$6M)                                   │
│                 (●) High Luxury ($6M-$10M)                              │
│                 (○) Ultra Luxury ($10M+)                                │
│                                                                        │
│  Price Floor*   [$6,000,000    ]                                        │
│  Price Ceiling  [$10,000,000   ] (optional)                             │
│                                                                        │
│  [← Back]                       [Next → (bg: accent, radius: sm)]      │

Step 3:
│  STEP 3: SEGMENTS & PROPERTY TYPES                                     │
│                                                                        │
│  Market Segments (select all that apply):                               │
│  [✓] Waterfront    [✓] Golf Course   [ ] Gated Community               │
│  [ ] Ski-in/out    [ ] Mountain View  [ ] Historic District             │
│  [ ] New Development                                                    │
│                                                                        │
│  Property Types (select all that apply):                                │
│  [✓] Single Family  [ ] Estate    [✓] Condo                            │
│  [ ] Townhouse      [ ] Co-op     [ ] Penthouse                        │
│  [ ] Chalet                                                            │
│                                                                        │
│  [← Back]             [Create Market (bg: accent, radius: sm)]         │
```

## API Design

### GET /api/markets
- Returns all markets for the current user
- Auth: requires Clerk session

### POST /api/markets
- Creates a new market
- Validates geography (city + state required), price floor ≥ 500000
- Sets is_default = 1 if it's the user's first market
- Auth: requires Clerk session

## Component References

- MarketWizard: multi-step form component
- StepIndicator: progress dots for wizard steps
