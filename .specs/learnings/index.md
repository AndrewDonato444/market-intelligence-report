# Learnings Index

Cross-cutting patterns learned in this codebase. Updated via `/compound`.

## Quick Reference

| Category | File | Summary |
|----------|------|---------|
| Testing | [testing.md](./testing.md) | Mocking, assertions, test patterns |
| Performance | [performance.md](./performance.md) | Optimization, lazy loading, caching |
| Security | [security.md](./security.md) | Auth, cookies, validation |
| API & Data | [api.md](./api.md) | Endpoints, data handling, errors |
| Design System | [design.md](./design.md) | Tokens, components, accessibility |
| General | [general.md](./general.md) | Other patterns |

---

## Recent Learnings

<!-- /compound adds recent learnings here - newest first -->

### 2026-03-11 — Step 3: Your Focus (ToggleCard pattern)

- **Framer Motion mock must include all element types** (`testing.md`): When adding `motion.button` to a component, ALL test files that render that component (including parent shell tests) must include `motion.button` in their framer-motion mock. Missing element types cause "Element type is invalid: got undefined" errors
- **ToggleCard as unified toggle pattern** (`design.md`): A single `ToggleCard` component with `role="switch"` + `aria-checked` handles both segments and property types — no need for separate `SegmentCard` / `PropertyTypeCard` components. Props: `value`, `label`, `description?`, `icon`, `selected`, `popular`, `onToggle`
- **Smart defaults via static state mapping** (`general.md`): For v1, map state abbreviations to default selections rather than calling APIs. Compute once via `useMemo` on mount, initialize `useState` with the result. "Popular" badges use a stable `Set` from the defaults that doesn't change on toggle
- **Validation + emission pattern for multi-select steps** (`general.md`): Use two `useEffect` hooks — one for `onValidationChange(isValid)`, one for `onStepComplete(data)` that only fires when valid. For toggle-based steps, the empty state prompt shows only when `!isValid && defaultSegments.length === 0`

### 2026-03-10 — Animation & UX Infrastructure

- **Framer Motion v12 Easing type** (`design.md`): Use `import type { Easing }` and annotate constants — `as const` and `as number[]` both fail strict TS
- **Variant data vs components** (`design.md`): Keep animation variant objects in `lib/animations.ts` (no React) separate from `"use client"` components
- **Portal tooltip positioning** (`design.md`): `createPortal` + `useEffect` for portal target + `requestAnimationFrame` for position measurement
- **Framer Motion JSDOM mock** (`testing.md`): Replace `motion.div` with plain `div` via `forwardRef`, destructure away animation props, `AnimatePresence` → `Fragment`

### 2026-03-10 — Persona Content in PDF Template

- **PDF renderer dispatch pattern** (`design.md`): Register in RENDERER_MAP, export component, getSectionRenderer dispatches by sectionType string
- **Cross-cutting callout injection** (`design.md`): Add PersonaFramingCallout at SectionPage level (not per-renderer) — avoids duplicating logic across 4 renderers
- **Data source humanization** (`general.md`): camelCase dot-notation keys → title case via regex split + capitalize; special-case "yoy" → "YoY"
- **getAllByText for multi-match** (`testing.md`): When rendered content repeats across personas/sections, use `getAllByText().length > 0` instead of `getByText` which throws on multiple matches

### 2026-03-10 — Persona Intelligence Agent

- **Agent template pattern** (`general.md`): 4-step pipeline registration: agent file → ALL_AGENTS → SECTION_REGISTRY_V2 → section-grouping loop
- **Claude agent test mocking** (`testing.md`): Mock `@anthropic-ai/sdk` class, build `buildMockClaudeResponse(n)` helper, mock DB services with full schema shapes
- **Error tagging for retry** (`api.md`): Tag all agent errors with `retriable: boolean` — 429/500/503 and JSON parse → true, abort/400 → false
- **Graceful upstream degradation** (feature spec): Note missing upstreams in prompt instead of throwing — partial context still produces useful output

### 2026-03-10 — Persona Selection UI

- **Wizard step insertion pattern** (`general.md`): When inserting a step, update STEPS array and shift all step index conditionals
- **Pre-fetch on mount** (`general.md`): Fetch personas when wizard mounts, not on step transition — avoids loading spinners
- **Card selection with data attributes** (`design.md`): Use `data-selected="true|false"` for both styling and test assertions
- **Preview panel toggle pattern** (`design.md`): Single `previewPersonaSlug` state, toggle on click, switch on different card click
- **Regex exact matching** (`testing.md`): Use `^(A|B|C)$` anchors to avoid partial string matches in `getAllByText`
- **Multi-step wizard test helpers** (`testing.md`): Extract `renderAtStepN()` to reduce setup duplication

### 2026-03-09 — Admin Dashboard + Eval Suite

- **Route groups vs real directories** (`general.md`): `app/(admin)/` doesn't create a URL segment — use `app/admin/` instead
- **jest.mock fails on non-existent modules** (`testing.md`): Use local mock functions in TDD when target module doesn't exist yet
- **@testing-library/jest-dom import required** (`testing.md`): Must explicitly import for DOM matchers
- **Role-based admin auth pattern** (`security.md`): `requireAdmin()` composes auth ID + profile role check
- **Split environment gotchas** (`general.md`): Remote auth + local DB requires manual profile row insertion
- **Never `supabase db reset`** (`general.md`): Destroys all local data; use `node -e` or Studio SQL Editor

---

## How This Works

1. **Feature-specific learnings** → Go in the spec file's `## Learnings` section
2. **Cross-cutting learnings** → Go in category files below
3. **General patterns** → Go in `general.md`

The `/compound` command analyzes your session and routes learnings to the right place.
