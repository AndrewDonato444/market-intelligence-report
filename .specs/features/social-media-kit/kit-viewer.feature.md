---
feature: Social Media Kit Viewer
domain: social-media-kit
source: components/reports/kit-viewer.tsx
tests:
  - __tests__/social-media-kit/kit-viewer.test.ts
components:
  - KitViewer
  - PlatformIcon
  - PlatformBadge
  - StatBox
  - SectionHeading
  - CopyButton
personas:
  - rising-star-agent
  - established-practitioner
status: implemented
created: 2026-03-11
updated: 2026-03-16
---

# Social Media Kit Viewer

**Source Files**: components/reports/kit-viewer.tsx, app/(protected)/reports/[id]/kit/page.tsx
**Design System**: .specs/design-system/tokens.md
**Personas**: .specs/personas/rising-star-agent.md, .specs/personas/established-practitioner.md

## Feature: Social Media Kit Viewer (#163) — UX Redesign

A polished content studio for browsing, filtering, and copying social media content generated from a market intelligence report. The viewer organizes 7 content types with platform-branded visual identity, section-specific card designs, and micro-interactions.

Alex (Rising Star) needs to quickly grab LinkedIn posts and stat callouts to build credibility — the viewer must make platform-specific content instantly identifiable and one-click copyable. Jordan (Established Practitioner) reviews everything methodically, curating selections for a sophisticated audience — the viewer must feel like an editorial tool, not a data dump.

---

### Scenario: View completed kit organized by content type
Given a completed social media kit exists for a report
When the user navigates to /reports/[id]/kit
Then the kit content is displayed organized into sections:
  | Section              | Content Type         |
  | Post Ideas           | postIdeas            |
  | Platform Captions    | captions             |
  | Persona-Targeted     | personaPosts         |
  | Polls                | polls                |
  | Conversation Starters| conversationStarters |
  | Stat Callouts        | statCallouts         |
  | Content Calendar     | calendarSuggestions  |

### Scenario: Header displays content studio dashboard
Given a completed kit is displayed
Then the header shows "Content Studio" in serif font (Playfair Display)
And a subtitle shows "Social Media Kit · Generated {date}"
And a summary row displays 4 metrics: total content pieces, platforms covered, active sections, persona count
And metric numbers use the gold accent color with serif font
And metric labels are uppercase, small text

### Scenario: Platform filter buttons show brand icons
Given the kit viewer is displayed
Then each platform filter button includes an inline SVG icon for that platform
And the "All" button has no icon
And clicking a platform filter highlights the button with that platform's brand color:
  | Platform  | Brand Color |
  | LinkedIn  | #0A66C2     |
  | Instagram | #E4405F     |
  | X         | #0F1419     |
  | Facebook  | #1877F2     |
And clicking "All" highlights with the primary navy color (#0F172A)

### Scenario: Filter content by platform
Given the kit viewer is displayed
When the user clicks a platform filter (LinkedIn, Instagram, X, Facebook)
Then content items with a platform field are filtered (postIdeas, captions, personaPosts, polls)
And sections without a platform field always display (conversationStarters, statCallouts, calendarSuggestions)
And filtered content animates in with a cross-fade transition
And clicking "All" resets the filter

### Scenario: Filter content by persona
Given the kit has persona-targeted posts
When the user selects a persona filter
Then only persona posts for that persona are shown
And the platform filter still applies additively

### Scenario: Platform badges show branded icons
Given any content card is displayed
When a platform badge appears (on post ideas, captions, persona posts, polls, calendar)
Then the badge shows the platform's SVG icon + name
And the badge background is the platform's light tint color
And the badge text is the platform's brand color

### Scenario: Section headers have visual identity
Given the kit viewer is displayed
Then each section header includes:
  - A colored vertical accent bar on the left
  - A small section-specific SVG icon (lightbulb, quote, users, bar-chart, chat, trending-up, calendar)
  - A serif font section title in sentence case
  - An item count in tertiary text
  - A bottom border separator
And the accent bar color varies per section for visual differentiation

### Scenario: Post Ideas cards have editorial styling
Given the Post Ideas section is displayed
Then each card shows the title in serif font (Playfair Display)
And the body text uses relaxed line spacing
And platform badges appear at the bottom
And cards have a subtle shadow that elevates on hover

### Scenario: Platform Captions cards show platform brand accent
Given the Platform Captions section is displayed
Then each caption card has a 3px left border in the platform's brand color
And hashtags are displayed in the gold accent color
And character count appears in tertiary text

### Scenario: Persona Posts show avatar-style layout
Given the Persona-Targeted Posts section is displayed
Then each card shows a circular avatar with the persona's first letter in gold
And the persona name and platform badge appear on the same line
And the post body follows in a social-post style layout

### Scenario: Polls display as interactive-looking option bars
Given the Polls section is displayed
Then the poll question appears in serif font
And each option renders as a styled bar (not a bullet list)
And each option has a letter label (A, B, C, D) in gold
And the data context appears below the options in tertiary text

### Scenario: Conversation Starters use warm background
Given the Conversation Starters section is displayed
Then each card has a light gold (accent-light) background
And the context label appears as small uppercase gold text
And the template text is wrapped in smart quotes

### Scenario: Stat Callouts display as dark pull quotes
Given the Stat Callouts section is displayed
Then each card uses a dark navy background (pullquote style)
And the stat number appears large in gold serif font
And the context and source appear in light text on the dark background
And the suggested caption is separated by a divider line in italics
And the copy button uses a light-on-dark variant

### Scenario: Content Calendar shows structured week layout
Given the Content Calendar section is displayed
Then each week shows a circular navy badge with the week number
And the theme appears in serif font beside the week badge
And post ideas are listed as numbered items below
And platform badges appear at the bottom

### Scenario: Cards animate on load with stagger
Given the kit viewer loads or filters change
Then cards appear with a staggered slide-up animation
And each card animates 60ms after the previous one
And the overall effect completes within 500ms

### Scenario: Cards elevate on hover
Given the user hovers over any content card
Then the card lifts slightly (2px upward)
And the shadow increases from sm to md
And the transition is smooth (200ms)

### Scenario: Copy button shows animated checkmark
Given the user clicks copy on any content item
When the text is copied to clipboard
Then the "Copy" label is replaced by an animated green checkmark
And the checkmark scales in with a spring animation
And the checkmark reverts to "Copy" after 2 seconds

### Scenario: Copy individual item to clipboard
Given the user is viewing kit content
When the user clicks the copy button on any content item
Then the text content is copied to the clipboard
And the copy confirmation appears

### Scenario: Kit not found
Given no social media kit exists for the report
When the user navigates to /reports/[id]/kit
Then a message "No social media kit found" is shown
And a "Generate Kit" call-to-action is displayed

### Scenario: Kit is still generating (or queued)
Given a kit with status "generating" or "queued" exists
When the user navigates to /reports/[id]/kit
Then a generating status message is shown
And a GenerateKitButton with the current status handles polling for completion

### Scenario: Navigate back to report
Given the user is viewing the kit
When the user clicks the back link
Then they return to the report detail page

### Scenario: Empty persona posts (no personas selected)
Given the kit was generated for a report with no persona selections
When the user views the kit
Then the "Persona-Targeted" section shows a message "No personas were selected for this report"
And all other sections display normally

### Scenario: Kit generation failed
Given a kit with status "failed" exists
When the user navigates to /reports/[id]/kit
Then a "Kit Generation Failed" heading is shown
And the error message from the kit is displayed
And a GenerateKitButton with "failed" status allows retry

### Scenario: Regenerate from viewer
Given the user is viewing a completed kit
When the user clicks "Regenerate Kit"
Then kit generation is triggered via POST /api/reports/[id]/kit/generate
And the user is redirected to the report detail page

### Scenario: Section-level refresh still works
Given the user is viewing a completed kit
When the user clicks the refresh icon on any section heading
Then a spinning animation appears on the icon
And after regeneration completes, the section content updates
And an "Updated!" indicator appears briefly

### Scenario: API returns kit content for authorized user
Given a completed kit exists for the user's report
When GET /api/reports/[id]/kit/status is called
Then it returns the kit with full content JSONB
And includes status, generatedAt, and content fields

---

## User Journey

1. User generates a report (existing flow)
2. Report completes → user sees "Generate Social Media Kit" button
3. User clicks generate → kit is created
4. Button changes to "View Social Media Kit" (link to /reports/[id]/kit)
5. **User enters Content Studio — sees dashboard header with content counts**
6. **User identifies platform-specific content instantly via branded icons**
7. **User filters by platform — content animates with cross-fade**
8. **User copies stat callouts (dark pull-quote cards pop visually)**
9. **User browses content calendar for posting schedule**
10. User pastes into their social media scheduling tool

---

## UI Mockup

```
/reports/[id]/kit
┌──────────────────────────────────────────────────────────┐
│ ← Back to Report                        [Regenerate Kit] │
│                                                          │
│ Content Studio          (font: serif, text: 2xl, bold)   │
│ Social Media Kit · Generated Mar 16, 2026                │
│                                                          │
│ ┌────────────┬────────────┬────────────┬────────────┐    │
│ │     32     │      4     │      7     │      2     │    │
│ │  CONTENT   │ PLATFORMS  │  SECTIONS  │  PERSONAS  │    │
│ │  PIECES    │            │            │            │    │
│ └────────────┴────────────┴────────────┴────────────┘    │
│                                                          │
│ Platform: [All] [🔵in LinkedIn] [📷 Instagram] [𝕏 X]    │
│           [🔵f Facebook]                                 │
│           (active = platform brand color bg)             │
│                                                          │
│ ▎💡 Post Ideas  8                              [↻]      │
│ ─────────────────────────────────────────────────        │
│ ┌──────────────────────────────────────────────────┐     │
│ │ The Volume Collapse Story   (serif, semibold)    │[✓]  │
│ │                                                  │     │
│ │ Our latest analysis reveals that New Canaan's    │     │
│ │ luxury market isn't experiencing a price crash—   │     │
│ │ it's experiencing a participation strike...       │     │
│ │                                                  │     │
│ │ [🔵 LinkedIn] [🔵 Facebook]                     │     │
│ │ (branded pills with icons)                       │     │
│ └──────────────────────────────────────────────────┘     │
│                                                          │
│ ▎💬 Platform Captions  4                       [↻]      │
│ ─────────────────────────────────────────────────        │
│ ┌───┬──────────────────────────────────────────────┐     │
│ │   │ [🔵 LinkedIn]  187 characters         [Copy] │     │
│ │ B │                                              │     │
│ │ L │ "The luxury market is telling a story that    │     │
│ │ U │ most agents are misreading..."               │     │
│ │ E │                                              │     │
│ │   │ #LuxuryRealEstate #MarketIntelligence        │     │
│ │   │ (hashtags in gold accent)                    │     │
│ └───┴──────────────────────────────────────────────┘     │
│  ↑ 3px left border in platform brand color               │
│                                                          │
│ ▎👥 Persona-Targeted Posts  3                  [↻]      │
│ ─────────────────────────────────────────────────        │
│ Persona: [All] [Private Equity] [Retiring UHNW]         │
│ ┌──────────────────────────────────────────────────┐     │
│ │ (J) Jordan Ellis  [🔵 LinkedIn]           [Copy] │     │
│ │  ↑ gold avatar circle                            │     │
│ │                                                  │     │
│ │ "For global investors evaluating the US luxury   │     │
│ │ market, this data point changes the calculus..." │     │
│ └──────────────────────────────────────────────────┘     │
│                                                          │
│ ▎📊 Polls  4                                   [↻]      │
│ ─────────────────────────────────────────────────        │
│ ┌──────────────────────────────────────────────────┐     │
│ │ What's driving luxury decisions?  (serif)  [Copy]│     │
│ │                                                  │     │
│ │ ┌─ A ─ Location & lifestyle ────────────────┐   │     │
│ │ ├─ B ─ Investment potential ────────────────┤    │     │
│ │ ├─ C ─ Tax advantages ─────────────────────┤    │     │
│ │ └─ D ─ Portfolio diversification ───────────┘   │     │
│ │   (option bars with gold letter labels)          │     │
│ │                                                  │     │
│ │ [🔵 LinkedIn]  Based on Q1 buyer data            │     │
│ └──────────────────────────────────────────────────┘     │
│                                                          │
│ ▎💬 Conversation Starters  5                   [↻]      │
│ ─────────────────────────────────────────────────        │
│ ┌──────────────────────────────────────────────────┐     │
│ │  bg: accent-light (warm gold tint)               │     │
│ │  MARKET TIMING  (gold uppercase label)    [Copy] │     │
│ │  "I've been analyzing the Q1 transaction         │     │
│ │  data and here's what most agents miss..."       │     │
│ └──────────────────────────────────────────────────┘     │
│                                                          │
│ ▎📈 Stat Callouts  6                           [↻]      │
│ ─────────────────────────────────────────────────        │
│ ┌──────────────────────────────────────────────────┐     │
│ │ ██████████████████████████████████████████████████│     │
│ │ ██  91.3% Volume Decline  (gold serif xl) ██████ │     │
│ │ ██                                        ██████ │     │
│ │ ██  The defining metric is the volume      █[📋]█│     │
│ │ ██  collapse to $437M in total value...   ██████ │     │
│ │ ██                                        ██████ │     │
│ │ ██  Source: Q1 2026 MLS transaction data  ██████ │     │
│ │ ██  ──────────────────────────────────    ██████ │     │
│ │ ██  "The volume collapse tells the real   ██████ │     │
│ │ ██  story..."  (italic)                  ██████ │     │
│ │ ██████████████████████████████████████████████████│     │
│ └──────────────────────────────────────────────────┘     │
│  ↑ dark navy bg, light text, gold stat = pullquote       │
│                                                          │
│ ▎📅 Content Calendar  4                        [↻]      │
│ ─────────────────────────────────────────────────        │
│ ┌──────────────────────────────────────────────────┐     │
│ │ (1)  Market Intelligence Launch  (serif)         │     │
│ │  ↑ navy circle                                   │     │
│ │      1. Waterfront Premium reveal                │     │
│ │      2. Q1 snapshot                              │     │
│ │      [🔵 LinkedIn] [📷 Instagram]               │     │
│ └──────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────┘
```

## Component References

- KitViewer: components/reports/kit-viewer.tsx (redesign)
- GenerateKitButton: components/reports/generate-kit-button.tsx (unchanged)
- Design Tokens: .specs/design-system/tokens.md
- Animations: lib/animations.ts (reuse staggerContainer, fadeVariant)

## Learnings

- The original kit viewer was implemented as a functional-first MVP with identical card styling for all 7 content types. The UX redesign differentiates each section visually while preserving all existing functionality (filter, copy, refresh, regenerate).
- Platform brand colors are added as CSS custom properties in globals.css rather than hardcoded in the component, following the existing design token pattern.
- Inline SVGs are used for platform icons since the project has no icon library — consistent with the existing refresh icon pattern in kit-viewer.tsx.
- Framer Motion stagger animations reuse the existing `staggerContainer` variant from lib/animations.ts.
- Stat callout pull-quote treatment reuses the existing `--color-report-pullquote-bg` design concept from the PDF report tokens.
