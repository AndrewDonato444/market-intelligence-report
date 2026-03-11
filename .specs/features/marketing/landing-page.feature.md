---
feature: Marketing Landing Page
domain: marketing
source: app/page.tsx
tests:
  - __tests__/app/landing-page.test.tsx
components:
  - HeroSection
  - CredibilityBar
  - TheProblem
  - EditorialShowcase
  - HowItWorks
  - ReportBreakdown
  - IntelligencePillars
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
updated: 2026-03-11
---

# Marketing Landing Page

**Source File**: `app/page.tsx`
**Design System**: `.specs/design-system/tokens.md`
**Creative Brief**: Knox Brothers Intelligence Report Creative Design Brief (March 2026)
**Personas**: All five agent personas

## Overview

The public-facing marketing page for Modern Signal Advisory's Luxury Market Intelligence Report platform.

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
- No discount or value-oriented language ("complimentary," "free," "no credit card required")
- No quality promises without specifics ("magazine-quality," "stunning")
- No stock photography or generic beach imagery
- No cluttered layouts — if it feels crowded, add more space
- No influencer-style design or viral hooks

---

## Feature: Marketing Landing Page

### Scenario: First-time visitor lands on the page
Given a visitor navigates to the root URL "/"
When the page loads
Then they see a full-viewport hero with a dark navy background and overlay
And a small gold "Luxury Market Intelligence" label above the headline
And a serif headline "The market report your clients will actually read." in Playfair Display
And a gold accent line beneath the headline
And a subheadline describing AI-powered intelligence reports that transform raw market data into strategic narrative
And dual CTAs: a primary gold "See How It Works" button (scrolls to #how-it-works) and a ghost "Request Access" button (links to /sign-up)
And the overall impression is editorial luxury — not a SaaS conversion page
And the page loads within 2 seconds on a 4G connection

### Scenario: Visitor encounters the credibility bar
Given the visitor has seen the hero
When they scroll to the credibility bar section just below the hero
Then they see 3 data figures styled as design elements
And the figures are: "2,234" (Transactions analyzed per report), "$6.58B" (In luxury volume modeled), "31" (Market indicators tracked)
And each figure uses Playfair Display in gold with a gold accent line beneath
And each figure has a supporting context line in Inter
And the section has a subtle bottom border and sits on a white surface background

### Scenario: Visitor sees the problem section
Given the visitor has scrolled past the credibility bar
When the problem section enters the viewport
Then they see a section titled "Your market expertise deserves better packaging."
And a "The gap" label above the heading in gold
And three before/after pain points showing what agents do now vs what the platform provides
And the "before" items are styled with strikethrough text
And the "after" items are preceded by gold accent marks
And the section uses warm off-white background (color-report-bg)

### Scenario: Visitor reaches the editorial showcase
Given the visitor has scrolled past the problem section
When the editorial showcase section enters the viewport
Then they see a two-column editorial spread layout
And the left column has a "The product" label, the heading "A publication, not a printout." and editorial body copy
And the body copy describes data-rich reports (not quality promises) — blending narrative, data visualization, and strategic intelligence
And the right column contains a stylized report preview with a Naples Intelligence Report header
And the report preview shows metric cards (9.3 Liquidity Index, A+ Ultra-Luxury, +4.2% YoY Growth)
And the preview has faux body text lines and section headers
And the layout feels like a magazine feature spread, not a product screenshot

### Scenario: Visitor sees the How It Works section
Given the visitor has scrolled to the How It Works section
When the section is visible (it is the scroll target of the primary hero CTA)
Then they see a "How it works" label and heading "From raw data to finished publication"
And a three-part process with oversized Playfair numbers (01, 02, 03) in gold at low opacity
And step 01: "Define your market" — select geography, tier, buyer personas
And step 02: "AI agents go to work" — four agents analyze data, identify themes, model forecasts, craft narrative
And step 03: "Publish and present" — download a branded PDF with ten sections of strategic intelligence
And each step has a gold accent line and description in Inter
And a "Get Started" CTA button follows the steps
And the section has id="how-it-works" and scroll-mt-16 for smooth anchor navigation

### Scenario: Visitor explores report contents
Given the visitor has scrolled to the report breakdown section
When the section is visible
Then they see a section on dark navy background
And a "What you get" label and heading "Ten sections of strategic intelligence"
And they see 8 report sections listed in a 2-column grid with numbered prefixes (01-08)
And the sections are: Strategic Overview & Insights Index, Executive Summary & Market Matrix, Key Market Drivers, Neighborhood Intelligence, The Narrative, Competitive Positioning, Forward Outlook & Forecasts, Strategic Summary
And each section has a one-line description
And the numbering uses Playfair font in gold at reduced opacity

### Scenario: Visitor reads the intelligence pillars
Given the visitor has scrolled to the intelligence pillars section
When the section is visible
Then they see a "Why it works" label and heading "Intelligence, not information"
And three pillars with generous spacing between them
And each pillar has a gold accent mark, a serif Playfair title, and a multi-sentence description
And the three pillars are: "Proprietary Intelligence" (conviction-grade insight, strategic framework), "AI-Synthesized Narrative" (agents transform transactions into market analysis), "Editorial Presentation" (designed for print, read cover to cover)
And the descriptions use advisor vocabulary (not developer or SaaS vocabulary)
And the section uses warm off-white background (color-report-bg)

### Scenario: Visitor reaches the closing statement
Given the visitor has scrolled to the bottom of the page
When the closing statement section is visible
Then they see a section with a dark navy background and overlay (min-height 60vh)
And a closing headline "Your market knowledge is the edge. This is how you prove it."
And a gold accent line
And supporting text about generating a first report in minutes
And a single gold CTA button reading "Get Started" linking to /sign-up
And no urgency language, no aggressive conversion design

### Scenario: Navigation behavior
Given the visitor is anywhere on the page
When they look at the top of the viewport
Then they see a minimal fixed navigation bar
And the nav contains "Modern Signal Advisory" wordmark in Playfair on the left
And a "Sign In" text link and "Get Started" link on the right
And the nav background transitions from transparent to warm white (color-report-bg) on scroll
And "Get Started" becomes a gold pill button (bg-accent, rounded) when scrolled
And the nav has a subtle bottom border in color-border when scrolled
And the transition uses duration-default

### Scenario: Page is viewed on mobile (< 768px)
Given the visitor is on a mobile device
When the page renders
Then the hero headline scales to text-3xl but remains the dominant element
And the dual CTAs stack vertically (flex-col on small screens)
And the credibility stats stack vertically with generous spacing
And the pain points stack (before above, after below)
And the editorial showcase stacks (copy above, report preview below)
And the intelligence pillars stack vertically
And the process steps stack vertically
And all touch targets are at least 44px
And horizontal scrolling never occurs

### Scenario: Visitor clicks "See How It Works" CTA
Given the visitor clicks "See How It Works" in the hero
When the click event fires
Then the page scrolls smoothly to the #how-it-works section

### Scenario: Visitor clicks "Request Access" or "Get Started"
Given the visitor clicks "Request Access" in the hero or "Get Started" anywhere on the page
When the click event fires
Then they are navigated to "/sign-up"

### Scenario: Visitor clicks "Sign In"
Given the visitor clicks "Sign In" in the navigation
When the click event fires
Then they are navigated to "/sign-in"

### Scenario: Photography and imagery (placeholder state)
Given the page is rendered
When the visitor views the hero and closing sections
Then both sections use dark navy CSS backgrounds with opacity overlays (placeholder for photography)
And real photography will be swapped in via next/image — code is structured for trivial image replacement

---

## User Journey

1. Agent hears about Modern Signal Advisory (referral, wealth manager, search)
2. **Lands on marketing page (this feature)**
3. Scrolls through — editorial quality establishes credibility before a word of sales copy
4. Clicks "See How It Works" → scrolls to process section
5. Clicks "Get Started" → sign-up flow
6. Onboarding → first report

---

## Section Order (Implementation)

1. **Hero** — Full-viewport, dark navy bg, dual CTAs
2. **Credibility Bar** — 3 proof-point stats on white surface
3. **The Problem** — Before/after pain points on warm bg
4. **Editorial Showcase** — Two-column: copy + report preview on warm bg
5. **How It Works** — 3-step process on white, scroll anchor target
6. **Report Breakdown** — 8 sections listed on dark navy bg
7. **Intelligence Pillars** — 3 differentiators on warm bg
8. **Closing CTA** — Dark navy bg, final conversion
9. **Footer** — Minimal branding

---

## Persona Revision Notes

### Vocabulary alignment (informed by Knox Brothers creative brief)
- **"Intelligence"** over "data" or "analytics" — all personas think in strategic insight
- **"Conviction-grade"** — Jordan Ellis's vocabulary for quality
- **"Strategic narrative"** — the Competitive Veteran's desired enhancement to his storytelling
- **"Cover to cover"** — the brief's aspiration that clients keep the report
- **"Your market knowledge is the edge"** — positions the agent's expertise as the differentiator, platform as proof
- **"See How It Works"** as primary CTA — low-commitment discovery, not high-commitment request

### Brief-informed audience awareness
- The marketing page speaks to **agents**, but the design quality must match what those agents' **end clients** expect ($10M+ net worth, 55-70 years old, accustomed to Goldman Sachs and Architectural Digest)
- The "Problem" section speaks directly to agent frustrations — copy-pasting MLS data, generic summaries, forgettable reports

### Anti-persona filtering
- No "easy," "quick," or "simple" language
- No feature checklists or plan comparisons
- No pricing on this page
- No "complimentary" or "free" language
- No quality promises without data backing ("magazine-quality" removed)
- The word "intelligence" appears more than "report"

---

## Design Token Usage

| Element | Token(s) |
|---------|----------|
| Hero/Closing overlay | `color-primary` at 85-90% opacity over photography placeholder |
| Headlines | `font-serif` (Playfair), `font-light` (300) |
| Gold accent lines | `color-accent` (#CA8A04), 0.5 (h-0.5) height |
| CTA buttons | `bg: color-accent`, `text: color-primary`, `radius-sm`, uppercase, tracking-widest |
| Ghost CTA | border `color-text-tertiary`/30, text `color-text-tertiary` |
| Body text | `font-sans` (Inter), `color-text-secondary`, leading-relaxed |
| Credibility stat numbers | `font-serif`, `text-4xl md:text-5xl`, `color-accent` |
| Section labels | `font-sans`, `text-xs`, uppercase, tracking-[0.2em], `color-accent` |
| Section spacing | `spacing-16` (64px) vertical padding per section |
| Report breakdown bg | `color-primary` |
| Warm off-white sections | `color-report-bg` (#FAFAF9) |
| Card shadows | `shadow-lg` |
| Nav transition | `duration-default` |
| Max content width | `max-w-5xl` (1024px) or `max-w-4xl` |

---

## Component References

- LandingNav: `components/marketing/landing-nav.tsx` — client component with scroll behavior
- All page sections: inline in `app/page.tsx` (server component, no separate component files)

---

## Technical Notes

- No authentication required — public page
- All sections server-rendered for SEO (except nav scroll behavior — client component)
- Fonts (Playfair Display, Inter) loaded via `next/font/google`
- Photography: placeholder CSS backgrounds — ready for next/image swap
- Report preview is CSS-rendered illustration (styled divs with faux data)
- `scroll-mt-16` on #how-it-works for nav clearance
- Line height: leading-relaxed (1.625) used throughout
- Data constants extracted to top-level arrays for maintainability

---

## Learnings

- "See How It Works" as primary CTA is lower commitment than "Request a Sample Report" — better for first-touch
- Removing "magazine-quality" and "complimentary" language keeps copy focused on data value, not quality promises
- Before/after pain points ("The Problem" section) are more effective than feature lists for agents
- Explicit space `{" "}` needed before `<br className="hidden md:block" />` to prevent word collision on mobile
