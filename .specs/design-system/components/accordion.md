# Accordion

**Status**: Stub (pending implementation)

## Purpose
Expandable/collapsible content sections. Used for FAQ on the How To page. Only one item open at a time.

## Props
- `items` — Array of `{ question: string, answer: string }`
- `defaultOpen` — Index of initially open item (optional)

## Design Tokens
- Question: font-sans, text-base, font-medium, color-text
- Answer: font-sans, text-sm, color-text-secondary
- Divider: border-b, border-border
- Chevron: color-text-secondary, duration-default rotation
- Padding: spacing-4 vertical
