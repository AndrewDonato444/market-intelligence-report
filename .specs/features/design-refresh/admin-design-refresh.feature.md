---
feature: Design Refresh — Admin Pages
domain: design-refresh
source: components/layout/admin-sidebar.tsx, components/admin/analytics-nav.tsx, components/admin/user-list-dashboard.tsx, components/admin/user-detail-panel.tsx, components/admin/create-user-form.tsx, components/admin/report-list-dashboard.tsx, components/admin/report-detail-panel.tsx, components/admin/error-triage-dashboard.tsx, components/admin/data-sources-dashboard.tsx, components/admin/system-monitoring-dashboard.tsx, components/admin/volume-metrics-dashboard.tsx, components/admin/geographic-analytics-dashboard.tsx, components/admin/user-analytics-dashboard.tsx, components/admin/pipeline-performance-dashboard.tsx, components/admin/kit-analytics-dashboard.tsx, components/admin/tier-management-dashboard.tsx, components/admin/entitlement-overrides-panel.tsx, components/admin/test-suite-dashboard.tsx, components/admin/pipeline-visualizer.tsx, components/admin/waitlist-dashboard.tsx, components/admin/export-button.tsx, app/admin/eval/page.tsx, app/admin/eval/report/page.tsx, app/admin/analytics/layout.tsx
tests:
  - __tests__/admin/admin-design-refresh.test.tsx
components:
  - AdminSidebar
  - AnalyticsNav
  - UserListDashboard
  - UserDetailPanel
  - CreateUserForm
  - ReportListDashboard
  - ReportDetailPanel
  - ErrorTriageDashboard
  - DataSourcesDashboard
  - SystemMonitoringDashboard
  - VolumeMetricsDashboard
  - GeographicAnalyticsDashboard
  - UserAnalyticsDashboard
  - PipelinePerformanceDashboard
  - KitAnalyticsDashboard
  - TierManagementDashboard
  - EntitlementOverridesPanel
  - TestSuiteDashboard
  - PipelineVisualizer
  - WaitlistDashboard
  - ExportButton
design_refs:
  - .specs/design-system/tokens.md
personas:
  - rising-star-agent
  - established-practitioner
status: implemented
created: 2026-03-28
updated: 2026-03-28
---

# Design Refresh — Admin Pages

**Parent Spec**: `.specs/features/design-refresh/backend-design-refresh.feature.md`
**Design System**: `.specs/design-system/tokens.md`
**Personas**: Rising Star Agent (Alex Rivera), Established Practitioner (Jordan Ellis)

## Overview

The admin pages are the last authenticated surface still using cold-palette tokens (`--color-primary`, `--color-surface`, `--color-border`, `--font-sans`, `--color-primary-light`, `--color-accent`). The shell around them (TopNav, Sidebar, PageShell, Footer) is already warm (Phase 1 ✅), creating a warm frame around cold content.

While admin pages are internal-only (P3 priority), agents who are also admins (like Jordan's team lead role or Alex reviewing their own account tier) experience the jarring cold-to-warm transition every time they navigate to admin. The "walk into a cold office" feeling undermines the premium consistency established across all other pages.

This spec migrates **all admin components** to the warm `--color-app-*` tokens and swaps typography to `--font-display` (Cormorant Garamond) for headings and `--font-body` (DM Sans) for body/UI text.

**Scope**: 21 admin components + 3 admin page/layout files. The admin layout itself (`app/admin/layout.tsx`) already uses the warm shell components (TopNav, PageShell, Footer) — no changes needed there. The focus is on AdminSidebar, AnalyticsNav, and all dashboard/panel components.

## Hard Constraints

1. **Do NOT touch PDFs** — zero changes to report PDF rendering, PDF templates, PDF components, or any `--color-report-*` tokens
2. **Additive only** — never rename, delete, or change values of existing `--color-*`, `--font-serif`, `--font-sans` tokens
3. **Preserve all functionality** — admin auth gating, user CRUD, report inspection, analytics queries, error triage filtering, pipeline controls, tier management, eval suite, test suite, waitlist management must all keep working
4. **Keep semantic colors** — `--color-success`, `--color-error`, `--color-warning` stay as-is (semantic, not aesthetic)
5. **Keep monospace** — `--font-mono` (JetBrains Mono) stays unchanged for any code/JSON/technical output in admin panels

---

## Token Migration Map

### AdminSidebar

| Old Token | New Token | Element |
|-----------|-----------|---------|
| `--color-surface` (bg) | `--color-app-sidebar-bg` | Sidebar background |
| `--color-border` (border-right) | `--color-app-border` | Right border divider |
| `--font-sans` (nav labels) | `--font-body` | All nav item text |
| `--color-primary-light` (active bg) | `--color-app-active-bg` | Active nav item background |
| `--color-primary` (active text) | `--color-app-text` | Active nav item text |
| `--color-accent` (active icon) | `--color-app-accent` | Active nav item icon |
| `--color-text-secondary` (inactive text) | `--color-app-text-secondary` | Inactive nav item text |
| `--color-primary-light` (hover bg) | `--color-app-active-bg` | Nav item hover background |
| `--color-text` (hover text) | `--color-app-text` | Nav item hover text |
| `--color-border` (footer border) | `--color-app-border` | Footer divider border |
| `--color-text-tertiary` (footer text) | `--color-app-text-tertiary` | "Modern Signal Advisory" footer |

### AnalyticsNav (Tab Bar)

| Old Token | New Token | Element |
|-----------|-----------|---------|
| `--color-border` (bottom border) | `--color-app-border` | Tab bar bottom border |
| `--color-surface` (active bg) | `--color-app-surface` | Active tab background |
| `--color-primary` (active text, underline) | `--color-app-accent` | Active tab text + bottom border |
| `--color-text-secondary` (inactive text) | `--color-app-text-secondary` | Inactive tab text |
| `--color-text` (hover text) | `--color-app-text` | Tab hover text |
| `--color-surface` (hover bg) | `--color-app-surface` | Tab hover background |

### All Dashboard Components (Shared Pattern)

The following migration applies uniformly to all 18 dashboard/panel components:

| Old Token | New Token | Element |
|-----------|-----------|---------|
| `--font-sans` (body text) | `--font-body` | All body text, labels, table cells, inputs |
| `--color-text` (headings) | `--color-app-text` | Page h1, card headings |
| `--color-text-secondary` (subtitles, labels) | `--color-app-text-secondary` | Subtitles, metadata, table headers |
| `--color-text-tertiary` (hints) | `--color-app-text-tertiary` | Placeholder text, disabled labels |
| `--color-surface` (card bg) | `--color-app-surface` | Card/panel backgrounds |
| `--color-border` (borders) | `--color-app-border` | Card borders, table dividers, input borders |
| `--color-primary` (CTA buttons bg) | `--color-app-accent` | Primary action buttons |
| `--color-accent` (accent elements) | `--color-app-accent` | Highlighted metrics, active states |
| `#fff` / `white` (button text on primary) | `#fff` | Keep white text on gold buttons (sufficient contrast) |
| `--color-background` (readonly/alt bg) | `--color-app-bg` | Alternating row bg, readonly field bg |

### Headings (Dashboard Titles)

All admin dashboard h1 titles switch from `--font-sans` to `--font-display` (Cormorant Garamond). These are page-level headings like "Users", "Reports", "Analytics", "System Monitor" etc.

| Old Token | New Token | Element |
|-----------|-----------|---------|
| `--font-sans` / no font set | `--font-display` | Dashboard page h1 headings |
| `--font-sans` / inline style | `--font-body` | Card section headings (h2/h3) |

---

## Feature: Admin Pages Warm Palette Migration

### Scenario: AdminSidebar uses warm palette and DM Sans typography
```gherkin
Given the admin user is viewing any admin page
When the page renders
Then the AdminSidebar background is var(--color-app-sidebar-bg) (#F5F2ED warm ivory)
And the right border color is var(--color-app-border) (#E5DDD2 warm sand)
And all nav item labels use DM Sans (--font-body) at text-sm
And the active nav item has background var(--color-app-active-bg) (rgba(184,151,90,0.08) subtle gold tint)
And the active nav item text is var(--color-app-text) (#2C2825 warm charcoal)
And the active nav item icon is var(--color-app-accent) (#B8975A antique gold)
And inactive nav items have text var(--color-app-text-secondary) (#7A7168 warm gray)
And nav items have a hover transition (background and text color, 200ms)
And the footer text "Modern Signal Advisory" uses DM Sans text-xs in var(--color-app-text-tertiary)
And the footer border is var(--color-app-border)
```

### Scenario: AnalyticsNav tabs use warm palette
```gherkin
Given the admin user is on an analytics sub-page
When the analytics tab bar renders
Then the tab bar bottom border is var(--color-app-border) (#E5DDD2)
And the active tab text color is var(--color-app-accent) (#B8975A antique gold)
And the active tab bottom border is var(--color-app-accent) (#B8975A)
And the active tab background is var(--color-app-surface) (#FDFCFA warm white)
And inactive tab text is var(--color-app-text-secondary) (#7A7168)
And tab hover text is var(--color-app-text) (#2C2825)
And tab hover background is var(--color-app-surface)
And all tab labels use DM Sans (--font-body)
```

### Scenario: Dashboard headings use Cormorant Garamond
```gherkin
Given the admin user is on any admin dashboard page
When the page renders
Then the page-level heading (h1) uses Cormorant Garamond (--font-display)
And the heading text color is var(--color-app-text) (#2C2825)
And the heading font size is var(--text-2xl) (24px)
And card section headings (h2/h3) use DM Sans (--font-body) at font-semibold
```

### Scenario: Dashboard cards and panels use warm surface tokens
```gherkin
Given the admin user is on any admin dashboard page
When a card or panel renders
Then the card background is var(--color-app-surface) (#FDFCFA warm white)
And card borders use var(--color-app-border) (#E5DDD2 warm sand)
And card body text uses DM Sans (--font-body)
And card label text color is var(--color-app-text-secondary) (#7A7168)
And card value/metric text color is var(--color-app-text) (#2C2825)
And card border-radius remains var(--radius-md) (6px)
```

### Scenario: Admin tables use warm borders and typography
```gherkin
Given the admin user is viewing a data table (users, reports, errors, waitlist)
When the table renders
Then table header text uses DM Sans (--font-body) at text-sm font-medium
And table header text color is var(--color-app-text-secondary) (#7A7168)
And table cell text uses DM Sans (--font-body) at text-sm
And table cell text color is var(--color-app-text) (#2C2825)
And table row dividers use var(--color-app-border) (#E5DDD2)
And alternating row backgrounds use var(--color-app-bg) (#F5F2ED) on even rows (where applicable)
And table hover rows use var(--color-app-active-bg) (rgba(184,151,90,0.08))
```

### Scenario: Admin action buttons use warm gold accent
```gherkin
Given the admin user sees a primary action button (e.g., "+ Add User", "Save", "Run Pipeline")
When the button renders
Then the button background is var(--color-app-accent) (#B8975A antique gold)
And the button hover background is var(--color-app-accent-hover) (#A07D42)
And the button text is white (#fff)
And the button uses DM Sans (--font-body) at text-sm font-medium
And the button border-radius is var(--radius-md) (6px)
And secondary/outline buttons use border var(--color-app-border) with text var(--color-app-text)
```

### Scenario: Admin form inputs use warm tokens
```gherkin
Given the admin user interacts with a form input (search, create user, filters)
When the input renders
Then the input background is var(--color-app-surface) (#FDFCFA)
And the input border is var(--color-app-border) (#E5DDD2)
And the input text color is var(--color-app-text) (#2C2825)
And the input placeholder color is var(--color-app-text-tertiary) (#B5AA9B)
And the input focus ring/border is var(--color-app-accent) (#B8975A)
And the input uses DM Sans (--font-body) at text-sm
```

### Scenario: Status badges retain semantic colors
```gherkin
Given the admin user views a status badge (active/suspended/deleted user, report status, pipeline status)
When the badge renders
Then "active" / "success" badges use var(--color-success) (#15803D) — unchanged
And "warning" / "suspended" badges use var(--color-warning) (#B45309) — unchanged
And "error" / "deleted" / "failed" badges use var(--color-error) (#B91C1C) — unchanged
And badge text uses DM Sans (--font-body) at text-xs font-medium
```

### Scenario: Admin page entrance animation
```gherkin
Given the admin user navigates to any admin page
When the page content renders
Then the dashboard content fades in with .app-fade-in animation
And the animation is opacity 0→1, translateY(12px)→0, 0.6s ease-out-expo
And the animation plays once on mount
```

### Scenario: ExportButton uses warm accent
```gherkin
Given the admin user sees an export button on any dashboard
When the button renders
Then the export button follows the secondary button style (outline with warm border)
And the icon and text use var(--color-app-text-secondary) (#7A7168)
And hover state uses var(--color-app-text) (#2C2825) with var(--color-app-active-bg) background
```

### Scenario: Existing functionality preserved
```gherkin
Given the admin user is signed in with admin privileges
When the admin pages render with the warm palette
Then admin auth gating still redirects non-admins to /dashboard
And user search, filtering, sorting, and pagination still work
And user create/edit/suspend/delete operations still work
And report detail inspection (layers, sections, metadata) still works
And analytics charts and data loading still work correctly
And error triage filtering and acknowledgement still works
And data source status checks still function
And pipeline visualizer and run controls still function
And tier management CRUD operations still work
And entitlement override panel still works
And eval suite and test suite dashboards still render
And waitlist management still works
And export buttons still trigger CSV/JSON downloads
And the "Back to App" sidebar link still navigates to /dashboard
```

---

## UI Mockup

### AdminSidebar (Before → After)

```
BEFORE:                              AFTER:
┌──────────────────┐                 ┌──────────────────┐
│  ← Back to App   │  white bg       │  ← Back to App   │  warm ivory bg
│                   │  #FFFFFF        │                   │  #F5F2ED
│  Waitlist         │  cold border    │  Waitlist         │  warm sand border
│  ■ User Mgmt     │  #E2E8F0        │  ■ User Mgmt     │  #E5DDD2
│  Report Registry  │  blue-tinted    │  Report Registry  │  gold-tinted
│  Error Triage     │  active bg      │  Error Triage     │  active bg
│  Eval Suite       │  #F1F5F9        │  Eval Suite       │  rgba(184,151,90,0.08)
│  Data Sources     │  navy active    │  Data Sources     │  gold accent icon
│  Pipeline         │  text #0F172A   │  Pipeline         │  text #2C2825
│  Test Suite       │  Inter font     │  Test Suite       │  DM Sans font
│  Analytics        │                 │  Analytics        │
│  System Monitor   │                 │  System Monitor   │
│  Sub. Tiers       │                 │  Sub. Tiers       │
│                   │                 │                   │
│  Modern Signal    │  cold tertiary  │  Modern Signal    │  warm tertiary
│  Advisory         │  #94A3B8        │  Advisory         │  #B5AA9B
└──────────────────┘                 └──────────────────┘
```

### Analytics Tab Bar (Before → After)

```
BEFORE:
┌────────────────────────────────────────────────────────────┐
│  Volume  │  Geographic  │  Users  │  Performance  │  Kits  │
│  ═══════                                                   │  navy underline #0F172A
│  cold border ──────────────────────────────────────── #E2E8F0
└────────────────────────────────────────────────────────────┘

AFTER:
┌────────────────────────────────────────────────────────────┐
│  Volume  │  Geographic  │  Users  │  Performance  │  Kits  │
│  ═══════                                                   │  gold underline #B8975A
│  warm border ──────────────────────────────────────── #E5DDD2
└────────────────────────────────────────────────────────────┘
```

### Admin Dashboard Page (Before → After)

```
BEFORE:
┌──────────────────────────────────────────────────────────────┐
│  Users                               (Inter, --color-text)   │
│  Manage platform accounts            (Inter, --color-text-2) │
│                                                               │
│  [+ Add User] ──── navy bg #0F172A   [Search...] ── #E2E8F0  │
│                                                               │
│  ┌─ All ─┬─ Active ─┬─ Suspended ─┬─ Deleted ─┐              │
│  │  cold blue-tinted tabs           │           │              │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ Name        Email       Tier    Status   Last Login    │   │
│  │ ─────────── cold dividers #E2E8F0 ──────────────────  │   │
│  │ Jane Doe    jane@...    Pro     ● Active   Mar 27     │   │
│  │ John Smith  john@...    Starter ● Active   Mar 26     │   │
│  └────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘

AFTER:
┌──────────────────────────────────────────────────────────────┐
│  Users                    (Cormorant Garamond, --color-app-text)│
│  Manage platform accounts (DM Sans, --color-app-text-secondary)│
│                                                               │
│  [+ Add User] ── gold bg #B8975A   [Search...] ── #E5DDD2    │
│                                                               │
│  ┌─ All ─┬─ Active ─┬─ Suspended ─┬─ Deleted ─┐              │
│  │  warm gold-tinted tabs           │           │              │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ Name        Email       Tier    Status   Last Login    │   │
│  │ ─────────── warm dividers #E5DDD2 ──────────────────  │   │
│  │ Jane Doe    jane@...    Pro     ● Active   Mar 27     │   │
│  │ John Smith  john@...    Starter ● Active   Mar 26     │   │
│  └────────────────────────────────────────────────────────┘   │
│                          DM Sans throughout, warm charcoal     │
└──────────────────────────────────────────────────────────────┘
```

### Full Admin Shell Assembled

```
┌────────────────────────────────────────────────────────────────────────┐
│  Modern Signal Advisory  │  INTELLIGENCE PLATFORM           Sign Out  │
│  ─── warm dark #1A1714 ──── "Signal" in gold ────── DM Sans ──────── │
├──────────────────┬─────────────────────────────────────────────────────┤
│                  │                                                     │
│  ← Back to App  │    p-8 (32px)                                      │
│                  │    bg: warm ivory #F5F2ED                           │
│  Waitlist        │                                                     │
│  ■ User Mgmt    │    ┌─────────────────────────────────────────┐      │
│  Report Registry │    │  Users           (Cormorant Garamond)  │      │
│  Error Triage    │    │  Manage accounts (DM Sans, warm gray)  │      │
│  Eval Suite      │    │                                        │      │
│  Data Sources    │    │  [+ Add User] gold  [Search...] warm   │      │
│  Pipeline        │    │                                        │      │
│  Test Suite      │    │  ┌─ table ── warm borders ──────────┐  │      │
│  Analytics       │    │  │  warm charcoal text, DM Sans     │  │      │
│  System Monitor  │    │  │  gold-tinted hover rows          │  │      │
│  Sub. Tiers      │    │  └──────────────────────────────────┘  │      │
│                  │    └─────────────────────────────────────────┘      │
│  warm ivory bg   │                  .app-fade-in on mount             │
│  gold active     │                                                     │
│  DM Sans text    │                                                     │
│                  │                                                     │
│  Modern Signal   │                                                     │
│  Advisory        │                                                     │
├──────────────────┴─────────────────────────────────────────────────────┤
│  © 2026 Modern Signal Advisory ──── warm dark #1A1714 ─────────────── │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Component References

### Layout
- AdminSidebar: `components/layout/admin-sidebar.tsx`
- Admin Layout: `app/admin/layout.tsx` (already uses warm shell — no changes)
- Analytics Layout: `app/admin/analytics/layout.tsx`

### Dashboard Components
- AnalyticsNav: `components/admin/analytics-nav.tsx`
- UserListDashboard: `components/admin/user-list-dashboard.tsx`
- UserDetailPanel: `components/admin/user-detail-panel.tsx`
- CreateUserForm: `components/admin/create-user-form.tsx`
- ReportListDashboard: `components/admin/report-list-dashboard.tsx`
- ReportDetailPanel: `components/admin/report-detail-panel.tsx`
- ErrorTriageDashboard: `components/admin/error-triage-dashboard.tsx`
- DataSourcesDashboard: `components/admin/data-sources-dashboard.tsx`
- SystemMonitoringDashboard: `components/admin/system-monitoring-dashboard.tsx`
- VolumeMetricsDashboard: `components/admin/volume-metrics-dashboard.tsx`
- GeographicAnalyticsDashboard: `components/admin/geographic-analytics-dashboard.tsx`
- UserAnalyticsDashboard: `components/admin/user-analytics-dashboard.tsx`
- PipelinePerformanceDashboard: `components/admin/pipeline-performance-dashboard.tsx`
- KitAnalyticsDashboard: `components/admin/kit-analytics-dashboard.tsx`
- TierManagementDashboard: `components/admin/tier-management-dashboard.tsx`
- EntitlementOverridesPanel: `components/admin/entitlement-overrides-panel.tsx`
- TestSuiteDashboard: `components/admin/test-suite-dashboard.tsx`
- PipelineVisualizer: `components/admin/pipeline-visualizer.tsx`
- WaitlistDashboard: `components/admin/waitlist-dashboard.tsx`
- ExportButton: `components/admin/export-button.tsx`

### Page Files
- Eval page: `app/admin/eval/page.tsx`
- Eval report: `app/admin/eval/report/page.tsx`

---

## Implementation Notes

### Approach: Systematic Token Swap

The migration is mechanical — find-and-replace within each component:

1. **AdminSidebar** — highest visual impact, do first
2. **AnalyticsNav** — shared tab component, do second
3. **Dashboard components** — batch process all 18, applying the shared pattern table above
4. **Page files** — eval pages that may have inline styles

### Inline Styles vs Tailwind Classes

Many admin components use inline `style={{}}` objects with CSS variable references rather than Tailwind classes (e.g., `fontFamily: "var(--font-sans)"`, `color: "var(--color-text)"`). The migration should swap token references within the existing style approach — do NOT refactor from inline styles to Tailwind as part of this feature.

### Testing Strategy

Tests should verify:
- AdminSidebar renders with warm tokens (snapshot or specific class/style assertions)
- AnalyticsNav active tab uses `--color-app-accent` instead of `--color-primary`
- Dashboard components render with warm typography and colors
- All existing functionality tests still pass (user CRUD, report inspection, analytics, etc.)

---

## User Journey

1. Admin navigates to `/admin/users` from sidebar
2. **Warm sidebar, warm page heading, warm table — consistent with the rest of the app** ← THIS IS THE FIX
3. Admin clicks through analytics tabs — warm tab bar, warm active indicator
4. Admin creates a user — warm form, gold save button
5. Admin checks pipeline — warm cards, warm status indicators
6. Admin clicks "Back to App" — seamless transition back to dashboard (both warm)

---

## Learnings

### 2026-03-29
- **Three styling patterns**: Admin components use three different approaches — inline `style={{}}`, Tailwind `className` with `var()`, and hardcoded Tailwind colors (test-suite-dashboard only). Migration must handle all three.
- **Panel vs dashboard distinction**: EntitlementOverridesPanel has no h1 — only h3 section headings. Tests must distinguish between page dashboards (expect `--font-display`) and embedded panels (expect only `--font-body`).
- **Font removal without replacement**: When migrating `--font-sans` in inline styles, verify `--font-body` was added. Report-detail-panel had font-family removed entirely — fixed by adding `fontFamily: "var(--font-body)"` to the wrapper div.
- **Cross-test grep required**: Admin sidebar tokens are tested by 3 separate test files. After migration, grep ALL `__tests__/` for old token names to catch breakage.
- **Mixed test strategy**: Source file inspection (`fs.readFileSync`) for 18 complex dashboards with API dependencies; render tests only for 3 simple components (AdminSidebar, AnalyticsNav, ExportButton). 286 tests total.
