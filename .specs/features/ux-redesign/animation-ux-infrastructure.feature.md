---
feature: Animation & UX Infrastructure
domain: ux-redesign
source: components/ui/tooltip.tsx, lib/animations.ts
tests:
  - __tests__/components/ui/tooltip.test.tsx
  - __tests__/components/ui/animated-container.test.tsx
  - __tests__/lib/animations.test.ts
components:
  - Tooltip
  - AnimatedContainer
  - StaggerItem
personas:
  - rising-star-agent
  - team-leader
  - legacy-agent
status: implemented
created: 2026-03-10
updated: 2026-03-10
---

# Animation & UX Infrastructure

**Source Files**: `components/ui/tooltip.tsx`, `lib/animations.ts`
**Design System**: `.specs/design-system/tokens.md`
**Personas**: All 5 (this is foundational infrastructure used across the entire creation flow)

## Feature: Animation & UX Infrastructure

The foundation layer for the Report Creation Experience Redesign (Phase 12). Installs Framer Motion, creates a reusable Tooltip component, and defines shared animation variants that every subsequent step in the unified creation flow will use.

This is infrastructure — agents won't see this directly, but every smooth transition, helpful tooltip, and polished interaction in the creation flow depends on it. Taylor (team leader, patience: Low-Medium) won't tolerate clunky UI. Pat (legacy agent, patience: High but less comfortable with complex UI) needs interactions that feel intuitive, not technical. Alex (rising star, patience: Medium) expects a professional tool that signals credibility.

---

## Feature: Framer Motion Installation & Configuration

### Scenario: Framer Motion is available as a project dependency
Given the Next.js project uses React 19 and Tailwind CSS
When a developer imports from "framer-motion"
Then the import resolves successfully
And the library version is compatible with React 19 and Next.js App Router

### Scenario: Framer Motion works with server components
Given the project uses Next.js App Router with server components by default
When a component uses Framer Motion's `motion` components
Then the component includes a "use client" directive
And no hydration errors occur

---

## Feature: Shared Animation Variants

### Scenario: Fade variant animates element opacity
Given a component uses the `fadeVariant` animation
When the element enters the viewport
Then it transitions from `opacity: 0` to `opacity: 1`
And the transition uses `duration-slow` (300ms) with `easing-default`

### Scenario: Slide variant animates element position
Given a component uses the `slideVariant` animation with direction "left"
When the element enters
Then it slides in from the right (20px offset) while fading in
And the transition uses `duration-slow` (300ms) with `easing-default`

### Scenario: Slide variant supports multiple directions
Given a component uses `slideVariant` with direction "up"
When the element enters
Then it slides up from below (20px offset) while fading in

### Scenario: Scale variant animates element size
Given a component uses the `scaleVariant` animation
When the element enters
Then it scales from `0.95` to `1.0` while fading in
And the transition uses `duration-default` (200ms) with `easing-default`

### Scenario: Stagger children variant animates items sequentially
Given a container uses the `staggerContainer` variant with 3 child items
When the container enters
Then each child animates in sequence with a 50ms stagger delay
And the container completes its own animation before children start (`when: "beforeChildren"`)

### Scenario: Page transition variant handles step-to-step navigation
Given the creation flow moves from Step 1 to Step 2
When the transition occurs
Then the current step slides out to the left while fading
And the next step slides in from the right while fading in
And both transitions use `duration-slow` (300ms)

### Scenario: Page transition handles backward navigation
Given the creation flow moves from Step 3 back to Step 2
When the user navigates backward
Then the current step slides out to the right
And the previous step slides in from the left
And the direction is reversed from forward navigation

### Scenario: Selection feedback variant provides satisfying confirmation
Given a selectable card uses the `selectionVariant`
When the user clicks the card
Then the card briefly scales to `1.02` and back to `1.0`
And the transition uses `duration-fast` (100ms) with `easing-spring`

---

## Feature: Tooltip Component

### Scenario: Tooltip displays contextual guidance on hover
Given a form field has a tooltip with text "We'll use this to find luxury transactions in your area"
When the agent hovers over the help icon
Then a tooltip appears near the icon with the guidance text
And the tooltip uses `color-surface-elevated` background with `shadow-lg`
And text renders in `font-sans`, `text-sm`, `color-text`

### Scenario: Tooltip appears with entrance animation
Given a tooltip is triggered
When it becomes visible
Then it fades in and scales up from `0.95` using `duration-fast` (100ms)

### Scenario: Tooltip disappears on mouse leave
Given a tooltip is currently visible
When the agent moves the mouse away from the trigger
Then the tooltip fades out over `duration-fast` (100ms)
And the tooltip is removed from the DOM after animation completes

### Scenario: Tooltip supports configurable placement
Given a tooltip is configured with placement "top"
When the tooltip is triggered
Then it appears above the trigger element
And it is centered horizontally relative to the trigger

### Scenario: Tooltip supports bottom placement
Given a tooltip is configured with placement "bottom"
When the tooltip is triggered
Then it appears below the trigger element

### Scenario: Tooltip supports right placement
Given a tooltip is configured with placement "right"
When the tooltip is triggered
Then it appears to the right of the trigger element

### Scenario: Tooltip supports left placement
Given a tooltip is configured with placement "left"
When the tooltip is triggered
Then it appears to the left of the trigger element

### Scenario: Tooltip does not overflow the viewport
Given a tooltip trigger is near the right edge of the screen
When the tooltip is triggered with placement "right"
Then the tooltip repositions to avoid overflowing the viewport
And the tooltip remains fully visible

### Scenario: Tooltip is accessible via keyboard
Given a tooltip trigger has focus
When the agent presses Enter or focuses the trigger
Then the tooltip becomes visible
And the tooltip has role="tooltip" with proper aria attributes
And pressing Escape dismisses the tooltip

### Scenario: Tooltip supports rich content
Given a tooltip is configured with a React node as content
When the tooltip is triggered
Then it renders the rich content (not just plain text)
And the tooltip maintains proper styling

---

## Feature: Animated Container Component

### Scenario: AnimatedContainer wraps children with entrance animation
Given a page section uses AnimatedContainer
When the section mounts
Then its children animate in using the specified variant (default: fade)
And the animation only plays once on initial mount

### Scenario: AnimatedContainer supports variant selection
Given an AnimatedContainer is configured with variant "slide" and direction "up"
When the container mounts
Then children slide in from below while fading

### Scenario: AnimatedContainer supports stagger for lists
Given an AnimatedContainer wraps a list of 5 market cards
When the container mounts
Then each card animates in sequence with stagger delay
And the visual effect is a cascading entrance

### Scenario: AnimatedContainer passes className to the wrapper
Given an AnimatedContainer is configured with a className prop
When the container mounts
Then the wrapper element includes the provided class name

---

## User Journey

1. Developer installs Framer Motion and imports animation utilities
2. **Animation & UX Infrastructure** provides all shared primitives
3. Unified Creation Flow Shell (#151) uses page transitions and stagger
4. Each step (#152-#157) uses fade/slide/scale variants and Tooltip
5. Dashboard redesign (#159) uses entrance animations

---

## UI Mockup

### Tooltip Component

```
┌─ Form Field ────────────────────────────────────────────────┐
│                                                              │
│  Your Market                              [?]  <── trigger   │
│  ┌──────────────────────────────────────────┐                │
│  │ Naples, FL                               │                │
│  └──────────────────────────────────────────┘                │
│                                                              │
│       ┌─ Tooltip (bg: surface-elevated, shadow: lg) ─────┐  │
│       │  We'll use this to find luxury transactions      │  │
│       │  in your area.                                    │  │
│       │  (font: sans, text: sm, color: text)             │  │
│       └──────────────────────────────────────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Animation Variant Library

```
┌─ Animation Variants (lib/animations.ts) ─────────────────────┐
│                                                               │
│  fadeVariant                                                  │
│  ├── initial:  { opacity: 0 }                                │
│  ├── animate:  { opacity: 1 }                                │
│  └── exit:     { opacity: 0 }                                │
│      transition: 300ms, easing-default                        │
│                                                               │
│  slideVariant(direction)                                      │
│  ├── initial:  { opacity: 0, x/y: +/-20px }                 │
│  ├── animate:  { opacity: 1, x/y: 0 }                       │
│  └── exit:     { opacity: 0, x/y: -/+20px }                 │
│      transition: 300ms, easing-default                        │
│                                                               │
│  scaleVariant                                                 │
│  ├── initial:  { opacity: 0, scale: 0.95 }                  │
│  ├── animate:  { opacity: 1, scale: 1 }                     │
│  └── exit:     { opacity: 0, scale: 0.95 }                  │
│      transition: 200ms, easing-default                        │
│                                                               │
│  selectionVariant                                             │
│  ├── tap:      { scale: 1.02 }                               │
│  └── transition: 100ms, easing-spring                         │
│                                                               │
│  staggerContainer                                             │
│  ├── animate:  { transition: { staggerChildren: 0.05 } }    │
│  └── children use any of the above variants                   │
│                                                               │
│  pageTransition(direction: 'forward' | 'backward')            │
│  ├── enter: slide in from right (forward) / left (backward)  │
│  ├── exit:  slide out to left (forward) / right (backward)   │
│  └── transition: 300ms, easing-default                        │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### Step Indicator Enhancement (visual target)

```
┌─ Refined Step Indicator ─────────────────────────────────────┐
│                                                               │
│   ● Your Market  ──────  ● Your Tier  ──────  ○ Your Focus  │
│   (accent, bold)         (accent, bold)        (text-tertiary)│
│                                                               │
│   ○ Your Audience ──────  ○ Review  ──────  ○ Generating     │
│   (text-tertiary)         (text-tertiary)    (text-tertiary)  │
│                                                               │
│   ● = completed/active (color-accent, filled)                 │
│   ○ = pending (color-border, hollow)                          │
│   ── = connector line (accent if complete, border if pending) │
│                                                               │
│   Step names use persona vocabulary:                          │
│   "Your Market" not "Geography Setup"                         │
│   "Your Audience" not "Persona Selection"                     │
│   "Review" not "Configuration Summary"                        │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

## Component References

- Tooltip: `.specs/design-system/components/tooltip.md` (stub -- create)
- AnimatedContainer: `.specs/design-system/components/animated-container.md` (stub -- create)
- StepIndicator (existing): `components/markets/step-indicator.tsx` (to be enhanced in #151)

---

## Design Token Usage

| Element | Tokens Used |
|---------|-------------|
| Tooltip background | `color-surface-elevated`, `shadow-lg` |
| Tooltip text | `font-sans`, `text-sm`, `color-text` |
| Tooltip border | `color-border`, `radius-md` |
| Fade transition | `duration-slow` (300ms), `easing-default` |
| Scale transition | `duration-default` (200ms), `easing-default` |
| Selection feedback | `duration-fast` (100ms), `easing-spring` |
| Stagger delay | 50ms (derived from `duration-fast`) |
| Slide offset | 20px (derived from `spacing-6` / 24px, slightly less) |

---

## Implementation Notes

- **Framer Motion v11+** required for React 19 compatibility
- All animation components must be `"use client"` -- Framer Motion uses React hooks
- Animation variants live in `lib/animations.ts` as plain objects (importable by any client component)
- Tooltip uses `React.createPortal` for viewport escape
- Tooltip positioning via simple offset calculation -- no heavy positioning library needed for v1
- The existing `StepIndicator` component in `components/markets/step-indicator.tsx` will be enhanced in feature #151, not here. This feature provides the animation primitives it will use.
- All animation durations and easings match the design tokens in `tokens.md`

---

## Acceptance Criteria Summary

1. `framer-motion` is installed and imports work in client components
2. `lib/animations.ts` exports: `fadeVariant`, `slideVariant`, `scaleVariant`, `selectionVariant`, `staggerContainer`, `pageTransition`
3. `components/ui/tooltip.tsx` renders accessible tooltips with entrance/exit animations, configurable placement, and viewport-aware repositioning
4. `components/ui/animated-container.tsx` wraps children with selectable animation variants
5. All animations use design token durations and easings
6. No hydration errors with Next.js App Router
7. Components are keyboard accessible (tooltip: Enter/Escape, aria-describedby)

---

## Learnings

### 2026-03-10
- **Gotcha**: Framer Motion v12 `Easing` type requires `import type { Easing } from "framer-motion"` — `as const` readonly tuples and `as number[]` casts both fail TypeScript strict checks. Annotate constants directly: `const EASING_DEFAULT: Easing = [0.4, 0, 0.2, 1]`.
- **Decision**: Animation variants live in `lib/animations.ts` as plain objects (no React dependency). Components that use them (`"use client"`) import the variants. This keeps the animation data importable without forcing a client boundary.
- **Pattern**: Tooltip uses `createPortal` to `document.body` for viewport escape. Portal target is set in a `useEffect` (not inline `document.body`) to avoid SSR hydration mismatch. Position is computed via `requestAnimationFrame` after showing, giving the portal element one frame to render before measuring.
- **Decision**: Created `StaggerItem` as a companion to `AnimatedContainer` — stagger containers need children wrapped in their own `motion.div` with the child variant. Without `StaggerItem`, consumers would need to manually wire `motion.div` + `variants` on each child.
