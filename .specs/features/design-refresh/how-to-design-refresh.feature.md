---
feature: Design Refresh — How-To Page
domain: design-refresh
source: components/how-to/how-to-content.tsx
tests:
  - __tests__/how-to/how-to-design-refresh.test.tsx
components:
  - HowToContent
  - QuickStartChecklist
  - StepCard
  - FaqAccordion
design_refs:
  - .specs/design-system/tokens.md
personas:
  - established-practitioner
  - rising-star-agent
status: implemented
created: 2026-03-28
updated: 2026-03-28
---

# Design Refresh — How-To Page

**Parent Spec**: `.specs/features/design-refresh/backend-design-refresh.feature.md`
**Original Spec**: `.specs/features/dashboard/how-to-guide.feature.md`
**Design System**: `.specs/design-system/tokens.md`
**Personas**: Established Practitioner (Jordan Ellis), Rising Star Agent (Alex Rivera)

## Overview

The How-To page (`components/how-to/how-to-content.tsx`) still uses cold-palette tokens (`--color-surface`, `--color-border`, `--color-text`, `--color-accent`, `--font-serif`, `--font-sans`). The shell around it (TopNav, Sidebar, PageShell) is already warm (Phase 1 completed). This creates a warm frame around cold content — the user walks from a warm lobby into a cold office.

This spec migrates all How-To page components (HowToContent, QuickStartChecklist, StepCard, FaqAccordion) to the warm `--color-app-*` tokens and swaps typography to `--font-display` (Cormorant Garamond) for headings and `--font-body` (DM Sans) for body text.

The How-To page is a single-file component (`how-to-content.tsx`) containing all four sub-components inline. The server page (`app/(protected)/how-to/page.tsx`) is data-fetching only and requires no token changes.

## Hard Constraints

1. **Do NOT touch PDFs** — zero changes to report PDF rendering, PDF templates, PDF components, or any `--color-report-*` tokens
2. **Additive only** — never rename, delete, or change values of existing `--color-*`, `--font-serif`, `--font-sans` tokens
3. **Preserve all functionality** — checklist progress tracking, step card CTAs, FAQ accordion expand/collapse, conditional CTA text based on user state must all keep working
4. **Keep semantic colors** — `--color-success`, `--color-error`, `--color-warning` stay as-is (they're semantic, not aesthetic)
5. **Preserve persona vocabulary** — all copy stays identical ("market intelligence brief", "analysis engine", "publication-quality", etc.)

---

## Token Migration Map

### Page Header (HowToContent)

| Old Token | New Token | Element |
|-----------|-----------|---------|
| `--font-serif` (h1 heading) | `--font-display` | "Getting Started" h1 |
| `--color-text` (h1 text) | `--color-app-text` | "Getting Started" h1 text color |
| `--font-sans` (subtitle) | `--font-body` | Subtitle paragraph |
| `--color-text-secondary` (subtitle) | `--color-app-text-secondary` | Subtitle text color |

### QuickStartChecklist

| Old Token | New Token | Element |
|-----------|-----------|---------|
| `--color-surface` (card bg) | `--color-app-surface` | Checklist card background |
| `--color-border` (card border) | `--color-app-border` | Checklist card border |
| `--font-sans` (heading) | `--font-body` | "YOUR PROGRESS" label |
| `--color-text-secondary` (heading) | `--color-app-text-secondary` | "YOUR PROGRESS" label color |
| `--font-sans` (items) | `--font-body` | Checklist item text |
| `--color-accent` (complete icon) | `--color-app-accent` | Gold checkmark icon |
| `--color-text-secondary` (incomplete icon) | `--color-app-text-secondary` | Muted circle icon |
| `--color-text` (complete label) | `--color-app-text` | Completed item text color |
| `--color-text-secondary` (incomplete label) | `--color-app-text-secondary` | Incomplete item text color |

### StepCard

| Old Token | New Token | Element |
|-----------|-----------|---------|
| `--color-surface` (card bg) | `--color-app-surface` | Step card background |
| `--color-border` (card border) | `--color-app-border` | Step card border |
| `--font-serif` (step number) | `--font-display` | Step number (1, 2, 3) |
| `--color-accent` (step number) | `--color-app-accent` | Step number gold color |
| `--font-serif` (step title) | `--font-display` | Step title (e.g., "Define Your Market") |
| `--color-text` (step title) | `--color-app-text` | Step title text color |
| `--font-sans` (step body) | `--font-body` | Step description paragraph |
| `--color-text-secondary` (step body) | `--color-app-text-secondary` | Step description text color |
| `--font-sans` (CTA button) | `--font-body` | CTA button text |
| `--color-accent` (CTA bg) | `--color-app-accent` | Active CTA button background |
| `text-white` (CTA text) | `--color-app-surface` | Active CTA button text (warm white instead of plain white) |
| `--color-border` (disabled bg) | `--color-app-border` | Disabled CTA background |
| `--color-text-secondary` (disabled text) | `--color-app-text-secondary` | Disabled CTA text color |
| `--font-sans` (disabled text) | `--font-body` | Disabled CTA text font |

### FaqAccordion

| Old Token | New Token | Element |
|-----------|-----------|---------|
| `--font-sans` (section heading) | `--font-body` | "Common Questions" heading |
| `--color-text` (section heading) | `--color-app-text` | "Common Questions" heading color |
| `--color-border` (dividers) | `--color-app-border` | Top border, item borders |
| `--font-sans` (question text) | `--font-body` | FAQ question button text |
| `--color-text` (question text) | `--color-app-text` | FAQ question text color |
| `--color-accent` (question hover) | `--color-app-accent` | FAQ question hover color |
| `--color-text-secondary` (chevron) | `--color-app-text-secondary` | Expand/collapse chevron |
| `--font-sans` (answer text) | `--font-body` | FAQ answer paragraph |
| `--color-text-secondary` (answer text) | `--color-app-text-secondary` | FAQ answer text color |

---

## Feature: How-To Page Warm Refresh

### Scenario: Page heading uses warm display font
Given the user navigates to the How To page
When the page renders
Then the "Getting Started" heading uses `--font-display` (Cormorant Garamond)
And the heading text color uses `--color-app-text`
And the subtitle uses `--font-body` (DM Sans) and `--color-app-text-secondary`

### Scenario: Quick-start checklist uses warm palette
Given the How To page renders
When the checklist card is visible
Then the card background uses `--color-app-surface`
And the card border uses `--color-app-border`
And the "YOUR PROGRESS" label uses `--font-body` and `--color-app-text-secondary`
And checklist item text uses `--font-body`
And completed items show a gold checkmark using `--color-app-accent`
And completed item labels use `--color-app-text`
And incomplete items show a muted circle using `--color-app-text-secondary`
And incomplete item labels use `--color-app-text-secondary`

### Scenario: Step cards use warm palette
Given the How To page renders
When the three step cards are visible
Then each card background uses `--color-app-surface`
And each card border uses `--color-app-border`
And the step number uses `--font-display` and `--color-app-accent`
And the step title uses `--font-display` and `--color-app-text`
And the step description uses `--font-body` and `--color-app-text-secondary`

### Scenario: Active step CTA buttons use warm accent
Given a step card has an active CTA
When the CTA button renders
Then the button background uses `--color-app-accent`
And the button text uses `--color-app-surface` (warm white, not plain white)
And the button label uses `--font-body`

### Scenario: Disabled step CTA uses warm muted state
Given Step 3 is disabled (no reports yet)
When the disabled CTA renders
Then the disabled background uses `--color-app-border`
And the disabled text uses `--color-app-text-secondary`
And the disabled text uses `--font-body`

### Scenario: FAQ section uses warm palette
Given the user scrolls to the FAQ section
When the "Common Questions" section renders
Then the section heading uses `--font-body` and `--color-app-text`
And divider borders use `--color-app-border`
And question text uses `--font-body` and `--color-app-text`
And question hover state uses `--color-app-accent`
And the expand/collapse chevron uses `--color-app-text-secondary`
And answer text uses `--font-body` and `--color-app-text-secondary`

### Scenario: All How-To functionality is preserved
Given the How To page renders with warm tokens
When the user has markets defined
Then the checklist shows "Define at least one market" as complete with gold checkmark
And Step 1 CTA reads "View Your Markets"
When the user has reports generated
Then the checklist shows "Generate your first report" as complete
And Step 2 CTA reads "Create Another Report"
And Step 3 CTA is enabled with "View Social Media Kit"
When the user clicks a FAQ question
Then the answer expands with accordion behavior (one at a time)
When the user clicks the same question again
Then the answer collapses

### Scenario: New user with no data sees correct state
Given a new user with no markets or reports
When they visit the How To page
Then all checklist items show as incomplete (muted circles)
And Step 1 CTA reads "Define Your First Market"
And Step 2 CTA reads "Generate Your First Report"
And Step 3 CTA is disabled with "Coming after your first report"

---

## User Journey

1. User signs in → dashboard (warm palette)
2. User clicks "How To" in sidebar → lands on How To page
3. **How-To page (this feature)** — orients the user to the platform workflow
4. User follows step CTAs → Markets, Reports, Social Media Kit

## UI Mockup (warm How-To page)

```
┌─────────────────────────────────────────────────────────┐
│  TopNav (--color-app-nav-bg) [Phase 1 ✅]                │
├────────┬────────────────────────────────────────────────┤
│Sidebar │  PageShell (--color-app-bg) [Phase 1 ✅]       │
│(warm)  │                                                │
│        │  "Getting Started"                              │
│        │   font-display / --color-app-text               │
│        │  "Your guide to creating market intelligence    │
│        │   that positions you as the authority your      │
│        │   clients expect."                              │
│        │   font-body / --color-app-text-secondary        │
│        │                                                │
│        │  ┌─────────────────────────────────────────┐   │
│        │  │  YOUR PROGRESS  (--color-app-surface)   │   │
│        │  │  font-body / --color-app-text-secondary  │   │
│        │  │  --color-app-border                      │   │
│        │  │                                         │   │
│        │  │  ◉ Define at least one market            │   │
│        │  │    app-accent (gold) / app-text           │   │
│        │  │  ○ Generate your first report             │   │
│        │  │    app-text-secondary / 40% opacity       │   │
│        │  │  ○ Review your social media kit            │   │
│        │  │    app-text-secondary / 40% opacity       │   │
│        │  └─────────────────────────────────────────┘   │
│        │                                                │
│        │  ┌─────────────────────────────────────────┐   │
│        │  │  (--color-app-surface / app-border)      │   │
│        │  │                                         │   │
│        │  │  ①  DEFINE YOUR MARKET                   │   │
│        │  │  font-display / app-accent    font-display│   │
│        │  │                               app-text   │   │
│        │  │  Every great market brief starts          │   │
│        │  │  with a clearly defined territory...      │   │
│        │  │  font-body / app-text-secondary           │   │
│        │  │                                         │   │
│        │  │  [ View Your Markets → ]                  │   │
│        │  │    app-accent bg / app-surface text       │   │
│        │  │    font-body                              │   │
│        │  └─────────────────────────────────────────┘   │
│        │                                                │
│        │  ┌─────────────────────────────────────────┐   │
│        │  │  ②  GENERATE YOUR REPORT                 │   │
│        │  │  font-display / app-accent    font-display│   │
│        │  │                               app-text   │   │
│        │  │  Our analysis engine examines recent      │   │
│        │  │  transactions, market trends...           │   │
│        │  │  font-body / app-text-secondary           │   │
│        │  │                                         │   │
│        │  │  [ Create Another Report → ]              │   │
│        │  │    app-accent bg / app-surface text       │   │
│        │  └─────────────────────────────────────────┘   │
│        │                                                │
│        │  ┌─────────────────────────────────────────┐   │
│        │  │  ③  SHARE YOUR INTELLIGENCE              │   │
│        │  │  font-display / app-accent    font-display│   │
│        │  │                               app-text   │   │
│        │  │  Each report includes a Social Media      │   │
│        │  │  Kit — ready-to-post commentary...        │   │
│        │  │  font-body / app-text-secondary           │   │
│        │  │                                         │   │
│        │  │  [ Coming after your first report ]       │   │
│        │  │    app-border bg / app-text-secondary     │   │
│        │  │    (disabled)                             │   │
│        │  └─────────────────────────────────────────┘   │
│        │                                                │
│        │  Common Questions                               │
│        │  font-body / --color-app-text                   │
│        │  ─── (--color-app-border) ───                   │
│        │  ▸ How long does a report take?                 │
│        │    font-body / app-text / hover: app-accent     │
│        │  ─── app-border ───                             │
│        │  ▸ What data sources power the analysis?        │
│        │  ─── app-border ───                             │
│        │  ▸ Can I customize report sections?             │
│        │  ─── app-border ───                             │
│        │  ▸ How do I add peer markets?                   │
│        │  ─── app-border ───                             │
│        │  ▸ What is the Social Media Kit?                │
│        │  ─── app-border ───                             │
│        │                                                │
├────────┴────────────────────────────────────────────────┤
│  Footer (--color-app-nav-bg) [Phase 1 ✅]                │
└─────────────────────────────────────────────────────────┘
```

## Component References

- HowToContent: `components/how-to/how-to-content.tsx` (main export + all sub-components)
- Page: `app/(protected)/how-to/page.tsx` (server data-fetching only, no token changes)

## Persona Revision Notes

**Revision pass through persona lens:**

1. **Jordan Ellis (Established Practitioner, 45)** — The warm palette reinforces the editorial, advisory atmosphere Jordan expects. Cormorant Garamond headings feel like a premium professional service guide, not a SaaS onboarding wizard. The antique gold accents (`#B8975A`) match the institutional warmth Jordan associates with trust. Copy unchanged — already uses Jordan's vocabulary ("advisory", "intelligence brief", "publication-quality").

2. **Alex Rivera (Rising Star, 32)** — Alex scans the page quickly. The warm gold CTAs pop against the ivory surface, making the action path instantly clear. DM Sans body text is clean and readable without the tech-product feel of Inter. The step-by-step structure with clear CTAs aligns with Alex's "show me the payoff" patience level.

**No copy changes needed** — the existing persona vocabulary is already well-calibrated from the original spec. This is a purely visual token migration.

## Learnings

### 2026-03-28
- **Pattern**: Single-file migration — all 4 sub-components live inline in `how-to-content.tsx`, making this a straightforward token swap with no cross-file coordination. Server page (`page.tsx`) untouched.
- **Decision**: CTA button text changed from `text-white` to `text-[var(--color-app-surface)]` for warm white consistency.
- **Gotcha**: Checklist text ("Generate your first report") duplicates Step 2 CTA text — tests must scope with `within()` to avoid `getByText` multiple match errors.
