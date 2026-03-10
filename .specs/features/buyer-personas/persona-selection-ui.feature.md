---
feature: Persona Selection UI
domain: buyer-personas
source: components/reports/report-wizard.tsx
tests:
  - __tests__/buyer-personas/persona-selection-ui.test.tsx
components:
  - ReportWizard
  - PersonaCard
  - PersonaPreviewPanel
personas:
  - rising-star-agent
  - team-leader
  - legacy-agent
status: implemented
created: 2026-03-10
updated: 2026-03-10
---

# Persona Selection UI in Report Builder Wizard

**Source Files**: `components/reports/report-wizard.tsx`, `app/api/buyer-personas/route.ts`, `app/api/reports/route.ts`
**Design System**: .specs/design-system/tokens.md
**Personas**: .specs/personas/rising-star-agent.md, .specs/personas/team-leader.md, .specs/personas/legacy-agent.md
**Depends On**: Feature #40 (Report Builder Wizard), Feature #90 (Buyer Persona Data Model)

## Feature: Persona Selection UI

Adds a new step to the report builder wizard where agents select 1-3 buyer personas from the 8 Knox Brothers archetypes. Each persona card shows a preview of what that persona adds to the report — talking points, narrative framing, and metric emphasis — so agents can make an informed choice. Selection order matters: the first-selected persona sets the primary narrative tone.

**Why it matters**: Agents serve different buyer types. A report tailored to "The Business Mogul" emphasizes ROI, CAGR, and tax strategy. A report for "The Coastal Escape Seeker" emphasizes lifestyle, design, and tranquility. This step lets agents customize the intelligence brief for the clients they're advising.

### Scenario: Persona step appears in the wizard
Given the agent has selected a market and sections
When they advance past the Sections step
Then they see a new "Personas" step (step 3 of 4)
And the step indicator shows 4 steps: Market, Sections, Personas, Review
And the Review step moves to step 4

### Scenario: All 8 buyer personas are displayed
Given the agent is on the Personas step
When the personas load
Then 8 persona cards are displayed in a 2-column grid
And each card shows the persona name, tagline, and primary motivation
And cards are ordered by display_order (1 through 8)
And no personas are pre-selected

### Scenario: Persona card shows key details
Given the agent is viewing the persona cards
Then each card displays:
  - Name (e.g., "The Business Mogul") in font-serif, text-lg, font-semibold
  - Tagline (e.g., "Treats real estate as an asset class.") in text-xs, color-text-secondary
  - Primary motivation (e.g., "Status + Asset Strategy") as a pill badge
  - A "Preview" link/button to see what this persona adds

### Scenario: Agent selects personas by clicking cards
Given the agent is on the Personas step
When they click a persona card
Then the card becomes selected (border-accent, bg-accent-light)
And a selection number badge appears (1, 2, or 3) showing the order
And the card can be clicked again to deselect

### Scenario: Maximum 3 personas can be selected
Given 3 personas are already selected
When the agent clicks a 4th persona card
Then nothing happens — the card does not become selected
And a message appears: "Maximum 3 personas. Deselect one to choose a different persona."

### Scenario: At least 1 persona is required to proceed
Given the agent is on the Personas step
And no personas are selected
When they click Next
Then an error appears: "Select at least 1 buyer persona to continue"
And the wizard does not advance

### Scenario: Selection order determines narrative priority
Given the agent selects "The Business Mogul" first, then "The Coastal Escape Seeker"
Then "The Business Mogul" shows badge "1" (primary narrative tone)
And "The Coastal Escape Seeker" shows badge "2" (secondary)
And the preview panel explains: "Primary persona sets the report's narrative tone"

### Scenario: Preview panel shows persona intelligence preview
Given the agent clicks the "Preview" button on a persona card
Then a slide-out panel or expanded section appears showing:
  - Persona name and profile overview (2-3 sentences)
  - "What Wins Them" — what this persona values
  - "Biggest Fear" — what to address
  - Key vocabulary examples (3-5 words from narrative_framing.keyVocabulary)
  - Top 3 report metrics this persona needs (from report_metrics)
  - Sample talking point (first template from talking_point_templates)
And the panel uses font-serif for the persona name, font-sans for body text

### Scenario: Preview panel can be closed
Given the preview panel is open for a persona
When the agent clicks close (or clicks "Preview" on a different persona)
Then the panel closes (or switches to the new persona)
And the card grid remains visible

### Scenario: Persona selections appear in the Review step
Given the agent has selected 2 personas and advances to Review
Then the Review summary shows a "Buyer Personas" row
And it displays the selected persona names in order (e.g., "1. The Business Mogul, 2. The Coastal Escape Seeker")

### Scenario: Persona selections are included in the report creation payload
Given the agent clicks "Generate Report" on the Review step
When POST /api/reports is called
Then the request body includes a personaIds array with the selected persona UUIDs in selection order
And the API creates report_persona junction records via setReportPersonas()

### Scenario: API route for listing personas
Given the page loads the Personas step
When GET /api/buyer-personas is called
Then all 8 personas are returned ordered by display_order
And each persona includes: id, name, slug, tagline, primaryMotivation, buyingLens, whatWinsThem, biggestFear, profileOverview, reportMetrics, narrativeFraming, talkingPointTemplates

### Scenario: Personas step loads without delay
Given the agent advances to the Personas step
Then personas are pre-fetched (loaded when the wizard mounts or on step 2)
And no loading spinner is shown on step transition
And if fetch fails, an error message appears with a "Retry" button

### Scenario: Back navigation preserves selections
Given the agent has selected 2 personas on the Personas step
When they click Back to return to Sections, then click Next to return to Personas
Then their 2 persona selections are preserved in the same order

### Scenario: Wizard works without persona selection feature flag (graceful)
Given the buyer_personas table exists with seed data
Then the Personas step is always shown (no feature flag needed)
And if the API returns 0 personas (empty table), the step shows: "No buyer personas available. You can generate a report without persona targeting."
And the Next button is enabled (0 is acceptable only if no personas exist in the system)

## User Journey

1. Agent opens /reports/new — report builder wizard loads
2. **Step 1: Market** — selects target market
3. **Step 2: Sections** — chooses report sections
4. **Step 3: Personas** — selects 1-3 buyer personas, previews what each adds
5. **Step 4: Review** — confirms title, market, sections, and personas → "Generate Report"
6. Report is created with persona selections → redirected to /reports

## UI Mockup

```
┌─ Card (bg: surface, radius: md, shadow: sm, p: spacing-6) ──────────────────────────┐
│                                                                                        │
│  GENERATE REPORT (font: serif, text: 2xl, bold, color: primary)                        │
│  Configure and generate a market intelligence report.                                  │
│  ─────── (accent line, w: spacing-12)                                                  │
│                                                                                        │
│  ● Market  ─── ● Sections  ─── ◉ Personas  ─── ○ Review                               │
│                                                                                        │
│  Select Buyer Personas (font: sans, text: sm, font-medium)                             │
│  Choose 1-3 buyer archetypes. The first persona sets the report's primary              │
│  narrative tone. (font: sans, text: xs, color: text-secondary)                         │
│                                                                                        │
│  ┌─ Persona Grid (2 columns, gap: spacing-3) ─────────────────────────────────────┐   │
│  │                                                                                  │   │
│  │  ┌─ PersonaCard (selected, border: accent, bg: accent-light) ─────────────┐     │   │
│  │  │  ❶ (badge: bg-accent, color-primary, radius-full, top-right)            │     │   │
│  │  │                                                                          │     │   │
│  │  │  The Business Mogul (font: serif, text-lg, semibold)                     │     │   │
│  │  │  Treats real estate as an asset class.                                   │     │   │
│  │  │  (text-xs, color: text-secondary)                                        │     │   │
│  │  │                                                                          │     │   │
│  │  │  ┌ Status + Asset Strategy ┐ (pill: bg-primary-light, text-xs)           │     │   │
│  │  │  └────────────────────────┘                                              │     │   │
│  │  │                                                                          │     │   │
│  │  │  [Preview] (text-xs, color: accent, underline, cursor-pointer)           │     │   │
│  │  └──────────────────────────────────────────────────────────────────────────┘     │   │
│  │                                                                                  │   │
│  │  ┌─ PersonaCard (unselected, border: border, hover: border-strong) ───────┐     │   │
│  │  │                                                                          │     │   │
│  │  │  The Legacy Builder (font: serif, text-lg, semibold)                     │     │   │
│  │  │  Multi-generational wealth and family legacy.                            │     │   │
│  │  │  (text-xs, color: text-secondary)                                        │     │   │
│  │  │                                                                          │     │   │
│  │  │  ┌ Meaning + Legacy ┐ (pill: bg-primary-light, text-xs)                  │     │   │
│  │  │  └─────────────────┘                                                     │     │   │
│  │  │                                                                          │     │   │
│  │  │  [Preview] (text-xs, color: accent, underline, cursor-pointer)           │     │   │
│  │  └──────────────────────────────────────────────────────────────────────────┘     │   │
│  │                                                                                  │   │
│  │  ... (6 more persona cards in 2-column grid)                                     │   │
│  │                                                                                  │   │
│  └──────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                        │
│  ┌─ Preview Panel (bg: background, radius: sm, p: spacing-4) ─────────────────────┐   │
│  │  (Appears below grid when "Preview" is clicked)                                  │   │
│  │                                                                                  │   │
│  │  THE BUSINESS MOGUL (font: serif, text-xl, semibold, color: primary)             │   │
│  │  ──── (accent line)                                                              │   │
│  │                                                                                  │   │
│  │  Founder, CEO, PE partner, hedge fund manager. Treats real estate as an          │   │
│  │  asset class. Every purchase is underwritten.                                    │   │
│  │  (font: sans, text-sm, color: text)                                              │   │
│  │                                                                                  │   │
│  │  What Wins Them: Data, market intelligence, exclusivity                          │   │
│  │  (font: sans, text-xs, font-medium)                                              │   │
│  │                                                                                  │   │
│  │  Biggest Fear: Overpaying                                                        │   │
│  │  (font: sans, text-xs, color: text-secondary)                                    │   │
│  │                                                                                  │   │
│  │  KEY VOCABULARY (text-xs, uppercase, color: text-tertiary, tracked)              │   │
│  │  ┌basis┐ ┌alpha┐ ┌total return┐ ┌replacement cost┐ ┌cap rate┐                   │   │
│  │  (pills: border-border, text-xs, color: text-secondary)                          │   │
│  │                                                                                  │   │
│  │  TOP REPORT METRICS (text-xs, uppercase, color: text-tertiary, tracked)          │   │
│  │  • CAGR by Micro-Market                                                          │   │
│  │  • Price Per Square Foot Trends                                                  │   │
│  │  • Days on Market vs Sold Price                                                  │   │
│  │  (font: sans, text-xs, color: text)                                              │   │
│  │                                                                                  │   │
│  │  SAMPLE TALKING POINT (text-xs, uppercase, color: text-tertiary, tracked)        │   │
│  │  "In [period], ultra-luxury volume ($10M+) reached [value],                      │   │
│  │  representing..."                                                                │   │
│  │  (font: sans, text-xs, color: text-secondary, italic, bg: surface, p: spacing-2)│   │
│  │                                                                                  │   │
│  │  [Close Preview] (text-xs, color: text-tertiary, cursor-pointer)                 │   │
│  └──────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                        │
│  ┌───────────────────────────────────────────────────────────────────────────────────┐ │
│  │  [Back] (text-secondary)                              [Next] (bg: accent, bold)   │ │
│  └───────────────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Review Step (Updated — Step 4)

```
┌─ Review Summary (bg: background, radius: sm, p: spacing-4) ─────────────────────────┐
│  Report Summary (font: sans, text: sm, font-semibold)                                 │
│                                                                                        │
│  Market .......................... Naples Ultra-Luxury                                  │
│  Sections ........................ 7 of 8                                               │
│  Buyer Personas .................. 1. The Business Mogul                                │
│                                    2. The Coastal Escape Seeker                         │
│  Title ........................... Naples Ultra-Luxury Intelligence Report               │
│                                                                                        │
│  (font: sans, text-xs, left labels: color-text-secondary, right values: font-medium)   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

## Component References

- StepIndicator: components/markets/step-indicator.tsx (reused, update STEPS from 3 to 4)
- PersonaCard: NEW — .specs/design-system/components/persona-card.md (stub needed)
- PersonaPreviewPanel: NEW — .specs/design-system/components/persona-preview-panel.md (stub needed)

## Implementation Notes

### Wizard Changes
- STEPS array changes from ["Market", "Sections", "Review"] to ["Market", "Sections", "Personas", "Review"]
- New state: selectedPersonaIds: string[] (ordered array, max 3)
- New state: previewPersonaSlug: string | null (which persona's preview is open)
- New state: personas: BuyerPersona[] (fetched from API)
- Step 2 (Sections) → Step 3 (Personas) → Step 4 (Review)
- handleSubmit payload adds personaIds field

### API Changes
- GET /api/buyer-personas route must be created (service function exists)
- POST /api/reports must accept optional personaIds in body
- After report creation, call setReportPersonas(reportId, personaIds) if personaIds provided

### Data Flow
1. Wizard mounts → fetch personas from GET /api/buyer-personas
2. Agent selects 1-3 personas (stored as ordered array in component state)
3. On submit → POST includes personaIds: [uuid1, uuid2, ...]
4. API creates report → calls setReportPersonas(reportId, personaIds) → returns report ID
5. Redirect to /reports

## Persona Revision Notes

**Reviewed through persona lenses**:

- **Rising Star Agent (Alex)**: Alex needs the persona selection to feel like a strategic advantage — "I'm customizing this intelligence brief for my HNWI." The card layout and preview panel reinforce that these are data-backed buyer archetypes, not generic profiles. The selection order badge (1, 2, 3) mirrors the "positioning" language Alex uses naturally.

- **Team Leader (Taylor)**: Taylor needs this to be fast and consistent across team members. The 2-column grid is scannable. No complex interactions — just click cards, preview if needed, move on. The "maximum 3" constraint prevents analysis paralysis. Team members can be trained: "Always select Business Mogul first for our Naples clients."

- **Legacy Agent (Pat)**: Pat may be less comfortable with UI complexity. The card layout is clean — name, tagline, motivation pill. The preview panel provides the narrative context Pat values without cluttering the selection view. Pat will appreciate seeing "Key Vocabulary" and "Sample Talking Point" — that's the editorial craft Pat respects.

**Vocabulary adjustments made**: Used "buyer personas" (not "archetypes" or "profiles") throughout the UI since agents already use this term. "Primary narrative tone" aligns with how Jordan and Pat think about report voice. "Intelligence brief" appears in preview context to match Alex's vocabulary.
