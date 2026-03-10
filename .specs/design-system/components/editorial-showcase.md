# EditorialShowcase

**Status**: Stub (pending implementation)

## Purpose
Two-column editorial spread showing the product. Left column has a serif headline, gold accent, and body copy. Right column has a stylized report preview. Feels like a magazine feature, not a product screenshot section.

## Props
- `headline`: string
- `body`: string
- `reportPreview`: ReactNode (CSS-rendered report illustration)

## Design Tokens
- Background: warm off-white (`color-report-bg` / #FAFAF9)
- Headline: `font-serif`, `text-3xl`, `color-primary`
- Accent line: `color-accent`, 2px, 40px wide
- Body: `font-sans`, `text-base`, `color-text-secondary`, line-height 1.7
- Report preview: `shadow-lg`, `radius-md`, border-bottom `color-accent` 2px

## Responsive
- Desktop: two columns, generous gap
- Tablet: two columns, reduced gap
- Mobile: stacked, copy above preview

## Variants
(To be documented after implementation)
