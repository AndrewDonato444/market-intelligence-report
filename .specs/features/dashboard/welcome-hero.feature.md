---
feature: Dashboard Welcome Hero
domain: dashboard
source: components/dashboard/dashboard-content.tsx
tests: []
components:
  - DashboardWelcomeHero
  - DashboardStats
design_refs:
  - .specs/design-system/tokens.md
personas:
  - established-practitioner
  - rising-star-agent
status: specced
created: 2026-03-18
updated: 2026-03-18
---

# Dashboard Welcome Hero

**Source File**: `components/dashboard/dashboard-welcome-hero.tsx`
**Design System**: `.specs/design-system/tokens.md`
**Personas**: `.specs/personas/established-practitioner.md`, `.specs/personas/rising-star-agent.md`

## Feature: Dashboard Welcome Hero

The first thing users see when they open the app. Replaces the plain white stats card with a personalized welcome header that combines editorial gravitas with key account metrics. Inspired by the "Hello [Name]" pattern from modern SaaS dashboards — adapted to the Bloomberg-meets-Architectural-Digest design language of this product.

---

### Scenario: Returning user with reports and markets sees personalized welcome

Given the user is authenticated with a name resolvable from their profile
And they have at least one market and at least one report
When the dashboard loads
Then a greeting "Good [morning/afternoon/evening], [first name]" is displayed
And the greeting uses `font-serif` (Playfair Display) at `text-3xl` weight `font-semibold`
And the color is `color-primary` (deep navy)
And below the greeting a contextual tagline is shown (e.g. "Your markets are ready.")
And the tagline uses `font-sans` at `text-base` `color-text-secondary`
And the three stats (Reports Generated, Last Report, Active Markets) appear below the greeting
And the stats are rendered in a horizontal row with `color-accent` (gold) for the primary numbers
And a primary CTA button "Generate New Report" links to `/reports/create`

### Scenario: First-time user with markets but no reports sees onboarding welcome

Given the user has markets defined but zero reports generated
When the dashboard loads
Then the greeting still shows the personalized "Good [time], [name]" header
And in place of the stats row a single prompt is shown:
  "Your first intelligence brief is one click away."
And a prominent gold CTA "Generate Your First Report" links to `/reports/create`
And no stats card is rendered (avoids showing zeros that feel discouraging)

### Scenario: User name is unavailable (email-only account)

Given the user's profile has no display name or first name
When the dashboard loads
Then the greeting falls back to "Welcome back." (no name)
And all other behavior is unchanged

### Scenario: Time-of-day greeting updates correctly

Given the user opens the dashboard
When the local hour is 0–11
Then the greeting reads "Good morning"
When the local hour is 12–16
Then the greeting reads "Good afternoon"
When the local hour is 17–23
Then the greeting reads "Good evening"

### Scenario: Dashboard hero is visible without scrolling on desktop

Given the dashboard loads on a ≥1024px viewport
When the page settles
Then the entire welcome hero section (greeting + tagline + stats or CTA) is visible above the fold
And the "YOUR MARKETS" section begins below the fold, anchoring the scroll

---

## UI Mockup

### Returning user (with reports)

```
┌─ Dashboard Page (bg: background #F8FAFC) ───────────────────────────────────┐
│                                                                               │
│  ┌─ Welcome Hero (bg: surface #FFF, radius: md, shadow: sm, px-8 py-6) ────┐ │
│  │                                                                           │ │
│  │  Good morning, Jordan.         [Generate New Report ▶]                   │ │
│  │  (font: serif, text-3xl,       (bg: accent #CA8A04, color: primary,      │ │
│  │   semibold, color: primary)     radius: sm, font: sans, font-semibold)   │ │
│  │                                                                           │ │
│  │  Your markets are ready.                                                  │ │
│  │  (font: sans, text-base, color: text-secondary)                           │ │
│  │                                                                           │ │
│  │  ────────────────────────────────────────────────────── (border: border) │ │
│  │                                                                           │ │
│  │    13                   Mar 17, 2026              5                       │ │
│  │  (text-3xl, accent)   (text-lg, accent)       (text-3xl, accent)         │ │
│  │  Reports Generated      Last Report           Active Markets              │ │
│  │  (text-sm, text-secondary)                   (text-sm, text-secondary)   │ │
│  │                                                                           │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  YOUR MARKETS                                                                 │
│  ┌─────────────────────┐  ┌─────────────────────┐                            │
│  │  [photo tile]       │  │  [photo tile]       │                            │
│  └─────────────────────┘  └─────────────────────┘                            │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

### First-time user (no reports)

```
┌─ Welcome Hero (bg: surface, radius: md, shadow: sm) ──────────────────────────┐
│                                                                                │
│  Good afternoon, Marcus.                                                       │
│  (font: serif, text-3xl, semibold, color: primary)                            │
│                                                                                │
│  Your first intelligence brief is one click away.                              │
│  (font: sans, text-base, color: text-secondary)                               │
│                                                                                │
│  [  Generate Your First Report  ]                                              │
│  (bg: accent, color: primary, radius: sm, font: sans, semibold, full-width    │
│   on mobile / inline on desktop)                                               │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## Component References

- `DashboardWelcomeHero`: `.specs/design-system/components/dashboard-welcome-hero.md` (stub)
- `DashboardStats`: currently lives inside `dashboard-stats.tsx` — stats row will be absorbed into the hero component or remain as a sub-component passed as a child

---

## Implementation Notes

- **Name resolution**: Pull from `user.user_metadata?.full_name` or `user.user_metadata?.name`, split on space, take first token. Fall back to empty string → render "Welcome back."
- **Time-of-day**: Computed client-side (`new Date().getHours()`) — mark the hero as `"use client"` or extract greeting logic to a shared util.
- **Stats row**: The existing `DashboardStats` component can be composed inside the new hero wrapper rather than duplicated — the hero controls layout and the stats component supplies the numbers.
- **No-reports state**: When `hasReports === false`, hide the stats divider + row; show the onboarding prompt + CTA instead. The current split (stats only shown when reports exist) already handles this in `dashboard-content.tsx` — just move the render location into the hero.
- **User data**: The `user` object is fetched server-side in `dashboard/page.tsx` — pass `user.user_metadata` (or just the resolved first name) as a prop to `DashboardContent` → `DashboardWelcomeHero`.
- **CTA placement**: The "Generate New Report" CTA appears in the hero and replaces the need for the scattered CTA buttons elsewhere on first load — reduces cognitive load.

---

## User Journey

1. User signs in → lands on `/dashboard`
2. **[This feature]** — first visual impression: warm, personalized greeting + key metrics
3. User scans market cards below
4. User clicks "Generate New Report" or a market card's "New Report" button
5. Enters report creation flow

---

## Learnings

_To be filled in after implementation._
