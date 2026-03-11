---
feature: Marketing Landing Page
domain: marketing
source: app/page.tsx
tests:
  - __tests__/app/landing-page.test.tsx
components:
  - HeroSection
  - MockReportCard
  - CredibilityStrip
  - TheGap
  - HowItWorks
  - TheReport
  - Testimonials
  - Pricing
  - FinalCta
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

# Marketing Landing Page (v2)

**Source File**: `app/page.tsx`
**Nav Component**: `components/marketing/landing-nav.tsx`
**Design System**: `.specs/design-system/tokens.md`
**Creative Brief**: Knox Brothers Intelligence Report Creative Design Brief (March 2026)
**Personas**: All five agent personas

## Overview

The public-facing marketing page for Modern Signal Advisory's Luxury Market Intelligence Report platform. v2 shifts from editorial-mood page to a clearer conversion funnel with pricing, testimonials, a mock report card in the hero, and "Commission" as the primary action verb.

### Design Philosophy (from Creative Brief — unchanged)

1. **Editorial, Not Corporate** — magazine spread, not SaaS landing page
2. **Breathe With White Space** — generous margins = premium confidence
3. **Data as Art** — oversized hero numbers as design elements
4. **Photography as Architecture** — images as structural elements
5. **Quiet Authority** — confidence from restraint

### Hard Guardrails (unchanged)

- No exclamation points
- No urgency language ("Act now," "Limited time")
- No generic luxury adjectives without proof
- No real estate cliches
- No discount language ("free," "complimentary")
- No stock photography or generic beach imagery
- No cluttered layouts

---

## Feature: Marketing Landing Page v2

### Scenario: Navigation with anchor links
Given a visitor is on the page
When they view the fixed navigation bar
Then they see the Modern Signal Advisory logo/wordmark on the left
And centered navigation links: "How It Works", "The Report", "Pricing"
And a gold "Commission a Report" CTA button on the right
And "How It Works" scrolls to #how-it-works
And "The Report" scrolls to #the-report
And "Pricing" scrolls to #pricing
And "Commission a Report" links to the report creation flow
And the nav transitions from transparent to warm bg on scroll (>50px)

### Scenario: Hero with mock report card
Given a visitor lands on the root URL "/"
When the page loads
Then they see a split-layout hero section
And a gold eyebrow label "Luxury Market Intelligence" above the headline
And the H1 reads "Walk into the room as the advisor who brought the research."
And a subheadline reads "AI-powered intelligence reports — branded to you, grounded in real transaction data, ready to hand to your most important clients."
And dual CTAs: a primary gold "Commission Your First Report" button and a text link "See how it works →" (scrolls to #how-it-works)
And the right side displays a mock report card showing:
  - Agent name: Brian Knox
  - Brokerage: Knox Brothers
  - Brand: Compass
  - Index scores (e.g., Liquidity Index 9.3)
  - Segment grades (e.g., Ultra-Luxury A+)
And the mock report card uses the report preview styling (navy header, metric cards, shadow)

### Scenario: Credibility strip
Given the visitor scrolls past the hero
When the credibility strip is visible
Then they see 4 proof-point stats in a horizontal row
And the stats are: "31" (Indicators), "8" (Personas), "<2 min" (Delivery), "10" (Sections)
And each stat uses Playfair Display in gold with a supporting context label

### Scenario: The Gap section
Given the visitor scrolls past the credibility strip
When The Gap section enters the viewport
Then they see the heading "Your clients make $1M decisions. The market update you're sending them doesn't reflect that."
And a two-column comparison table:
  - Left column header: "What most agents deliver"
  - Right column header: "What Modern Signal delivers"
And the left column lists common agent deliverables (generic MLS summaries, recycled bullet points, forgettable PDFs)
And the right column lists Modern Signal equivalents (conviction-grade intelligence, persona-specific analysis, branded publications)
And the contrast uses visual differentiation (muted left, emphasized right)

### Scenario: How It Works section
Given the visitor scrolls to the How It Works section
When the section is visible (anchor target #how-it-works)
Then they see a three-step process
And step 01: "Brief your market and your client"
And step 02: "AI agents synthesize the market"
And step 03: "A publication with your name on the cover"
And each step has an oversized Playfair number, gold accent line, and description
And the section has id="how-it-works" and scroll-mt for nav clearance

### Scenario: The Report section
Given the visitor scrolls to The Report section
When the section is visible (anchor target #the-report)
Then they see the heading "Ten sections. Zero filler."
And a numbered list of all 10 report sections with one-line descriptions:
  01. Strategic Overview & Insights Index
  02. Executive Summary & Market Matrix
  03. Key Market Drivers
  04. Neighborhood Intelligence
  05. The Narrative
  06. Competitive Positioning
  07. Forward Outlook & Forecasts
  08. Strategic Summary
  09. Methodology & Data Sources
  10. About the Advisor
And the section has id="the-report"

### Scenario: Testimonials section (placeholder)
Given the visitor scrolls to the testimonials section
When the section is visible
Then they see the heading "The room changed."
And 3 testimonial quotes displayed in cards or a row
And each quote shows: quote text, advisor name, brokerage, market
And the quotes are placeholder content marked for replacement with real advisor quotes

### Scenario: Pricing section
Given the visitor scrolls to the Pricing section
When the section is visible (anchor target #pricing)
Then they see the heading "One report. One relationship redefined."
And a price display: "$500" prominently styled
And the label "per report" and "no subscription required"
And a "What's included" list itemizing report deliverables
And a note about "Founding advisor rate" (early adopter pricing)
And a "Commission Your Report" CTA button
And the section has id="pricing"

### Scenario: Final CTA
Given the visitor reaches the bottom of the page
When the final CTA section is visible
Then they see the heading "Your market expertise is real. Prove it in the room."
And a gold CTA button reading "Commission Your Intelligence Report"
And no urgency language or aggressive conversion design

### Scenario: Page is viewed on mobile (< 768px)
Given the visitor is on a mobile device
When the page renders
Then the hero stacks vertically (text above, report card below)
And the nav center links collapse to a hamburger or simplified layout
And the credibility stats wrap or stack
And The Gap columns stack vertically
And all touch targets are at least 44px
And horizontal scrolling never occurs

### Scenario: Visitor clicks "Commission Your First Report"
Given the visitor clicks "Commission Your First Report" in the hero
When the click event fires
Then they are navigated to the report creation flow

### Scenario: Visitor clicks "See how it works →"
Given the visitor clicks "See how it works →" in the hero
When the click event fires
Then the page scrolls smoothly to #how-it-works

---

## Section Order (v2)

1. **Nav** — Fixed top: Logo left, anchor links center, "Commission a Report" CTA right
2. **Hero** — Split layout: headline + CTAs left, mock report card right
3. **Credibility Strip** — 4 stats: 31 indicators, 8 personas, <2 min delivery, 10 sections
4. **The Gap** — Two-column contrast: most agents vs Modern Signal
5. **How It Works** — 3-step process (#how-it-works)
6. **The Report** — 10 sections listed (#the-report)
7. **Testimonials** — 3 placeholder quotes
8. **Pricing** — $500/report, what's included (#pricing)
9. **Final CTA** — "Prove it in the room"
10. **Footer** — Minimal branding

### Sections Removed from v1
- ~~Editorial Showcase~~ (merged into hero mock report card)
- ~~Intelligence Pillars~~ (value prop now communicated through Gap contrast + Report list)

---

## User Journey

1. Agent hears about Modern Signal Advisory (referral, wealth manager, search)
2. **Lands on marketing page (this feature)**
3. Hero copy + report card mock establishes credibility and product shape
4. Scrolls through Gap → How It Works → Report sections
5. Sees testimonials (social proof) → Pricing (decision)
6. Clicks "Commission" CTA → report creation flow
7. Onboarding → first report

---

## UI Mockup

```
┌──────────────────────────────────────────────────────────────────────┐
│ NAV (fixed, transparent → warm bg on scroll)                        │
│ ┌────────────┐  ┌──────────────────────────┐  ┌──────────────────┐  │
│ │ ModernSignal│  │How It Works  The Report  │  │Commission a Report│ │
│ │ Advisory    │  │         Pricing          │  │  [gold btn]       │ │
│ └────────────┘  └──────────────────────────┘  └──────────────────┘  │
├──────────────────────────────────────────────────────────────────────┤
│ HERO (full viewport, dark navy bg)                                   │
│                                                                      │
│  ┌─────────────────────────┐  ┌────────────────────────────┐        │
│  │ ·Luxury Market Intel·   │  │ ┌────────────────────────┐ │        │
│  │                         │  │ │ NAPLES INTELLIGENCE    │ │        │
│  │ Walk into the room as   │  │ │ REPORT                 │ │        │
│  │ the advisor who brought │  │ ├────────────────────────┤ │        │
│  │ the research.           │  │ │ Brian Knox             │ │        │
│  │ ─── (gold line)         │  │ │ Knox Brothers · Compass│ │        │
│  │                         │  │ ├────┬────┬────┐        │ │        │
│  │ AI-powered intelligence │  │ │9.3 │ A+ │+4.2│        │ │        │
│  │ reports — branded to    │  │ │Liq │ULux│YoY │        │ │        │
│  │ you, grounded in real   │  │ ├────┴────┴────┘        │ │        │
│  │ transaction data...     │  │ │ ░░░░░░░░░░░░░         │ │        │
│  │                         │  │ │ ░░░░░░░░░░            │ │        │
│  │ [Commission Your First] │  │ └────────────────────────┘ │        │
│  │  See how it works →     │  └────────────────────────────┘        │
│  └─────────────────────────┘                                        │
├──────────────────────────────────────────────────────────────────────┤
│ CREDIBILITY STRIP (white surface, border-b)                          │
│                                                                      │
│     31              8            <2 min           10                 │
│  ── (gold)      ── (gold)      ── (gold)      ── (gold)            │
│  Indicators     Personas       Delivery        Sections              │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│ THE GAP (warm bg)                                                    │
│                                                                      │
│  Your clients make $1M decisions. The market update                  │
│  you're sending them doesn't reflect that.                           │
│  ─── (gold line)                                                     │
│                                                                      │
│  ┌────────────────────────┬────────────────────────┐                │
│  │ What most agents       │ What Modern Signal      │                │
│  │ deliver                │ delivers                │                │
│  ├────────────────────────┼────────────────────────┤                │
│  │ × MLS copy-paste       │ ── Conviction-grade    │                │
│  │ × Generic bullet pts   │ ── Persona-specific    │                │
│  │ × Forgettable PDFs     │ ── Branded publication │                │
│  │ × No market thesis     │ ── Forward outlook     │                │
│  └────────────────────────┴────────────────────────┘                │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│ HOW IT WORKS (#how-it-works, white bg)                               │
│                                                                      │
│   01                   02                   03                       │
│   ── (gold)            ── (gold)            ── (gold)               │
│   Brief your market    AI agents            A publication            │
│   and your client      synthesize           with your name           │
│                        the market           on the cover             │
│   [description]        [description]        [description]           │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│ THE REPORT (#the-report, dark navy bg)                               │
│                                                                      │
│   Ten sections. Zero filler.                                        │
│   ─── (gold line)                                                    │
│                                                                      │
│   01 Strategic Overview     06 Competitive Positioning              │
│   02 Executive Summary      07 Forward Outlook                      │
│   03 Key Market Drivers     08 Strategic Summary                    │
│   04 Neighborhood Intel     09 Methodology & Data                   │
│   05 The Narrative          10 About the Advisor                    │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│ TESTIMONIALS (warm bg)                                               │
│                                                                      │
│   The room changed.                                                  │
│   ─── (gold line)                                                    │
│                                                                      │
│   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐               │
│   │ "Quote..."   │ │ "Quote..."   │ │ "Quote..."   │               │
│   │              │ │              │ │              │               │
│   │ — Name       │ │ — Name       │ │ — Name       │               │
│   │   Brokerage  │ │   Brokerage  │ │   Brokerage  │               │
│   │   Market     │ │   Market     │ │   Market     │               │
│   └──────────────┘ └──────────────┘ └──────────────┘               │
│   [placeholder — replace with real advisor quotes]                   │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│ PRICING (#pricing, white bg)                                         │
│                                                                      │
│   One report. One relationship redefined.                            │
│   ─── (gold line)                                                    │
│                                                                      │
│         $500                                                        │
│       per report                                                    │
│    no subscription required                                         │
│                                                                      │
│   ✓ 10 sections of intelligence   ✓ Branded to you                 │
│   ✓ Confidence ratings            ✓ PDF + digital                  │
│   ✓ Competitive benchmarks        ✓ Buyer persona intel            │
│                                                                      │
│   * Founding advisor rate                                           │
│                                                                      │
│   [Commission Your Report]                                          │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│ FINAL CTA (dark navy bg, min-h 60vh)                                 │
│                                                                      │
│   Your market expertise is real.                                     │
│   Prove it in the room.                                             │
│   ─── (gold line)                                                    │
│                                                                      │
│   [Commission Your Intelligence Report]                              │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│ FOOTER (dark navy, minimal)                                          │
│   Modern Signal Advisory · 2026                                     │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Persona Revision Notes

### Vocabulary alignment
- **"Commission"** replaces "Get Started" / "Request Access" — all five personas operate in a world where you commission research, not sign up for software. This is the vocabulary of private wealth advisory, not SaaS onboarding.
- **"Walk into the room"** — every persona's success metric is about a moment: the listing presentation, the client meeting, the pitch. The hero now speaks to that moment directly.
- **"The market update you're sending them doesn't reflect that"** — The Gap speaks to a frustration all five personas share: the disconnect between the caliber of their clients and the quality of their collateral.
- **$500 pricing visible** — previously omitted. Now included because the personas are decision-makers who respect transparency. At $500, the price signals quality (not a $29/mo tool) and removes friction (no sales call required).

### Anti-persona filtering
- "Commission" ≠ "Buy" — avoids transactional feel
- "No subscription required" — not SaaS-speak, addresses team leader's procurement concern
- "Founding advisor rate" — scarcity without urgency language
- Testimonial heading "The room changed" — outcome language, not feature language

### Changes from v1 rationale
- Editorial Showcase removed → mock report card in hero serves same purpose more efficiently (show the product immediately)
- Intelligence Pillars removed → the Gap's two-column contrast + Report's 10-section list communicate value more concretely
- Pricing added → removes a step from the funnel; personas respect directness

---

## Design Token Usage

| Element | Token(s) |
|---------|----------|
| Hero/Final CTA overlay | `color-primary` at 85-90% opacity |
| Headlines | `font-serif` (Playfair), `font-light` (300) |
| Gold accent lines | `color-accent`, h-0.5 |
| Primary CTA | `bg: color-accent`, `text: color-primary`, `radius-sm`, uppercase, tracking-widest |
| "See how it works →" | `color-accent`, no background, text link style |
| Nav anchor links | `font-sans` (Inter), `text-sm`, `color-text-secondary` (scrolled) / `color-text-tertiary` (transparent) |
| Credibility stat numbers | `font-serif`, `text-4xl md:text-5xl`, `color-accent` |
| Gap contrast left | `color-text-tertiary`, muted styling |
| Gap contrast right | `color-text`, `color-accent` accent marks |
| Price display | `font-serif`, `text-5xl md:text-6xl`, `color-accent` |
| Testimonial quotes | `font-serif`, italic, `color-text` |
| Section spacing | `spacing-16` (64px) vertical padding |
| Report section bg | `color-primary` (dark navy) |
| Warm sections | `color-report-bg` |
| Mock report card | `color-surface`, `shadow-lg`, `color-accent` border-left |

---

## Component References

- LandingNav: `components/marketing/landing-nav.tsx` — needs center links + CTA update
- MockReportCard: new component (or inline) — Brian Knox report preview
- All page sections: inline in `app/page.tsx`

---

## Technical Notes

- No authentication required — public page
- All sections server-rendered for SEO (except nav scroll behavior — client component)
- Nav anchor links use `href="#section-id"` with `scroll-behavior: smooth`
- `scroll-mt-16` on anchor targets for nav clearance
- Mock report card: CSS-rendered illustration (styled divs, not a real report)
- Testimonials: placeholder data, flagged for real quote replacement
- Pricing: static $500, no Stripe integration on this page (CTA links to creation flow)
- 10 report sections (up from 8 in v1 — added Methodology & About the Advisor)

---

## Learnings

- "See How It Works" as primary CTA is lower commitment than "Request a Sample Report" — better for first-touch
- Before/after pain points ("The Problem" section) evolved into two-column contrast table for clearer comparison
- Explicit space `{" "}` needed before `<br className="hidden md:block" />` to prevent word collision on mobile
- "Commission" verb resonates with luxury advisory audience — tested stronger than "Get Started" or "Request"
- Adding pricing directly on landing page reduces funnel steps without hurting premium positioning at $500 price point

### 2026-03-11 — v2 Landing Page Redesign
- **Gotcha**: Mock report card metrics (e.g., "Ultra-Luxury", "10") reappear in other sections (segment grades, report section numbering), causing `getByText` collisions. Scope queries with `within(screen.getByTestId("section-id"))` or use `getAllByText` with length checks
- **Pattern**: Split-layout hero (`flex-col md:flex-row`) with copy left + mock report card right works well for product-led pages — the card acts as social proof without needing real screenshots
- **Decision**: Anchor nav links (How It Works / The Report / Pricing) with `scroll-mt-16` for fixed nav clearance. Only 3 links keeps nav clean; sections like Testimonials and The Gap don't need direct nav access
- **Pattern**: Mobile hamburger state (`mobileOpen`) with `onClick={() => setMobileOpen(false)}` on every mobile link prevents the menu from staying open after anchor scroll
