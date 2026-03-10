# LandingNav

**Status**: Stub (pending implementation)

## Purpose
Fixed minimal navigation bar for the marketing page. Transparent over the hero, transitions to warm white on scroll. Contains serif wordmark and understated auth links. No aggressive CTA styling in the nav.

## Props
- `signInHref`: string
- `ctaText`: string
- `ctaHref`: string

## Design Tokens
- Background: transparent → warm white (not cold #FFF) on scroll
- Border bottom: `color-border` (visible when scrolled only)
- Wordmark: `font-serif` (Playfair), `text-base`
  - Over hero: `color-text-inverse`
  - Over content: `color-primary`
- Sign In: text link, understated
  - Over hero: `color-text-tertiary` (light)
  - Over content: `color-text-secondary`
- Request Access: understated text link (not a button in nav)
- Transition: `duration-default`, `ease-default`

## Behavior
- Client component (`"use client"`)
- `useEffect` + scroll listener (or IntersectionObserver) for background transition
- Respects `prefers-reduced-motion`

## Variants
(To be documented after implementation)
