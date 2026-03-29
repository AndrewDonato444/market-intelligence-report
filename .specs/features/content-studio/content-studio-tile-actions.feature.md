---
feature: Content Studio Tile Actions
domain: content-studio
source:
  - components/content-studio/content-studio-tile-grid.tsx
tests:
  - __tests__/content-studio/content-studio-tile-actions.test.tsx
components:
  - ContentStudioTileGrid
  - ContentStudioTile
  - TileActionPanel
personas:
  - rising-star-agent
  - legacy-agent
design_refs:
  - .specs/design-system/tokens.md
status: implemented
created: 2026-03-29
updated: 2026-03-29
---

# Content Studio Tile Actions

**Source File**: `components/content-studio/content-studio-tile-grid.tsx`
**Design System**: `.specs/design-system/tokens.md`
**Personas**: `.specs/personas/rising-star-agent.md` (Alex, 32 — wants fast entry), `.specs/personas/legacy-agent.md` (Pat, 60 — needs clear visual hierarchy)

## Problem

The current Content Studio listing page wastes horizontal space. Each tile is a photo card with small green "Social Media" / "Email" status badges overlaid at the bottom. The badges are hard to read, the action (clicking the whole card) is unclear, and there's no way to generate missing content types from this page — users must click through to the report detail first.

The page needs a clear, visually prominent action area next to each tile that:
- Provides one-click access to the Content Studio when content exists
- Offers a generate button when content hasn't been created yet
- Uses the white space to the right of tiles productively

## Feature: Content Studio Tile Actions

Redesign the Content Studio listing tiles from a card-only layout to a **tile + action panel** layout. Each report row shows the photo tile on the left and an action panel on the right. The action panel dynamically shows the appropriate state for social media and email content.

### Scenario: Content studio with both social media and email completed
```gherkin
Given I have a report with a completed social media kit and completed email campaign
When I view the Content Studio listing page
Then I see the report photo tile on the left
And to the right I see an action panel with two sections:
  | Section       | State     | Action                  |
  | Social Media  | completed | "Open Social Media Kit" button linking to /reports/{id}/kit |
  | Email         | completed | "Open Email Kit" button linking to /reports/{id}/kit?tab=email |
And both buttons use the accent (gold) color scheme
```

### Scenario: Content studio with only social media completed
```gherkin
Given I have a report with a completed social media kit and no email campaign
When I view the Content Studio listing page
Then the action panel shows:
  | Section       | State     | Action                           |
  | Social Media  | completed | "Open Social Media Kit" button       |
  | Email         | none      | "Generate Email Kit" button |
And the generate button uses a secondary/outline style
```

### Scenario: Content studio with nothing generated yet
```gherkin
Given I have a report that appears on the listing (it has at least one kit/email record)
And the social media kit status is null or failed
And the email campaign status is null or failed
When I view the Content Studio listing page
Then the action panel shows:
  | Section       | State     | Action                            |
  | Social Media  | none      | "Generate Social Media Kit" button    |
  | Email         | none      | "Generate Email Kit" button  |
And both buttons use the secondary/outline style
```

### Scenario: Content is currently generating
```gherkin
Given I have a report with a social media kit in "generating" status
When I view the Content Studio listing page
Then the Social Media section shows a "Generating..." label with a pulsing indicator
And the button is disabled during generation
```

### Scenario: User clicks "Generate Social Media" from the listing
```gherkin
Given I see a "Generate Social Media Kit" button on the action panel
When I click the button
Then the system triggers social media kit generation for that report
And the button changes to "Generating..." with a pulsing indicator
And when generation completes, the button updates to "Open Social Media Kit"
```

### Scenario: User clicks "Generate Email Campaign" from the listing
```gherkin
Given I see a "Generate Email Kit" button on the action panel
When I click the button
Then the system triggers email campaign generation for that report
And the button changes to "Generating..." with a pulsing indicator
And when generation completes, the button updates to "Open Email Kit"
```

### Scenario: Generation fails
```gherkin
Given a social media kit generation fails
Then the action panel shows the Social Media section with "Failed — Retry" button
And clicking "Retry" triggers generation again
```

### Scenario: Responsive layout on smaller screens
```gherkin
Given the user is on a tablet or smaller screen (< 768px)
When they view the Content Studio listing page
Then the action panel stacks below the photo tile instead of beside it
And all buttons are full-width
```

## User Journey

1. User navigates to **Content Studio** in sidebar
2. Sees reports grouped by market with photo tiles + action panels
3. For completed content → clicks "Open Social Media Kit" or "Open Email Kit" → taken to content studio
4. For missing content → clicks "Generate" → content generates in place → button updates when ready

## UI Mockup

```
─── Naples ──────────────────────────────────────────────────

┌──────────────────────┐  ┌─────────────────────────────────┐
│                      │  │                                 │
│    [city photo]      │  │  Naples Q1 2026 Luxury Report   │
│                      │  │  3/17/2026                      │
│                      │  │                                 │
│                      │  │  ┌─────────────────────────┐    │
│                      │  │  │  ● Open Social Media  → │    │
│                      │  │  └─────────────────────────┘    │
│                      │  │  ┌─────────────────────────┐    │
│                      │  │  │  ● Open Email Campaign → │   │
│                      │  │  └─────────────────────────┘    │
│                      │  │                                 │
└──────────────────────┘  └─────────────────────────────────┘

─── Miami ───────────────────────────────────────────────────

┌──────────────────────┐  ┌─────────────────────────────────┐
│                      │  │                                 │
│    [city photo]      │  │  Miami Q1 2026 Ultra Luxury     │
│                      │  │  3/17/2026                      │
│                      │  │                                 │
│                      │  │  ┌─────────────────────────┐    │
│                      │  │  │  ● Open Social Media  → │    │
│                      │  │  └─────────────────────────┘    │
│                      │  │  ┌─────────────────────────┐    │
│                      │  │  │  ○ Generate Email      ↻ │   │
│                      │  │  └─────────────────────────┘    │
│                      │  │                                 │
└──────────────────────┘  └─────────────────────────────────┘

─── Newport ─────────────────────────────────────────────────

┌──────────────────────┐  ┌─────────────────────────────────┐
│                      │  │                                 │
│    [city photo]      │  │  Newport Q1 2026 Luxury Report  │
│                      │  │  3/28/2026                      │
│                      │  │                                 │
│                      │  │  ┌─────────────────────────┐    │
│                      │  │  │  ◎ Generating...        │    │ ← pulsing
│                      │  │  └─────────────────────────┘    │
│                      │  │  ┌─────────────────────────┐    │
│                      │  │  │  ○ Generate Email      ↻ │   │
│                      │  │  └─────────────────────────┘    │
│                      │  │                                 │
└──────────────────────┘  └─────────────────────────────────┘

Design Token Usage:
─────────────────
- Layout: tile (left, fixed 240px) + action panel (right, flex-1)
- Tile: same photo+gradient overlay as current (160px height, radius-md, shadow-sm)
- Action panel: bg-surface, border border-border, radius-md, shadow-sm, p-spacing-4
- Report title: font-serif, text-base, font-semibold, color-text
- Date: font-sans, text-xs, color-text-secondary
- "Open" buttons (completed): bg-accent, text-primary, font-sans text-sm font-medium, radius-sm
- "Generate" buttons (none/failed): border border-border, color-text-secondary, font-sans text-sm, radius-sm
- "Generating" state: color-accent, animate-pulse, disabled
- Status dots: ● completed (color-success), ○ not generated (color-border), ◎ generating (color-accent pulse)
- Responsive: below md breakpoint, stack tile above action panel (full-width)
- Row gap: spacing-4 between tile and panel
- Group gap: spacing-8 between market groups

Legend:
  ● = completed (solid dot, color-success)
  ○ = not yet generated (outline dot, color-border)
  ◎ = generating (pulsing dot, color-accent)
  → = links to content studio viewer
  ↻ = triggers generation
```

### Mobile Layout (< 768px)

```
─── Naples ──────────────

┌────────────────────────┐
│     [city photo]       │
│                        │
│  Naples Q1 2026 Luxury │
│  3/17/2026             │
└────────────────────────┘
┌────────────────────────┐
│ ● Open Social Media  → │
├────────────────────────┤
│ ● Open Email Campaign→ │
└────────────────────────┘
```

## Persona Revision Notes

**Revision pass through persona lens:**

1. **Alex (Rising Star, 32)** — Action panel provides immediate clarity: "What can I do right now?" Alex won't spend time deciphering tiny badges. The generate-in-place pattern means Alex never has to navigate away — one click to generate, one click to open. Fast.

2. **Pat (Legacy Agent, 60)** — Clear button labels instead of cryptic badges. "Open Social Media Kit" is unambiguous. The visual separation between tile (visual context) and action panel (what to do) creates a clear reading order. Pat won't accidentally click the wrong thing.

**Key vocabulary choices:**
- "Open Social Media Kit" not "View Kit" (direct, tells you what you'll see)
- "Generate Email Campaign" not "Create" (matches the platform's established verb)
- "Generating..." not "Processing" (consistent with existing loading states)

## Component References

- ContentStudioTileGrid (existing, modify): `components/content-studio/content-studio-tile-grid.tsx`
- GenerateKitButton (existing, reuse logic): `components/reports/generate-kit-button.tsx`
- GenerateEmailButton (existing, reuse logic): `components/reports/generate-email-button.tsx`

## Learnings

(To be filled after implementation)
