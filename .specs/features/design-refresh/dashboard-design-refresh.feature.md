---
feature: Dashboard Design Refresh (Phase 2)
domain: design-refresh
source: components/dashboard/dashboard-content.tsx, components/dashboard/dashboard-welcome-hero.tsx, components/dashboard/market-card.tsx, components/dashboard/recent-reports-list.tsx, components/dashboard/dashboard-empty-state.tsx
tests:
  - __tests__/dashboard/dashboard-design-refresh.test.tsx
components:
  - DashboardContent
  - DashboardWelcomeHero
  - MarketCard
  - RecentReportsList
  - DashboardEmptyState
design_refs:
  - .specs/design-system/tokens.md
personas:
  - rising-star-agent
  - established-practitioner
status: implemented
created: 2026-03-28
updated: 2026-03-28
---

# Dashboard Design Refresh (Phase 2)

**Parent Spec**: `.specs/features/design-refresh/backend-design-refresh.feature.md`
**Design System**: `.specs/design-system/tokens.md`
**Personas**: Rising Star Agent (Alex Rivera), Established Practitioner (Jordan Ellis)

## Overview

Phase 1 refreshed the shell (TopNav, Sidebar, PageShell, Footer) to the warm luxury palette. Now the dashboard content inside that shell still uses cold tokens (`--color-primary`, `--color-surface`, `--color-border`, `--font-serif`, `--font-sans`). This creates a warm frame around cold content.

Phase 2 migrates all 5 dashboard components to the `--color-app-*` warm tokens and swaps typography to `--font-display` (Cormorant Garamond) for headings and `--font-body` (DM Sans) for body text.

## Hard Constraints

1. **Do NOT touch PDFs** — zero changes to report PDF rendering, PDF templates, PDF components, or any `--color-report-*` tokens
2. **Additive only** — never rename, delete, or change values of existing `--color-*`, `--font-serif`, `--font-sans` tokens
3. **Preserve all functionality** — navigation, links, download buttons, status indicators, report filtering, empty states must all keep working
4. **Keep semantic colors** — `--color-success`, `--color-error`, `--color-warning` stay as-is (they're semantic, not aesthetic)

---

## Token Migration Map

| Old Token | New Token | Component(s) |
|-----------|-----------|--------------|
| `--color-primary` (text) | `--color-app-text` | welcome hero heading, section headings, empty state heading, buttons |
| `--color-surface` | `--color-app-surface` | card backgrounds, report rows, empty state bg |
| `--color-border` | `--color-app-border` | divider lines |
| `--color-text` | `--color-app-text` | report title text |
| `--color-text-secondary` | `--color-app-text-secondary` | subtitle text, metadata |
| `--color-text-tertiary` | `--color-app-text-tertiary` | muted labels, dates |
| `--color-accent` | `--color-app-accent` | CTA buttons, links, badges, status |
| `--color-accent-hover` | `--color-app-accent-hover` | button hover states |
| `--color-accent-light` | `--color-app-accent-light` | tier badge background |
| `--font-serif` | `--font-display` | all headings (welcome, section titles, card titles) |
| `--font-sans` | `--font-body` | body text, labels, buttons, metadata |

### Market Card Hardcoded Colors

| Old Hardcoded | New Value | Purpose |
|---------------|-----------|---------|
| `#1E293B` (gradient end) | `#2C2825` | Card fallback gradient (warm charcoal) |
| `rgba(15,23,42,…)` overlays | `rgba(26,23,20,…)` | Text overlay + hover overlay (warm dark) |
| `rgba(248,250,252,0.55)` | `rgba(253,252,250,0.55)` | Price/date text on card (warm white base) |
| `rgba(248,250,252,0.45)` | `rgba(253,252,250,0.45)` | Faded meta text on card |

---

## Feature: Dashboard Warm Refresh

### Scenario: Welcome hero uses warm palette
Given the user is logged in and viewing the dashboard
When the welcome hero renders
Then the heading uses `--font-display` (Cormorant Garamond)
And the heading text color uses `--color-app-text`
And the subtitle uses `--font-body` and `--color-app-text-secondary`
And the card background uses `--color-app-surface`
And the CTA button uses `--color-app-accent` background with `--color-app-surface` text
And the CTA hover uses `--color-app-accent-hover`

### Scenario: Section headings use warm display font
Given the dashboard has markets and reports
When section headings render ("Your Markets", "Recent Intelligence Briefs")
Then headings use `--font-display` font family
And heading text color is `--color-app-text`

### Scenario: Market cards use warm overlay colors
Given the user has defined markets
When market cards render
Then the fallback gradient uses warm charcoal (`#2C2825`) instead of cold slate (`#1E293B`)
And the text overlay gradient uses warm dark rgba instead of cold navy rgba
And the hover overlay uses warm dark rgba
And the card title uses `--font-display`
And the tier badge background uses `--color-app-accent-light`
And the tier badge text uses `--color-app-accent`

### Scenario: Report list rows use warm tokens
Given the user has generated reports
When recent report rows render
Then row backgrounds use `--color-app-surface`
And report title text uses `--color-app-text`
And report title hover uses `--color-app-accent`
And metadata text uses `--color-app-text-secondary`
And status labels use `--font-body`
And semantic status colors are preserved (success, error unchanged)

### Scenario: Dashboard dividers use warm border
Given the dashboard renders section dividers
When the border between markets and reports renders
Then it uses `--color-app-border` instead of `--color-border`

### Scenario: Empty state uses warm palette
Given the user has no markets defined
When the empty state renders
Then the heading uses `--font-display` and `--color-app-text`
And the body text uses `--font-body` and `--color-app-text-secondary`
And the dashed border uses `--color-app-accent`
And the CTA button uses `--color-app-accent` background
And the accent line uses `--color-app-accent`

### Scenario: All links and CTAs stay functional
Given the dashboard renders with warm tokens
When the user clicks "Define New Market"
Then they navigate to the market creation flow
When the user clicks "Generate Report" on a market card
Then they navigate to the report creation flow
When the user clicks a report title
Then they navigate to the report detail page
When the user clicks the download button
Then the PDF downloads successfully

---

## UI Mockup (Phase 2 — warm dashboard)

```
┌─────────────────────────────────────────────────────────┐
│  TopNav (--color-app-nav-bg) [Phase 1 ✅]                │
├────────┬────────────────────────────────────────────────┤
│Sidebar │  PageShell (--color-app-bg) [Phase 1 ✅]       │
│(warm)  │                                                │
│        │  ┌──────────────────────────────────────────┐  │
│        │  │  Welcome Hero (--color-app-surface)      │  │
│        │  │  ┌─────────────────────────────────────┐ │  │
│        │  │  │ "Good afternoon, Alex"               │ │  │
│        │  │  │  font-display / --color-app-text     │ │  │
│        │  │  │                                      │ │  │
│        │  │  │ "Your intelligence is ready..."      │ │  │
│        │  │  │  font-body / --color-app-text-sec    │ │  │
│        │  │  │                                      │ │  │
│        │  │  │ [Generate Report] ← app-accent bg    │ │  │
│        │  │  └─────────────────────────────────────┘ │  │
│        │  └──────────────────────────────────────────┘  │
│        │                                                │
│        │  "Your Markets"  ← font-display, app-text      │
│        │  ┌──────────────┐  ┌──────────────┐            │
│        │  │ Market Card  │  │ Market Card  │            │
│        │  │ warm overlay │  │ warm overlay │            │
│        │  │ font-display │  │ font-display │            │
│        │  │ accent badge │  │ accent badge │            │
│        │  └──────────────┘  └──────────────┘            │
│        │  + Define New Market  ← app-accent text         │
│        │                                                │
│        │  ─── (--color-app-border) ───                   │
│        │                                                │
│        │  "Recent Intelligence Briefs" ← font-display    │
│        │  ┌──────────────────────────────────────────┐  │
│        │  │ Report Row (--color-app-surface)         │  │
│        │  │  Title (app-text) · Status (semantic)    │  │
│        │  │  Date (app-text-secondary)    [Download] │  │
│        │  └──────────────────────────────────────────┘  │
│        │  ┌──────────────────────────────────────────┐  │
│        │  │ Report Row ...                           │  │
│        │  └──────────────────────────────────────────┘  │
│        │                                                │
├────────┴────────────────────────────────────────────────┤
│  Footer (--color-app-nav-bg) [Phase 1 ✅]                │
└─────────────────────────────────────────────────────────┘
```

## Component References

- DashboardWelcomeHero: `components/dashboard/dashboard-welcome-hero.tsx`
- DashboardContent: `components/dashboard/dashboard-content.tsx`
- MarketCard: `components/dashboard/market-card.tsx`
- RecentReportsList: `components/dashboard/recent-reports-list.tsx`
- DashboardEmptyState: `components/dashboard/dashboard-empty-state.tsx`
- AnimatedContainer: `components/ui/animated-container.tsx` (no changes needed)
- DownloadPdfButton: `components/reports/download-pdf-button.tsx` (no changes — lives in reports domain)
