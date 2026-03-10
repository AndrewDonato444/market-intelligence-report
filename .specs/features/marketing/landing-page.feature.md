---
feature: Marketing Landing Page
domain: marketing
source: app/page.tsx
tests:
  - __tests__/app/landing-page.test.tsx
components:
  - HeroSection
  - DataCallout
  - EditorialShowcase
  - Intelligencepillars
  - ProcessNarrative
  - ReportBreakdown
  - ClosingStatement
  - LandingNav
personas:
  - rising-star-agent
  - established-solo
  - team-leader
  - competitive-veteran
  - legacy-agent
status: implemented
created: 2026-03-10
updated: 2026-03-10
---

# Marketing Landing Page

**Source File**: `app/page.tsx`
**Design System**: `.specs/design-system/tokens.md`
**Creative Brief**: Knox Brothers Intelligence Report Creative Design Brief (March 2026)
**Personas**: All five agent personas

## Overview

The public-facing marketing page for Modern Signal Advisory's Luxury Market Intelligence Report platform. This page replaces the current placeholder at `app/page.tsx`.

### Design Philosophy (from Creative Brief)

The creative brief establishes five design principles that govern this page:

1. **Editorial, Not Corporate** — the page reads like a magazine spread, not a SaaS landing page. Typography-driven, not bullet-driven. Every section has visual rhythm.
2. **Breathe With White Space** — generous margins and spacing communicate confidence and premium positioning. Resist the urge to fill every inch.
3. **Data as Art** — oversized hero numbers with supporting context lines. Data callouts are design elements, not functional inserts.
4. **Photography as Architecture** — images integrated as structural elements. Morning light, warm desaturated color grading. Gulf coast architecture, not stock photos.
5. **Quiet Authority** — no flashy tricks, no gradients for their sake. Confidence comes from restraint.

### Voice Principles (design translations)

| Voice | Design Translation |
|-------|-------------------|
| Confident, Not Arrogant | Bold typography, decisive layout. Never flashy or over-designed. |
| Warm, Not Casual | Warm-toned backgrounds, serif typography, morning-light photography. |
| Strategic, Not Salesy | No aggressive CTAs, no urgency callouts. Intelligence, not promotion. |
| Story-Driven, Not Feature-Dumping | Narrative arc with focal points. Photography tells a story. |
| Discreet, Not Secretive | Exclusive feel without gatekeeping. Invite the reader in, then deliver. |

### Hard Guardrails

- No exclamation points anywhere on the page
- No urgency language ("Don't miss out," "Act now," "Limited time")
- No generic luxury adjectives without proof ("stunning," "gorgeous," "breathtaking")
- No real estate cliches ("Turnkey paradise," "Dream home")
- No discount or value-oriented language
- No stock photography or generic beach imagery
- No cluttered layouts — if it feels crowded, add more space
- No influencer-style design or viral hooks

---

## Feature: Marketing Landing Page

### Scenario: First-time visitor lands on the page
Given a visitor navigates to the root URL "/"
When the page loads
Then they see a full-viewport hero with a full-bleed architectural photograph and dark overlay
And a serif headline in Playfair Display communicating strategic intelligence
And a gold accent line beneath the headline
And a single-sentence subheadline in Inter addressing luxury advisors
And a single understated gold CTA button reading "Request a Sample Report"
And the overall impression is editorial luxury — not a SaaS conversion page
And the page loads within 2 seconds on a 4G connection

### Scenario: Visitor encounters the hero data callouts
Given the visitor has seen the hero
When they scroll to the data callout section just below the hero
Then they see 3 oversized data figures styled as design elements
And each figure uses Playfair Display at text-4xl in gold or navy
And each figure has a supporting context line beneath it in Inter
And the callouts are spaced generously with ample white space between them
And the section establishes the product as data-rich without feeling cluttered

### Scenario: Visitor reaches the editorial showcase
Given the visitor has scrolled past the data callouts
When the editorial showcase section enters the viewport
Then they see a two-column editorial spread layout
And the left column contains a serif headline and editorial body copy describing the report
And the right column contains a stylized representation of the report (magazine-format preview)
And the report preview has a subtle shadow and warm border treatment
And the layout feels like a magazine feature spread, not a product screenshot
And generous white space surrounds both columns

### Scenario: Visitor reads the intelligence pillars
Given the visitor has scrolled to the intelligence pillars section
When the section is visible
Then they see three pillars with generous spacing between them
And each pillar has a small gold accent mark, a serif title, and a concise description
And the descriptions use advisor vocabulary (not developer or SaaS vocabulary)
And the section has warm-toned background (not cold white)
And the typography hierarchy is clear: serif title dominant, sans body secondary

### Scenario: Visitor sees the process narrative
Given the visitor has scrolled to the process section
When the section is visible
Then they see a three-part narrative presented editorially (not as numbered SaaS steps)
And each part has an oversized Playfair number in gold
And each part has a one-line title and a brief description
And the presentation is horizontal on desktop with subtle connecting elements
And the overall feel is story-driven, not a feature checklist

### Scenario: Visitor explores report contents
Given the visitor has scrolled to the report breakdown section
When the section is visible
Then they see a section on dark navy background
And a serif heading introduces the report structure
And they see the report sections listed with one-line descriptions
And the section communicates depth with restraint — not an exhaustive feature list
And key differentiators (confidence ratings, AI forecasts, Market Matrix) are subtly highlighted with gold accents
And generous spacing prevents any feeling of clutter

### Scenario: Visitor reaches the closing statement
Given the visitor has scrolled to the bottom of the page
When the closing statement section is visible
Then they see a section with full-bleed photography and dark overlay (matching hero treatment)
And a brief, confident closing headline in Playfair Display
And a single gold CTA button reading "Request a Sample Report"
And minimal footer with "Modern Signal Advisory" branding and copyright
And no urgency language, no aggressive conversion design
And the closing feels like the final page of a magazine — quiet, confident, complete

### Scenario: Navigation behavior
Given the visitor is anywhere on the page
When they look at the top of the viewport
Then they see a minimal fixed navigation bar
And the nav contains "Modern Signal Advisory" wordmark in serif on the left
And a "Sign In" text link and understated "Request Access" link on the right
And the nav background transitions from transparent to warm white on scroll
And the nav has a subtle bottom border in color-border when scrolled
And the transition uses duration-default with ease-default

### Scenario: Page is viewed on mobile (< 768px)
Given the visitor is on a mobile device
When the page renders
Then the hero headline scales to text-3xl but remains the dominant element
And the data callouts stack vertically with generous spacing
And the editorial showcase stacks (copy above, report preview below)
And the intelligence pillars stack vertically
And the process narrative stacks vertically with left-aligned numbers
And all touch targets are at least 44px
And horizontal scrolling never occurs
And white space proportions are maintained (not collapsed)

### Scenario: Page is viewed on tablet (768px - 1024px)
Given the visitor is on a tablet
When the page renders
Then the editorial showcase maintains its two-column layout
And the intelligence pillars display in 3 columns (with reduced spacing)
And the data callouts remain in a horizontal row
And typography scales proportionally between mobile and desktop

### Scenario: Visitor clicks primary CTA
Given the visitor clicks "Request a Sample Report" or "Request Access"
When the click event fires
Then they are navigated to "/auth/signup"

### Scenario: Visitor clicks "Sign In"
Given the visitor clicks "Sign In" in the navigation
When the click event fires
Then they are navigated to "/auth/signin"

### Scenario: Photography and imagery
Given the page is rendered
When the visitor views the hero and closing sections
Then both sections feature full-bleed photography with dark navy overlays
And the photography subjects are architectural (Gulf coast estates, clean lines, coastal)
And the color grading is warm and slightly desaturated (morning light / golden hour)
And no stock photos, no tourist imagery, no identifiable faces
And images are loaded via next/image with appropriate priority and sizing

---

## User Journey

1. Agent hears about Modern Signal Advisory (referral, wealth manager, search)
2. **Lands on marketing page (this feature)**
3. Scrolls through — editorial quality establishes credibility before a word of sales copy
4. Clicks "Request a Sample Report" → sign-up flow
5. Onboarding → first report

---

## UI Mockup

```
┌─────────────────────────────────────────────────────────────────────────┐
│ NAV (fixed, transparent → warm white on scroll)                          │
│                                                                          │
│   Modern Signal Advisory              Sign In    Request Access          │
│   (Playfair, small caps)              (text link) (understated link)     │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│ HERO (100vh)                                                             │
│ ┌────────────────────────────────────────────────────────────────────┐   │
│ │                                                                    │   │
│ │   [FULL-BLEED PHOTOGRAPHY: Gulf coast architecture,                │   │
│ │    morning light, warm desaturated — with dark navy overlay]       │   │
│ │                                                                    │   │
│ │                                                                    │   │
│ │              The Intelligence Behind                               │   │
│ │              the Advisory                                          │   │
│ │              (Playfair Display, text-5xl,                          │   │
│ │               color-text-inverse, font-light)                      │   │
│ │                                                                    │   │
│ │              ════════════════                                       │   │
│ │              (color-accent, 2px, 80px wide)                        │   │
│ │                                                                    │   │
│ │              Market intelligence that your clients                 │   │
│ │              and their advisors will read cover to cover.          │   │
│ │              (Inter, text-lg, color-text-tertiary,                 │   │
│ │               max-width: 480px, line-height: 1.6)                  │   │
│ │                                                                    │   │
│ │              [Request a Sample Report]                              │   │
│ │              (bg: color-accent, color-primary,                     │   │
│ │               radius-sm, px-8 py-3, text-sm,                       │   │
│ │               tracking-wide, uppercase)                            │   │
│ │                                                                    │   │
│ │                                                                    │   │
│ └────────────────────────────────────────────────────────────────────┘   │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│ DATA CALLOUTS (bg: color-surface, py: spacing-16)                        │
│                                                                          │
│                  generous white space above                               │
│                                                                          │
│   ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐   │
│   │                   │  │                   │  │                   │   │
│   │       31          │  │        7          │  │       8           │   │
│   │  (Playfair,       │  │  (Playfair,       │  │  (Playfair,       │   │
│   │   text-5xl,       │  │   text-5xl,       │  │   text-5xl,       │   │
│   │   color-accent)   │  │   color-accent)   │  │   color-accent)   │   │
│   │                   │  │                   │  │                   │   │
│   │   ── (gold line)  │  │   ── (gold line)  │  │   ── (gold line)  │   │
│   │                   │  │                   │  │                   │   │
│   │   Proprietary     │  │   Specialized     │  │   Intelligence    │   │
│   │   market          │  │   AI agents       │  │   sections per    │   │
│   │   indicators      │  │   per report      │  │   report          │   │
│   │   (Inter, text-sm │  │   (Inter, text-sm │  │   (Inter, text-sm │   │
│   │   color-text-     │  │   color-text-     │  │   color-text-     │   │
│   │   secondary)      │  │   secondary)      │  │   secondary)      │   │
│   │                   │  │                   │  │                   │   │
│   └───────────────────┘  └───────────────────┘  └───────────────────┘   │
│                                                                          │
│                  generous white space below                               │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│ EDITORIAL SHOWCASE (bg: warm off-white, py: spacing-16)                  │
│                                                                          │
│   ┌──────────────────────────┐    ┌─────────────────────────────┐       │
│   │                          │    │                             │       │
│   │  A publication, not      │    │  ┌───────────────────────┐  │       │
│   │  a printout.             │    │  │                       │  │       │
│   │  (Playfair, text-3xl,    │    │  │   REPORT PREVIEW      │  │       │
│   │   color-primary)         │    │  │   (magazine-format,    │  │       │
│   │                          │    │  │    editorial spread    │  │       │
│   │  ── (gold accent, 40px)  │    │  │    with visible        │  │       │
│   │                          │    │  │    sections:            │  │       │
│   │  Every report is a       │    │  │                       │  │       │
│   │  magazine-quality        │    │  │    Executive Summary   │  │       │
│   │  market publication      │    │  │    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓    │  │       │
│   │  that blends             │    │  │    Market Matrix ★★★  │  │       │
│   │  editorial narrative,    │    │  │    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓    │  │       │
│   │  sophisticated data      │    │  │    Forecasts ↗ +4.2%  │  │       │
│   │  visualization, and      │    │  │                       │  │       │
│   │  strategic intelligence  │    │  │   )                    │  │       │
│   │  into a premium reading  │    │  └───────────────────────┘  │       │
│   │  experience your clients │    │   (shadow-lg, radius-md,    │       │
│   │  will keep — not delete. │    │    warm border-bottom:       │       │
│   │                          │    │    color-accent 2px)         │       │
│   │  (Inter, text-base,      │    │                             │       │
│   │   color-text-secondary,  │    └─────────────────────────────┘       │
│   │   line-height: 1.7)     │                                           │
│   │                          │                                           │
│   └──────────────────────────┘                                           │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│ INTELLIGENCE PILLARS (bg: color-surface, py: spacing-16)                 │
│                                                                          │
│                  generous white space                                     │
│                                                                          │
│   ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐│
│   │                    │  │                    │  │                    ││
│   │   ──               │  │   ──               │  │   ──               ││
│   │   (gold, 24px)     │  │   (gold, 24px)     │  │   (gold, 24px)     ││
│   │                    │  │                    │  │                    ││
│   │   Proprietary      │  │   AI-Synthesized   │  │   Editorial        ││
│   │   Intelligence     │  │   Narrative        │  │   Presentation     ││
│   │   (Playfair,       │  │   (Playfair,       │  │   (Playfair,       ││
│   │    text-xl,        │  │    text-xl,        │  │    text-xl,        ││
│   │    color-primary)  │  │    color-primary)  │  │    color-primary)  ││
│   │                    │  │                    │  │                    ││
│   │   Market indicators│  │   Seven specialized│  │   Reports your     ││
│   │   and indexes that │  │   agents transform │  │   clients and      ││
│   │   provide          │  │   raw data into    │  │   their wealth     ││
│   │   conviction-grade │  │   strategic market │  │   managers will     ││
│   │   insight — not    │  │   narrative with   │  │   read cover       ││
│   │   just data.       │  │   confidence       │  │   to cover.        ││
│   │                    │  │   ratings.         │  │                    ││
│   │   (Inter, text-sm, │  │   (Inter, text-sm, │  │   (Inter, text-sm, ││
│   │    color-text-     │  │    color-text-     │  │    color-text-     ││
│   │    secondary,      │  │    secondary,      │  │    secondary,      ││
│   │    line-ht: 1.7)   │  │    line-ht: 1.7)   │  │    line-ht: 1.7)   ││
│   │                    │  │                    │  │                    ││
│   └────────────────────┘  └────────────────────┘  └────────────────────┘│
│                                                                          │
│                  generous white space                                     │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│ PROCESS NARRATIVE (bg: warm off-white, py: spacing-16)                   │
│                                                                          │
│                    From market to publication                             │
│                    (Playfair, text-2xl, color-primary, center)            │
│                    ════════ (gold, center, 60px)                          │
│                                                                          │
│                  generous white space                                     │
│                                                                          │
│   ┌────────────────┐     ┌────────────────┐     ┌────────────────┐      │
│   │                │     │                │     │                │      │
│   │   01           │     │   02           │     │   03           │      │
│   │   (Playfair,   │     │   (Playfair,   │     │   (Playfair,   │      │
│   │    text-4xl,   │ ──  │    text-4xl,   │ ──  │    text-4xl,   │      │
│   │    color-      │     │    color-      │     │    color-      │      │
│   │    accent,     │     │    accent,     │     │    accent,     │      │
│   │    font-light) │     │    font-light) │     │    font-light) │      │
│   │                │     │                │     │                │      │
│   │   Define       │     │   Analyze      │     │   Publish      │      │
│   │   (Inter,      │     │   (Inter,      │     │   (Inter,      │      │
│   │    font-semi,  │     │    font-semi,  │     │    font-semi,  │      │
│   │    color-      │     │    color-      │     │    color-      │      │
│   │    primary)    │     │    primary)    │     │    primary)    │      │
│   │                │     │                │     │                │      │
│   │   Select your  │     │   Seven AI     │     │   Download a   │      │
│   │   market and   │     │   agents       │     │   branded PDF  │      │
│   │   set the      │     │   synthesize   │     │   ready for    │      │
│   │   parameters.  │     │   real data    │     │   your next    │      │
│   │                │     │   into         │     │   advisory     │      │
│   │   (Inter,      │     │   strategic    │     │   meeting.     │      │
│   │    text-sm,    │     │   narrative.   │     │                │      │
│   │    color-text- │     │                │     │   (Inter,      │      │
│   │    secondary)  │     │   (Inter,      │     │    text-sm,    │      │
│   │                │     │    text-sm,    │     │    color-text- │      │
│   │                │     │    color-text- │     │    secondary)  │      │
│   │                │     │    secondary)  │     │                │      │
│   └────────────────┘     └────────────────┘     └────────────────┘      │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│ REPORT BREAKDOWN (bg: color-primary, py: spacing-16)                     │
│                                                                          │
│                  generous white space                                     │
│                                                                          │
│                    Inside every report                                    │
│                    (Playfair, text-3xl,                                   │
│                     color-text-inverse, center)                           │
│                    ════════ (gold, center)                                │
│                                                                          │
│                  generous white space                                     │
│                                                                          │
│   ┌──────────────────────────────┐  ┌──────────────────────────────┐    │
│   │                              │  │                              │    │
│   │  ──  Executive Summary       │  │  ──  Key Market Drivers       │    │
│   │      Strategic market        │  │      The forces shaping       │    │
│   │      narrative distilled     │  │      price and velocity       │    │
│   │      by AI, reviewed by you  │  │                              │    │
│   │                              │  │                              │    │
│   │  ──  Market Overview         │  │  ──  Competitive Analysis     │    │
│   │      Pricing, inventory,     │  │      Peer market matrix       │    │
│   │      absorption, velocity    │  │      with intelligence        │    │
│   │                              │  │      ratings                  │    │
│   │                              │  │                              │    │
│   │  ──  Second Home Analysis    │  │  ──  Trending Insights        │    │
│   │      Seasonal patterns and   │  │      Emerging patterns your   │    │
│   │      investment signals      │  │      competitors will miss    │    │
│   │                              │  │                              │    │
│   │  ──  AI-Powered Forecasts    │  │  ──  Methodology              │    │
│   │      Confidence-rated        │  │      Full transparency        │    │
│   │      market projections      │  │      on sources and process   │    │
│   │                              │  │                              │    │
│   └──────────────────────────────┘  └──────────────────────────────┘    │
│                                                                          │
│   (── marks are gold accent lines, 16px wide)                            │
│   (Titles: Inter, font-medium, color-text-inverse)                       │
│   (Descriptions: Inter, text-sm, color-text-tertiary)                    │
│   (generous line-height: 1.6, spacing-4 between items)                   │
│                                                                          │
│                  generous white space                                     │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│ CLOSING STATEMENT (100vh, same treatment as hero)                        │
│ ┌────────────────────────────────────────────────────────────────────┐   │
│ │                                                                    │   │
│ │   [FULL-BLEED PHOTOGRAPHY: architectural detail or Gulf horizon,   │   │
│ │    golden hour, warm desaturated — with dark navy overlay]         │   │
│ │                                                                    │   │
│ │                                                                    │   │
│ │              Your market deserves more                             │   │
│ │              than a spreadsheet.                                   │   │
│ │              (Playfair, text-3xl,                                  │   │
│ │               color-text-inverse, font-light)                      │   │
│ │                                                                    │   │
│ │              ════════════════                                       │   │
│ │                                                                    │   │
│ │              [Request a Sample Report]                              │   │
│ │              (gold btn, same treatment as hero)                    │   │
│ │                                                                    │   │
│ │                                                                    │   │
│ └────────────────────────────────────────────────────────────────────┘   │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│ FOOTER (bg: color-primary, py: spacing-8)                                │
│                                                                          │
│   Modern Signal Advisory                                                 │
│   (Playfair, text-sm, color-text-tertiary, center)                       │
│                                                                          │
│   (thin gold line, 40px, centered)                                       │
│                                                                          │
│   2026 Modern Signal Advisory                                            │
│   (Inter, text-xs, color-text-tertiary, center)                          │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Mobile Layout (< 768px)

```
┌─────────────────────────────┐
│ Modern Signal    Sign In    │
│ Advisory                    │
│ (Playfair, sm)              │
├─────────────────────────────┤
│ HERO (100vh)                │
│ [Full-bleed photo + overlay]│
│                             │
│   The Intelligence          │
│   Behind the Advisory       │
│   (Playfair, text-3xl)      │
│                             │
│   ═══════════               │
│                             │
│   Market intelligence       │
│   that your clients and     │
│   their advisors will       │
│   read cover to cover.      │
│                             │
│   [Request a Sample Report] │
│                             │
├─────────────────────────────┤
│ DATA CALLOUTS (stacked)     │
│                             │
│         31                  │
│         ──                  │
│   Proprietary market        │
│   indicators                │
│                             │
│   (generous spacing)        │
│                             │
│          7                  │
│         ──                  │
│   Specialized AI agents     │
│   per report                │
│                             │
│   (generous spacing)        │
│                             │
│          8                  │
│         ──                  │
│   Intelligence sections     │
│   per report                │
│                             │
├─────────────────────────────┤
│ EDITORIAL SHOWCASE          │
│                             │
│   A publication,            │
│   not a printout.           │
│                             │
│   ──                        │
│                             │
│   (editorial body copy)     │
│                             │
│   ┌───────────────────────┐ │
│   │ Report Preview        │ │
│   │ (full-width, centered)│ │
│   └───────────────────────┘ │
│                             │
├─────────────────────────────┤
│ PILLARS (stacked)           │
│                             │
│   ── Proprietary Intel      │
│   (description...)          │
│                             │
│   ── AI-Synthesized         │
│   (description...)          │
│                             │
│   ── Editorial Presentation │
│   (description...)          │
│                             │
├─────────────────────────────┤
│ PROCESS (vertical)          │
│                             │
│   01  Define                │
│       (description)         │
│                             │
│   02  Analyze               │
│       (description)         │
│                             │
│   03  Publish               │
│       (description)         │
│                             │
├─────────────────────────────┤
│ REPORT BREAKDOWN            │
│ (single column on navy)     │
│                             │
│   ── Executive Summary      │
│   ── Market Overview        │
│   ── Second Home Analysis   │
│   ── AI-Powered Forecasts   │
│   ── Key Market Drivers     │
│   ── Competitive Analysis   │
│   ── Trending Insights      │
│   ── Methodology            │
│                             │
├─────────────────────────────┤
│ CLOSING                     │
│ [Full-bleed photo + overlay]│
│                             │
│   Your market deserves      │
│   more than a spreadsheet.  │
│                             │
│   [Request a Sample Report] │
│                             │
├─────────────────────────────┤
│ Footer                      │
└─────────────────────────────┘
```

---

## Persona Revision Notes

### Vocabulary alignment (informed by Knox Brothers creative brief)
- **"Intelligence"** over "data" or "analytics" — all personas think in strategic insight
- **"Advisors"** over "agents" — Rising Star and Established Solo aspire to be advisors
- **"Conviction-grade"** — Jordan Ellis's vocabulary for quality
- **"Institutional-quality"** — Alex Rivera's aspiration
- **"Strategic narrative"** — the Competitive Veteran's desired enhancement to his storytelling
- **"Cover to cover"** — the brief's aspiration that clients keep the report on their coffee table
- **"Your market deserves more than a spreadsheet"** — every persona is frustrated by commodity CMAs and generic market updates

### Brief-informed audience awareness
- The marketing page speaks to **agents**, but the design quality must match what those agents' **end clients** expect ($10M+ net worth, 55-70 years old, accustomed to Goldman Sachs and Architectural Digest)
- If the landing page doesn't look like it belongs in the same world as the reports it produces, no agent will trust the product
- The brief's filter question applies: "Would our Seaside Visionary client feel this was made for someone at their level?"

### Patience and complexity
- Scannable (Team Leader) but layered (Established Solo wants depth on scroll)
- No feature comparison tables or pricing on this page — aspirational only
- The data callouts serve the Competitive Veteran's need to see proof of depth

### Anti-persona filtering
- No "easy," "quick," or "simple" language
- No feature checklists or plan comparisons
- No pricing on this page
- The word "intelligence" appears more than "report"

---

## Design Token Usage

| Element | Token(s) |
|---------|----------|
| Hero/Closing overlay | `color-primary` at 85% opacity over photography |
| Headlines | `font-serif` (Playfair), `font-light` (300) |
| Gold accent lines | `color-accent` (#CA8A04), 2px height |
| CTA buttons | `bg: color-accent`, `text: color-primary`, `radius-sm`, uppercase, tracking-wide |
| Body text | `font-sans` (Inter), `color-text-secondary`, line-height 1.6-1.7 |
| Data callout numbers | `font-serif`, `text-5xl` (48px), `color-accent` |
| Section spacing | `spacing-16` (64px) vertical padding per section |
| Internal spacing | `spacing-8` to `spacing-12` between elements |
| Report breakdown bg | `color-primary` |
| Warm off-white sections | `#FAF9F7` or `color-report-bg` (#FAFAF9) — warm, not cold |
| Card shadows | `shadow-lg` |
| Nav transition | `duration-default`, `ease-default` |
| Mobile breakpoint | 768px |
| Tablet breakpoint | 1024px |
| Max content width | 1120px (editorial column width) |

### Typography Scale on This Page

| Usage | Font | Size | Weight | Color |
|-------|------|------|--------|-------|
| Hero headline | Playfair Display | text-5xl (48px) | Light (300) | color-text-inverse |
| Section headings | Playfair Display | text-3xl (30px) | Light (300) | color-primary or color-text-inverse |
| Pillar titles | Playfair Display | text-xl (20px) | Regular (400) | color-primary |
| Data callout numbers | Playfair Display | text-5xl (48px) | Regular (400) | color-accent |
| Body copy | Inter | text-base (16px) | Regular (400) | color-text-secondary |
| Supporting text | Inter | text-sm (14px) | Regular (400) | color-text-secondary |
| CTA buttons | Inter | text-sm (14px) | Medium (500) | color-primary |
| Nav wordmark | Playfair Display | text-base (16px) | Regular (400) | context-dependent |

---

## Component References

- HeroSection: `.specs/design-system/components/hero-section.md` (stub — needs update for photography overlay)
- DataCallout: `.specs/design-system/components/data-callout.md` (stub needed)
- EditorialShowcase: `.specs/design-system/components/editorial-showcase.md` (stub needed)
- IntelligencePillars: `.specs/design-system/components/intelligence-pillars.md` (stub needed)
- ProcessNarrative: `.specs/design-system/components/process-narrative.md` (stub needed)
- ReportBreakdown: `.specs/design-system/components/report-breakdown.md` (stub exists — needs update)
- ClosingStatement: `.specs/design-system/components/closing-statement.md` (stub needed)
- LandingNav: `.specs/design-system/components/landing-nav.md` (stub exists — needs update)

---

## Technical Notes

- This replaces the current placeholder in `app/page.tsx`
- No authentication required — public page
- All sections server-rendered for SEO (except nav scroll behavior — client component)
- Fonts (Playfair Display, Inter) loaded via `next/font/google`
- Photography: use placeholder images initially (solid navy with subtle gradient) — real photography to be added later. Code should use `next/image` with proper `sizes` and `priority` attributes so swapping in real photos is trivial.
- The report preview in the editorial showcase is a CSS-rendered illustration (not an actual screenshot) — styled divs mimicking a report page with section headers and data visualization hints
- Consider `prefers-reduced-motion` for the nav scroll transition
- Line height: 1.5-1.6 minimum everywhere (the brief designs for 55-70 age demographic readability)
- Max content width ~1120px with generous side padding

---

## Learnings

(To be filled after implementation)
