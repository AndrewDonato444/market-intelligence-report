---
feature: "Step 4: Your Audience"
domain: ux-redesign
source: components/reports/steps/step-your-audience.tsx
tests:
  - __tests__/reports/step-your-audience.test.tsx
components:
  - StepYourAudience
  - AudiencePersonaCard
  - AudiencePreviewPanel
personas:
  - rising-star-agent
  - legacy-agent
  - team-leader
  - competitive-veteran
status: implemented
created: 2026-03-11
updated: 2026-03-11
---

# Step 4: Your Audience

**Source File**: `components/reports/steps/step-your-audience.tsx`
**Design System**: `.specs/design-system/tokens.md`
**Personas**: `.specs/personas/rising-star-agent.md`, `.specs/personas/legacy-agent.md`, `.specs/personas/team-leader.md`, `.specs/personas/competitive-veteran.md`
**Parent Feature**: Unified Creation Flow Shell (#151)
**Depends On**: Buyer Persona Data Model (#90), Persona Selection UI (#91)

## Feature: Your Audience — Buyer Persona Selection

Step 4 of the unified report creation flow. The agent selects up to 3 buyer personas that the report should be tailored for. These are the agent's clients — the buyers they're advising — not our users. Large persona cards show the persona name, tagline, primary motivation, and "what they care about" summary. A slide-in preview panel reveals detailed traits when requested. Max-3 enforcement is graceful: unselected cards dim with a brief explanation, not a hard disable.

**Who it's for**: All agent personas — Alex (rising star, wants to target the right buyer types for credibility), Morgan (competitive veteran, knows exactly which client archetypes to address), Taylor (team leader, wants consistent persona selection across the team), Pat (legacy agent, wants to understand what each persona adds to the report).

### Scenario: Agent sees the Your Audience step
Given the agent completed Steps 1-3 and advanced to Step 4
Then they see the heading "Who are you advising?"
And they see helper text "Select up to 3 buyer personas — we'll tailor insights, talking points, and narrative framing to match their priorities"
And they see a grid of persona cards fetched from the API

### Scenario: Persona cards display with key traits
Given the agent is on Step 4
And personas have loaded from `/api/buyer-personas`
Then they see a card for each persona in the system (8 Knox Brothers personas)
And each card shows the persona name (serif heading)
And each card shows the tagline (one-line description)
And each card shows the primary motivation as a badge
And each card shows a "What they care about" summary (the `whatWinsThem` field)
And each card has a "Preview" link to see full details

### Scenario: Cards are ordered by display order
Given the agent is on Step 4
Then persona cards appear in `displayOrder` sequence (1 through 8)
And the order matches: The Business Mogul, The Legacy Builder, The Coastal Escape Seeker, The Tech Founder, The Seasonal & Second-Home Buyer, The International Buyer, The Celebrity / Public Figure, The Corporate Executive

### Scenario: Agent selects a persona card
Given the agent is on Step 4
And fewer than 3 personas are selected
When they click a persona card
Then the card is visually highlighted (accent border + accent-light background)
And a gold selection order badge appears in the top-right corner showing the selection order (1, 2, or 3)
And the card scales up briefly (1.02) with spring easing as selection feedback
And the persona is added to the selected list

### Scenario: Agent deselects a persona card
Given a persona card is currently selected
When the agent clicks that card again
Then the card returns to its default state (surface background, default border)
And the selection order badge is removed
And remaining selected personas have their order badges renumbered sequentially
And the persona is removed from the selected list

### Scenario: Selection order renumbering on deselect
Given the agent has selected personas in order: A (1), B (2), C (3)
When the agent deselects persona B
Then persona A shows badge "1"
And persona C shows badge "2"
And the next selection would be badge "3"

### Scenario: Graceful max-3 enforcement
Given the agent has selected 3 personas
Then unselected persona cards dim to 60% opacity
And a brief explanation appears below the grid: "You've chosen 3 personas — that's the max for a focused report. Deselect one to swap."
And the explanation uses text-secondary color and text-sm size
And clicking a dimmed card does nothing (no selection, no error flash)

### Scenario: Max-3 explanation disappears when slot opens
Given the agent has 3 personas selected and sees the max explanation
When the agent deselects one persona
Then the max explanation fades out
And the remaining unselected cards return to full opacity
And the agent can select a new persona

### Scenario: Preview panel slides in from the right
Given the agent is on Step 4
When they click the "Preview" link on a persona card
Then a preview panel slides in from the right side of the card grid
And the panel shows the persona's full profile overview
And the panel shows "What Wins Them" and "Biggest Fear" as decision signals
And the panel shows key vocabulary as tags
And the panel shows top 3 report metrics this persona emphasizes
And the panel shows a sample talking point in italics
And the panel has a "Close Preview" link

### Scenario: Preview panel uses slide animation
Given the agent clicks "Preview" on a persona card
Then the preview panel enters with a slideVariant("right") animation (slides in from right, duration-slow)
When the agent clicks "Close Preview"
Then the panel exits with the reverse slide animation

### Scenario: Preview panel closes when selecting a different preview
Given the preview panel is open for Persona A
When the agent clicks "Preview" on Persona B
Then Persona A's panel closes
And Persona B's panel opens in its place

### Scenario: Selecting a persona while preview is open
Given the preview panel is open for a persona
When the agent clicks the persona's card area (not the Preview link)
Then the persona is selected/deselected normally
And the preview panel remains open

### Scenario: Step validation — at least one persona required
Given the agent has not selected any personas
Then the step reports invalid via onValidationChange(false)
And the Next button in the shell is disabled
Given the agent selects at least one persona
Then the step reports valid via onValidationChange(true)

### Scenario: Step validation — no personas in system (graceful fallback)
Given the API returns an empty personas list
Then a message appears: "No buyer personas are configured yet. You can proceed without targeting specific buyer types."
And the step reports valid via onValidationChange(true)
And onStepComplete is called with { personaIds: [] }

### Scenario: Step emits data on valid selection
Given the agent has at least one persona selected
Then onStepComplete is called with { personaIds: string[] }
And the IDs are in selection order (first-selected first)
And the data updates every time a persona is selected or deselected

### Scenario: Loading state while personas fetch
Given the agent navigates to Step 4
And the persona API call is in progress
Then a loading skeleton appears with 8 placeholder cards
And the placeholder cards pulse with a subtle animation
And the heading and helper text are visible immediately

### Scenario: API error state
Given the persona API call fails
Then an error message appears: "We couldn't load buyer personas. You can skip this step or try refreshing."
And the step reports valid via onValidationChange(true) (allow skipping)
And a "Retry" button is available to re-fetch

### Scenario: Cards animate on entrance
Given the agent navigates to Step 4
And personas have loaded
Then persona cards stagger in using staggerContainer (0.05s delay between cards)
And each card uses fadeVariant for its entrance

## User Journey

1. Agent selects geography in Step 1 (Your Market)
2. Agent selects luxury tier in Step 2 (Your Tier)
3. Agent selects segments and property types in Step 3 (Your Focus)
4. **Step 4: Your Audience** — selects buyer personas (this feature)
5. Step 5: Review — confirms all selections
6. Step 6: Generate — watches the pipeline build the report

## UI Mockup

```
+---------------------------------------------------------------------+
|                                                                     |
|  WHO ARE YOU ADVISING?                                              |
|  (font: serif, text: 2xl, weight: bold, color: primary)            |
|                                                                     |
|  Select up to 3 buyer personas — we'll tailor insights,            |
|  talking points, and narrative framing to match their priorities.   |
|  (font: sans, text: sm, color: text-secondary)                     |
|                                                                     |
|  -- (accent line) -----------------------------------------------  |
|                                                                     |
|  +- Card (selected, order: 1) ---+  +- Card -------------------+  |
|  | bg: accent-light              |  |                           |  |
|  | border: accent                |  |  The Legacy Builder       |  |
|  |                          [1]  |  |  (serif, text-lg, bold)   |  |
|  |  The Business Mogul           |  |                           |  |
|  |  (serif, text-lg, bold)       |  |  Tagline line here        |  |
|  |                               |  |  (sans, text-xs,          |  |
|  |  Tagline line here            |  |   text-secondary)         |  |
|  |  (sans, text-xs,              |  |                           |  |
|  |   text-secondary)             |  |  [Meaning + Legacy]       |  |
|  |                               |  |  (badge: primary-light)   |  |
|  |  [Status + Asset Strategy]    |  |                           |  |
|  |  (badge: primary-light)       |  |  What they care about:    |  |
|  |                               |  |  Story + emotional        |  |
|  |  What they care about:        |  |  significance             |  |
|  |  Data, market intelligence,   |  |  (sans, text-xs,          |  |
|  |  exclusivity                  |  |   text-secondary, italic) |  |
|  |  (sans, text-xs,              |  |                           |  |
|  |   text-secondary, italic)     |  |  [Preview]                |  |
|  |                               |  |  (text-xs, color: accent, |  |
|  |  [Preview]                    |  |   underline)              |  |
|  |  (text-xs, color: accent,     |  +---------------------------+  |
|  |   underline)                  |                                  |
|  +-------------------------------+                                  |
|                                                                     |
|  +- Card -------------------+  +- Card -------------------+        |
|  |  The Coastal Escape      |  |  The Tech Founder        |        |
|  |  Seeker                  |  |  ...                      |        |
|  |  ...                     |  +---------------------------+        |
|  +---------------------------+                                      |
|                                                                     |
|  +- Card -------------------+  +- Card -------------------+        |
|  |  The Seasonal &          |  |  The International       |        |
|  |  Second-Home Buyer       |  |  Buyer                   |        |
|  |  ...                     |  |  ...                      |        |
|  +---------------------------+  +---------------------------+        |
|                                                                     |
|  +- Card -------------------+  +- Card -------------------+        |
|  |  The Celebrity /         |  |  The Corporate           |        |
|  |  Public Figure           |  |  Executive               |        |
|  |  ...                     |  |  ...                      |        |
|  +---------------------------+  +---------------------------+        |
|                                                                     |
+---------------------------------------------------------------------+

--- Preview panel (slides in from right, replaces right column) ---

+---------------------------------------------------------------------+
|                                                                     |
|  +- Card grid (left) ------+  +- Preview Panel (right) ----------+ |
|  | [cards in single col]   |  | bg: background, radius: md,      | |
|  |                         |  | shadow: md, p: spacing-6          | |
|  |                         |  |                                   | |
|  |                         |  | THE BUSINESS MOGUL                | |
|  |                         |  | (serif, text-xl, bold, primary,   | |
|  |                         |  |  uppercase)                       | |
|  |                         |  | -- (accent line, w-8) --          | |
|  |                         |  |                                   | |
|  |                         |  | [Profile overview paragraph]      | |
|  |                         |  | (sans, text-sm, color: text)      | |
|  |                         |  |                                   | |
|  |                         |  | What Wins Them: Data, market      | |
|  |                         |  | intelligence, exclusivity         | |
|  |                         |  | (sans, text-xs, semibold label)   | |
|  |                         |  |                                   | |
|  |                         |  | Biggest Fear: Overpaying or       | |
|  |                         |  | missing data                      | |
|  |                         |  | (sans, text-xs, text-secondary)   | |
|  |                         |  |                                   | |
|  |                         |  | KEY VOCABULARY                    | |
|  |                         |  | (uppercase label, text-tertiary)  | |
|  |                         |  | [ROI] [leverage] [allocation]     | |
|  |                         |  | (pill tags, border, radius-full)  | |
|  |                         |  |                                   | |
|  |                         |  | TOP REPORT METRICS                | |
|  |                         |  | (uppercase label, text-tertiary)  | |
|  |                         |  | - Cash transaction ratio          | |
|  |                         |  | - Price-per-sqft trend            | |
|  |                         |  | - Inventory absorption rate       | |
|  |                         |  |                                   | |
|  |                         |  | SAMPLE TALKING POINT              | |
|  |                         |  | "Based on the data, this          | |
|  |                         |  | market shows..."                  | |
|  |                         |  | (italic, bg: surface, rounded)    | |
|  |                         |  |                                   | |
|  |                         |  | [Close Preview]                   | |
|  |                         |  | (text-xs, text-tertiary)          | |
|  +-------------------------+  +-----------------------------------+ |
|                                                                     |
+---------------------------------------------------------------------+

--- Max-3 state ---

+---------------------------------------------------------------------+
|                                                                     |
|  +- Selected [1] ----------+  +- Selected [2] ---------------+     |
|  | bg: accent-light        |  | bg: accent-light              |     |
|  | ...                     |  | ...                           |     |
|  +-------------------------+  +-------------------------------+     |
|                                                                     |
|  +- Selected [3] ----------+  +- Dimmed (opacity: 60%) ------+     |
|  | bg: accent-light        |  | cursor: not-allowed           |     |
|  | ...                     |  | ...                           |     |
|  +-------------------------+  +-------------------------------+     |
|                                                                     |
|  +- Dimmed ----------------+  +- Dimmed ----------------------+     |
|  | opacity: 60%            |  | opacity: 60%                  |     |
|  | ...                     |  | ...                           |     |
|  +-------------------------+  +-------------------------------+     |
|                                                                     |
|  You've chosen 3 personas — that's the max for a focused report.   |
|  Deselect one to swap.                                              |
|  (sans, text-sm, color: text-secondary, text-center, py: spacing-4)|
|                                                                     |
+---------------------------------------------------------------------+

Card states:
  Default:     bg: surface, border: border, radius: md, shadow: sm
  Hover:       border: border-strong, shadow: md
  Selected:    bg: accent-light, border: accent, shadow: sm
  Dimmed:      opacity: 60%, cursor: not-allowed
  Badge:       w-6, h-6, rounded-full, bg: accent, color: primary,
               text-xs, font-semibold, absolute top-2 right-2

Loading skeleton:
  8 cards in 2-col grid, bg: background, radius: md, h-40,
  animate-pulse
```

## Technical Notes

### Component Architecture

- **StepYourAudience** — Main step component, rendered by CreationFlowShell when step index is 3
  - Fetches personas from `/api/buyer-personas` on mount
  - Manages local state: `{ selectedPersonaIds: string[], previewPersonaSlug: string | null }`
  - Emits step data upward via `onStepComplete` callback
  - Reports validity via `onValidationChange` callback

- **AudiencePersonaCard** — Enhanced persona card for the unified flow (inline in `step-your-audience.tsx`)
  - Extends the existing PersonaCard concept with the `whatWinsThem` field displayed
  - Props: `{ persona: BuyerPersonaSummary, isSelected: boolean, selectionOrder: number | null, isMaxed: boolean, onSelect: (id: string) => void, onPreview: (slug: string) => void }`
  - Uses Framer Motion: `whileTap` via `selectionVariant.tap` for selection feedback
  - Selection order badge matches existing PersonaCard pattern

- **AudiencePreviewPanel** — Slide-in panel reusing PersonaPreviewPanel content pattern
  - Wrapped in `<AnimatePresence>` with `slideVariant("right")` for enter/exit animation
  - Props: `{ persona: PersonaForPreview, onClose: () => void }`
  - Content mirrors existing `PersonaPreviewPanel`: profile overview, decision signals, vocabulary tags, metrics, sample talking point

### Integration with CreationFlowShell

The shell needs these additions to support Step 4:

```typescript
// New import
import { StepYourAudience } from "./steps/step-your-audience";
import type { StepAudienceData } from "./steps/step-your-audience";

// New ref
const audienceDataRef = useRef<StepAudienceData | null>(null);

// New callbacks
const handleAudienceStepComplete = useCallback((data: StepAudienceData) => {
  audienceDataRef.current = data;
}, []);

const handleAudienceValidation = useCallback((valid: boolean) => {
  setStepValid(valid);
}, []);

// In renderStepContent, add case for currentStep === 3:
if (currentStep === 3) {
  return (
    <StepYourAudience
      onStepComplete={handleAudienceStepComplete}
      onValidationChange={handleAudienceValidation}
    />
  );
}
```

### Data Contract

Step 4 produces this data for the flow:

```typescript
export interface StepAudienceData {
  personaIds: string[];  // UUIDs in selection order (first-selected = primary narrative tone)
}
```

### API Dependency

- **GET `/api/buyer-personas`** — existing endpoint, returns `{ personas: BuyerPersona[] }`
- **GET `/api/buyer-personas/[slug]`** — existing endpoint for full persona detail (used by preview panel)

No new API endpoints needed. The step fetches the full list on mount and uses the summary fields for cards. The preview panel fetches the full detail by slug when opened.

### State Flow

```
CreationFlowShell
  +-- StepYourAudience
        |-- personas: BuyerPersona[] (fetched from API on mount)
        |-- selectedPersonaIds: string[] (ordered)
        |-- previewPersonaSlug: string | null
        |-- isMaxed: boolean (selectedPersonaIds.length >= 3)
        |-- AudiencePersonaCard (x 8 personas)
        |     |-- onClick -> toggles selectedPersonaIds
        |     |-- onPreview -> sets previewPersonaSlug
        |-- AudiencePreviewPanel (conditional, slides in from right)
        |     |-- fetches full persona detail by slug
        |     |-- onClose -> clears previewPersonaSlug
        +-- onStepComplete({ personaIds }) -> passed to shell
```

### Existing Code to Reuse

- `components/reports/persona-card.tsx` — PersonaCard component (reference for styling patterns, may adapt inline)
- `components/reports/persona-preview-panel.tsx` — PersonaPreviewPanel component (reference for content layout)
- `lib/services/buyer-personas.ts` — `getAllBuyerPersonas()`, `getBuyerPersonaBySlug()`
- `lib/animations.ts` — `fadeVariant`, `staggerContainer`, `selectionVariant`, `slideVariant("right")`, `DURATION_SLOW`
- `components/ui/tooltip.tsx` — Tooltip component from #150
- CSS variable pattern from `step-your-focus.tsx` (same `var(--color-*)` approach)

### Accessibility

- Each persona card is a `<button>` with `role="switch"` and `aria-checked={selected}`
- Cards are keyboard-navigable (Tab to focus, Enter/Space to toggle)
- "Preview" link is a separate `<button>` inside the card (stops propagation)
- Selection order badge has `aria-label="Selected, position {N}"`
- Preview panel has `role="complementary"` and `aria-label="Persona preview: {name}"`
- Max-3 dimmed cards have `aria-disabled="true"` and `aria-label="{name} — maximum 3 personas selected"`
- Loading skeleton has `aria-busy="true"` and `aria-label="Loading buyer personas"`

## Component References

- AudiencePersonaCard: inline in `step-your-audience.tsx` (adapts PersonaCard pattern)
- AudiencePreviewPanel: inline in `step-your-audience.tsx` (adapts PersonaPreviewPanel pattern)
- AnimatedContainer: `.specs/design-system/components/animated-container.md`
- Tooltip: `.specs/design-system/components/tooltip.md`

## Persona Revision Notes

**Rising Star (Alex)**: Medium patience — "Who are you advising?" frames persona selection as strategic targeting, not a checkbox exercise. Alex wants to look smart to HNWIs — selecting "The Business Mogul" and seeing "What they care about: Data, market intelligence, exclusivity" immediately clicks. The preview panel's "Sample Talking Point" is gold for Alex — ready-made intelligence language.

**Competitive Veteran (Morgan)**: Medium-high patience — Morgan knows their client types already. The 2-column card layout lets them scan quickly and pick the 2-3 personas matching their book. Morgan appreciates the selection order (1-2-3) because first-selected sets the primary narrative tone — Morgan wants control over which client type drives the report's voice.

**Team Leader (Taylor)**: Low-medium patience — Taylor needs this to be efficient for 10 agents. The 8 cards in a 2-column grid are scannable in seconds. The preview panel gives Taylor enough depth to train agents on which personas to select for different listings. Taylor values consistency — every agent sees the same personas with the same descriptions.

**Legacy Agent (Pat)**: High patience — Pat will read every card's tagline and "What they care about" before selecting. The preview panel's "Profile Overview" and "Key Vocabulary" help Pat understand the modern buyer archetypes. Pat's used to describing clients in narrative terms — the persona taglines bridge Pat's relational vocabulary with structured targeting.

**Vocabulary alignment**: "Who are you advising?" is the exact frame luxury agents use — they don't "select personas," they decide which client types they're preparing for. "Buyer personas" is only used once in the helper text for clarity. The rest uses agent vocabulary: "insights," "talking points," "narrative framing," "priorities." The max-3 message ("that's the max for a focused report") frames the limit as quality control, not system limitation.

## Learnings

### 2026-03-11
- **Gotcha**: Nested `<button>` inside `<motion.button>` triggers React DOM warning "button cannot contain a nested button". Use `<span role="link" tabIndex={0}>` with click/keydown handlers for the Preview link inside persona cards.
- **Pattern**: For fetch-driven step components (unlike Steps 1-3 which use static data), the component needs loading/error/empty states. Validation defaults to `false` during load, becomes `true` on error (allows skipping), and tracks selection state once data loads.
- **Pattern**: Preview panel fetches full detail from `/api/buyer-personas/[slug]` on click rather than preloading all — keeps initial load fast with only summary data from the list endpoint.
- **Decision**: Selection order tracking uses array index (`selectedIds.indexOf(id) + 1`) rather than a separate counter/map. Deselecting renumbers automatically since `filter()` preserves relative order.
