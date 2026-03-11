---
feature: "Step 2: Your Tier"
domain: ux-redesign
source: components/reports/steps/step-your-tier.tsx
tests:
  - __tests__/reports/step-your-tier.test.tsx
components:
  - StepYourTier
personas:
  - rising-star-agent
  - legacy-agent
  - team-leader
status: implemented
created: 2026-03-10
updated: 2026-03-10
---

# Step 2: Your Tier

**Source File**: `components/reports/steps/step-your-tier.tsx`
**Design System**: `.specs/design-system/tokens.md`
**Personas**: `.specs/personas/rising-star-agent.md`, `.specs/personas/legacy-agent.md`, `.specs/personas/team-leader.md`
**Parent Feature**: Unified Creation Flow Shell (#151)

## Feature: Your Tier — Luxury Tier & Price Range Selection

Step 2 of the unified report creation flow. The agent selects their luxury tier and fine-tunes the price range. Visual card selectors replace radio buttons, with animated price inputs and sensible defaults.

### Scenario: Agent sees the Your Tier step
Given the agent completed Step 1 (Your Market) and advanced to Step 2
Then they see the heading "What's your price point?"
And they see helper text "This determines which transactions we analyze for your market"
And they see three visual tier cards: Luxury, High Luxury, Ultra Luxury

### Scenario: Tier cards display as visual selectors
Given the agent is on Step 2
Then each tier card shows the tier name, price range, and a brief tagline
And "Luxury" shows "$1M - $6M" with tagline "The broadest luxury segment"
And "High Luxury" shows "$6M - $10M" with tagline "Established luxury enclaves"
And "Ultra Luxury" shows "$10M+" with tagline "Trophy properties and estates"
And no tier is pre-selected by default

### Scenario: Agent selects a tier card
Given the agent is on Step 2 with no tier selected
When they click the "Luxury" tier card
Then the card is visually highlighted (accent border + accent-light background)
And the price floor is set to $1,000,000
And the step becomes valid (Next button enabled)

### Scenario: Selecting a different tier updates defaults
Given the agent has selected "Luxury" tier
When they click "High Luxury"
Then "High Luxury" is highlighted and "Luxury" returns to default
And the price floor updates to $6,000,000

### Scenario: Agent adjusts price floor and ceiling
Given the agent has selected a tier
Then they see Price Floor and Price Ceiling inputs below the tier cards
And Price Floor is pre-filled with the tier's default
And Price Ceiling is empty (optional) with placeholder "No ceiling"

### Scenario: Price validation
Given the agent enters a price floor below $500,000
Then a validation message appears: "Price floor must be at least $500,000"
Given the agent enters a ceiling <= floor
Then a validation message appears: "Ceiling must be higher than the floor"

### Scenario: Validation prevents proceeding without a tier
Given the agent has not selected any tier
Then the step reports invalid via onValidationChange(false)

### Scenario: Step emits data on valid selection
Given the agent selects a tier and the price inputs are valid
Then onStepComplete is called with { luxuryTier, priceFloor, priceCeiling? }

## Data Contract

```typescript
export interface StepTierData {
  luxuryTier: "luxury" | "high_luxury" | "ultra_luxury";
  priceFloor: number;
  priceCeiling?: number;
}
```

## Persona Revision Notes

**Vocabulary**: "What's your price point?" is natural agent language. Tier taglines use market vocabulary ("enclaves", "trophy properties").
