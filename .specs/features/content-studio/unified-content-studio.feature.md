---
feature: Unified Content Studio
domain: content-studio
source: app/(protected)/reports/[id]/kit/page.tsx
tests:
  - __tests__/content-studio/unified-content-studio.test.tsx
  - __tests__/content-studio/email-route-redirect.test.ts
components:
  - ContentStudioPage
  - ContentStudioButton
  - KitViewer
  - EmailCampaignViewer
personas:
  - rising-star-agent
status: implemented
created: 2026-03-17
updated: 2026-03-17
---

# Unified Content Studio

**Source Files**:
- `app/(protected)/reports/[id]/kit/page.tsx` (becomes Content Studio page)
- `app/(protected)/reports/[id]/emails/page.tsx` (absorbed into Content Studio)
- `components/reports/kit-viewer.tsx`
- `components/reports/email-viewer.tsx`

**Design System**: .specs/design-system/tokens.md
**Personas**: .specs/personas/rising-star-agent.md

## Problem

Currently, the Social Media Kit and Email Campaigns live on separate pages (`/reports/[id]/kit` and `/reports/[id]/emails`). Alex (rising star agent) sees these as two disconnected tools when they're really one workflow: "I generated a report, now turn it into content I can use." Having them in one place makes the Content Studio feel like a unified content repurposing hub, not two separate features.

## Feature: Unified Content Studio

Merge the Social Media Kit viewer and Email Campaign viewer into a single tabbed Content Studio page at `/reports/[id]/kit`. The `/reports/[id]/emails` route redirects to the Content Studio with the Email tab active.

### Scenario: Agent opens Content Studio and sees tabs
Given a completed report with both a social media kit and an email campaign
When the agent navigates to `/reports/[id]/kit`
Then they see a "Content Studio" header with two tabs: "Social Media" and "Email Campaigns"
And the "Social Media" tab is active by default
And the social media kit content is displayed (same as current KitViewer)

### Scenario: Agent switches to Email Campaigns tab
Given the agent is on the Content Studio page
When they click the "Email Campaigns" tab
Then the email campaign content is displayed (same as current EmailCampaignViewer)
And the URL updates to `/reports/[id]/kit?tab=email`
And the tab selection persists on page refresh

### Scenario: Deep link to email tab
Given a completed report
When the agent navigates to `/reports/[id]/kit?tab=email`
Then the Content Studio opens with the "Email Campaigns" tab active

### Scenario: Legacy email route redirects
Given a completed report
When the agent navigates to `/reports/[id]/emails`
Then they are redirected to `/reports/[id]/kit?tab=email`

### Scenario: Only social media kit exists (no email campaign)
Given a completed report with a social media kit but no email campaign
When the agent opens the Content Studio
Then the "Social Media" tab shows the kit content
And the "Email Campaigns" tab shows the generate CTA (or upgrade prompt per entitlement)

### Scenario: Only email campaign exists (no social media kit)
Given a completed report with an email campaign but no social media kit
When the agent opens the Content Studio
Then the "Social Media" tab shows the generate CTA (or upgrade prompt per entitlement)
And the "Email Campaigns" tab shows the email campaign content

### Scenario: Neither content exists yet
Given a completed report with neither kit nor campaign
When the agent opens the Content Studio
Then both tabs show their respective generate CTAs
And the header still reads "Content Studio"

### Scenario: Report detail page shows single Content Studio button
Given a completed report
When the agent views the report detail page
Then they see a single "Content Studio" button (not separate kit + email buttons)
And the button navigates to `/reports/[id]/kit`

### Scenario: Generating status shown per tab
Given a report where the social media kit is completed but email campaign is generating
When the agent views the Content Studio
Then the "Social Media" tab shows completed kit content
And the "Email Campaigns" tab shows the generating progress indicator with polling

### Scenario: Entitlement gating per content type
Given an agent on the Starter tier (social_media_kits cap=0, email_campaigns cap=0)
When they open the Content Studio
Then both tabs show upgrade prompts (not generate buttons)
And each tab's upgrade prompt lists benefits specific to that content type

## User Journey

1. Agent generates a market intelligence report
2. Report completes, agent sees report detail page
3. Agent clicks **"Content Studio"** button
4. **Content Studio** opens with Social Media tab active
5. Agent browses social media content, copies posts
6. Agent clicks **"Email Campaigns"** tab
7. Agent browses email sequences, copies subject lines
8. Agent returns to report or generates another

## UI Mockup

```
┌──────────────────────────────────────────────────────────────┐
│  <- Back to Report                                           │
│                                                              │
│  Content Studio                    Generated 2 hours ago     │
│  ┌─────────────────┬───────────────────┐                     │
│  │  Social Media   │  Email Campaigns  │                     │
│  │  (active)       │                   │                     │
│  └─────────────────┴───────────────────┘                     │
│                                                              │
│  ┌─ Stats Row ──────────────────────────────────────────┐    │
│  │  12 Content Pieces  │  4 Platforms  │  7 Sections    │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  Platform: [All] [LinkedIn] [Instagram] [X] [Facebook]       │
│                                                              │
│  ┌─ Post Ideas (5) ───────────────────── [Refresh] ─────┐   │
│  │  ...existing kit content...                           │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─ Platform Captions (8) ──────────── [Refresh] ────────┐  │
│  │  ...existing kit content...                            │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ...remaining social media sections...                       │
└──────────────────────────────────────────────────────────────┘

When "Email Campaigns" tab is clicked:

┌──────────────────────────────────────────────────────────────┐
│  <- Back to Report                                           │
│                                                              │
│  Content Studio                    Generated 2 hours ago     │
│  ┌─────────────────┬───────────────────┐                     │
│  │  Social Media   │  Email Campaigns  │                     │
│  │                 │  (active)         │                     │
│  └─────────────────┴───────────────────┘                     │
│                                                              │
│  Persona: [All] [Alex Rivera] [Jordan Chen]                  │
│                                                              │
│  ┌─ Drip Sequence (5 emails) ───────── [Refresh] ───────┐   │
│  │  ...existing email content...                         │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─ Newsletter ──────────────────────── [Refresh] ───────┐  │
│  │  ...existing email content...                          │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ...remaining email sections...                              │
└──────────────────────────────────────────────────────────────┘

Report Detail Page — single CTA:

┌──────────────────────────────────────────────────────────────┐
│  Report: Naples Luxury Market Q1 2026                        │
│                                                              │
│  [Download PDF]  [Share]  [Content Studio ->]                │
│                                                              │
│  ...report preview...                                        │
└──────────────────────────────────────────────────────────────┘
```

## Technical Approach

### Route Changes
1. **`/reports/[id]/kit/page.tsx`** — becomes the unified Content Studio page
   - Server-side: fetch both `getSocialMediaKit()` and `getEmailCampaign()`
   - Server-side: check entitlements for both `social_media_kits` and `email_campaigns`
   - Pass all data to a new `ContentStudioPage` client component
2. **`/reports/[id]/emails/page.tsx`** — redirect to `/reports/[id]/kit?tab=email`
3. **Report detail page** — replace separate GenerateKitButton + GenerateEmailButton with single Content Studio link/button

### Component Changes
1. **New: `ContentStudioPage`** (client component, wraps tabs)
   - Reads `?tab=` query param for initial tab
   - Renders tab bar with "Social Media" and "Email Campaigns"
   - Renders `KitViewer` or `EmailCampaignViewer` based on active tab
   - Falls back to generate CTA or upgrade prompt per tab when content missing
2. **`KitViewer`** — no changes (rendered inside Social Media tab)
3. **`EmailCampaignViewer`** — no changes (rendered inside Email Campaigns tab)
4. **Report detail page** — single "Content Studio" button replaces two separate buttons

### What Stays the Same
- All API routes (`/api/reports/[id]/kit/*`, `/api/reports/[id]/email-campaign/*`)
- KitViewer and EmailCampaignViewer components (no modifications)
- Generation logic, polling, regeneration
- Entitlement checks (still per content type)
- Database schema

## Component References

- KitViewer: `components/reports/kit-viewer.tsx` (existing, no changes)
- EmailCampaignViewer: `components/reports/email-viewer.tsx` (existing, no changes)
- ContentStudioPage: new wrapper component with tab navigation

## Learnings

(empty — to be filled after implementation)
