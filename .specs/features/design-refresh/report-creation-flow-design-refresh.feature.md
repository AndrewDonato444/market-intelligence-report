---
feature: Design Refresh — Report Creation Flow (Phase 4)
domain: design-refresh
source: components/reports/creation-flow-shell.tsx, components/reports/creation-step-indicator.tsx, components/reports/steps/step-your-market.tsx, components/reports/steps/step-your-tier.tsx, components/reports/steps/step-your-audience.tsx, components/reports/steps/step-your-review.tsx, components/reports/steps/step-generating.tsx, components/reports/steps/market-autocomplete.tsx, components/reports/steps/market-preview-card.tsx, components/reports/persona-card.tsx, components/reports/persona-preview-panel.tsx
tests: []
components:
  - CreationFlowShell
  - CreationStepIndicator
  - StepYourMarket
  - StepYourTier
  - StepYourAudience
  - StepYourReview
  - StepGenerating
  - MarketAutocomplete
  - MarketPreviewCard
  - AudiencePersonaCard
  - ReviewSectionCard
  - AgentCard
  - ActivityLog
design_refs:
  - .specs/design-system/tokens.md
personas:
  - rising-star-agent
  - established-practitioner
status: specced
created: 2026-03-28
updated: 2026-03-28
---

# Design Refresh: Report Creation Flow (Phase 4)

**Parent Spec**: `.specs/features/design-refresh/backend-design-refresh.feature.md`
**Design System**: `.specs/design-system/tokens.md`
**Personas**: Rising Star Agent (Alex Rivera), Established Practitioner (Jordan Ellis)

## Overview

Phases 1-2 refreshed the shell and dashboard to the warm luxury palette. The report creation flow — the 5-step wizard where agents configure and generate their intelligence report — still uses cold tokens (`--color-primary`, `--color-surface`, `--color-border`, `--font-serif`, `--font-sans`). This creates a warm frame around a cold form, breaking the "walking deeper into the same space" principle.

Phase 4 migrates the entire creation flow (shell, step indicator, all 5 steps, and sub-components) to `--color-app-*` warm tokens and `--font-display` / `--font-body` typography.

**Persona lens**: Alex (Rising Star) is configuring a report to impress HNWIs — the creation flow should feel like a premium concierge experience, not a SaaS form wizard. Jordan (Established Practitioner) expects the editorial quality of an advisory intake, not a checkout page.

## Hard Constraints

1. **Do NOT touch PDFs** — zero changes to report PDF rendering, PDF templates, PDF components, or any `--color-report-*` tokens
2. **Additive only** — never rename, delete, or change values of existing `--color-*`, `--font-serif`, `--font-sans` tokens
3. **Preserve all functionality** — step navigation, draft persistence, quick start, market autocomplete, persona selection, entitlement gating, generation polling, retry, and view-report navigation must all keep working
4. **Keep semantic colors** — `--color-success`, `--color-error`, `--color-warning` stay as-is
5. **Keep animations** — all Framer Motion transitions, selection variants, and stagger animations stay as-is

---

## Token Migration Map

### Typography

| Old Token | New Token | Components |
|-----------|-----------|------------|
| `--font-serif` | `--font-display` | All step headings (h1, h2), tier range text, review "What we're building" heading, entitlement gate heading, generating step heading |
| `--font-sans` | `--font-body` | All body text, labels, buttons, form inputs, metadata, step indicator labels, agent names, log messages, tags |

### Colors

| Old Token | New Token | Components |
|-----------|-----------|------------|
| `--color-primary` (as text) | `--color-app-text` | Shell h1, step headings, tier range text, review heading, generating heading, "Use This" button text, generate button text |
| `--color-surface` | `--color-app-surface` | Shell card bg, tier card bg (unselected), review section card bg, activity log bg, agent card bg (pending/completed/failed), entitlement gate bg, gradient fade |
| `--color-border` | `--color-app-border` | Shell nav border-t, step indicator connector (incomplete), tier card border (unselected), review section card border, form input borders, activity log border, progress bar track, "or define a new market" divider |
| `--color-text` | `--color-app-text` | Form input text, tier label text, review data text, agent name text, tag text |
| `--color-text-secondary` | `--color-app-text-secondary` | Step descriptions, form labels, tier taglines, review subtitles, persona descriptions, log messages, usage indicator text, "Back" button, "Maybe Later" link |
| `--color-text-tertiary` | `--color-app-text-tertiary` | Step indicator (inactive), review section labels (uppercase), title char count, placeholder text, log timestamps, agent completed description |
| `--color-accent` | `--color-app-accent` | Step indicator (active/complete), accent lines, "Next" button bg, "Use This" button bg, tier card border (selected), selection badge bg, edit links, diamond bullets, progress bar fill, "View Plans" button bg |
| `--color-accent-hover` | `--color-app-accent-hover` | "Next" button hover, "Use This" button hover, edit link hover, generate button hover, "View Plans" button hover, "Pro" badge text |
| `--color-accent-light` | `--color-app-accent-light` | Tier card bg (selected), persona card bg (selected), agent card bg (running), "Pro" badge bg, entitlement last-report bg |
| `--color-primary-light` | `--color-app-active-bg` | Tag bg (primary variant), entitlement loading skeleton bg, usage indicator bg |
| `--color-background` | `--color-app-bg` | Form input backgrounds |
| `--color-border-strong` | `--color-app-border-strong` | Persona card hover border, entitlement gate border |

---

## Feature: Report Creation Flow Warm Refresh

### Scenario: Creation flow shell uses warm palette
Given the user navigates to the report creation page
When the creation flow shell renders
Then the outer card uses `--color-app-surface` background
And the h1 "Create Your Intelligence Report" uses `--font-display` and `--color-app-text`
And the gold accent line uses `--color-app-accent`
And the navigation border uses `--color-app-border`
And the "Back" button text uses `--color-app-text-secondary` with hover `--color-app-text`
And the "Next" button uses `--color-app-accent` bg with `--color-app-text` text

### Scenario: Step indicator uses warm tokens
Given the creation flow renders with 5 steps
When the step indicator renders
Then active step circles use `--color-app-accent` border and bg
And completed step circles use `--color-app-accent` border and bg
And inactive step circles use `--color-app-border` border and `--color-app-surface` bg
And inactive step numbers use `--color-app-text-tertiary`
And active step labels use `--color-app-accent` text and `--font-body`
And completed step labels use `--color-app-accent` text
And inactive step labels use `--color-app-text-tertiary`
And connector lines between completed steps use `--color-app-accent`
And connector lines between incomplete steps use `--color-app-border`

### Scenario: Step 1 — Your Market uses warm palette
Given the user is on step 1 "Your Market"
When the step renders
Then the heading "Where do you operate?" uses `--font-display` and `--color-app-text`
And the subtitle uses `--font-body` and `--color-app-text-secondary`
And the accent line uses `--color-app-accent`
And saved market cards use `--color-app-surface` bg and `--color-app-border` border
And market name text uses `--font-body` and `--color-app-text`
And market metadata uses `--font-body` and `--color-app-text-secondary`
And the "Use This" quick-start button uses `--color-app-accent` bg
And the "or define a new market" divider uses `--color-app-border` lines and `--color-app-text-secondary` text
And form labels use `--font-body` and `--color-app-text-secondary`
And form inputs use `--color-app-bg` background, `--color-app-border` border, `--color-app-text` text
And input focus rings use `--color-app-accent`
And input placeholder text uses `--color-app-text-tertiary`

### Scenario: Step 2 — Your Tier uses warm palette
Given the user is on step 2 "Your Tier"
When the step renders
Then the heading "Which tier defines your clientele?" uses `--font-display` and `--color-app-text`
And the subtitle uses `--font-body` and `--color-app-text-secondary`
And the accent line uses `--color-app-accent`
And unselected tier cards use `--color-app-surface` bg and `--color-app-border` border
And selected tier cards use `--color-app-accent-light` bg and `--color-app-accent` border
And tier label text uses `--font-body` and `--color-app-text`
And tier range text uses `--font-display` and `--color-app-text`
And tier tagline uses `--font-body` and `--color-app-text-secondary`
And the diamond tip uses `--color-app-accent`
And the tip text uses `--font-body` and `--color-app-text-secondary`

### Scenario: Step 3 — Your Audience uses warm palette
Given the user is on step 3 "Your Audience"
When persona cards render
Then unselected cards use `--color-app-surface` bg and `--color-app-border` border
And selected cards use `--color-app-accent-light` bg and `--color-app-accent` border
And card hover border uses `--color-app-border-strong`
And selection badge uses `--color-app-accent` bg and `--color-app-text` text
And persona name uses `--font-body` and `--color-app-text`
And persona tagline uses `--font-body` and `--color-app-text-secondary`
And qualifier question text uses `--font-body` and `--color-app-text`
And qualifier option labels use `--font-body` and `--color-app-text-secondary`

### Scenario: Step 4 — Review uses warm palette
Given the user is on step 4 "Review"
When the review step renders
Then the heading "Review Your Report" uses `--font-display` and `--color-app-text`
And the subtitle uses `--font-body` and `--color-app-text-secondary`
And the accent line uses `--color-app-accent`
And review section cards use `--color-app-surface` bg and `--color-app-border` border
And section labels use `--font-body` and `--color-app-text-tertiary`
And "Edit" links use `--color-app-accent` with hover `--color-app-accent-hover`
And data values use `--font-body` and `--color-app-text`
And persona tags use `--color-app-active-bg` bg and `--color-app-text` text
And the report title input uses `--color-app-surface` bg, `--color-app-border` border, `--color-app-text` text
And the title input focus ring uses `--color-app-accent`
And the title char count uses `--color-app-text-tertiary`
And the "What we're building" card uses `--color-app-surface` bg, `--color-app-border` border
And the "What we're building" heading uses `--font-display` and `--color-app-text`
And report section bullets use `--color-app-accent` diamond and `--font-body`
And the footer note uses `--color-app-text-tertiary` with `--color-app-border` top border
And the "Generate Report" button uses `--color-app-accent` bg with `--color-app-text` text

### Scenario: Entitlement UI uses warm palette
Given the user has a limited plan
When entitlement indicators render
Then the loading skeleton uses `--color-app-active-bg` bg
And the usage indicator uses `--color-app-active-bg` bg (or `--color-app-accent-light` when last report)
And usage text uses `--font-body` and `--color-app-text-secondary`
And the entitlement gate banner uses `--color-app-surface` bg, `--color-app-border-strong` border
And the gate heading uses `--font-display` and `--color-app-text`
And the gate description uses `--font-body` and `--color-app-text-secondary`
And "View Plans" button uses `--color-app-accent` bg
And "Maybe Later" uses `--font-body` and `--color-app-text-secondary`
And semantic colors (`--color-warning`, `--color-error`) remain unchanged

### Scenario: Step 5 — Generating uses warm palette
Given the user triggered report generation
When the generating step renders
Then the heading uses `--font-display` and `--color-app-text`
And the subtitle uses `--font-body` and `--color-app-text-secondary`
And the accent line uses `--color-app-accent`
And the progress bar track uses `--color-app-border`
And the progress bar fill uses `--color-app-accent` (or `--color-error` on failure)
And the shimmer gradient uses warm tones
And the time/status row uses `--font-body` and `--color-app-text-secondary`

### Scenario: Agent cards use warm palette
Given the generating step shows agent cards
When agent cards render
Then pending cards use `--color-app-surface` bg and `--color-app-border` left border
And running cards use `--color-app-accent-light` bg and `--color-app-accent` left border
And completed cards use `--color-app-surface` bg and `--color-success` left border
And failed cards use `--color-app-surface` bg and `--color-error` left border
And status dots map: pending `--color-app-border`, running `--color-app-accent`, completed `--color-success`, failed `--color-error`
And agent names use `--font-body` and `--color-app-text`
And "Pro" badges use `--color-app-accent-light` bg and `--color-app-accent-hover` text
And descriptions use `--font-body` and `--color-app-text-secondary` (running: italic) / `--color-app-text-tertiary` (completed)

### Scenario: Activity log uses warm palette
Given the generating step shows the activity log
When the log renders
Then the log container uses `--color-app-surface` bg and `--color-app-border` border
And the top fade gradient uses `from-[var(--color-app-surface)]`
And timestamps use `--color-app-text-tertiary`
And log messages use `--font-body` and `--color-app-text-secondary`

### Scenario: Completion and failure states use warm palette
Given the report generation completes or fails
When the "View Report" or "Retry" buttons render
Then "View Report" uses `--color-app-accent` bg with `--color-app-text` text
And "Retry" uses `--color-app-accent` bg
And all headings and subtitles follow the same warm token pattern
And semantic colors (`--color-success` for complete, `--color-error` for fail) remain unchanged

### Scenario: All navigation and functionality preserved
Given the creation flow renders with warm tokens
When the user navigates forward and back through steps
Then step transitions animate correctly with Framer Motion
When the user uses quick start on a saved market
Then they jump to step 3 with market + tier pre-filled
When the user completes the flow and generates a report
Then the report is created and polling begins
When the report completes
Then the "View Report" button navigates to `/reports/{id}`
When the user abandons and returns later
Then draft persistence restores their progress

---

## UI Mockup (Phase 4 — warm creation flow)

```
┌─────────────────────────────────────────────────────────┐
│  TopNav (--color-app-nav-bg) [Phase 1 ✅]                │
├────────┬────────────────────────────────────────────────┤
│Sidebar │  PageShell (--color-app-bg) [Phase 1 ✅]       │
│(warm)  │                                                │
│        │  ┌──────────────────────────────────────────┐  │
│        │  │  Creation Shell (--color-app-surface)     │  │
│        │  │                                          │  │
│        │  │  "Create Your Intelligence Report"       │  │
│        │  │   font-display / --color-app-text        │  │
│        │  │  ━━━━ (--color-app-accent)               │  │
│        │  │                                          │  │
│        │  │  Step Indicator                          │  │
│        │  │  ●──●──●──○──○                           │  │
│        │  │  app-accent  app-border                  │  │
│        │  │  font-body labels                        │  │
│        │  │                                          │  │
│        │  │  ┌────────────────────────────────────┐  │  │
│        │  │  │  Step Content Area                 │  │  │
│        │  │  │                                    │  │  │
│        │  │  │  Step heading: font-display        │  │  │
│        │  │  │  Subtitle: font-body, app-text-sec │  │  │
│        │  │  │  ━━━━ (--color-app-accent)         │  │  │
│        │  │  │                                    │  │  │
│        │  │  │  ┌──────────┐  ┌──────────┐       │  │  │
│        │  │  │  │ Card     │  │ Card     │       │  │  │
│        │  │  │  │ app-srf  │  │ selected │       │  │  │
│        │  │  │  │ app-bdr  │  │ accent-lt│       │  │  │
│        │  │  │  │ font-bod │  │ accent   │       │  │  │
│        │  │  │  └──────────┘  └──────────┘       │  │  │
│        │  │  │                                    │  │  │
│        │  │  │  Inputs: app-bg, app-border        │  │  │
│        │  │  │  Focus: app-accent ring            │  │  │
│        │  │  └────────────────────────────────────┘  │  │
│        │  │                                          │  │
│        │  │  ─── (--color-app-border) nav border ──  │  │
│        │  │  [Back]                        [Next]    │  │
│        │  │  app-text-sec          app-accent bg     │  │
│        │  │  font-body             font-body         │  │
│        │  └──────────────────────────────────────────┘  │
│        │                                                │
├────────┴────────────────────────────────────────────────┤
│  Footer (--color-app-nav-bg) [Phase 1 ✅]                │
└─────────────────────────────────────────────────────────┘
```

### Generating Step Layout (warm)

```
┌──────────────────────────────────────────────┐
│  "Your Advisory Team Is On It"               │
│   font-display / --color-app-text            │
│  "Six specialists are building..."           │
│   font-body / --color-app-text-secondary     │
│  ━━━━ (--color-app-accent)                   │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │  Progress Bar                        │    │
│  │  Track: --color-app-border           │    │
│  │  Fill:  --color-app-accent           │    │
│  └──────────────────────────────────────┘    │
│  0:42 elapsed · ~2 min remaining             │
│  font-body / app-text-secondary              │
│                                              │
│  ┌ Activity Log (app-surface, app-border) ┐  │
│  │ 0:12  Pulling transaction records...   │  │
│  │ 0:15  Computing median price/sqft...   │  │
│  │ fade gradient: from-app-surface        │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌ Agent Card (running) ─────────────────┐   │
│  │▌ app-accent border                    │   │
│  │  app-accent-light bg                  │   │
│  │  ● Chief Architect    font-body       │   │
│  │  "Pulling live transaction..."        │   │
│  └───────────────────────────────────────┘   │
│  ┌ Agent Card (pending) ─────────────────┐   │
│  │▌ app-border border                    │   │
│  │  app-surface bg · opacity-70          │   │
│  │  ○ Intelligence Analyst               │   │
│  └───────────────────────────────────────┘   │
│  ...                                         │
└──────────────────────────────────────────────┘
```

---

## User Journey

1. **Dashboard** (Phase 2 ✅) — user clicks "Generate Report" CTA
2. **Report Creation Flow** (this spec) — 5-step warm wizard
3. **Reports List** (Phase 3 🔄) — user sees completed report in list

---

## Component References

- CreationFlowShell: `components/reports/creation-flow-shell.tsx`
- CreationStepIndicator: `components/reports/creation-step-indicator.tsx`
- StepYourMarket: `components/reports/steps/step-your-market.tsx`
- StepYourTier: `components/reports/steps/step-your-tier.tsx`
- StepYourAudience: `components/reports/steps/step-your-audience.tsx`
- StepYourReview: `components/reports/steps/step-your-review.tsx`
- StepGenerating: `components/reports/steps/step-generating.tsx`
- MarketAutocomplete: `components/reports/steps/market-autocomplete.tsx`
- MarketPreviewCard: `components/reports/steps/market-preview-card.tsx`
- PersonaCard: `components/reports/persona-card.tsx`
- PersonaPreviewPanel: `components/reports/persona-preview-panel.tsx`
