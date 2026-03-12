# Design System Learnings

Patterns for UI and design system in this codebase.

---

## Token Usage

<!-- When to use which tokens, overrides -->

### 2026-03-10
- **Pattern**: PDF styles need additional color tokens not in the base set — `textTertiary` (#94A3B8) for subtle labels, `primaryLight` (#F0F4FF) for callout backgrounds, `accentLight` (#FFFBEB) for blended sections. Add these to the COLORS constant in `styles.ts` alongside existing tokens.
- **Decision**: Persona card primary/secondary distinction uses left border (3pt accent for primary, standard border for secondary) rather than background color — more subtle and professional for print PDF.

---

## Component Patterns

<!-- Common component structures, composition -->

### 2026-03-12 — Auth Page Visual Differentiation
- **Pattern**: Split-screen auth layout — layout.tsx is a minimal `flex-col md:flex-row` container; each page owns its own left panel (brand vs sizzle). This avoids route-aware logic in the layout and keeps each page self-contained.
- **Decision**: Sign-up uses gold (`color-accent`) CTA, sign-in uses navy (`color-primary`) CTA. Visual hierarchy immediately signals which page is for new users vs returning. The sign-in page also has a gold "Create Account" callout below the form to funnel users to sign-up.
- **Pattern**: Sizzle panel content should be pulled from the landing page for copy consistency — credibility stats, hero headline, testimonial brokerages. Static data only (no API calls). Feature cards use `bg-white/[0.07]` for subtle glass effect on dark backgrounds.
- **Pattern**: Confirmation state (ConfirmationSent) renders inside the same split-screen layout — the sizzle panel stays visible alongside the "Check Your Email" message so the page doesn't feel like a different app.

### 2026-03-12 — Soft Gate Banner UX (#174)
- **Decision**: Entitlement soft gate is an inline banner inside the review step, not a modal/popup. The agent can still see their configuration and edit it. Respects the flow — nothing feels like a paywall wall. Banner uses `role="alert"` for screen reader announcement, disabled button has `aria-describedby` pointing to the banner.
- **Pattern**: Usage indicator uses conditional styling: `bg-[var(--color-primary-light)]` for normal state, `bg-[var(--color-accent-light)]` for "last report" warning. Warning text uses `text-[var(--color-warning)]`. Unlimited users see no usage indicator at all — they don't need to count.
- **Pattern**: Loading skeleton for async checks — `animate-pulse` div with fixed width (w-44) during entitlement fetch. Generate button disabled while loading. `aria-busy="true"` + `aria-label="Checking report availability"` for accessibility.

### 2026-03-11 — AudiencePersonaCard pattern
- **Gotcha**: HTML spec forbids `<button>` inside `<button>`. When a card is a `<motion.button>` with `role="switch"`, any interactive child (like "Preview") must be a `<span role="link" tabIndex={0}>` with its own click/keydown handlers, not a nested `<button>`. React emits a console.error warning in dev and tests.
- **Pattern**: For step components fetching from an API (vs static data like Steps 1-3), implement three states: loading skeleton (`animate-pulse` divs), error with Retry button, and empty state. Validation should be `true` on error/empty (allows user to skip) and track selection state only after data loads.

### 2026-03-11 — ToggleCard pattern
- **Pattern**: A single `ToggleCard` component serves both segments and property types — use `role="switch"` with `aria-checked` instead of radio/checkbox. Props: `value`, `label`, `description?`, `icon`, `selected`, `popular`, `onToggle`. The `popular` flag drives a "Popular in your area" badge that persists even after deselection (tied to smart defaults, not selection state).
- **Pattern**: Card toggle styling uses CSS variable references: selected = `border-[var(--color-accent)] bg-[var(--color-accent-light)]`, hover = `border-[var(--color-border-strong)] shadow-[var(--shadow-md)]`. Matches the tier card pattern from Step 2 but uses `role="switch"` instead of `role="radio"` since multiple selections are allowed.

### 2026-03-10
- **Pattern**: For card-based selection UIs (e.g., persona cards), use `data-selected="true|false"` attributes on the container div. This enables both CSS styling via attribute selectors and easy test assertions via `card.getAttribute("data-selected")`.
- **Pattern**: Selection-order badges (numbered 1, 2, 3) should use `data-testid="selection-badge-{order}"` and be positioned `absolute top-2 right-2` within a `relative` container. The parent component passes `selectionOrder={index + 1}` where index comes from `selectedIds.indexOf(id)`.
- **Pattern**: For PDF renderers, the RENDERER_MAP dispatch pattern uses `getSectionRenderer(sectionType)` → returns component or falls back to `GenericSectionPdf`. Register new renderers by adding to the map and exporting the component. Cross-cutting concerns (like PersonaFramingCallout) belong at the SectionPage wrapper level, not inside individual renderers — avoids repeating null-check logic in 4+ renderers.
- **Decision**: Preview panels render below the card grid (not as a slide-out drawer) for simplicity. The `previewPersonaSlug` state lives in the parent wizard, toggled by clicking "Preview" on any card. Clicking a different card's Preview switches the panel; clicking the same card's Preview or "Close Preview" closes it.

---

## Responsive Design

<!-- Breakpoints, mobile-first patterns -->

### 2026-03-10
- **Pattern**: For marketing/editorial landing pages, use `text-3xl md:text-5xl` pattern for headlines — mobile gets 30px, desktop gets 48px. The 55-70 age demographic (per Knox Brothers brief) needs generous line-height (1.5-1.6x) and never sacrificing legibility for aesthetics.
- **Pattern**: Three-column layouts (pillars, process steps) use `grid-cols-1 md:grid-cols-3` or `flex-col md:flex-row`. On mobile they stack with generous gap-12; on desktop they sit side-by-side with reduced gap-8.

---

## Accessibility

<!-- ARIA, keyboard nav, screen readers -->

### 2026-03-10
- **Pattern**: Tooltips need: `role="tooltip"` on the popup, unique `id` (React `useId()`), `aria-describedby={id}` on the trigger (only when visible), `tabIndex={0}` on trigger for keyboard focus, Enter to toggle, Escape to dismiss. The trigger wraps children in a `<span>` with inline-flex display.
- **Pattern**: Portal-rendered tooltips (via `createPortal` to `document.body`) escape parent overflow/z-index stacking but need `position: absolute` with scroll-aware coordinates (`window.scrollX/Y`). Set `pointerEvents: "none"` to prevent tooltip from stealing mouse events.

---

## Animation

<!-- Motion patterns, transitions -->

### 2026-03-10
- **Gotcha**: Framer Motion v12+ with strict TS requires `Easing` type for cubic-bezier arrays — `[0.4, 0, 0.2, 1] as const` fails (readonly tuple ≠ `Easing`), `as number[]` fails (too wide). Import `Easing` from `framer-motion` and annotate: `const EASING_DEFAULT: Easing = [0.4, 0, 0.2, 1]`. This satisfies `Transition.ease` without casting.
- **Pattern**: Animation variants in `lib/animations.ts` are plain objects (no React imports) — importable by any `"use client"` component. Keep all duration/easing constants exported alongside variants so tooltip, animated-container, and future components share a single source of truth mirroring CSS custom properties.
- **Pattern**: Framer Motion components must have `"use client"` directive — they use hooks internally. Keep animation *data* (variant objects, constants) separate from animation *components* so server components can reference the data without pulling in the client boundary.
- **Pattern**: For tooltip positioning with `createPortal`, use `requestAnimationFrame(updatePosition)` after showing — the portal-rendered element needs one frame to be in the DOM before `getBoundingClientRect()` returns real dimensions.
- **Pattern**: Fixed nav transparency→solid scroll transition: use `useEffect` + scroll listener with `{ passive: true }`. Toggle a `scrolled` boolean state at 50px threshold. Apply `transition-colors duration-[var(--duration-default)] ease-[var(--ease-default)]` on the nav. Background goes from `bg-transparent` to `bg-[var(--color-report-bg)]` (warm white, not cold #FFF).

---

## Editorial Landing Page Patterns

### 2026-03-11 — Landing Page v2 Redesign
- **Pattern**: Mock report card as hero element — a styled card showing real-looking data (agent name, brokerage, index scores, segment grades) acts as both product preview and social proof. Uses `bg-[var(--color-primary)]` dark card with gold accent metrics. More effective than screenshots because it's responsive and always pixel-perfect.
- **Decision**: CTA verb upgraded from "Request" to "Commission" for v2 — aligns with advisory/luxury vocabulary. "Commission a Report" on nav CTA, "Commission Your First Report" on hero CTA. The verb implies bespoke work, not self-service SaaS.
- **Pattern**: Section alternation rhythm for v2: dark hero → light credibility strip → white gap section → warm surface for process steps → white for report breakdown → dark testimonials → warm pricing → dark final CTA. Alternating `color-primary` (dark) and `color-report-bg`/`color-surface` (light) backgrounds create visual chapters.

### 2026-03-10
- **Pattern**: "Data as Art" callouts — oversized Playfair numbers (`text-5xl`, `color-accent`) with a small gold accent line (`w-6 h-0.5`) and supporting context in `text-sm` Inter. These turn statistics into narrative moments per the Knox Brothers creative brief.
- **Pattern**: Full-bleed photography sections use `relative` container with an `absolute inset-0` overlay div at 85% opacity over `color-primary`. The text sits in a `relative z-10` inner container. This pattern works for hero and closing sections. When real images are added, swap the overlay's bg-color div for a `next/image` with `fill` prop + the same overlay on top.
- **Pattern**: Warm vs cold section alternation creates visual rhythm. Use `color-surface` (#FFF) for data-focused sections and `color-report-bg` (#FAFAF9, warm off-white) for editorial/narrative sections. Dark sections use `color-primary` for contrast.
- **Decision**: CTA language for luxury market: "Request a Sample Report" (consultative, discreet) beats "Build Your First Report" (transactional, SaaS-y) or "Get Started" (generic). The brief's voice principle is "Strategic, Not Salesy."
- **Guardrails**: Knox Brothers creative brief hard rules — no exclamation points, no urgency language, no generic luxury adjectives, no stock photos, no cluttered layouts. These apply to both the report design and the marketing page.
