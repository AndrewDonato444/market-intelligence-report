---
feature: "Step 3: Your Focus"
domain: ux-redesign
source: components/reports/steps/step-your-focus.tsx
tests:
  - __tests__/reports/step-your-focus.test.tsx
components:
  - StepYourFocus
  - ToggleCard
personas:
  - rising-star-agent
  - legacy-agent
  - team-leader
  - competitive-veteran
status: implemented
created: 2026-03-10
updated: 2026-03-11
---

# Step 3: Your Focus

**Source File**: `components/reports/steps/step-your-focus.tsx`
**Design System**: `.specs/design-system/tokens.md`
**Personas**: `.specs/personas/rising-star-agent.md`, `.specs/personas/legacy-agent.md`, `.specs/personas/team-leader.md`, `.specs/personas/competitive-veteran.md`
**Parent Feature**: Unified Creation Flow Shell (#151)

## Feature: Your Focus — Market Segments & Property Types

Step 3 of the unified report creation flow. The agent selects which market segments (waterfront, golf course, etc.) and property types (single family, estate, condo, etc.) matter to their market. Visual toggleable cards replace checkboxes — each option has an icon and a short description. Smart defaults pre-select common options based on the agent's market and tier from Steps 1-2. "Popular in your area" badges highlight the most relevant choices.

**Who it's for**: All agent personas — from Alex (rising star, wants data-driven positioning on the right segments) to Morgan (competitive veteran, needs hyperlocal depth on specific niches) to Taylor (team leader, wants fast, templated setup) to Pat (legacy agent, wants clarity about what each option adds to the report).

### Scenario: Agent sees the Your Focus step
Given the agent completed Steps 1-2 and advanced to Step 3
Then they see the heading "What matters in your market?"
And they see helper text "Select the segments and property types that define your area — we'll tailor the analysis to match"
And they see two sections: "Market Segments" and "Property Types"

### Scenario: Market segments display as visual toggleable cards
Given the agent is on Step 3
Then they see a grid of segment cards, one for each available segment
And each card shows an icon, the segment name, and a one-line description
And the available segments are: Waterfront, Golf Course, Gated Community, Ski-In/Ski-Out, Mountain View, Historic District, New Development, Equestrian, Beachfront, Lakefront, Vineyard, Desert, Island
And no segments are pre-selected by default (unless smart defaults apply)

### Scenario: Segment card descriptions use agent vocabulary
Given the agent is viewing segment cards
Then "Waterfront" shows "Lakefront, riverfront, and canal-front properties"
And "Golf Course" shows "Golf and country club communities"
And "Gated Community" shows "Private, access-controlled enclaves"
And "Beachfront" shows "Direct ocean or gulf access"
And "New Development" shows "Recently built or under construction"
And "Historic District" shows "Designated historic neighborhoods"
And "Ski-In/Ski-Out" shows "Direct slope access properties"
And "Mountain View" shows "Properties with mountain vistas"
And "Equestrian" shows "Horse properties and equestrian estates"
And "Lakefront" shows "Direct lake access"
And "Vineyard" shows "Wine country and vineyard estates"
And "Desert" shows "Desert landscape properties"
And "Island" shows "Island and barrier island properties"

### Scenario: Agent toggles a segment card
Given the agent is on Step 3
When they click the "Waterfront" segment card
Then the card is visually highlighted (accent border + accent-light background + scale animation)
And "Waterfront" is added to the selected segments
When they click "Waterfront" again
Then the card returns to its default state
And "Waterfront" is removed from the selected segments

### Scenario: Property types display as visual toggleable cards
Given the agent is on Step 3
Then they see a grid of property type cards below the segment cards
And each card shows an icon and the property type name
And the available types are: Single Family, Estate, Condo, Townhouse, Co-op, Penthouse, Chalet, Villa, Ranch, Land
And no property types are pre-selected by default (unless smart defaults apply)

### Scenario: Agent toggles a property type card
Given the agent is on Step 3
When they click the "Estate" property type card
Then the card is visually highlighted (accent border + accent-light background + scale animation)
And "Estate" is added to the selected property types
When they click "Estate" again
Then the card returns to its default state

### Scenario: Smart defaults pre-select popular options
Given the agent selected a city and state in Step 1
And the agent selected a luxury tier in Step 2
When they arrive at Step 3
Then segments and property types commonly associated with that market/tier are pre-selected
And pre-selected cards show a "Popular in your area" badge (accent-light background, text-xs)
Note: For v1, smart defaults are derived from a static mapping of state to common segments (e.g., FL to Waterfront, Beachfront, Golf Course; CO to Ski-In/Ski-Out, Mountain View). This is not an API call.

### Scenario: Smart default mapping by state
Given the agent's state from Step 1
Then the following defaults apply:
- FL, HI, SC, NC, GA, AL, MS, LA, TX (Gulf/Atlantic coast) -> Waterfront, Beachfront, Golf Course + Single Family, Estate, Condo
- CA -> Waterfront, Vineyard, New Development + Single Family, Estate, Condo
- CO, MT, WY, UT, ID -> Ski-In/Ski-Out, Mountain View + Chalet, Estate, Single Family
- NY, NJ, CT, MA -> Gated Community, Waterfront + Condo, Co-op, Penthouse, Townhouse
- AZ, NV, NM -> Desert, Golf Course + Estate, Single Family, Villa
- All other states -> Gated Community + Single Family, Estate
Note: If the agent changes a pre-selected card, the "Popular in your area" badge remains but the card becomes unselected

### Scenario: Agent can select multiple segments and property types
Given the agent is on Step 3
Then they can select any number of segments (0 or more)
And they can select any number of property types (0 or more)
And there is no maximum limit on selections

### Scenario: Step validation — at least one selection required
Given the agent has not selected any segments AND has not selected any property types
Then the step reports invalid via onValidationChange(false)
Given the agent selects at least one segment OR at least one property type
Then the step reports valid via onValidationChange(true)

### Scenario: Step emits data on valid selection
Given the agent has at least one segment or property type selected
Then onStepComplete is called with { segments: string[], propertyTypes: string[] }
And the data updates every time a card is toggled

### Scenario: Cards animate on selection
Given the agent clicks a card to select it
Then the card scales up briefly (scale: 1.02) with easing-spring duration
And the border color transitions to accent with duration-default
And the background transitions to accent-light with duration-default
Given the agent clicks a card to deselect it
Then the card scales back to 1.0
And styling returns to default (surface background, border color)

### Scenario: Empty state before any selection
Given the agent has no segments or property types selected (and no smart defaults)
Then a subtle prompt appears: "Pick the segments that define your market — or skip ahead if you want the full picture"
And the prompt uses text-secondary color and text-sm size

## User Journey

1. Agent selects geography in Step 1 (Your Market)
2. Agent selects luxury tier in Step 2 (Your Tier)
3. **Step 3: Your Focus** — selects segments and property types (this feature)
4. Step 4: Your Audience — selects buyer personas
5. Step 5: Review — confirms all selections
6. Step 6: Generate — watches the pipeline build the report

## UI Mockup

```
+---------------------------------------------------------+
|                                                         |
|  WHAT MATTERS IN YOUR MARKET?                           |
|  (font: serif, text: 2xl, weight: bold, color: primary) |
|                                                         |
|  Select the segments and property types that define     |
|  your area — we'll tailor the analysis to match.        |
|  (font: sans, text: sm, color: text-secondary)          |
|                                                         |
|  -- (accent line) ------------------------------------  |
|                                                         |
|  MARKET SEGMENTS                                        |
|  (font: sans, text: sm, weight: semibold, color: text,  |
|   uppercase, tracking-wide)                              |
|                                                         |
|  +- Card --------+  +- Card --------+  +- Card -------+ |
|  | Waterfront    |  | Golf Course   |  | Gated        | |
|  | Lakefront,    |  | Golf & CC     |  | Community    | |
|  | riverfront..  |  | communities   |  | Private,     | |
|  | [Popular]     |  | [Popular]     |  | access-      | |
|  | (selected)    |  | (selected)    |  | controlled   | |
|  | bg: accent-   |  |               |  | enclaves     | |
|  | light, border:|  |               |  |              | |
|  | accent        |  |               |  |              | |
|  +---------------+  +---------------+  +--------------+ |
|                                                         |
|  +- Card --------+  +- Card --------+  +- Card -------+ |
|  | Mountain View |  | Ski-In/       |  | Historic     | |
|  | Properties    |  | Ski-Out       |  | District     | |
|  | with mountain |  | Direct slope  |  | Designated   | |
|  | vistas        |  | access        |  | historic     | |
|  |               |  | properties    |  | neighborhoods| |
|  +---------------+  +---------------+  +--------------+ |
|                                                         |
|  +- Card --------+  +- Card --------+  +- Card -------+ |
|  | New           |  | Equestrian    |  | Beachfront   | |
|  | Development   |  | Horse         |  | Direct ocean | |
|  | Recently      |  | properties &  |  | or gulf      | |
|  | built or      |  | equestrian    |  | access       | |
|  | under const.  |  | estates       |  | [Popular]    | |
|  |               |  |               |  | (selected)   | |
|  +---------------+  +---------------+  +--------------+ |
|                                                         |
|  +- Card --------+  +- Card --------+  +- Card -------+ |
|  | Lakefront     |  | Vineyard      |  | Desert       | |
|  | Direct lake   |  | Wine country  |  | Desert land- | |
|  | access        |  | & vineyard    |  | scape        | |
|  |               |  | estates       |  | properties   | |
|  +---------------+  +---------------+  +--------------+ |
|                                                         |
|  +- Card --------+                                      |
|  | Island        |                                      |
|  | Island &      |                                      |
|  | barrier island|                                      |
|  | properties    |                                      |
|  +---------------+                                      |
|                                                         |
|  -- (divider) ----------------------------------------  |
|                                                         |
|  PROPERTY TYPES                                         |
|  (font: sans, text: sm, weight: semibold, color: text,  |
|   uppercase, tracking-wide)                              |
|                                                         |
|  +- Card -----+  +- Card -----+  +- Card -----+       |
|  | Single     |  | Estate     |  | Condo       |       |
|  | Family     |  |            |  |             |       |
|  | [Popular]  |  | [Popular]  |  | [Popular]   |       |
|  | (selected) |  | (selected) |  | (selected)  |       |
|  +------------+  +------------+  +-------------+       |
|                                                         |
|  +- Card -----+  +- Card -----+  +- Card -----+       |
|  | Townhouse  |  | Co-op      |  | Penthouse   |       |
|  +------------+  +------------+  +-------------+       |
|                                                         |
|  +- Card -----+  +- Card -----+  +- Card -----+       |
|  | Chalet     |  | Villa      |  | Ranch       |       |
|  +------------+  +------------+  +-------------+       |
|                                                         |
|  +- Card -----+                                        |
|  | Land       |                                        |
|  +------------+                                        |
|                                                         |
+---------------------------------------------------------+

Card states:
  Default:  bg: surface, border: border, radius: md, shadow: sm
  Hover:    border: border-strong, shadow: md
  Selected: bg: accent-light, border: accent, shadow: sm
  Badge:    "Popular in your area" -- bg: accent-light, text: accent,
            text-xs, radius: full, px: spacing-2, py: spacing-1

Empty state (no selections, no smart defaults):
| |  Pick the segments that define your market -- or skip  |
| |  ahead if you want the full picture.                   |
| |  (font: sans, text: sm, color: text-secondary,         |
| |   text-center, py: spacing-6)                           |
```

## Technical Notes

### Component Architecture

- **StepYourFocus** -- Main step component, rendered by CreationFlowShell when step index is 2
  - Receives `marketData` (city, state from Step 1) to compute smart defaults
  - Manages local state: `{ selectedSegments: string[], selectedPropertyTypes: string[] }`
  - Emits step data upward via `onStepComplete` callback
  - Reports validity via `onValidationChange` callback

- **ToggleCard** -- Single reusable toggleable card component used for both segments and property types (inline in `step-your-focus.tsx`)
  - Props: `{ value: string, label: string, description?: string, icon: string, selected: boolean, popular: boolean, onToggle: (value: string) => void }`
  - Framer Motion for selection animation: `whileTap` via `selectionVariant.tap`, `variants={scaleVariant}`
  - "Popular in your area" badge rendered when `popular` is true

### Smart Default Logic

```typescript
const STATE_SEGMENT_DEFAULTS: Record<string, string[]> = {
  // Gulf/Atlantic coast
  FL: ["waterfront", "beachfront", "golf course"],
  HI: ["waterfront", "beachfront", "golf course"],
  SC: ["waterfront", "beachfront", "golf course"],
  NC: ["waterfront", "beachfront", "golf course"],
  GA: ["waterfront", "beachfront", "golf course"],
  AL: ["waterfront", "beachfront", "golf course"],
  MS: ["waterfront", "beachfront", "golf course"],
  LA: ["waterfront", "beachfront", "golf course"],
  TX: ["waterfront", "beachfront", "golf course"],
  // California
  CA: ["waterfront", "vineyard", "new development"],
  // Mountain
  CO: ["ski-in/ski-out", "mountain view"],
  MT: ["ski-in/ski-out", "mountain view"],
  WY: ["ski-in/ski-out", "mountain view"],
  UT: ["ski-in/ski-out", "mountain view"],
  ID: ["ski-in/ski-out", "mountain view"],
  // Northeast
  NY: ["gated community", "waterfront"],
  NJ: ["gated community", "waterfront"],
  CT: ["gated community", "waterfront"],
  MA: ["gated community", "waterfront"],
  // Desert
  AZ: ["desert", "golf course"],
  NV: ["desert", "golf course"],
  NM: ["desert", "golf course"],
  // Fallback
  _default: ["gated community"],
};

const STATE_PROPERTY_DEFAULTS: Record<string, string[]> = {
  FL: ["single_family", "estate", "condo"],
  HI: ["single_family", "estate", "condo"],
  SC: ["single_family", "estate", "condo"],
  NC: ["single_family", "estate", "condo"],
  GA: ["single_family", "estate", "condo"],
  AL: ["single_family", "estate", "condo"],
  MS: ["single_family", "estate", "condo"],
  LA: ["single_family", "estate", "condo"],
  TX: ["single_family", "estate", "condo"],
  CA: ["single_family", "estate", "condo"],
  CO: ["chalet", "estate", "single_family"],
  MT: ["chalet", "estate", "single_family"],
  WY: ["chalet", "estate", "single_family"],
  UT: ["chalet", "estate", "single_family"],
  ID: ["chalet", "estate", "single_family"],
  NY: ["condo", "co-op", "penthouse", "townhouse"],
  NJ: ["condo", "co-op", "penthouse", "townhouse"],
  CT: ["condo", "co-op", "penthouse", "townhouse"],
  MA: ["condo", "co-op", "penthouse", "townhouse"],
  AZ: ["estate", "single_family", "villa"],
  NV: ["estate", "single_family", "villa"],
  NM: ["estate", "single_family", "villa"],
  _default: ["single_family", "estate"],
};
```

Smart defaults are computed once when the step mounts (using the state from Step 1). If the agent toggles a pre-selected card off, the "Popular" badge remains visible but the card is deselected.

### Data Contract

Step 3 produces this data for the flow:

```typescript
export interface StepFocusData {
  segments: string[];
  propertyTypes: string[];
}
```

Values use the same string identifiers from `AVAILABLE_SEGMENTS` and `AVAILABLE_PROPERTY_TYPES` in `lib/services/market-validation.ts`.

### State Flow

```
CreationFlowShell
  +-- StepYourFocus
        |-- marketData (from Step 1 via props -- city, state)
        |-- selectedSegments: string[]
        |-- selectedPropertyTypes: string[]
        |-- smartDefaults (computed from state)
        |-- ToggleCard (x N segments) -> toggles selectedSegments
        |-- ToggleCard (x N property types) -> toggles selectedPropertyTypes
        +-- onStepComplete({ segments, propertyTypes }) -> passed to shell
```

### Existing Code to Reuse

- `lib/services/market-validation.ts` -- `AVAILABLE_SEGMENTS`, `AVAILABLE_PROPERTY_TYPES` arrays
- `lib/animations.ts` -- `pageTransition()`, `DURATION_DEFAULT`, `EASING_DEFAULT`, `EASING_SPRING`
- `components/ui/tooltip.tsx` -- Tooltip component from #150
- CSS variable pattern from `step-your-tier.tsx` and `step-your-market.tsx`

### Accessibility

- Each card is a `<button>` with `role="switch"` and `aria-checked={selected}`
- Cards are keyboard-navigable (Tab to focus, Enter/Space to toggle)
- Section headings use semantic markup (`<h3>` for "Market Segments" and "Property Types")
- Selected state is communicated visually (color) and semantically (aria-checked)
- "Popular in your area" badges include `aria-label` for screen readers

## Component References

- ToggleCard: `.specs/design-system/components/toggle-card.md` (inline in step-your-focus.tsx — not a separate file)
- AnimatedContainer: `.specs/design-system/components/animated-container.md`
- Tooltip: `.specs/design-system/components/tooltip.md`

## Persona Revision Notes

**Rising Star (Alex)**: Medium patience -- "What matters in your market?" frames the step as market intelligence, not form completion. Smart defaults show Alex that the system understands their market. "Popular in your area" badges provide data-driven guidance -- Alex loves signals that help with positioning.

**Competitive Veteran (Morgan)**: Medium-high patience -- the visual card layout lets Morgan quickly scan all options. Segment descriptions use vocabulary Morgan recognizes ("enclaves", "direct slope access"). No artificial limits on selections -- Morgan can select exactly the niches that match their deep expertise.

**Team Leader (Taylor)**: Low-medium patience -- smart defaults mean Taylor can accept the pre-selections and move on. The entire step can be a 2-second glance + Next click for repeat users. No unnecessary friction.

**Legacy Agent (Pat)**: High patience -- each card has a description explaining what it means. Pat doesn't have to guess what "gated community" covers in this context. The layout is scannable, not overwhelming. The empty state prompt ("or skip ahead if you want the full picture") reassures Pat that skipping is okay.

**Vocabulary alignment**: "What matters in your market?" is how agents think -- not "Select segments." "Segments" and "property types" are industry terms agents use daily. Descriptions use natural language ("Golf and country club communities" not "Properties near golf amenities"). The "Popular in your area" badge speaks to competitive intelligence -- agents want to know what's standard in their market.
