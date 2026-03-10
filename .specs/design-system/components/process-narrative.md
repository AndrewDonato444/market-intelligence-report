# ProcessNarrative

**Status**: Stub (pending implementation)

## Purpose
Three-part editorial process flow. Each step has an oversized Playfair number in gold, a one-word title, and brief description. Connected by subtle lines on desktop. Presented as a narrative, not a numbered SaaS checklist.

## Props
- `heading`: string
- `steps`: Array<{ number: string, title: string, description: string }>

## Design Tokens
- Background: warm off-white (`color-report-bg`)
- Heading: `font-serif`, `text-2xl`, `color-primary`, centered
- Accent line: `color-accent`, centered, 60px
- Step number: `font-serif`, `text-4xl`, `color-accent`, `font-light`
- Step title: `font-sans`, `font-semibold`, `color-primary`
- Step description: `font-sans`, `text-sm`, `color-text-secondary`
- Connector: `color-border`, 1px, horizontal

## Responsive
- Desktop: horizontal with connector lines
- Mobile: vertical, left-aligned numbers

## Variants
(To be documented after implementation)
