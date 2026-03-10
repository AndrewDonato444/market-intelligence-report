# PersonaCard

**Status**: 📝 Stub (pending implementation)
**Created**: 2026-03-10

## Purpose

Displays a buyer persona archetype as a selectable card in the report builder wizard's Personas step. Shows the persona name, tagline, primary motivation pill, and a Preview link. Supports selected state with numbered badge (1, 2, or 3).

## Props

_To be documented after implementation._

## Variants

- **Default**: Unselected card with border-border
- **Selected**: border-accent, bg-accent-light, numbered badge
- **Hover**: border-border-strong (unselected only)
- **Disabled**: When max 3 already selected (muted appearance)

## Design Tokens Used

- `color-border`, `color-border-strong`, `color-accent`, `color-accent-light`
- `color-primary-light` (motivation pill)
- `font-serif` (persona name), `font-sans` (tagline, pill)
- `text-lg`, `text-xs`
- `radius-sm`, `radius-full` (badge)
- `spacing-3` (padding)

## Usage

Used in: `components/reports/report-wizard.tsx` (Personas step)
