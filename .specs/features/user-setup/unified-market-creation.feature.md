---
feature: Unified Market Creation
domain: user-setup
source: app/(protected)/markets/new/page.tsx, components/markets/market-creation-shell.tsx
tests:
  - __tests__/markets/unified-market-creation.test.tsx
components:
  - MarketCreationShell
  - StepYourMarket
  - StepYourTier
  - CreationStepIndicator
personas:
  - rising-star-agent
  - established-practitioner
status: implemented
created: 2026-03-11
updated: 2026-03-16
---

# Unified Market Creation

**Source Files**: `app/(protected)/markets/new/page.tsx`, `components/markets/market-creation-shell.tsx`
**Design System**: `.specs/design-system/tokens.md`
**Personas**: Rising Star Agent (quick setup, medium patience), Established Practitioner (deliberate, quality-first)
**Replaces**: `components/markets/market-wizard.tsx` (legacy 3-step wizard with plain HTML forms)

## Problem

The Markets tab used a legacy `MarketWizard` (basic inputs, checkbox lists, no smart defaults) while the Dashboard report flow uses the redesigned step components (`StepYourMarket` → `StepYourTier`) with animated transitions, toggle cards, smart state-based defaults, and the full design system. Two different UIs for the same action creates inconsistency and maintenance burden.

## Solution

Replace `MarketWizard` with a new `MarketCreationShell` that composes the same 2 step components from the report creation flow. The shell handles step navigation, validation gating, and API submission. The final action is "Save Market" (not "Generate Report"). The edit page (`/markets/[id]/edit`) also uses this shell in edit mode with pre-populated data.

## Feature: Unified Market Creation

### Scenario: Agent creates a market from the Markets tab
Given an agent is on the Markets page
When they click "Define New Market"
Then they are taken to `/markets/new`
And they see a 2-step flow: Your Market → Your Tier
And the step indicator shows 2 steps (not 5)

### Scenario: Step 1 — Your Market (geography)
Given the agent is on step 1
When they enter city, state, and optionally county/region
Then the market name auto-generates from city + state
And the Next button enables when city and state are filled

### Scenario: Step 2 — Your Tier (pricing + save)
Given the agent completed step 1
When they select a luxury tier (Luxury / High Luxury / Ultra Luxury)
Then the price floor auto-populates from the tier default
And they can optionally adjust floor and ceiling
And the "Save Market" button is visible

### Scenario: Agent saves a new market
Given the agent has completed both steps
When they click "Save Market"
Then a POST to `/api/markets` creates the market
And they are redirected to `/markets`
And a success toast appears

### Scenario: Agent edits an existing market
Given an agent is on `/markets/[id]/edit`
Then they see the same 2-step flow pre-populated with existing data
And the step indicator shows the current step
And the final button says "Save Changes" instead of "Save Market"
When they modify fields and click "Save Changes"
Then a PUT to `/api/markets/[id]` updates the market

### Scenario: Legacy /markets/new route still works
Given `/markets/new` previously used `MarketWizard`
When the page loads
Then it renders `MarketCreationShell` (not `MarketWizard`)

### Scenario: Validation prevents skipping steps
Given the agent is on step 1
When they have not entered city or state
Then the Next button is disabled
And they cannot advance to step 2

### Scenario: Back navigation preserves data
Given the agent is on step 2 with tier selected
When they click Back to step 1
And then click Next to return to step 2
Then their tier selection is preserved

### Scenario: First market is set as default
Given the agent has no existing markets
When they create their first market
Then it is automatically set as default (is_default = 1)

## User Journey

1. Agent signs up and completes profile
2. **Agent defines their target market** (this feature — from Markets tab or during onboarding)
3. Agent generates a report using this market (report creation flow)
4. Agent can later edit market or add peer markets

## UI Mockup

```
┌─ Markets / Define New Market ──────────────────────────────────────────────┐
│  (bg: background)                                                          │
│                                                                            │
│  ┌─ Card (bg: surface, radius: lg, shadow: md) ───────────────────────┐   │
│  │                                                                      │   │
│  │  DEFINE YOUR MARKET                                                  │   │
│  │  (font: serif, text: 2xl, weight: bold, color: text)                 │   │
│  │  Set up the market that drives your intelligence reports.            │   │
│  │  (text: sm, color: text-secondary)                                   │   │
│  │  ── accent line (bg: accent, h: 0.5, w: 12) ──                      │   │
│  │                                                                      │   │
│  │  ┌─ CreationStepIndicator ──────────────────────────────────────┐   │   │
│  │  │  ● Your Market  ─── ○ Your Tier                              │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─ Step content (animated via framer-motion) ──────────────────┐   │   │
│  │  │                                                                │   │   │
│  │  │  [StepYourMarket / StepYourTier]                               │   │   │
│  │  │  (same components as report creation flow)                     │   │   │
│  │  │                                                                │   │   │
│  │  └────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─ Navigation bar ────────────────────────────────────────────┐   │   │
│  │  │  [← Back]                     [Next → ] or [Save Market]    │   │   │
│  │  │  (text-secondary)             (bg: accent, color: primary)  │   │   │
│  │  └────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

## Implementation Notes

- `MarketCreationShell` is a new component at `components/markets/market-creation-shell.tsx`
- Reuses `StepYourMarket`, `StepYourTier` from `components/reports/steps/`
- Reuses `CreationStepIndicator` from `components/reports/`
- Navigation: shell manages `currentStep` state, Back/Next buttons, validation gating
- Edit mode: shell receives `initialData` prop → pre-populates step refs → starts at step 1
- Delete `components/markets/market-wizard.tsx` after migration
- Update `/markets/[id]/edit/page.tsx` to use `MarketCreationShell` with `mode="edit"`

## Dead Code Removal

After implementation:
- Delete `components/markets/market-wizard.tsx` ✅
- Delete `components/markets/step-indicator.tsx` (legacy step indicator) ✅
- Delete `__tests__/markets/market.test.tsx` (tests the legacy wizard) ✅
- Archive `.specs/features/user-setup/market-definition.feature.md`
- Remove `StepYourFocus` from market creation flow (Focus step was dead code — collected segments/propertyTypes data that was never consumed by the pipeline) ✅

## Component References

- StepYourMarket: `components/reports/steps/step-your-market.tsx`
- StepYourTier: `components/reports/steps/step-your-tier.tsx`
- CreationStepIndicator: `components/reports/creation-step-indicator.tsx`

## Learnings

### 2026-03-16
- **Dead code removal**: The Focus step (`StepYourFocus`) was removed from both `MarketCreationShell` (2 steps) and `CreationFlowShell` (5 steps). It collected `segments` and `propertyTypes` data that was never consumed by any agent or computation in the pipeline. The DB columns remain intact (no migration needed) — only the UI step was removed.
