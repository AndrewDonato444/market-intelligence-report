---
feature: Base App Layout
domain: foundation
source: components/layout/top-nav.tsx, components/layout/sidebar.tsx, components/layout/page-shell.tsx, app/(protected)/layout.tsx
tests:
  - __tests__/layout/layout.test.tsx
components:
  - TopNav
  - Sidebar
  - PageShell
personas:
  - rising-star-agent
  - legacy-agent
status: implemented
created: 2026-03-09
updated: 2026-03-09
---

# Base App Layout

**Source Files**: `components/layout/`
**Design System**: `.specs/design-system/tokens.md`

## Feature: Base App Layout

The consistent app shell that wraps all protected pages. Provides navigation, sidebar, and content area using design tokens. Professional, dense, Bloomberg-meets-Architectural-Digest aesthetic.

### Scenario: Top nav displays branding and user controls
Given a user is on any protected page
When the page renders
Then the top nav shows the Modern Signal Advisory wordmark
And the UserButton component is visible for account management

### Scenario: Sidebar shows navigation links
Given a user is on any protected page
When the sidebar renders
Then it shows links for: Dashboard, Reports, Markets, Settings

### Scenario: Page shell provides content area
Given a user is on any protected page
When the content renders
Then it appears in a properly padded content area to the right of the sidebar

### Scenario: Active nav item is highlighted
Given a user is on a specific page
When the sidebar renders
Then the current page's nav item uses accent styling

## UI Mockup

```
┌─── TopNav (bg: primary, h: 56px) ────────────────────────────┐
│  MSA (serif, bold, text-inverse)  │  [UserButton]             │
└───────────────────────────────────┴───────────────────────────┘
┌─ Sidebar ─┐┌─ PageShell (bg: background) ───────────────────┐
│ (bg: surf) ││                                                 │
│ w: 240px   ││  {children}                                     │
│            ││                                                 │
│ Dashboard  ││                                                 │
│ Reports    ││                                                 │
│ Markets    ││                                                 │
│ Settings   ││                                                 │
│            ││                                                 │
└────────────┘└─────────────────────────────────────────────────┘
```
