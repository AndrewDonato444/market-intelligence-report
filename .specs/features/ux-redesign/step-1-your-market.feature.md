---
feature: "Step 1: Your Market"
domain: ux-redesign
source: components/reports/steps/step-your-market.tsx
tests:
  - __tests__/reports/step-your-market.test.tsx
components:
  - StepYourMarket
  - MarketAutocomplete
  - MarketPreviewCard
personas:
  - rising-star-agent
  - legacy-agent
  - team-leader
status: implemented
created: 2026-03-10
updated: 2026-03-11
---

# Step 1: Your Market

**Source File**: `components/reports/steps/step-your-market.tsx`
**Design System**: `.specs/design-system/tokens.md`
**Personas**: `.specs/personas/rising-star-agent.md`, `.specs/personas/legacy-agent.md`, `.specs/personas/team-leader.md`
**Parent Feature**: Unified Creation Flow Shell (#151)

## Feature: Your Market — Geography Selection

Step 1 of the unified report creation flow. The agent selects the geographic market for their intelligence report. This replaces the old market wizard's geography step with a premium experience: smart autocomplete, contextual guidance, and an animated market preview that gives immediate feedback as the agent types.

**Who it's for**: All agent personas — from Alex (rising star, wants quick setup with confidence) to Pat (legacy agent, wants clarity and guidance) to Taylor (team leader, wants efficient templated setup).

### Scenario: Agent sees the Your Market step
Given the agent is on step 1 of the creation flow
Then they see the heading "Where do you operate?"
And they see helper text "We'll use this to find luxury transactions in your area"
And they see a city input with placeholder "e.g., Naples"
And they see a state selector
And they see optional county and region fields collapsed under "Refine your area"

### Scenario: Agent enters a city with smart autocomplete
Given the agent is on step 1
When they start typing in the city field
Then an autocomplete dropdown appears after 2+ characters
And suggestions show "City, State" format (e.g., "Naples, FL")
And suggestions are filtered as the agent types
And the agent can select a suggestion with click or keyboard (Enter/Arrow keys)

### Scenario: Selecting an autocomplete suggestion fills city and state
Given the autocomplete dropdown is showing suggestions
When the agent selects "Naples, FL"
Then the city field is set to "Naples"
And the state field is set to "Florida"
And the autocomplete dropdown closes
And the market preview card animates in

### Scenario: Agent sees animated market preview after selecting geography
Given the agent has selected a city and state
Then a market preview card fades in below the inputs
And the preview shows the market name (e.g., "Naples, Florida")
And the preview shows a subtle map or location icon
And the preview animates with a slide-up + fade entrance (duration-slow)

### Scenario: Agent expands optional fields to refine their area
Given the agent has entered city and state
When they click "Refine your area"
Then county and region fields appear below the toggle
Note: Tooltip for county/region guidance is not implemented in v1; fields are self-explanatory via placeholder text

### Scenario: Agent provides a market name
Given the agent has selected geography
Then a market name field appears pre-filled with "{City} Luxury" (e.g., "Naples Luxury")
And the agent can edit the name
And the name is used as the display label for this market throughout the flow

### Scenario: Validation prevents proceeding without required fields
Given the agent has not entered a city or state
Then the step reports invalid via the onValidationChange(false) callback
And the parent shell (CreationFlowShell) disables "Next" navigation
Note: Inline error messages ("We need a city to find your market data") and warning-color field highlighting are delegated to the shell, not rendered by StepYourMarket directly

### Scenario: Agent can select an existing market instead
Given the agent has previously created markets
Then a section appears above the form: "Use an existing market"
And each existing market is shown as a selectable card with name, city/state, and tier
And selecting an existing market pre-fills all fields and shows the preview
And the agent can proceed to step 2 immediately

### Scenario: Existing market selection skips market creation
Given the agent selects an existing market card
Then all geography fields are populated from that market
And the selected card is visually highlighted (accent border + accent-light background)
And the agent can still edit any field (which clears selectedExistingId, switching to "creating new market" mode)
Note: A text "Using your saved market" indicator is not rendered in v1; selection state is communicated via button styling only

### Scenario: Agent with no existing markets sees only the creation form
Given the agent has no previously created markets
Then the "Use an existing market" section is not shown
And only the creation form is visible

### Scenario: Agent manually enters city and state without autocomplete
Given the agent types a city name that doesn't match autocomplete suggestions
When they dismiss the dropdown (Escape or click away)
Then the typed value is kept in the city field
And the agent can manually select a state from the dropdown
And validation still applies (city + state required)

## User Journey

1. Agent navigates to `/reports/create` (from dashboard or nav)
2. **Step 1: Your Market** — selects geography (this feature)
3. Step 2: Your Tier — selects luxury tier and price range
4. Step 3: Your Focus — selects segments and property types
5. Step 4: Your Audience — selects buyer personas
6. Step 5: Review — confirms all selections
7. Step 6: Generate — watches the pipeline build the report

## UI Mockup

```
+-----------------------------------------------------------+
|   Create Your Intelligence Report                         |
|   ------- (accent underline)                              |
|                                                           |
|   * --- o --- o --- o --- o --- o                          |
|   Your   Your  Your  Your  Review Generate                |
|   Market Tier  Focus Audience                             |
|                                                           |
| +---------------------------------------------------------+
| |                                                         |
| |  WHERE DO YOU OPERATE?                                  |
| |  (font: serif, text: 2xl, weight: bold, color: primary) |
| |                                                         |
| |  We'll use this to find luxury transactions in          |
| |  your area.                                             |
| |  (font: sans, text: sm, color: text-secondary)          |
| |                                                         |
| |  -- (accent line) ------------------------------------  |
| |                                                         |
| |  +- Use an existing market -------------------------+   |
| |  |  +- Card ------+  +- Card ------+               |   |
| |  |  | Naples       |  | Miami Beach |               |   |
| |  |  | FL . High Lux|  | FL . Ultra  |               |   |
| |  |  +--------------+  +-------------+               |   |
| |  +--------------------------------------------------+   |
| |                                                         |
| |  -- or define a new market --                           |
| |                                                         |
| |  City *                                                 |
| |  +--------------------------------------------------+   |
| |  | Nap|                                              |   |
| |  |--------------------------------------------------|   |
| |  |  Naples, FL                                  <- * |   |
| |  |  Napa, CA                                        |   |
| |  |  Naperville, IL                                  |   |
| |  +--------------------------------------------------+   |
| |                                                         |
| |  State *                                                |
| |  +--------------------------------------------------+   |
| |  | Florida                                     v    |   |
| |  +--------------------------------------------------+   |
| |                                                         |
| |  > Refine your area (county, region)                    |
| |    (font: sans, text: sm, color: accent, cursor: ptr)   |
| |                                                         |
| |  Market Name                                            |
| |  +--------------------------------------------------+   |
| |  | Naples Luxury                                    |   |
| |  +--------------------------------------------------+   |
| |  (font: sans, text: xs, color: text-tertiary)           |
| |  This appears as the title in your report               |
| |                                                         |
| |  +- Market Preview (animated fade-in) --------------+   |
| |  |  Naples, Florida                                  |   |
| |  |  Collier County . Southwest Florida               |   |
| |  |  (bg: primary-light, radius: md, shadow: sm)      |   |
| |  +--------------------------------------------------+   |
| |                                                         |
| +---------------------------------------------------------+
|                                                           |
|                                              [Next ->]    |
|                                   (bg: accent, radius: sm) |
+-----------------------------------------------------------+

Expanded "Refine your area":
| |  v Refine your area                                     |
| |                                                         |
| |  County                              [?] tooltip        |
| |  +--------------------------------------------------+   |
| |  | Collier County                                   |   |
| |  +--------------------------------------------------+   |
| |                                                         |
| |  Region                              [?] tooltip        |
| |  +--------------------------------------------------+   |
| |  | Southwest Florida                                |   |
| |  +--------------------------------------------------+   |

Validation state:
| |  City *                                                 |
| |  +--------------------------------------------------+   |
| |  |                                                  |   |
| |  +--------------------------------------------------+   |
| |  We need a city to find your market data                |
| |  (font: sans, text: xs, color: warning)                 |
```

## Technical Notes

### Component Architecture

- **StepYourMarket** — Main step component, rendered by CreationFlowShell when step index is 0
  - Receives `markets` prop (existing user markets) from shell
  - Manages local form state: `{ city, state, county, region, marketName }`
  - Emits step data upward via callback (or context) for flow-wide state
  - Validates on "Next" click — blocks navigation if invalid

- **MarketAutocomplete** — Autocomplete input for city selection
  - Debounced input (300ms) triggers filtering after 2+ characters
  - Static list of US cities for v1 (no API call needed — use a curated list of ~200 luxury-relevant cities)
  - Falls back to free text if no match
  - Keyboard navigation: ArrowUp/Down to select, Enter to confirm, Escape to dismiss
  - Accessibility: `role="combobox"`, `aria-expanded`, `aria-activedescendant`

- **MarketPreviewCard** — Animated preview of selected geography
  - Framer Motion: `initial={{ opacity: 0, y: 10 }}` -> `animate={{ opacity: 1, y: 0 }}`
  - Shows city, state, county (if provided), region (if provided)
  - Uses `color-primary-light` background, `radius-md`, `shadow-sm`

### State Flow

```
CreationFlowShell
  +-- StepYourMarket
        |-- existingMarkets (from props)
        |-- formState { city, state, county, region, marketName, selectedExistingMarketId }
        |-- MarketAutocomplete -> updates city + state
        |-- MarketPreviewCard -> reads city + state + county + region
        +-- onStepComplete(stepData) -> passed to shell for flow-wide state
```

### Data Contract

Step 1 produces this data for the flow:

```typescript
interface StepMarketData {
  // If using existing market
  existingMarketId?: string;
  // Geography (from existing market or new input)
  city: string;
  state: string;
  county?: string;
  region?: string;
  marketName: string;
  // Flag
  isNewMarket: boolean;
}
```

### Existing Code to Reuse

- `lib/services/market-validation.ts` — validation rules (city/state required)
- `lib/animations.ts` — `pageTransition()`, `DURATION_SLOW`, `EASING_DEFAULT`
- `components/ui/tooltip.tsx` — Tooltip component from #150
- Market data types from `lib/services/market.ts`

### Accessibility

- City autocomplete uses WAI-ARIA combobox pattern
- State selector is a native `<select>` or custom accessible dropdown
- Error messages linked to inputs via `aria-describedby`
- All interactive elements keyboard-navigable
- Focus management: autocomplete selection returns focus to input

## Component References

- AnimatedContainer: `.specs/design-system/components/animated-container.md`
- Tooltip: `.specs/design-system/components/tooltip.md`
- MarketAutocomplete: `.specs/design-system/components/market-autocomplete.md` (stub — new)
- MarketPreviewCard: `.specs/design-system/components/market-preview-card.md` (stub — new)

## Persona Revision Notes

**Rising Star (Alex)**: Medium patience — wants guidance but not hand-holding. The autocomplete and auto-filled market name reduce friction. Contextual helper text ("We'll use this to find luxury transactions") frames the step in terms of outcome, not input.

**Legacy Agent (Pat)**: High patience, less comfortable with complex UI. The autocomplete is optional — Pat can type freely and select state manually. No forced interaction patterns. "Refine your area" is collapsed by default to reduce visual complexity.

**Team Leader (Taylor)**: Low-medium patience, wants efficiency. "Use an existing market" at the top lets Taylor skip the form entirely for repeat reports. Pre-filled market name saves a decision.

**Vocabulary alignment**: "Where do you operate?" uses natural language (not "Select geography"). "Market" and "area" are agent vocabulary. "Luxury transactions" connects the input to the output. Validation messages are conversational ("We need a city to find your market data"), not form-error-speak ("City is required").
