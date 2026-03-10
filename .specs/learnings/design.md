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

_No learnings yet._

---

## Animation

<!-- Motion patterns, transitions -->

### 2026-03-10
- **Pattern**: Fixed nav transparency→solid scroll transition: use `useEffect` + scroll listener with `{ passive: true }`. Toggle a `scrolled` boolean state at 50px threshold. Apply `transition-colors duration-[var(--duration-default)] ease-[var(--ease-default)]` on the nav. Background goes from `bg-transparent` to `bg-[var(--color-report-bg)]` (warm white, not cold #FFF).

---

## Editorial Landing Page Patterns

### 2026-03-10
- **Pattern**: "Data as Art" callouts — oversized Playfair numbers (`text-5xl`, `color-accent`) with a small gold accent line (`w-6 h-0.5`) and supporting context in `text-sm` Inter. These turn statistics into narrative moments per the Knox Brothers creative brief.
- **Pattern**: Full-bleed photography sections use `relative` container with an `absolute inset-0` overlay div at 85% opacity over `color-primary`. The text sits in a `relative z-10` inner container. This pattern works for hero and closing sections. When real images are added, swap the overlay's bg-color div for a `next/image` with `fill` prop + the same overlay on top.
- **Pattern**: Warm vs cold section alternation creates visual rhythm. Use `color-surface` (#FFF) for data-focused sections and `color-report-bg` (#FAFAF9, warm off-white) for editorial/narrative sections. Dark sections use `color-primary` for contrast.
- **Decision**: CTA language for luxury market: "Request a Sample Report" (consultative, discreet) beats "Build Your First Report" (transactional, SaaS-y) or "Get Started" (generic). The brief's voice principle is "Strategic, Not Salesy."
- **Guardrails**: Knox Brothers creative brief hard rules — no exclamation points, no urgency language, no generic luxury adjectives, no stock photos, no cluttered layouts. These apply to both the report design and the marketing page.
