# DataCallout

**Status**: Stub (pending implementation)

## Purpose
Oversized data figure styled as a design element — the Knox Brothers "Data as Art" pattern. A large number draws the eye, a gold accent line provides structure, and a supporting context line provides meaning. Turns statistics into narrative moments.

## Props
- `value`: string (e.g., "31", "7", "3.2%")
- `label`: string (supporting context line)

## Design Tokens
- Number: `font-serif` (Playfair), `text-5xl`, `color-accent`
- Accent line: `color-accent`, 2px, 24px wide
- Label: `font-sans` (Inter), `text-sm`, `color-text-secondary`
- Spacing: `spacing-4` between number, line, and label

## Usage
Used in a row of 3 on the marketing landing page. Can be reused in report preview or dashboard contexts.

## Responsive
- Desktop: horizontal row with generous spacing
- Mobile: stacked vertically, centered

## Variants
(To be documented after implementation)
