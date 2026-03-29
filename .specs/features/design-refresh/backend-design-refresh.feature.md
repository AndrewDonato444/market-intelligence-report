---
feature: Backend Design Refresh
domain: design-refresh
source: components/layout/top-nav.tsx, components/layout/sidebar.tsx, components/layout/page-shell.tsx, components/layout/footer.tsx, app/(protected)/layout.tsx, app/globals.css
tests:
  - __tests__/layout/shell-design-refresh.test.tsx
components:
  - TopNav
  - Sidebar
  - PageShell
  - Footer
design_refs:
  - .specs/design-system/tokens.md
personas:
  - rising-star-agent
  - established-practitioner
status: implemented
created: 2026-03-28
updated: 2026-03-28
---

# Backend Design Refresh

**Design System**: `.specs/design-system/tokens.md`
**Personas**: Rising Star Agent (Alex Rivera), Established Practitioner (Jordan Ellis)

## Overview

The marketing/landing page uses a warm luxury hospitality aesthetic (ivory palette, Cormorant Garamond + DM Sans, generous spacing, subtle animations, gold-tinted shadows). The authenticated app pages use a standard SaaS dashboard aesthetic (cold slate grays, Playfair + Inter, tight spacing, no animations). The gap undermines the premium positioning that the marketing page establishes.

This spec defines a page-by-page design refresh of all authenticated pages to bring the warm, editorial luxury feel of the marketing page into the app experience — without sacrificing data density or professional utility.

**Persona lens**: Alex (Rising Star) needs the app to feel like the premium tool that justifies the price — when they show a client their screen, it should reinforce "advisor, not salesperson." Jordan (Established Practitioner) expects the editorial quality of a Bloomberg terminal dressed in Architectural Digest — density with taste.

---

## Design Principles

1. **Warm, not cold** — Swap navy-tinted slate grays for warm neutrals (ivory, sand, charcoal)
2. **Editorial, not utilitarian** — Serif headlines, generous whitespace, intentional hierarchy
3. **Animated, not static** — Subtle entrance animations and hover transitions signal quality
4. **Consistent, not jarring** — Signing in should feel like walking deeper into the same space, not switching apps
5. **Dense, not sparse** — Keep data density (this is still a professional tool), but with better typography and breathing room

---

## Implementation Phases

This refresh is broken into 8 sub-features, implemented page-by-page:

| Phase | Area | Files | Priority |
|-------|------|-------|----------|
| 1 | App Shell (TopNav, Sidebar, PageShell, Footer) | `components/layout/*` | P0 — every page inherits this |
| 2 | Dashboard | `components/dashboard/*` | P0 — first page after login |
| 3 | Reports list | `app/(protected)/reports/page.tsx`, `components/reports/*` | P1 — most-visited |
| 4 | Report creation flow | `app/(protected)/reports/create/*` | P1 — audit for consistency |
| 5 | Markets page | `app/(protected)/markets/*`, `components/markets/*` | P1 — core workflow |
| 6 | Settings & Account | `app/(protected)/settings/*`, `components/account/*` | P2 — lower traffic |
| 7 | How-To page | `app/(protected)/how-to/*` | P2 — quick win |
| 8 | Admin pages | `app/admin/*`, `components/admin/*` | P3 — internal |

Each phase gets its own sub-spec as it's built. This parent spec defines the shared design language and the shell (Phase 1).

---

## Shared Design Language: App Warm Palette

### New CSS Variables (app-specific warm tokens)

These bridge the marketing palette into the app without replacing marketing-specific `--color-mkt-*` tokens. They live alongside existing tokens in `globals.css`.

| Token | Value | Replaces | Usage |
|-------|-------|----------|-------|
| `--color-app-bg` | `#F5F2ED` | `--color-background` (#F8FAFC) | Main page background (warm ivory instead of cold blue-gray) |
| `--color-app-surface` | `#FDFCFA` | `--color-surface` (#FFFFFF) | Card/panel backgrounds (warm white) |
| `--color-app-surface-elevated` | `#FFFFFF` | `--color-surface-elevated` | Modals, dropdowns (pure white for max contrast) |
| `--color-app-border` | `#E5DDD2` | `--color-border` (#E2E8F0) | Default borders (warm sand instead of cool slate) |
| `--color-app-border-strong` | `#C4B9A8` | `--color-border-strong` (#CBD5E1) | Emphasized borders, active inputs |
| `--color-app-text` | `#2C2825` | `--color-text` (#020617) | Primary text (warm charcoal instead of blue-black) |
| `--color-app-text-secondary` | `#7A7168` | `--color-text-secondary` (#475569) | Muted text, labels (warm gray) |
| `--color-app-text-tertiary` | `#B5AA9B` | `--color-text-tertiary` (#94A3B8) | Placeholders, disabled (warm stone) |
| `--color-app-nav-bg` | `#1A1714` | `--color-primary` (#0F172A) | TopNav/dark backgrounds (warm dark instead of cold navy) |
| `--color-app-sidebar-bg` | `#F5F2ED` | `--color-surface` (#FFFFFF) | Sidebar background (matches page bg for seamless blend) |
| `--color-app-accent` | `#B8975A` | `--color-accent` (#CA8A04) | Gold accent — antique gold matching marketing |
| `--color-app-accent-hover` | `#A07D42` | `--color-accent-hover` (#A16207) | Gold hover state |
| `--color-app-accent-light` | `rgba(184, 151, 90, 0.12)` | `--color-accent-light` (#FEF9C3) | Subtle gold tint backgrounds |
| `--color-app-active-bg` | `rgba(184, 151, 90, 0.08)` | `--color-primary-light` (#F1F5F9) | Active nav item, selected states |

### Typography Update

| Change | From | To | Rationale |
|--------|------|----|-----------|
| Headings (h1, h2, page titles) | Playfair Display | Cormorant Garamond | Match marketing editorial feel |
| Body / UI text | Inter | DM Sans | Match marketing geometric sans |
| Monospace | JetBrains Mono | JetBrains Mono (unchanged) | Only used in admin/dev contexts |

Font variable additions in `globals.css`:
- `--font-display`: `'Cormorant Garamond'` (already loaded for marketing page)
- `--font-body`: `'DM Sans'` (already loaded for marketing page)
- App components switch from `--font-serif`/`--font-sans` to `--font-display`/`--font-body`

### Shadow Update (Deferred)

Shadow tokens are global and affect all pages including un-migrated ones (reports, markets, settings, admin). Changing them now would create visual inconsistency on pages still using cold tokens. Deferred to Phase 6+ when most pages have migrated.

| Token | Current | Planned (future) |
|-------|---------|-------------------|
| `--shadow-sm` | `rgba(15,23,42,0.05)` | `rgba(184,151,90,0.06)` — warm gold tint |
| `--shadow-md` | `rgba(15,23,42,0.07)` | `rgba(184,151,90,0.08)` — warm gold tint |
| `--shadow-lg` | `rgba(15,23,42,0.08)` | `rgba(184,151,90,0.10)` — warm gold tint |

### Animation Tokens

Reuse marketing easing functions (already defined):
- `--ease-mkt-out-expo` for entrance animations
- `--ease-mkt-out-quart` for hover transitions

New app animation class:
- `.app-fade-in` — opacity 0 → 1, translateY(12px) → 0, 0.6s ease-out-expo (lighter than marketing's 30px/0.9s)

### Spacing Update

No changes to the spacing scale itself. Changes are to how spacing is applied:
- PageShell padding: `--spacing-6` (24px) → `--spacing-8` (32px) on desktop
- Section gaps within pages: increase by one step
- Card padding: increase from `p-5` to `p-6` or `p-8` depending on card type

---

## Feature: Phase 1 — App Shell Refresh

### Scenario: TopNav uses warm palette and marketing typography
```gherkin
Given the user is signed in and viewing any protected page
When the page renders
Then the TopNav background is var(--color-app-nav-bg) (#1A1714 warm dark)
And the brand name "Modern Signal Advisory" uses Cormorant Garamond (--font-display) at font-weight 500
And the word "Signal" is rendered in var(--color-app-accent) (#B8975A antique gold)
And the subtitle "Intelligence Platform" uses DM Sans (--font-body) in uppercase tracking
And the sign-out button uses DM Sans at text-sm
And the TopNav height is h-16 (64px, up from h-14/56px for more breathing room)
```

### Scenario: Sidebar uses warm palette with refined nav items
```gherkin
Given the user is signed in and viewing any protected page
When the page renders
Then the sidebar background is var(--color-app-sidebar-bg) (#F5F2ED, matching page bg for seamless blend)
And the sidebar border-right color is var(--color-app-border) (#E5DDD2 warm sand)
And nav item labels use DM Sans (--font-body) at text-sm
And the active nav item has background var(--color-app-active-bg) (subtle gold tint)
And the active nav item text is var(--color-app-text) (#2C2825 warm charcoal)
And the active nav item icon is var(--color-app-accent) (#B8975A antique gold)
And inactive nav items have text var(--color-app-text-secondary) (#7A7168)
And nav items have a transition on hover (background fade, 200ms)
And the BETA badge uses var(--color-app-accent) as background
And the "Report Credits" label uses DM Sans text-xs in var(--color-app-text-secondary)
And the sidebar footer text "Modern Signal Advisory" uses DM Sans text-xs in var(--color-app-text-tertiary)
```

### Scenario: PageShell uses warm background with increased padding
```gherkin
Given the user is signed in and viewing any protected page
When the page renders
Then the main content area background is var(--color-app-bg) (#F5F2ED warm ivory)
And the padding is var(--spacing-8) (32px) on desktop
And the padding is var(--spacing-4) (16px) on mobile (md breakpoint)
```

### Scenario: Footer uses warm dark palette
```gherkin
Given the user is signed in and viewing any protected page
When the page renders
Then the footer background is var(--color-app-nav-bg) (#1A1714 warm dark)
And the copyright text uses DM Sans (--font-body) at text-xs
And the copyright text color is var(--color-app-text-tertiary)
```

### Scenario: Page entrance animation on route change
```gherkin
Given the user navigates to any protected page
When the page content renders
Then the main content area children fade in with .app-fade-in animation
And the animation is opacity 0→1, translateY(12px)→0
And the animation duration is 0.6s with ease-out-expo easing
And the animation plays once on mount (not on every re-render)
```

### Scenario: Card shadows use warm gold tint (Deferred)
```gherkin
# DEFERRED to Phase 6+ — shadow tokens are global and would affect un-migrated pages.
# Keeping current navy-tinted shadows until most pages have migrated to warm tokens.
Given any card or elevated surface renders in the app
When the card has a shadow
Then the shadow currently uses navy-tinted rgba (unchanged from pre-refresh)
And this will be updated to gold-tinted rgba once Phases 3-5 are complete
```

### Scenario: Existing functionality preserved
```gherkin
Given the user is signed in
When the app shell renders with the new design
Then all navigation links still route correctly
And the sign-out button still signs the user out
And the sidebar still shows/hides the Admin link based on role
And the report entitlement badge still displays correctly
And the BETA notice still appears with report-an-issue link
And the sidebar width is still w-60 (240px)
And the layout is still h-screen flex column with overflow-hidden on the content row
```

### Scenario: Mobile responsiveness maintained
```gherkin
Given the user is on a viewport below the md breakpoint (768px)
When the page renders
Then the PageShell padding reduces to var(--spacing-4) (16px)
And the sidebar behavior is unchanged (current mobile handling preserved)
And the TopNav remains full-width and functional
```

---

## UI Mockup

### TopNav (Before → After)

```
BEFORE:
┌────────────────────────────────────────────────────────────────────┐
│ ██ Modern Signal Advisory │ Intelligence Platform      Sign Out   │  h-14, navy #0F172A
│    Playfair Display bold     Inter xs uppercase                   │  cold, utilitarian
└────────────────────────────────────────────────────────────────────┘

AFTER:
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│  Modern Signal Advisory  │  INTELLIGENCE PLATFORM        Sign Out  │  h-16, warm dark #1A1714
│  Cormorant Garamond 500     DM Sans xs tracked                    │  "Signal" in gold #B8975A
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Sidebar (Before → After)

```
BEFORE:                              AFTER:
┌──────────────────┐                 ┌──────────────────┐
│  ┌─ BETA ──────┐ │  white bg      │  ┌─ BETA ──────┐ │  warm white #FDFCFA
│  │  Some things │ │  #FFFFFF       │  │  Some things │ │  gold badge #B8975A
│  │  may break   │ │  cold border   │  │  may break   │ │  warm sand border
│  └─────────────-┘ │  #E2E8F0      │  └─────────────-┘ │  #E5DDD2
│                    │               │                    │
│  ■ Dashboard      │  blue-gray     │  ■ Dashboard      │  gold-tinted active bg
│    Reports        │  active bg     │    Reports        │  rgba(184,151,90,0.08)
│    Markets        │  #F1F5F9       │    Markets        │  warm charcoal text
│    Settings       │  Inter text    │    Settings       │  DM Sans text
│    How To         │               │    How To         │
│                    │               │                    │
│  Report Credits   │               │  Report Credits   │
│  [████░░] 2/5     │               │  [████░░] 2/5     │
│                    │               │                    │
│  ▸ Admin          │               │  ▸ Admin          │  gold accent
│                    │               │                    │
│  Modern Signal    │               │  Modern Signal    │
│  Advisory         │  cold tertiary │  Advisory         │  warm tertiary
└──────────────────┘                 └──────────────────┘
```

### PageShell (Before → After)

```
BEFORE:                                    AFTER:
┌──────────────────────────────┐          ┌──────────────────────────────┐
│  p-6 (24px)                  │          │  p-8 (32px)                  │
│  bg #F8FAFC (cold blue-gray) │          │  bg #F5F2ED (warm ivory)     │
│                              │          │                              │
│   Page content               │          │   Page content               │
│   (no entrance animation)    │          │   (fades in on mount,        │
│                              │          │    0.6s ease-out-expo)        │
│   Cards: cold navy shadows   │          │   Cards: warm gold shadows   │
│                              │          │                              │
└──────────────────────────────┘          └──────────────────────────────┘
```

### Full Shell Assembled

```
┌────────────────────────────────────────────────────────────────────────┐
│  Modern Signal Advisory  │  INTELLIGENCE PLATFORM           Sign Out  │
│  ─── warm dark #1A1714 ──── "Signal" in gold ────── DM Sans ──────── │
├──────────────────┬─────────────────────────────────────────────────────┤
│                  │                                                     │
│  ┌─ BETA ─────┐ │    p-8 (32px padding)                              │
│  │            │ │    bg: warm ivory #F5F2ED                           │
│  └────────────┘ │                                                     │
│                  │    ┌─────────────────────────────────────────┐      │
│  ■ Dashboard    │    │  Page content fades in                  │      │
│    Reports      │    │  Cards have warm gold shadows           │      │
│    Markets      │    │  Headings: Cormorant Garamond           │      │
│    Settings     │    │  Body: DM Sans                          │      │
│    How To       │    │  Borders: warm sand #E5DDD2             │      │
│                  │    └─────────────────────────────────────────┘      │
│  Report Credits │                                                     │
│  [████░░] 2/5   │                                                     │
│                  │                                                     │
│  ▸ Admin        │                                                     │
│                  │                                                     │
│  Modern Signal  │                                                     │
│  Advisory       │                                                     │
├──────────────────┴─────────────────────────────────────────────────────┤
│  © 2026 Modern Signal Advisory ──── warm dark #1A1714 ─────────────── │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Component References

- TopNav: `components/layout/top-nav.tsx`
- Sidebar: `components/layout/sidebar.tsx`
- PageShell: `components/layout/page-shell.tsx`
- Footer: `components/layout/footer.tsx`
- Protected Layout: `app/(protected)/layout.tsx`
- CSS Variables: `app/globals.css`

---

## Migration Strategy

### Token Approach: Additive, Not Destructive

We add new `--color-app-*` tokens alongside existing tokens. We do NOT rename or delete existing `--color-*` tokens because:

1. The report PDF rendering still uses `--color-primary`, `--color-accent`, etc.
2. Admin pages may be refreshed later (Phase 8) — they can migrate incrementally
3. The marketing page has its own `--color-mkt-*` namespace already

Shell components (TopNav, Sidebar, PageShell, Footer) switch to `--color-app-*` tokens. Content pages migrate page-by-page in subsequent phases.

### Font Approach: Shared Variables

The marketing page already loads Cormorant Garamond and DM Sans via Google Fonts in `layout.tsx`. We add:
- `--font-display` (already exists for marketing) → used in app headings
- `--font-body` (already exists for marketing) → used in app body text

App components swap `font-[family-name:var(--font-serif)]` → `font-[family-name:var(--font-display)]` and `font-[family-name:var(--font-sans)]` → `font-[family-name:var(--font-body)]`.

---

## User Journey

1. User sees marketing page (warm, editorial, luxury)
2. User signs up / signs in
3. **User lands on dashboard → same warm palette, same fonts, same quality feel** ← THIS IS THE FIX
4. User navigates between pages — consistent shell, consistent animations
5. User generates a report — creation flow already redesigned, now consistent with shell

---

## Hard Constraints

1. **Do NOT touch PDFs** — zero changes to report PDF rendering, PDF templates, PDF components, or any `--color-report-*` tokens. The PDF pipeline is a separate product surface.
2. **Do NOT touch marketing page** — the `--color-mkt-*` tokens and marketing components are locked.
3. **Additive tokens only** — never rename, delete, or change values of existing `--color-*`, `--font-serif`, `--font-sans` tokens. Add new `--color-app-*` tokens and migrate shell components to them.

## Open Questions

1. **Keep `--font-serif`/`--font-sans` for backward compat?** Recommendation: Yes, keep them defined but stop using them in shell components. Pages can migrate incrementally.
2. **Should admin pages use warm palette too?** Recommendation: Yes, eventually (Phase 8), but they can stay on current tokens until then. The shell will already be warm around them.
3. **Dark mode?** Not in scope. The marketing page doesn't have dark mode either. Future consideration.

---

## Learnings

(To be filled after implementation)
