---
feature: Social Media Kit Button UX
domain: social-media-kit
source: components/reports/generate-kit-button.tsx
tests: []
components:
  - GenerateKitButton
personas:
  - rising-star-agent
  - established-practitioner
status: specced
created: 2026-03-16
updated: 2026-03-16
---

# Social Media Kit Button UX

**Source Files**:
- `components/reports/generate-kit-button.tsx` (main component)
- `app/(protected)/reports/page.tsx` (reports list — compact mode)
- `app/(protected)/reports/[id]/page.tsx` (report detail — full mode)

**Design System**: .specs/design-system/tokens.md
**Personas**: rising-star-agent, established-practitioner

## Problem

On the reports list page, the compact kit button shows "Pro Feature" for Starter tier users. This label is confusing — it doesn't communicate what the button does or invite action. Users see three buttons ("Download PDF", "Pro Feature", "Completed") with no clear hierarchy or call-to-action for the kit.

## Solution

Replace "Pro Feature" with "Get Kit" across all entitlement states in compact mode. The button always navigates to the report detail page's social media kit section (`#social-media-kit`), where:
- **Entitled users** see the generate/view kit controls
- **Non-entitled users** see the upgrade prompt (future: upgrade flow modal)

This creates a consistent, action-oriented entry point regardless of subscription tier.

---

## Feature: Kit Button UX on Reports List

### Scenario: Starter user sees "Get Kit" button (compact)
Given a Starter tier user is on the reports list page
And a report has status "completed"
And the user's social_media_kits entitlement cap is 0
When the page loads
Then the kit button shows "Get Kit"
And the button links to `/reports/{id}#social-media-kit`

### Scenario: Professional user with no kit sees "Get Kit" button (compact)
Given a Professional tier user is on the reports list page
And a report has status "completed"
And no kit has been generated for the report
When the page loads
Then the kit button shows "Get Kit"
And the button links to `/reports/{id}#social-media-kit`

### Scenario: User with completed kit sees "View Kit" (compact — unchanged)
Given a user is on the reports list page
And a report has a completed social media kit
When the page loads
Then the kit button shows "View Kit"
And the button links to `/reports/{id}/kit`

### Scenario: User with generating kit sees spinner (compact — unchanged)
Given a user is on the reports list page
And a report has a kit with status "generating"
When the page loads
Then the kit button shows "Generating..."
And the button is disabled

### Scenario: User at monthly cap sees "Get Kit" (compact)
Given a Professional tier user is on the reports list page
And the user has reached their monthly kit limit
When the page loads
Then the kit button shows "Get Kit"
And the button links to `/reports/{id}#social-media-kit`

---

## Feature: Kit Section Anchor on Report Detail Page

### Scenario: Report detail page has a kit section anchor
Given a user navigates to `/reports/{id}`
And the report status is "completed"
When the page loads
Then the GenerateKitButton section has id="social-media-kit"
And the page scrolls to #social-media-kit if present in the URL hash

### Scenario: Starter user clicks "Get Kit" and lands on upgrade prompt
Given a Starter tier user clicks "Get Kit" on the reports list
When they arrive at `/reports/{id}#social-media-kit`
Then the page scrolls to the social media kit section
And they see the "Social Media Kit — Professional Feature" upgrade card
And there is a "View Plans to Upgrade" link

### Scenario: Professional user clicks "Get Kit" and lands on generate button
Given a Professional tier user clicks "Get Kit" on the reports list
And no kit exists for the report
When they arrive at `/reports/{id}#social-media-kit`
Then the page scrolls to the social media kit section
And they see the "Generate Social Media Kit" button

---

## User Journey

1. User views reports list with completed reports
2. **User clicks "Get Kit"** on a report row
3. Navigated to report detail page, scrolled to kit section
4. If entitled → generate or view kit
5. If not entitled → see upgrade prompt with feature list

---

## UI Mockup — Reports List (Compact)

### Before (current)
```
┌──────────────────────────────────────────────────────────────────────┐
│ New Canaan Luxury Market Intelligence — Q1 2026                     │
│ New Canaan Luxury · Created 3/16/2026                               │
│                                    [Download PDF] [Pro Feature] Completed │
└──────────────────────────────────────────────────────────────────────┘
```

### After (new)
```
┌──────────────────────────────────────────────────────────────────────┐
│ New Canaan Luxury Market Intelligence — Q1 2026                     │
│ New Canaan Luxury · Created 3/16/2026                               │
│                                    [Download PDF] [Get Kit] Completed │
└──────────────────────────────────────────────────────────────────────┘
```

**Button styling**: Same `color-accent` gold background as "Generate Kit" button — visually consistent CTA regardless of tier. No longer styled as a passive/muted label.

### Kit states in compact mode (after change)

| Kit Status | Entitlement | Label | Action |
|------------|-------------|-------|--------|
| `none` | `not_included` | Get Kit | Link → `/reports/{id}#social-media-kit` |
| `none` | `allowed` | Get Kit | Link → `/reports/{id}#social-media-kit` |
| `none` | `at_cap` | Get Kit | Link → `/reports/{id}#social-media-kit` |
| `none` | `loading` | ... | (spinner, unchanged) |
| `generating` | any | Generating... | Disabled button (unchanged) |
| `completed` | any | View Kit | Link → `/reports/{id}/kit` (unchanged) |
| `failed` | any | Retry Kit | Trigger regeneration (unchanged) |

---

## UI Mockup — Report Detail Page (Kit Section)

### Entitled user, no kit yet
```
┌─────────────────────────────────────────────────┐
│ id="social-media-kit"                           │
│                                                 │
│ [Generate Social Media Kit]                     │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Non-entitled user (Starter tier)
```
┌─────────────────────────────────────────────────┐
│ id="social-media-kit"                           │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ Social Media Kit — Professional Feature     │ │
│ │                                             │ │
│ │ Turn your report into ready-to-post social  │ │
│ │ content:                                    │ │
│ │ • Platform-optimized posts                  │ │
│ │ • Persona-targeted content                  │ │
│ │ • Poll ideas with data-backed context       │ │
│ │ • Stat callouts for quick sharing           │ │
│ │ • Content calendar suggestions              │ │
│ │                                             │ │
│ │ [View Plans to Upgrade]                     │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

---

## Changes Summary

### `generate-kit-button.tsx`
1. **Compact `not_included` state**: Change from `<Link href="/account">Pro Feature</Link>` to `<Link href="/reports/{id}#social-media-kit">Get Kit</Link>` with gold accent styling
2. **Compact `allowed` state (no kit)**: Change from `<button onClick={handleGenerate}>Generate Kit</button>` to `<Link href="/reports/{id}#social-media-kit">Get Kit</Link>` — move generation trigger to detail page only
3. **Compact `at_cap` state**: Change from `<span>Limit reached</span>` to `<Link href="/reports/{id}#social-media-kit">Get Kit</Link>`
4. Entitlement check still runs in compact mode (harmless) but rendering ignores the specific status — all resolved states show "Get Kit"

### `app/(protected)/reports/[id]/page.tsx`
1. Wrap `GenerateKitButton` in a `<div id="social-media-kit">` for anchor linking

## Component References

- GenerateKitButton: `components/reports/generate-kit-button.tsx`

## Persona Lens Revision

**Alex (Rising Star)**: "Pro Feature" is a wall — it tells me I can't have something without explaining why I'd want it. "Get Kit" is an invitation. I click, I see the feature list, I understand the value, *then* I decide to upgrade. Much better funnel.

**Jordan (Established Practitioner)**: The current UX wastes my time. If I already have Pro access, I shouldn't have to figure out which button generates the kit vs. tells me it's a pro feature. "Get Kit" is clear — it takes me where I need to go.
