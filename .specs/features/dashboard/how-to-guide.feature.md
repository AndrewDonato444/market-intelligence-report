---
feature: How To Guide
domain: dashboard
source: app/(protected)/how-to/page.tsx
tests:
  - __tests__/app/how-to/how-to-page.test.tsx
components:
  - HowToContent
  - StepCard
  - QuickStartChecklist
  - FaqAccordion
design_refs:
  - .specs/design-system/tokens.md
personas:
  - rising-star-agent
  - established-practitioner
  - team-leader
  - competitive-veteran
  - legacy-agent
status: implemented
created: 2026-03-12
updated: 2026-03-29
---

# How To Guide

**Source File**: `app/(protected)/how-to/page.tsx`
**Design System**: `.specs/design-system/tokens.md`
**Personas**: All five — this page must serve Pat (60, minimal tech comfort) as well as Alex (32, data-native)

## Feature: How To Guide Page

An elegant, scannable guide that orients users to the platform's three-step workflow:
**Define Your Market → Generate Your Report → Activate Your Content Studio**.

The page uses the professional editorial tone of the rest of the platform (Bloomberg meets Architectural Digest). No jargon, no "click here" language. Each step shows the *why* alongside the *how* — because these agents sell on expertise, not button-clicking.

### Scenario: First-time user views How To page
```gherkin
Given a user has just signed up and landed in the dashboard
When they click "How To" in the sidebar navigation
Then they see a page titled "Getting Started"
And they see three numbered step sections:
  | Step | Title                        | Description                                    |
  | 1    | Define Your Market           | Set up the market area you advise on            |
  | 2    | Generate Your Report         | Create your market intelligence brief           |
  | 3    | Activate Your Content Studio | Use your Content Studio for social and email    |
And each step section includes:
  - A brief explanation of why this step matters
  - A clear call-to-action linking to the relevant page
  - A visual indicator (step number with gold accent)
```

### Scenario: User sees quick-start checklist
```gherkin
Given the user is on the How To page
Then they see a "Your Progress" checklist at the top showing:
  | Task                                | Status     |
  | Define at least one market          | complete/incomplete based on user data |
  | Generate your first report          | complete/incomplete based on user data |
  | Explore your Content Studio         | complete/incomplete based on kit data  |
And completed tasks show a gold checkmark
And incomplete tasks show a muted circle
```

### Scenario: Returning user with completed steps
```gherkin
Given a user has already created a market, generated a report, and has a content studio kit
When they visit the How To page
Then the checklist shows all three items as complete
And step sections still display (for reference) but CTAs read contextually:
  | Step | CTA Text                    | Href              |
  | 1    | "View Your Markets"         | /markets          |
  | 2    | "Create Another Report"     | /reports/create   |
  | 3    | "Open Content Studio"       | /content-studio   |
```

### Scenario: User with no markets or reports
```gherkin
Given a new user with no markets or reports
When they visit the How To page
Then the checklist shows all items as incomplete
And step CTAs read:
  | Step | CTA Text                           | Href            | State    |
  | 1    | "Define Your First Market"         | /markets/new    | enabled  |
  | 2    | "Generate Your First Report"       | /reports/create | enabled  |
  | 3    | "Coming after your first report"   | —               | disabled |
```

### Scenario: User navigates to How To from sidebar
```gherkin
Given the user is on any protected page
When they look at the sidebar navigation
Then they see a "How To" link
And the link uses a help/book icon
When they click "How To"
Then they are navigated to /how-to
```

### Scenario: Page renders on mobile viewport
```gherkin
Given the user is on a mobile device (< 768px)
When they view the How To page
Then the step sections stack vertically
And the checklist remains at the top
And all CTAs are full-width buttons
And the page remains readable without horizontal scroll
```

### Scenario: FAQ section answers common questions
```gherkin
Given the user scrolls past the three steps
Then they see a "Common Questions" section with expandable items:
  | Question                                            |
  | How long does a report take to generate?                          |
  | What data sources power the analysis?                             |
  | Can I customize which sections appear in my report?               |
  | What are client personas and how do they shape my report?         |
  | What is the Content Studio?                                       |
And each question expands to reveal a concise answer (2-3 sentences)
And only one question is expanded at a time (accordion behavior)
```

## User Journey

1. User signs up / logs in → lands on **Dashboard**
2. **How To page** (this feature) — understands the workflow
3. Follows Step 1 → **Markets** → defines their market
4. Follows Step 2 → **Reports** → generates first report
5. Follows Step 3 → **Content Studio** → social posts and email campaigns

## UI Mockup

```
┌─────────────────────────────────────────────────────────┐
│  SIDEBAR  │                                             │
│           │  Getting Started                            │
│  Dashboard│  Your guide to creating market intelligence │
│  Reports  │                                             │
│  Content  │  ┌─────────────────────────────────────┐    │
│   Studio  │  │  YOUR PROGRESS                      │    │
│  Markets  │  │                                     │    │
│  Settings │  │  ◉ Define at least one market        │    │
│ >How To   │  │  ○ Generate your first report        │    │
│           │  │  ○ Explore your Content Studio       │    │
│           │  └─────────────────────────────────────┘    │
│           │                                             │
│           │  ┌─────────────────────────────────────┐    │
│           │  │                                     │    │
│           │  │  ①  DEFINE YOUR MARKET              │    │
│           │  │                                     │    │
│           │  │  Every great market brief starts     │    │
│           │  │  with a clearly defined territory.   │    │
│           │  │  Set your geographic focus, price    │    │
│           │  │  range, and property types so the    │    │
│           │  │  analysis speaks directly to your    │    │
│           │  │  clients' interests.                 │    │
│           │  │                                     │    │
│           │  │  [ Define Your First Market → ]      │    │
│           │  └─────────────────────────────────────┘    │
│           │                                             │
│           │  ┌─────────────────────────────────────┐    │
│           │  │                                     │    │
│           │  │  ②  GENERATE YOUR REPORT            │    │
│           │  │                                     │    │
│           │  │  Our analysis engine examines        │    │
│           │  │  recent transactions, market trends, │    │
│           │  │  and competitive dynamics to produce │    │
│           │  │  a publication-quality intelligence  │    │
│           │  │  brief — typically in under five     │    │
│           │  │  minutes.                           │    │
│           │  │                                     │    │
│           │  │  [ Generate Your First Report → ]    │    │
│           │  │  href: /reports/create               │    │
│           │  └─────────────────────────────────────┘    │
│           │                                             │
│           │  ┌─────────────────────────────────────┐    │
│           │  │                                     │    │
│           │  │  ③  ACTIVATE YOUR CONTENT STUDIO    │    │
│           │  │                                     │    │
│           │  │  Each report powers a Content Studio │    │
│           │  │  — ready-to-post social content and  │    │
│           │  │  email campaigns that position you   │    │
│           │  │  as the market authority your clients │    │
│           │  │  expect.                            │    │
│           │  │                                     │    │
│           │  │  [ Coming after your first report ]  │    │
│           │  │  muted/disabled state                │    │
│           │  └─────────────────────────────────────┘    │
│           │                                             │
│           │  COMMON QUESTIONS                           │
│           │  ─────────────────────────────────          │
│           │  ▸ How long does a report take?             │
│           │  ▸ What data sources power the analysis?    │
│           │  ▸ Can I customize report sections?         │
│           │  ▸ What are client personas?                │
│           │  ▸ What is the Content Studio?              │
│           │                                             │
└─────────────────────────────────────────────────────────┘

Design Token Usage:
- Page title: font-serif (Playfair Display), text-3xl, color-text
- Subtitle: font-sans (Inter), text-base, color-text-secondary
- Step numbers: color-accent (#CA8A04), font-serif, text-2xl
- Step titles: font-serif, text-xl, font-semibold, color-text
- Step body: font-sans, text-base, color-text-secondary
- CTAs: bg-accent, text-white, radius-md, font-sans font-medium
- Disabled CTA: bg-border, color-text-secondary
- Checklist card: bg-surface, shadow-sm, radius-lg, border-border
- Step cards: bg-surface, shadow-sm, radius-lg, spacing-6 padding
- Checkmark (done): color-accent (gold)
- Checkmark (pending): color-text-secondary, opacity 40%
- FAQ section title: font-sans, text-lg, font-semibold, color-text
- FAQ items: font-sans, text-base, border-b border-border
- Page padding: spacing-8 (desktop), spacing-4 (mobile)
- Card gap: spacing-6
```

## Persona Revision Notes

**Revision pass through persona lens:**

1. **Pat (Legacy Agent, 60)** — Replaced all tech jargon. "Generate" is kept because it's used throughout the platform, but explanations emphasize the *outcome* ("publication-quality intelligence brief") not the process. Checklist provides gentle orientation without feeling like a tutorial for software.

2. **Alex (Rising Star, 32)** — Step copy emphasizes strategic positioning ("market authority," "intelligence brief") not just mechanics. CTAs are action-oriented. The page doesn't over-explain — Alex will skim the steps and click through quickly.

3. **Taylor (Team Leader)** — FAQ includes team-relevant questions. The page could serve as onboarding material for new team members. Step copy uses "publication" language that aligns with brand/thought-leadership goals.

4. **Jordan & Morgan (Established/Veteran)** — The editorial tone matches their expectation of premium tools. No "Welcome!" or "Let's get started!" energy. The page reads like a table of contents for a professional service, not a SaaS onboarding wizard.

**Key vocabulary choices:**
- "Market intelligence brief" not "report" (in descriptions — "report" in CTAs for clarity)
- "Define your market" not "Create a market" (advisory framing)
- "Activate your Content Studio" not "Share your intelligence" (reflects full feature set)
- "Content Studio" not "Social Media Kit" (encompasses social + email)
- "Analysis engine" not "AI agents" (black-box the tech)
- "Publication-quality" — resonates with every persona's desire for credibility

## Component References

- StepCard: `.specs/design-system/components/step-card.md` (stub needed)
- QuickStartChecklist: `.specs/design-system/components/quick-start-checklist.md` (stub needed)
- FAQ Accordion: reuse existing or create `.specs/design-system/components/accordion.md` (stub needed)

## Learnings

(To be filled after implementation)
