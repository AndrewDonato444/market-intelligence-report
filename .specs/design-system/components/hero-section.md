# HeroSection

**Status**: Stub (pending implementation)

## Purpose
Full-viewport hero with full-bleed photography and dark navy overlay. Editorial magazine cover feel — not a SaaS landing page. The photography is architecture, not decoration.

## Props
- `headline`: string
- `subheadline`: string
- `ctaText`: string
- `ctaHref`: string
- `backgroundImage?`: string (path to photo — fallback to gradient if absent)

## Design Tokens
- Background: full-bleed photo with `color-primary` overlay at 85% opacity
- Headline: `font-serif` (Playfair), `text-5xl`, `font-light`, `color-text-inverse`
- Accent line: `color-accent`, 2px height, 80px width
- Subheadline: `font-sans` (Inter), `text-lg`, `color-text-tertiary`, max-width 480px, line-height 1.6
- CTA: `bg: color-accent`, `color-primary`, `radius-sm`, uppercase, tracking-wide, px-8 py-3

## Photography Direction
- Subjects: Gulf coast architecture, clean lines, coastal landscaping
- Mood: Morning light or golden hour, warm, slightly desaturated
- Never: stock photos, tourist imagery, identifiable faces, HDR

## Variants
(To be documented after implementation)
