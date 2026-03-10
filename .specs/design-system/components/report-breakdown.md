# ReportBreakdown

**Status**: Stub (pending implementation)

## Purpose
Dark navy section displaying the 8 report sections. Uses gold accent lines (not icons) to mark each item. Communicates depth with restraint — not an exhaustive feature list.

## Props
- `heading`: string
- `sections`: Array<{ title: string, description: string }>

## Design Tokens
- Background: `color-primary`
- Heading: `font-serif`, `text-3xl`, `color-text-inverse`, centered
- Accent line below heading: `color-accent`, 60px, centered
- Item accent: `color-accent`, 2px, 16px wide
- Item title: `font-sans`, `font-medium`, `color-text-inverse`
- Item description: `font-sans`, `text-sm`, `color-text-tertiary`
- Spacing: `spacing-4` between items, generous vertical padding

## Responsive
- Desktop: 2-column grid (4 items each)
- Mobile: single column

## Variants
(To be documented after implementation)
