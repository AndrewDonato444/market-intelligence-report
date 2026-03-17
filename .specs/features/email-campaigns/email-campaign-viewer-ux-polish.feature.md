---
feature: Email Campaign Viewer UX Polish
domain: email-campaigns
source: components/reports/email-viewer.tsx
tests: []
components:
  - EmailCampaignViewer
  - CtaIdea
  - CollapsibleBody
design_refs:
  - .specs/design-system/tokens.md
personas:
  - rising-star-agent
  - established-practitioner
  - team-leader
status: specced
created: 2026-03-17
updated: 2026-03-17
drift_reconciled: 2026-03-17
---

# Email Campaign Viewer UX Polish

**Source File**: components/reports/email-viewer.tsx
**Design System**: .specs/design-system/tokens.md
**Personas**: .specs/personas/rising-star-agent.md, .specs/personas/established-practitioner.md

## Feature: Email Campaign Viewer UX Polish

Four targeted UX fixes to the email campaign viewer that address visual clutter, raw data leaking into the UI, cramped layout, and low-affordance interactive elements. No new functionality — purely polish that makes the page credible for client-facing use.

---

### Scenario: Duplicate "Back to Report" link is removed from viewer
Given the user is viewing the Email Campaigns tab in Content Studio
When the email campaign viewer renders
Then only one "Back to Report" link appears — the one in the Content Studio header
And the viewer itself does NOT render its own "Back to Report" link
And the "Email Campaign" h1 title and "Generated [date]" subtitle are removed from the viewer
Because the Content Studio header already provides page context and the tab label identifies the section

### Scenario: Snake_case report section labels are humanised
Given a drip sequence email has a reportSection value of "executive_briefing"
When the email card renders
Then the badge displays "Executive Briefing" (title-cased, underscores replaced with spaces)
And this applies to all reportSection values: "the_narrative" → "The Narrative", "luxury_market_dashboard" → "Luxury Market Dashboard", etc.
And the raw snake_case string is never shown to the user

### Scenario: CTA Idea label renders above the text, not inline
Given an email card has a CTA idea to display
When the CtaIdea component renders
Then the "CTA IDEA" label appears as a small badge above the text on its own line
And the CTA text sits below the label with full horizontal width
And the Copy button is right-aligned at the top of the component, next to the label
And the text no longer wraps awkwardly due to the inline label stealing horizontal space

### Scenario: "View Full Email" toggle reads as an interactive button
Given an email card has a collapsible body
When the CollapsibleBody component renders in its collapsed state
Then the toggle displays as a styled text button with visible affordance
And it uses the primary text color (not muted/secondary) so it reads as clickable
And the chevron/triangle indicator is replaced with a cleaner "Show email body" / "Hide email body" label
And there is a bottom border or separator above it to visually separate it from the preview text

### Scenario: Cards have breathing room
Given the email campaign viewer is rendering drip sequence cards
When any content card renders
Then each card has sufficient internal padding so text does not feel cramped
And there is visible vertical spacing between consecutive cards (gap, not border-collapse)
And the Day badge and section label have enough space between them and the card edge

---

## User Journey

1. User generates email campaign (existing flow)
2. Campaign loads in viewer
3. **User can immediately orient themselves — no duplicate nav, no redundant title**
4. **User reads section labels in plain English — no technical strings**
5. **User sees CTA ideas clearly laid out, can copy without label crowding the text**
6. **User clicks "Show email body" knowing it's interactive**
7. User copies content into CRM or email tool

---

## UI Mockup

```
BEFORE (current problems):
┌──────────────────────────────────────────────────────────────┐
│ ← Back to Report                          [Export CSV]       │  ← DUPLICATE nav
├──────────────────────────────────────────────────────────────┤
│ Email Campaign                                               │  ← REDUNDANT title
│ Generated Mar 17, 2026                                       │  ← takes up space
├──────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Day 0  executive_briefing                    [Copy]      │ │  ← RAW snake_case
│ │ Naples Luxury Intelligence Brief                         │ │
│ │ Based on our latest 100-transaction analysis...          │ │
│ │ ▶ View Full Email                                        │ │  ← LOW AFFORDANCE
│ │ ┌─────────────────────────────────────────────────────┐  │ │
│ │ │ CTA IDEA  View the full intelligence brief  [Copy]  │  │ │  ← CRAMPED inline
│ │ └─────────────────────────────────────────────────────┘  │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘

AFTER (polished):
┌──────────────────────────────────────────────────────────────┐
│                                               [Export CSV]   │  ← no dupe nav
├──────────────────────────────────────────────────────────────┤
│ POST-MEETING DRIP SEQUENCE (5)                      [↻]      │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Day 0  Executive Briefing                    [Copy]      │ │  ← humanised
│ │                                                          │ │
│ │ Naples Luxury Intelligence Brief                         │ │
│ │ Based on our latest 100-transaction analysis...          │ │
│ │                                                          │ │
│ │ ──────────────────────────────────────────────────────── │ │
│ │ Show email body ↓                                        │ │  ← clear affordance
│ │                                                          │ │
│ │ ┌──────────────────────────────────────────────────────┐ │ │
│ │ │ CTA IDEA                                  [Copy]     │ │ │  ← label on top
│ │ │ View the full intelligence brief                     │ │ │  ← text has full width
│ │ └──────────────────────────────────────────────────────┘ │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐ │  ← card gap
│ │ Day 3  The Narrative                         [Copy]      │ │
│ │ ...                                                      │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## Implementation Notes

**Snake_case humanisation** — pure presentation transform, no API change:
```ts
function humaniseLabel(raw: string): string {
  return raw.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}
```

**Duplicate nav removal** — delete the `← Back to Report` Link and the `{/* Title */}` div block from `EmailCampaignViewer`. The Content Studio page already provides navigation context.

**CtaIdea layout** — change from flex-row (label | text | copy) to:
```
┌──────────────────────────────────────┐
│ CTA IDEA label           [Copy btn]  │
│ Full-width text here                 │
└──────────────────────────────────────┘
```

**CollapsibleBody** — change from muted triangle+text to a subtle bordered button:
- Color: `color-text` (not `color-text-secondary`)
- Label: "Show email body" / "Hide email body"
- Add a top border separator to visually anchor it

**Card spacing** — increase internal padding from `p-3` to `p-4`, ensure `space-y-6` between section cards (currently `space-y-3`).

---

## Persona Revision Notes

- **Alex (Rising Star)**: Sees "Executive Briefing" not "executive_briefing" — won't have to mentally parse snake_case mid-workflow. "Show email body" is unambiguous — no hesitation about whether to click.
- **Jordan (Established Practitioner)**: CTA text with full width means no truncation anxiety — can read the full line before deciding to copy. Less visual noise from the redundant title.
- **Taylor (Team Leader)**: Cards with breathing room are easier to scan when distributing sections to 10 agents. Humanised labels map directly to vocabulary Taylor uses in briefings.

---

## Additional Implemented Behaviors (not originally specced)

The following behaviors exist in the code but were not part of this UX polish spec. They are documented here for completeness and future spec coverage.

### Persona Filter Pills
The Persona-Targeted Emails section renders filter pills ("All" + one per unique persona slug) that narrow the visible email cards. This is client-side filtering with no server request.

### Vocabulary Keywords Display
Each persona email card optionally renders a "Persona Keywords" section showing the `vocabularyUsed` array as pill tags below the CTA Idea block. Only shown when `email.vocabularyUsed.length > 0`.

### Section Refresh Flash State
After a section regenerates successfully, a brief "Updated!" text appears next to the section heading for 3 seconds before disappearing. Uses `justUpdated` state keyed by `ContentType`.

### Section Heading Labels (actual code values)
- Drip sequence: "Proposed Email Sequence"
- Newsletter: "Market Intelligence Newsletter"
- Persona emails: "Persona-Targeted Emails"
- Subject lines: "Subject Line Variants"
- CTA blocks: "CTA Blocks"
- Re-engagement: "Re-Engagement Templates"

## Learnings

##