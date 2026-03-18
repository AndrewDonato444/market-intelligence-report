---
feature: Marketing Landing Page
domain: marketing
source: app/page.tsx
tests:
  - __tests__/app/landing-page.test.tsx
components:
  - HeroSection
  - BrandStatement
  - OpportunitySection
  - PlatformSection
  - FlywheelSection
  - PromiseSection
  - ProofSection
  - BottomCta
  - LandingNav
personas:
  - rising-star-agent
  - established-solo
  - team-leader
  - competitive-veteran
  - legacy-agent
status: specced
created: 2026-03-10
updated: 2026-03-18
# drift reconciled 2026-03-18: hero/bottom CTA changed from email forms to /waitlist links, nav gained Log In link + /waitlist CTA, "7 spots remaining" added
---

# Marketing Landing Page (v3 — Waitlist/Brand)

**Source File**: `app/page.tsx`
**Nav Component**: `components/marketing/landing-nav.tsx`
**Design System**: `.specs/design-system/tokens.md`
**Locked Decisions**: `MSA_Homepage_Decisions.docx` (March 2026, v1.0)
**HTML Reference**: `msa-homepage.html` (Brian's approved design)
**Personas**: All five agent personas

## Overview

v3 pivots from product-led conversion (Commission a Report, $500 pricing) to brand/waitlist acquisition for the founding cohort. The page now positions Modern Signal Advisory as a platform with two products (Signal Report + Signal Voice), uses email waitlist capture as the primary CTA, and establishes credibility through the Knox Brothers precedent rather than testimonials.

### Strategic Shift (v2 → v3)

| Dimension | v2 (current) | v3 (Brian's locked decisions) |
|-----------|-------------|-------------------------------|
| Goal | Individual report sales | Founding cohort waitlist acquisition |
| CTA | "Commission Your First Report" → /sign-up | "Join the Waitlist" → /waitlist page |
| Products shown | Signal Report only | Signal Report + Signal Voice |
| Pricing | $500/report visible | No pricing (on hold until beta) |
| Social proof | 3 testimonial quotes | Knox Brothers precedent + $117M/$Top 1% stats |
| Hero format | Split layout with mock report card | Centered with CTA link to /waitlist |
| Design feel | Bloomberg Terminal × Architectural Digest | Luxury hospitality (warm, editorial) |
| Color palette | Navy/gold (cool) | Ivory/charcoal/gold (warm) |
| Typography | Playfair Display + Inter | Cormorant Garamond + DM Sans |

### Design Philosophy (updated for v3)

1. **Warm + Premium** — luxury hospitality feel, not SaaS or financial terminal
2. **Breathe With White Space** — generous margins = premium confidence
3. **Quiet Authority** — confidence from restraint, not assertion
4. **No "smartest person in the room"** — preparation and differentiation, not intellectual superiority
5. **No internal jargon** — IDA, Intelligence-Driven Advisor framework removed from public copy

### Hard Guardrails (unchanged + additions from locked decisions)

- No exclamation points
- No urgency language ("Act now," "Limited time")
- No generic luxury adjectives without proof
- No real estate cliches
- No discount language ("free," "complimentary")
- No stock photography or generic beach imagery
- No cluttered layouts
- No "smartest person in the room" framing
- No internal jargon (IDA, Intelligence-Driven Advisor)

### Design Direction — Marketing Tokens

The marketing page uses the `color-mkt-*` token set defined in `.specs/design-system/tokens.md` (Marketing-Specific section). These extend — not replace — the app's navy-based tokens.

| Design System Token | Brian's HTML Variable | Value | Usage |
|--------------------|----------------------|-------|-------|
| `color-mkt-bg` | `--ivory` | `#F7F4EF` | Page background |
| `color-mkt-surface` | `--warm-white` | `#FDFCFA` | Card backgrounds, inverse text |
| `color-mkt-border` | `--sand` | `#E8E0D4` | Borders |
| `color-mkt-text` | `--charcoal` | `#2C2825` | Headlines |
| `color-mkt-text-secondary` | `--warm-gray` | `#8A8077` | Body text |
| `color-mkt-text-muted` | `--stone` | `#C4B9A8` | Fine print |
| `color-mkt-dark` | `--deep` | `#1A1714` | Dark sections |
| `color-mkt-darkest` | `--ink` | `#0F0E0C` | Footer |
| `color-mkt-accent` | `--gold` | `#B8975A` | Primary accent |
| `color-mkt-accent-light` | `--gold-light` | `#D4B87A` | Accent on dark bg |
| `color-mkt-success` | `--signal-green` | `#4A7C59` | Waitlist confirmation |
| `font-display` | `--font-display` | Cormorant Garamond | Headlines |
| `font-body` | `--font-body` | DM Sans | Body/UI text |

**Shared from app tokens**: Spacing scale, border radius, font sizes, font weights, breakpoints.

> **Implementation note**: Use `--color-mkt-*` CSS variable names in code, not Brian's original variable names. This keeps everything traceable to the design system.

---

## Feature: Marketing Landing Page v3

### Scenario: Navigation
Given a visitor is on the page
When they view the fixed navigation bar
Then they see "Modern Signal Advisory" wordmark on the left (Cormorant Garamond)
And "Signal" is gold-colored
And navigation links on the right: "Platform", "How It Works", "Proof"
And a "Log In" text link pointing to /sign-in
And a "Join the Waitlist" CTA button (charcoal bg, warm-white text) linking to /waitlist
And the nav transitions from transparent to frosted ivory on scroll (>60px)
And the nav padding reduces from 24px to 16px when scrolled

### Scenario: Hero section with waitlist CTA
Given a visitor lands on the root URL "/"
When the page loads
Then they see a centered full-viewport hero on ivory background
And a gold overline "The Intelligence Era of Real Estate" (12px, tracking 0.25em)
And the H1 reads "Your market tells a story." with line break then italic gold "Most agents can't tell it."
And a subheadline in Cormorant Garamond reads "Modern Signal Advisory gives you the intelligence, the voice, and the system to tell it — with authority, in your words, every month without fail."
And a "Join the Waitlist" button linking to /waitlist
And below the button: "Founding cohort — limited to 25 agents · 7 spots remaining" (gold accent on "7 spots remaining")
And a scroll indicator animation at the bottom
And all elements animate in sequentially with fadeUp (staggered 0.3s–1.3s)

### Scenario: Brand statement section
Given the visitor scrolls past the hero
When the brand statement section enters the viewport
Then they see a dark (#1A1714) full-width section
And centered text in Cormorant Garamond reads: "Real estate has an old playbook. **The intelligence era is here.** Modern Signal Advisory builds the brand system to prove *you belong at the front of it.*"
And "The intelligence era is here" is bold white
And "you belong at the front of it" is italic gold

### Scenario: The Opportunity section
Given the visitor scrolls to The Opportunity section
When the section enters the viewport
Then they see a two-column layout
And the left column has:
  - Gold section label "THE OPPORTUNITY"
  - Headline: "The listing goes to the agent who can say what no one else can."
  - Two body paragraphs about the intelligence gap
And the right column has 3 stat cards:
  - "85%" — luxury agents who lost listings to more sophisticated-appearing agents
  - "60%" — do almost nothing for market intelligence
  - "#1" — pain point: attracting vs chasing clients
And each stat card has source "Compass Luxury Agent Survey, 2026"
And stat cards have hover state: gold border + subtle shadow

### Scenario: The Platform section
Given the visitor scrolls to The Platform section (anchor #platform)
When the section is visible
Then they see centered header with gold label "THE PLATFORM"
And headline "Intelligence. Voice. Proof."
And subhead about two integrated products
And two product cards side by side:
  - **Signal Report** — "The Proof Mechanism" — SVG icon, description of monthly intelligence report
  - **Signal Voice** — "The Reach Mechanism" — SVG icon, description of content transformation
And each card has a gold top-border animation on hover (scaleX 0→1)
And below the cards: italic teaser "The platform is expanding — with an advisor training course and private community *arriving later this year.*"

### Scenario: Growth Flywheel section
Given the visitor scrolls to the Flywheel section (anchor #flywheel)
When the section is visible
Then they see a dark (#1A1714) section with gold label "THE GROWTH FLYWHEEL"
And headline "Not a subscription. A compounding asset."
And three stages displayed horizontally (stacked on mobile):
  - 01 Intelligence (Signal Report)
  - 02 Performance (Signal Report)
  - 03 Visibility (Signal Voice)
And each stage has: large number, name, product tag, description
And stages are separated by subtle vertical borders

### Scenario: Promise section
Given the visitor scrolls past the flywheel
When the promise section enters the viewport
Then they see a charcoal (#2C2825) section
And a centered blockquote in Cormorant Garamond italic
And the quote contains two gold bold phrases about lasting reputation

### Scenario: Proof / Knox Brothers section
Given the visitor scrolls to the Proof section (anchor #proof)
When the section is visible
Then they see a two-column layout
And the left column has:
  - Gold label "BUILT BY ADVISORS, NOT TECHNOLOGISTS"
  - Headline: "This platform was proven before it was productized."
  - Two body paragraphs about the founders' journey
  - Two stats: "$117M" (Sales volume) and "Top 1%" (Producer at Compass)
And the right column has a dark visual panel with:
  - Label "The Knox Brothers Precedent"
  - Quote about subscribers building what founders already proved

### Scenario: Bottom CTA with waitlist link
Given the visitor reaches the bottom CTA section (anchor #join)
When the section is visible
Then they see a dark (#1A1714) section
And gold label "FOUNDING COHORT — NOW FORMING"
And headline "The intelligence era" / "isn't *coming.* It's here."
And body copy about 25 founding members
And a "Reserve My Spot" button linking to /waitlist (gold bg on dark section)
And note "No commitment. We'll reach out personally when the founding cohort opens."

### Scenario: Footer
Given the visitor reaches the footer
When the footer is visible
Then they see a minimal dark (#0F0E0C) footer
And "Modern Signal Advisory" wordmark on the left (with gold "Signal")
And "© 2026 Modern Signal Advisory, LLC · Confidential" on the right

### Scenario: Mobile responsive (< 900px)
Given the visitor is on a mobile device
When the page renders
Then the nav links are hidden (no hamburger in v3 HTML — simplified)
And the hero form stacks vertically (input above button)
And the opportunity grid stacks to single column
And the product cards stack to single column
And the flywheel stages stack vertically with top borders
And the proof grid stacks to single column
And the bottom CTA form stacks vertically
And the footer stacks centered
And all touch targets are accessible

### Scenario: Scroll-triggered fade-in animations
Given any section with class "fade-in" enters the viewport
When the IntersectionObserver triggers (threshold 0.15, rootMargin "0px 0px -40px 0px")
Then the element transitions from opacity:0 + translateY(30px) to opacity:1 + translateY(0)
And the transition duration is 0.9s with ease-out-expo timing

---

## Section Order (v3)

1. **Nav** — Fixed top: Wordmark left, anchor links right, "Join the Waitlist" CTA right
2. **Hero** — Centered: overline, headline, subhead, email form, founding cohort note
3. **Brand Statement** — Dark section, single centered editorial paragraph
4. **The Opportunity** — Two-column: copy left, 3 stat cards right
5. **The Platform** — Two product cards: Signal Report + Signal Voice
6. **Growth Flywheel** — Dark section, 3 horizontal stages
7. **Promise** — Blockquote on charcoal background
8. **Proof / Knox Brothers** — Two-column: copy+stats left, testimonial panel right
9. **Bottom CTA** — Dark section, email capture
10. **Footer** — Minimal branding

### Sections Removed from v2

- ~~Mock Report Card in Hero~~ (replaced with centered email capture)
- ~~Credibility Strip~~ (stat proof moved to Opportunity section)
- ~~The Gap~~ (contrast now implicit in Opportunity copy)
- ~~How It Works (3-step process)~~ (replaced with Growth Flywheel)
- ~~The Report (10 sections)~~ (product detail deferred)
- ~~Testimonials~~ (replaced with Promise quote + Knox Brothers proof)
- ~~Pricing ($500)~~ (on hold until beta feedback)
- ~~Final CTA (Commission)~~ (replaced with waitlist capture)

---

## User Journey

1. Agent hears about Modern Signal Advisory (referral, wealth manager, search)
2. **Lands on marketing page (this feature)**
3. Hero copy establishes the problem and positions MSA as the solution
4. Brand Statement reinforces positioning
5. Opportunity section validates with stats (85%, 60%, #1)
6. Platform section introduces both products
7. Flywheel shows compounding value
8. Promise + Proof builds trust through founders' track record
9. Bottom CTA captures email for founding cohort
10. Team reaches out personally when cohort opens

---

## UI Mockup

```
┌──────────────────────────────────────────────────────────────────────┐
│ NAV (fixed, transparent → frosted ivory on scroll)                   │
│ ┌────────────────────┐           ┌─────────────────────────────────┐│
│ │Modern Signal Adv.  │           │Platform  How It Works  Proof    ││
│ │      (gold Signal) │           │              [Join Waitlist]    ││
│ └────────────────────┘           └─────────────────────────────────┘│
├──────────────────────────────────────────────────────────────────────┤
│ HERO (full viewport, ivory bg, centered)                             │
│                                                                      │
│              THE INTELLIGENCE ERA OF REAL ESTATE                     │
│                     (gold, 12px, tracking)                           │
│                                                                      │
│          Your market tells a story.                                  │
│          Most agents can't tell it.                                  │
│              (italic gold)                                           │
│                                                                      │
│       [Cormorant Garamond subheadline about                          │
│        intelligence, voice, system]                                  │
│                                                                      │
│     ┌──────────────────────┬──────────────────┐                     │
│     │ Enter your email     │ Join the Waitlist │                     │
│     └──────────────────────┴──────────────────┘                     │
│         Founding cohort — limited to 25 agents                       │
│                                                                      │
│                     │ (scroll indicator)                             │
├──────────────────────────────────────────────────────────────────────┤
│ BRAND STATEMENT (dark #1A1714, centered Cormorant)                   │
│                                                                      │
│   Real estate has an old playbook. THE INTELLIGENCE ERA IS HERE.     │
│   Modern Signal Advisory builds the brand system to prove            │
│   you belong at the front of it.                                     │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│ THE OPPORTUNITY (ivory bg, 2-col)                                    │
│                                                                      │
│  ┌──────────────────────────┐  ┌──────────────────────────┐         │
│  │ THE OPPORTUNITY           │  │ ┌──────────────────────┐ │         │
│  │                           │  │ │ 85%                  │ │         │
│  │ The listing goes to the   │  │ │ of luxury agents...  │ │         │
│  │ agent who can say what    │  │ │ Compass Survey, 2026 │ │         │
│  │ no one else can.          │  │ └──────────────────────┘ │         │
│  │                           │  │ ┌──────────────────────┐ │         │
│  │ [body paragraphs]         │  │ │ 60%                  │ │         │
│  │                           │  │ │ do almost nothing... │ │         │
│  │                           │  │ └──────────────────────┘ │         │
│  │                           │  │ ┌──────────────────────┐ │         │
│  │                           │  │ │ #1                   │ │         │
│  │                           │  │ │ pain point...        │ │         │
│  └──────────────────────────┘  │ └──────────────────────┘ │         │
│                                 └──────────────────────────┘         │
├──────────────────────────────────────────────────────────────────────┤
│ THE PLATFORM (warm-white bg, #platform)                              │
│                                                                      │
│                    THE PLATFORM                                      │
│              Intelligence. Voice. Proof.                             │
│        Two integrated products that work together...                 │
│                                                                      │
│  ┌───────────────────────┐  ┌───────────────────────┐               │
│  │ [SVG icon]            │  │ [SVG icon]            │               │
│  │ Signal Report         │  │ Signal Voice          │               │
│  │ THE PROOF MECHANISM   │  │ THE REACH MECHANISM   │               │
│  │                       │  │                       │               │
│  │ A done-for-you monthly│  │ Your monthly intel    │               │
│  │ intelligence report...│  │ transformed into      │               │
│  │                       │  │ LinkedIn, Instagram...│               │
│  └───────────────────────┘  └───────────────────────┘               │
│                                                                      │
│     The platform is expanding — with an advisor training             │
│     course and private community arriving later this year.           │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│ GROWTH FLYWHEEL (dark #1A1714, #flywheel)                            │
│                                                                      │
│            THE GROWTH FLYWHEEL                                       │
│      Not a subscription. A compounding asset.                        │
│                                                                      │
│  ┌─────────────────┬─────────────────┬─────────────────┐            │
│  │ 01              │ 02              │ 03              │            │
│  │ Intelligence    │ Performance     │ Visibility      │            │
│  │ SIGNAL REPORT   │ SIGNAL REPORT   │ SIGNAL VOICE    │            │
│  │                 │                 │                 │            │
│  │ Walk into a     │ A listing won.  │ Your intel      │            │
│  │ listing appt... │ A buyer...      │ published...    │            │
│  └─────────────────┴─────────────────┴─────────────────┘            │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│ PROMISE (charcoal #2C2825, blockquote)                               │
│                                                                      │
│   "Once you learn how to read your market, speak to it with          │
│   authority, and show clients something no one else can —            │
│   that doesn't go away. The relationships you build, the             │
│   reputation you earn, the position you hold —                       │
│   those belong to you forever."                                      │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│ PROOF (ivory bg, 2-col, #proof)                                      │
│                                                                      │
│  ┌──────────────────────────┐  ┌──────────────────────────┐         │
│  │ BUILT BY ADVISORS,       │  │ ┌────────────────────┐   │         │
│  │ NOT TECHNOLOGISTS        │  │ │ (dark panel)       │   │         │
│  │                          │  │ │                    │   │         │
│  │ This platform was proven │  │ │ THE KNOX BROTHERS  │   │         │
│  │ before it was            │  │ │ PRECEDENT          │   │         │
│  │ productized.             │  │ │                    │   │         │
│  │                          │  │ │ "Every subscriber  │   │         │
│  │ [body paragraphs]        │  │ │ is building what   │   │         │
│  │                          │  │ │ the founders have  │   │         │
│  │ $117M     Top 1%         │  │ │ already done..."   │   │         │
│  │ Sales vol  Producer      │  │ └────────────────────┘   │         │
│  └──────────────────────────┘  └──────────────────────────┘         │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│ BOTTOM CTA (dark #1A1714, #join)                                     │
│                                                                      │
│           FOUNDING COHORT — NOW FORMING                              │
│                                                                      │
│        The intelligence era                                          │
│        isn't coming. It's here.                                      │
│              (italic gold "coming")                                  │
│                                                                      │
│     25 founding members. Founding pricing. Direct access             │
│     to the team building the platform.                               │
│                                                                      │
│     ┌──────────────────────┬──────────────────┐                     │
│     │ Enter your email     │ Reserve My Spot   │                     │
│     └──────────────────────┴──────────────────┘                     │
│     No commitment. We'll reach out personally.                       │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│ FOOTER (dark #0F0E0C, minimal)                                       │
│  Modern Signal Advisory    © 2026 Modern Signal Advisory, LLC        │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Locked Decisions (from Brian's doc)

These are non-negotiable and must be implemented exactly:

1. **Headline**: "Your market tells a story. Most agents can't tell it."
2. **Founding cohort**: 25 agents (changed from 50)
3. **Products shown**: Signal Report + Signal Voice only; IDA Course and Community teased as "arriving later this year"
4. **Signal Voice scope**: Intelligence Layer only — no personalized voice filtering (Problem 2 paused)
5. **Flywheel**: Three stages mapped to live products only
6. **Survey attribution**: "Compass Luxury Agent Survey, 2026" — no sample size shown
7. **Proof stats**: $117M sales volume + Top 1% Producer at Compass (186% YoY removed)
8. **Signal Report specs in copy**: Eight client personas, under ten minutes, client's decision framework
9. **Tone guardrails**: No "smartest person in the room" framing
10. **No internal jargon**: IDA, Intelligence-Driven Advisor framework removed
11. **CTA**: Waitlist email capture (top and bottom)
12. **Signal Report landing page**: On hold until beta feedback
13. **Design direction**: Warm + premium (luxury hospitality) — Cormorant Garamond + DM Sans, ivory/gold/charcoal

---

## Implementation Notes

### Architecture Decision: Marketing Token Layer

The marketing page uses the `color-mkt-*` tokens from the design system (`.specs/design-system/tokens.md`). This extends the token system rather than bypassing it. Rationale:
- One source of truth for all design decisions
- Marketing tokens follow the same naming pattern as Report-Specific tokens
- Shared spacing/radius/weights/breakpoints prevent drift
- The warm palette is a deliberate design choice, not an accident

### Approach

1. Add `--color-mkt-*` CSS variables to the marketing page (from tokens.md)
2. Replace current `app/page.tsx` sections entirely, using `color-mkt-*` tokens
3. Update `LandingNav` to match new nav structure
4. Waitlist form: client-side placeholder handler (same as Brian's HTML for now)
5. Google Fonts: Add Cormorant Garamond + DM Sans via `<link>` in page head or layout

### Files to Change

- `app/page.tsx` — full rewrite
- `components/marketing/landing-nav.tsx` — update to new nav structure
- `app/layout.tsx` or `app/page.tsx` head — add Cormorant Garamond + DM Sans fonts

### Files to Remove (or deprecate)

- Mock report card markup (was in hero, no longer needed)
- Testimonials data constant (replaced by Promise + Proof)
- Pricing section (on hold)
- Gap comparison table (replaced by Opportunity)

---

## Component References

- LandingNav: `components/marketing/landing-nav.tsx` — needs full rewrite for new structure
- All page sections: inline in `app/page.tsx` (matching Brian's single-file HTML approach)

---

## Technical Notes

- No authentication required — public page
- Waitlist form: `onsubmit` handler with placeholder success state (no backend integration yet)
- Scroll behavior: CSS `scroll-behavior: smooth`
- Nav scroll detection: IntersectionObserver or scroll event (>60px)
- Fade-in animations: IntersectionObserver with threshold 0.15
- Google Fonts loaded via `<link>` in head (Cormorant Garamond + DM Sans)
- Responsive breakpoint: 900px (matching Brian's HTML)
- Footer uses inline styles (not shared Footer component — different design from app footer)

---

## Learnings

- "Commission" verb from v2 replaced with "Join the Waitlist" — strategic shift from product sales to cohort building
- Before/after pain points ("The Gap") evolved into Opportunity section with survey stats
- Explicit `{" "}` needed before `<br className="hidden md:block" />` to prevent word collision on mobile
- Mock report card removed from hero — waitlist email capture is simpler and more appropriate for pre-launch
- Self-contained CSS variables for marketing page avoids polluting app design tokens

### 2026-03-18 — v3 Landing Page (Brian's Locked Decisions)
- **Decision**: Marketing page gets its own warm color palette separate from app's navy tokens
- **Decision**: Cormorant Garamond + DM Sans replaces Playfair Display + Inter for marketing page only
- **Decision**: No pricing shown until beta feedback collected
- **Decision**: Signal Voice introduced as second product alongside Signal Report
- **Locked**: All copy from Brian's decisions doc is final — implement exactly as written
