---
feature: Content Studio Listing Page
domain: content-studio
source:
  - app/(protected)/content-studio/page.tsx
  - components/content-studio/content-studio-tile-grid.tsx
  - lib/services/content-studio.ts
tests:
  - __tests__/content-studio/content-studio-tile-grid.test.tsx
components:
  - ContentStudioTileGrid
personas:
  - rising-star-agent
  - established-practitioner
status: implemented
created: 2026-03-29
updated: 2026-03-29
---

# Content Studio Listing Page

**Source File**: `app/(protected)/content-studio/page.tsx`
**Design System**: `.specs/design-system/tokens.md`
**Personas**: `.specs/personas/rising-star-agent.md`, `.specs/personas/established-practitioner.md`

## Problem

Content studios are currently buried inside individual report pages (`/reports/[id]/kit`). Users who generate multiple reports have no central place to browse, find, or jump into their content studios. The reports page lists reports — the content studio page should list content studios with the same first-class treatment.

## Feature: Content Studio Listing

A standalone `/content-studio` route in the sidebar that lists all content studios the user has generated, grouped by market. Each card shows the report it belongs to, what content types have been generated (social media, email, or both), generation status, and a link to open the studio.

### Scenario: User navigates to Content Studio listing
```gherkin
Given I am a logged-in user
When I click "Content Studio" in the sidebar
Then I see the Content Studio listing page at /content-studio
And I see a header with "Content Studio" title
And I see a subtitle "Your generated marketing content."
```

### Scenario: User sees content studios grouped by market
```gherkin
Given I have completed reports with content studios for "Naples" and "Miami"
When I view the Content Studio listing page
Then I see studios grouped under market headings
And each market heading matches the report's market name
And studios within each market are sorted newest first
```

### Scenario: User sees content studio tile with action panel
```gherkin
Given I have a completed report "Naples Q1 2026 Luxury Report" with a social media kit (completed) and email campaign (generating)
When I view the Content Studio listing page
Then I see a tile row with a photo on the left and an action panel on the right
And the action panel shows the report title "Naples Q1 2026 Luxury Report"
And the action panel shows an "Open Social Media Kit" button (completed)
And the action panel shows a "Generating..." indicator for email (in progress)
And the tile shows when the studio was last updated
```

### Scenario: User navigates to report or content studio from tile
```gherkin
Given I see a content studio tile for report "Naples Q1 2026 Luxury Report"
When I click the photo tile
Then I am navigated to /reports/{reportId} (report detail page)
When I click "Open Social Media Kit"
Then I am navigated to /reports/{reportId}/kit
When I click "Open Email Kit"
Then I am navigated to /reports/{reportId}/kit?tab=email
```

### Scenario: User has no content studios
```gherkin
Given I have no reports with generated content (no social media kits or email campaigns)
When I view the Content Studio listing page
Then I see an empty state message "No content studios yet."
And I see guidance text "Generate content from a completed report to see it here."
And I see a link to "View Reports" that navigates to /reports
```

### Scenario: User has reports but no content generated
```gherkin
Given I have completed reports but have not generated any social media kits or email campaigns
When I view the Content Studio listing page
Then I see the same empty state as having no content studios
```

### Scenario: Content studio with only social media content
```gherkin
Given I have a report with a completed social media kit but no email campaign
When I view the Content Studio listing page
Then the action panel shows "Open Social Media Kit" button
And the action panel shows "Generate Email Kit" button (secondary style)
```

### Scenario: Content studio with generating/queued status
```gherkin
Given I have a report with a social media kit in "generating" status
When I view the Content Studio listing page
Then the action panel shows a disabled "Generating..." button with a pulsing indicator
And the photo tile is still clickable to navigate to the report
```

### Scenario: Content studio with failed generation
```gherkin
Given I have a report with a social media kit in "failed" status
When I view the Content Studio listing page
Then the action panel shows a "Retry Social Media Kit" button in error styling
And clicking retry triggers regeneration and transitions to generating state
```

## User Journey

1. User logs in and sees **Content Studio** in the sidebar (new nav item)
2. **Content Studio listing page** — browses all studios by market
3. Clicks photo tile → taken to `/reports/[id]` (report detail page, backlink)
4. Clicks action button → taken to `/reports/[id]/kit` or `/reports/[id]/kit?tab=email`
5. Can also reach content studio from individual report tiles (existing flow preserved)

## UI Mockup

```
─── Naples ──────────────────────────────────────────────

┌──────────────┐  ┌──────────────────────────────────┐
│ [city photo] │  │  Naples Q1 2026 Luxury Report     │
│              │  │  3/17/2026                        │
│  hover:      │  │                                   │
│ "View Report"│  │  CONTENT STUDIO                   │
│              │  │  ● Open Social Media Kit →         │
│              │  │  ● Open Email Kit →                │
└──────────────┘  └──────────────────────────────────┘

─── Miami ───────────────────────────────────────────────

┌──────────────┐  ┌──────────────────────────────────┐
│ [city photo] │  │  Miami Q1 2026 Ultra Luxury       │
│              │  │  3/17/2026                        │
│              │  │                                   │
│              │  │  CONTENT STUDIO                   │
│              │  │  ● Open Social Media Kit →         │
│              │  │  ○ Generate Email Kit ↻            │
└──────────────┘  └──────────────────────────────────┘

Legend:
  ● = completed (green dot) → links to content studio viewer
  ○ = not generated (outline dot) → triggers generation
  ◎ = generating (pulsing accent, disabled)
  Photo tile links to /reports/{id} (report detail backlink)
  Report title also links to /reports/{id}
  Market headings: serif font, gold underline (matches report groups)
  Action buttons: inline-flex pill buttons (gold for completed, outline for generate)
```

### Empty State Mockup

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Content Studio                                             │
│  Your generated marketing content.                          │
│                                                             │
│  ┌───────────────────────────────────────────┐              │
│  │                                           │              │
│  │   No content studios yet.                 │              │
│  │                                           │              │
│  │   Generate content from a completed       │              │
│  │   report to see it here.                  │              │
│  │                                           │              │
│  │          [ View Reports ]                 │              │
│  │                                           │              │
│  └───────────────────────────────────────────┘              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Technical Approach

### Route
- `app/(protected)/content-studio/page.tsx` — server component
- Fetches all reports for the user that have at least one social media kit or email campaign
- Joins `reports` with `socialMediaKits` and `emailCampaigns` tables

### Data Query
- Query `reports` for current user
- Left join `socialMediaKits` on `reportId`
- Left join `emailCampaigns` on `reportId`
- Filter: only include reports where at least one of kit/email exists (status is not null)
- Return: report id, title, market info, kit status, kit generatedAt, email status, email generatedAt

### Sidebar Change
- Add "Content Studio" nav item to `components/layout/sidebar.tsx`
- Position between "Reports" and "Markets"
- Icon: palette or pen-tool (creative content metaphor)

### Components
- `ContentStudioTileGrid` — groups cards by market, mirrors `ReportTileGrid` pattern
- Reuses the same photo+gradient card approach as report tiles
- Content type badges show status (completed/generating/queued) with colored dots

### No new database tables needed
- All data comes from existing `reports`, `socialMediaKits`, and `emailCampaigns` tables

## Component References

- ReportTileGrid (existing pattern): `components/reports/report-tile-grid.tsx`
- Sidebar: `components/layout/sidebar.tsx`
- ContentStudioTileGrid (new): `components/content-studio/content-studio-tile-grid.tsx`

## Learnings
