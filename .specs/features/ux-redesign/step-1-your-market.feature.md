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
status: specced
created: 2026-03-10
updated: 2026-03-17
---

# Step 1: Your Market (Redesign)

**Source File**: `components/reports/steps/step-your-market.tsx`
**Design System**: `.specs/design-system/tokens.md`
**Personas**: `.specs/personas/rising-star-agent.md`, `.specs/personas/legacy-agent.md`, `.specs/personas/team-leader.md`
**Parent Feature**: Unified Creation Flow Shell

## Feature: Your Market — Geography Selection (Redesigned)

Redesign of Step 1 in the unified report creation flow. This revision removes dead fields (county, region) that were never sent to any API, and promotes "Report Name" — the most user-facing field — out of a hidden collapsible into a prominent, always-visible position.

**What changed from v1:**
- **Removed**: County field, Region field, "Refine your area" collapsible toggle, `showRefine` state
- **Promoted**: Report Name moved from below the collapsible to directly after city/state, with a new label and helper text that emphasizes its importance
- **Simplified**: MarketPreviewCard no longer accepts county/region props
- **Simplified**: StepMarketData no longer includes county/region fields

**Why**: County and region were stored in the database but never passed to RealEstateAPI, ScrapingDog, or any external service. They added visual clutter and decision friction with zero value. Report Name, conversely, is used by every Claude agent as the report title and appears prominently in the final output — yet it was buried under a toggle most users never opened.

**Who it's for**: All agent personas — Alex (rising star, wants quick setup) benefits from fewer fields. Pat (legacy, wants clarity) benefits from removing confusing optional fields. Taylor (team leader, wants efficiency) benefits from a streamlined form.

### Scenario: Agent sees the Your Market step
Given the agent is on step 1 of the creation flow
Then they see the heading "Where do you operate?"
And they see helper text "We'll use this to find luxury transactions in your area."
And they see a city input with placeholder "e.g., Naples"
And they see a state selector with placeholder "Select a state"
And they see a report name input directly below city/state
And they do NOT see county, region, or "Refine your area" fields

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
And the report name auto-generates as "Naples Luxury" (if not manually set)
And the market preview card animates in

### Scenario: Report name is prominent and auto-generated
Given the agent has entered a city
Then the report name field shows below state, labeled "Report Name"
And the report name is auto-populated as "{City} Luxury" (e.g., "Naples Luxury")
And helper text reads "This is the title of your intelligence report."
And the agent can override the auto-generated name by typing
And once manually edited, city changes no longer overwrite the name

### Scenario: Agent sees animated market preview after selecting geography
Given the agent has entered a city and state
Then a market preview card fades in below the report name
And the preview shows "{City}, {State}" (e.g., "Naples, Florida")
And the preview animates with a slide-up + fade entrance (duration-slow)
And the preview does NOT show county or region (removed)

### Scenario: Validation prevents proceeding without required fields
Given the agent has not entered a city or state
Then the step reports invalid via onValidationChange(false)
And the parent shell disables "Next" navigation

### Scenario: Agent can select an existing market instead
Given the agent has previously created markets
Then a section appears above the form: "Use an existing market"
And each existing market is shown as a selectable card with name, city/state, and tier
And selecting an existing market pre-fills city, state, and report name
And the market preview card appears
And the agent can proceed to step 2 immediately

### Scenario: Existing market selection highlights the card
Given the agent selects an existing market card
Then the selected card gets accent border + accent-light background
And all geography fields are populated from that market
And editing any field clears the selection (switches to new market mode)

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
2. **Step 1: Your Market** — selects geography and names their report (this feature)
3. Step 2: Your Tier — selects luxury tier and price range
4. Step 3: Your Audience — selects buyer personas
5. Step 4: Review — confirms all selections, edits title if needed
6. Step 5: Generate — watches the pipeline build the report

## UI Mockup

```
+-----------------------------------------------------------+
|   Create Your Intelligence Report                         |
|   ------- (accent underline)                              |
|                                                           |
|   * --- o --- o --- o --- o                                |
|   Your   Your  Your  Review Generate                      |
|   Market Tier  Audience                                   |
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
| |  -- (accent line, 32px wide) ------                     |
| |                                                         |
| |  +- Use an existing market -------------------------+   |
| |  |  +- Card ------+  +- Card ------+               |   |
| |  |  | Naples       |  | Miami Beach |               |   |
| |  |  | FL · High Lux|  | FL · Ultra  |               |   |
| |  |  +--------------+  +-------------+               |   |
| |  +--------------------------------------------------+   |
| |                                                         |
| |  -- or define a new market --                           |
| |  (font: sans, text: xs, color: text-tertiary)           |
| |                                                         |
| |  City *                                                 |
| |  (font: sans, text: xs, weight: medium, color:          |
| |   text-secondary)                                       |
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
| |  Report Name                                            |
| |  +--------------------------------------------------+   |
| |  | Naples Luxury                                    |   |
| |  +--------------------------------------------------+   |
| |  This is the title of your intelligence report.         |
| |  (font: sans, text: xs, color: text-tertiary)           |
| |                                                         |
| |  +- Market Preview (animated fade-in) --------------+   |
| |  |  (pin icon) Naples, Florida                      |   |
| |  |  (bg: accent-light, border: accent/20,           |   |
| |  |   radius: md, shadow: sm)                         |   |
| |  +--------------------------------------------------+   |
| |                                                         |
| +---------------------------------------------------------+
|                                                           |
|                                              [Next ->]    |
|                                   (bg: accent, radius: sm) |
+-----------------------------------------------------------+
```

## Technical Notes

### Component Architecture

- **StepYourMarket** — Main step component, rendered by CreationFlowShell when step index is 0
  - Receives `markets` prop (existing user markets) from shell
  - Manages local form state: `{ city, state, marketName }` (no county/region)
  - Emits step data upward via `onStepComplete` callback
  - Reports validity via `onValidationChange`

- **MarketAutocomplete** — Autocomplete input for city selection (unchanged)
  - Debounced input (300ms) triggers filtering after 2+ characters
  - Static list of US cities
  - Keyboard navigation: ArrowUp/Down, Enter, Escape
  - Accessibility: `role="combobox"`, `aria-expanded`, `aria-activedescendant`

- **MarketPreviewCard** — Animated preview of selected geography (simplified)
  - Framer Motion: `initial={{ opacity: 0, y: 10 }}` → `animate={{ opacity: 1, y: 0 }}`
  - Shows city and state only (county/region removed)
  - Uses `color-accent-light` background, `radius-md`, `shadow-sm`

### Data Contract (Updated)

Step 1 produces this data for the flow:

```typescript
export interface StepMarketData {
  existingMarketId?: string;
  city: string;
  state: string;
  // county and region REMOVED — never used by any API
  marketName: string;
  isNewMarket: boolean;
}
```

### What Gets Removed

| Item | File | Action |
|------|------|--------|
| `county` state | `step-your-market.tsx` | Delete useState, remove from StepMarketData |
| `region` state | `step-your-market.tsx` | Delete useState, remove from StepMarketData |
| `showRefine` state | `step-your-market.tsx` | Delete useState |
| "Refine your area" button + section | `step-your-market.tsx` | Delete JSX block (lines ~217-259) |
| `county` prop | `market-preview-card.tsx` | Remove from interface and rendering |
| `region` prop | `market-preview-card.tsx` | Remove from interface and rendering |
| `hasDetail` / `detailParts` logic | `market-preview-card.tsx` | Delete (no detail parts without county/region) |

### What Gets Moved

| Item | From | To |
|------|------|----|
| Report Name field | Below "Refine your area" collapsible | Directly after State selector |
| Report Name label | "Market Name" | "Report Name" |
| Report Name helper text | "This appears as the title in your report." | "This is the title of your intelligence report." |

### Existing Code to Reuse

- `lib/services/market-validation.ts` — validation rules (city/state required)
- `lib/animations.ts` — `pageTransition()`, `DURATION_SLOW`, `EASING_DEFAULT`
- Market data types from `lib/services/market.ts`

### Accessibility

- City autocomplete uses WAI-ARIA combobox pattern (unchanged)
- State selector is a native `<select>` (unchanged)
- All interactive elements keyboard-navigable
- Focus management: autocomplete selection returns focus to input

## Component References

- AnimatedContainer: `.specs/design-system/components/animated-container.md`
- MarketAutocomplete: `.specs/design-system/components/market-autocomplete.md`
- MarketPreviewCard: `.specs/design-system/components/market-preview-card.md`

## Persona Revision Notes

**Rising Star (Alex)**: Medium patience — fewer fields means faster setup. Report Name is now visible without hunting, which matters because Alex uses it in client-facing materials. The streamlined form feels professional, not bureaucratic.

**Legacy Agent (Pat)**: High patience, less comfortable with complex UI. Removing the collapsible toggle eliminates a confusing interaction pattern. Pat no longer has to wonder "should I fill in county?" when it doesn't matter. Report Name being visible means Pat can customize the title for their "intelligence brief" without discovering a hidden field.

**Team Leader (Taylor)**: Low-medium patience, wants efficiency. Three fewer form elements means faster market definition. "Use an existing market" still lets Taylor skip the form entirely.

**Vocabulary alignment**: "Report Name" is clearer than "Market Name" — agents think of the output as a report, not a market definition. "This is the title of your intelligence report" connects the field directly to the artifact they're creating.

## Learnings

(To be filled after implementation)
