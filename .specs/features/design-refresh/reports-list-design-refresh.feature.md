---
feature: Reports List Page Design Refresh
domain: design-refresh
source: app/(protected)/reports/page.tsx, components/reports/report-tile-grid.tsx
tests:
  - __tests__/reports/reports-list-design-refresh.test.tsx
components:
  - ReportsPage
  - ReportTileGrid
design_refs:
  - .specs/design-system/tokens.md
personas:
  - rising-star-agent
  - established-practitioner
status: implemented
created: 2026-03-28
updated: 2026-03-28
---

# Reports List Page Design Refresh (Phase 3)

**Design System**: `.specs/design-system/tokens.md`
**Personas**: Rising Star Agent (Alex Rivera), Established Practitioner (Jordan Ellis)

## Overview

Migrate the reports list page from cold SaaS palette to warm luxury palette.

## Feature: Reports List Page Warm Palette Migration

### Scenario: Page header uses warm palette
Given the user is viewing the reports list page
When the page renders
Then the "Reports" heading uses --font-display at text-2xl font-bold
And the heading text color is var(--color-app-text)
And the subtitle uses --font-body at text-sm
And the subtitle text color is var(--color-app-text-secondary)

### Scenario: Generate New Report button uses warm accent
Then the button background is var(--color-app-accent)
And the button hover is var(--color-app-accent-hover)
And the button text uses --font-body, color white

### Scenario: Empty state uses warm palette
Then the empty state card uses var(--color-app-surface)
And text uses --font-body in var(--color-app-text-secondary)

### Scenario: Market group headings use warm palette
Then headings use --font-display in var(--color-app-text)
And accent underline uses var(--color-app-accent)

### Scenario: Report tile overlays use warm dark
Then overlay uses rgba(26,23,20,...) not rgba(15,23,42,...)

### Scenario: Report tile text uses warm fonts
Then title/date/status use --font-body

### Scenario: Failed reports section uses warm palette
Then toggle uses --font-body in var(--color-app-text-secondary)
And rows use var(--color-app-surface), border uses var(--color-app-border)

## Token Migration Map

| Element | Old Token | New Token |
|---------|-----------|-----------|
| Heading font | --font-serif | --font-display |
| Body font | --font-sans | --font-body |
| Heading color | --color-primary | --color-app-text |
| Subtitle color | --color-text-secondary | --color-app-text-secondary |
| Button bg | --color-accent | --color-app-accent |
| Button hover | --color-accent-hover | --color-app-accent-hover |
| Card surface | --color-surface | --color-app-surface |
| Overlay gradient | rgba(15,23,42,...) | rgba(26,23,20,...) |
| Border | --color-border | --color-app-border |
| Button text | --color-primary | white |
