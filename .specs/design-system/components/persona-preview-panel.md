# PersonaPreviewPanel

**Status**: 📝 Stub (pending implementation)
**Created**: 2026-03-10

## Purpose

Expandable panel that appears below the persona card grid when an agent clicks "Preview" on a persona card. Shows detailed persona intelligence: profile overview, what wins them, biggest fear, key vocabulary pills, top report metrics, and a sample talking point.

## Props

_To be documented after implementation._

## Variants

- **Open**: Panel visible with persona details
- **Closed**: Panel hidden (default)

## Design Tokens Used

- `color-background` (panel bg), `color-surface` (talking point bg)
- `color-primary` (persona name), `color-accent` (accent line)
- `color-text`, `color-text-secondary`, `color-text-tertiary`
- `color-border` (vocabulary pills border)
- `font-serif` (persona name), `font-sans` (body text)
- `text-xl`, `text-sm`, `text-xs`
- `radius-sm` (panel), `spacing-4` (padding), `spacing-2` (inner padding)

## Usage

Used in: `components/reports/report-wizard.tsx` (Personas step)
