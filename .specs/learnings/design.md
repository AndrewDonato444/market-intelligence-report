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

_No learnings yet._

---

## Accessibility

<!-- ARIA, keyboard nav, screen readers -->

_No learnings yet._

---

## Animation

<!-- Motion patterns, transitions -->

_No learnings yet._
