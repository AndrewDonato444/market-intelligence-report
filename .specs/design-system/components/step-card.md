# StepCard

**Status**: Stub (pending implementation)

## Purpose
Displays a numbered step with title, description, and call-to-action. Used on the How To guide page.

## Props
- `stepNumber` — 1, 2, 3 etc. (rendered with gold accent)
- `title` — Step heading (serif font)
- `description` — Explanatory body text
- `ctaText` — Button label
- `ctaHref` — Link destination
- `disabled` — Mutes the CTA when a prerequisite isn't met

## Variants
- Default: Active CTA with gold accent button
- Disabled: Muted CTA with border background

## Design Tokens
- Step number: color-accent, font-serif, text-2xl
- Title: font-serif, text-xl, font-semibold
- Body: font-sans, text-base, color-text-secondary
- Card: bg-surface, shadow-sm, radius-lg, spacing-6 padding
- CTA active: bg-accent, text-white, radius-md
- CTA disabled: bg-border, color-text-secondary
