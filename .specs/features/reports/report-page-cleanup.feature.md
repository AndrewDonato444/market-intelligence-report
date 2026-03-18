---
feature: Report Page Cleanup
domain: reports
source: app/(protected)/reports/page.tsx
tests:
  - __tests__/reports/report-tile-grid.test.tsx
components:
  - ReportTileGrid
  - ReportTile
  - ReportEntitlementBadge
personas:
  - rising-star-agent
  - established-practitioner
  - team-leader
design_refs:
  - .specs/design-system/tokens.md
  - .specs/design-system/components/market-card.md
status: implemented
created: 2026-03-18
updated: 2026-03-18
---

# Report Page Cleanup

**Source Files**:
- `app/(protected)/reports/page.tsx`
- `components/reports/report-tile-grid.tsx`
- `components/reports/report-entitlement-badge.tsx`
- `components/layout/sidebar.tsx`
- `components/dashboard/recent-reports-list.tsx`
- `components/reports/download-pdf-button.tsx`
- `components/reports/generate-kit-button.tsx`
- `lib/services/report.ts`
- `lib/utils/market-image.ts`

**Design System**: `.specs/design-system/tokens.md`
**Personas**: Rising Star Agent, Established Practitioner, Team Leader

## Problem

The reports page used flat horizontal rows that felt like a data table, not an intelligence library. Failed reports cluttered the view. The "View Kit" label was unclear. The "Completed" badge was redundant when action buttons already implied success.

## Feature: Report Page — Tile Layout with Market Grouping

### Scenario: Reports grouped by market
Given the user has reports across multiple markets
When they visit the reports page
Then reports are grouped under market name headers
And market names are stripped of tier suffixes ("Luxury", "Ultra Luxury", "Report")
And each market header has a gold accent underline (border-b-2, color-accent)

### Scenario: Completed reports display as photo tiles
Given the user has completed reports
When they visit the reports page
Then each completed report appears as a 160px-tall photo tile
And the tile shows the market's city photo as background (shared `getMarketImageUrl` util)
And a dark gradient overlay ensures text legibility
And the tile shows the report title overlaid on the photo
And the tile shows a solid green "Ready" status pill in the top-right corner
And the tile shows a white "Download PDF" button (bg-white, shadow-sm)
And the tile shows a gold "Content Studio" link to `/reports/{id}/kit`
And the tile shows the creation date in muted white text
And tiles are arranged in a responsive grid (3 columns on desktop, 2 on tablet, 1 on mobile)

### Scenario: Generating reports display as tiles with progress indicator
Given the user has a report with status "generating"
When they visit the reports page
Then the report appears as a tile with a solid gold pulsing "Generating" pill (top-right)
And the Download PDF and Content Studio buttons are hidden
And the tile background uses the market photo (or gradient fallback)

### Scenario: Queued reports display as tiles
Given the user has a report with status "queued"
When they visit the reports page
Then the report appears as a tile with a solid gray "Queued" pill (top-right)
And the Download PDF and Content Studio buttons are hidden

### Scenario: Failed reports are hidden by default
Given the user has both completed and failed reports
When they visit the reports page
Then only completed, generating, and queued reports appear in the tile grid
And failed reports are not visible

### Scenario: Toggle reveals failed reports
Given the user has failed reports
When they click "Show failed reports (N)" at the bottom of the page
Then the failed reports appear below the main grid as a simple list (not tiles)
And the toggle text changes to "Hide failed reports"
And failed reports show the report title, cleaned market name, date, and a red "Failed" pill

### Scenario: Toggle hides failed reports again
Given failed reports are currently visible
When the user clicks "Hide failed reports"
Then the failed reports list collapses
And the toggle text returns to "Show failed reports (N)"

### Scenario: No failed reports — toggle hidden
Given the user has no failed reports
When they visit the reports page
Then the "Show failed reports" toggle does not appear

### Scenario: Empty state unchanged
Given the user has no reports at all
When they visit the reports page
Then the existing empty state card displays as before

### Scenario: Report entitlement badge on reports page
Given the user is on the reports page
Then a progress bar appears below the "Generate New Report" button
And for unlimited plans: a shimmering gold bar with "Unlimited" label
And for capped plans: a used/limit bar (e.g. "6/10") with reset date ("Credits reset Apr 1")
And the bar turns warning-orange at 80%+ usage
And negative remaining values are floored at 0

### Scenario: Report entitlement badge in sidebar
Given the user is on any authenticated page
Then the sidebar shows "Report Credits" with the same entitlement progress bar
And the progress bar appears above the footer in the sidebar

### Scenario: Sidebar beta card moved to top
Given the user is on any authenticated page
Then the beta announcement card appears above the nav items
And the card includes a "Report an issue" mailto link

### Scenario: Dashboard hides "Completed" label for completed reports
Given the dashboard shows recent intelligence briefs
When a report has status "completed"
Then the "Completed" text label is hidden (only Download PDF button shows)
And non-completed reports still show their status labels

## User Journey

1. User signs in and lands on **Dashboard** (sees market cards + recent briefs)
2. User clicks "View All Reports" or navigates to **Reports page** (this feature)
3. User sees their intelligence library as visual tiles, grouped by market
4. User downloads PDF or opens Content Studio from a tile
5. Optionally toggles failed reports to retry or review errors
6. User sees report credit usage in sidebar on every page

## UI Mockup

```
┌─────────────────────────────────────────────────────────────────┐
│  Reports                                    [Generate New Report]│
│  Your generated market intelligence reports.     ━━━━━━━ 6/10   │
│                                              Credits reset Apr 1 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Miami                                                           │
│  ════════ (gold underline)                                       │
│  ┌──────────────────┐ ┌──────────────────┐                      │
│  │  [Ready]  (top-R)│ │  [Ready]  (top-R)│                      │
│  │░░ (city photo) ░░│ │░░ (city photo) ░░│                      │
│  │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│                      │
│  │ Report Title     │ │ Report Title     │                      │
│  │ [PDF] [Studio]   │ │ [PDF] [Studio]   │                      │
│  │ 3/17/2026        │ │ 3/13/2026        │                      │
│  └──────────────────┘ └──────────────────┘                      │
│                                                                  │
│  Newport                                                         │
│  ════════ (gold underline)                                       │
│  ┌──────────────────┐ ┌──────────────────┐                      │
│  │ ...              │ │ ...              │                      │
│  └──────────────────┘ └──────────────────┘                      │
│                                                                  │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│  ▸ Show failed reports (3)                                      │
└─────────────────────────────────────────────────────────────────┘
```

## Design Token Usage

| Element | Token |
|---------|-------|
| Tile background fallback | `color-primary` → `#1E293B` gradient |
| Tile radius | `radius-md` |
| Tile shadow | `shadow-sm`, `shadow-md` on hover |
| Title text | `font-sans`, `text-sm`, `color-text-inverse` |
| Meta text | `font-sans`, `text-xs`, muted white (55% opacity) |
| Ready pill | Solid `color-success` bg, white text, drop shadow |
| Generating pill | Solid `color-accent` bg, white text, pulse animation |
| Queued pill | Solid `color-text-tertiary` bg, white text |
| Failed pill | `color-error` bg at 10%, `color-error` text |
| PDF button | `bg-white`, `color-primary` text, `shadow-sm`, `font-semibold` |
| Content Studio link | `color-accent` bg, `color-primary` text |
| Market header | `font-serif`, `text-lg`, `border-b-2 border-accent` |
| Toggle text | `font-sans`, `text-sm`, `color-text-secondary` |
| Failed list row | `color-surface` bg, `shadow-sm` |
| Entitlement bar | `h-1.5`, `color-accent` fill, `color-warning` at 80%+ |
| Entitlement unlimited | Shimmer gradient animation, `color-accent` |

## Component References

- MarketCard (reference): `components/dashboard/market-card.tsx`
- ReportTileGrid (new): `components/reports/report-tile-grid.tsx` — market-grouped tiles with failed toggle
- ReportTile (new): internal to ReportTileGrid — single photo tile
- ReportEntitlementBadge (new): `components/reports/report-entitlement-badge.tsx` — progress bar
- DownloadPdfButton (modified): `components/reports/download-pdf-button.tsx` — white bg style
- GenerateKitButton (modified): `components/reports/generate-kit-button.tsx` — "Content Studio" label
- Sidebar (modified): `components/layout/sidebar.tsx` — beta card top, credits bottom, issue link
- getMarketImageUrl (extracted): `lib/utils/market-image.ts` — shared city photo URL builder

## Learnings

(to be filled by /compound)
