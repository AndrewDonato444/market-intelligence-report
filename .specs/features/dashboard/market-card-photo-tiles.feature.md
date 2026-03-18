---
feature: Market Card Photo Tiles
domain: dashboard
source: components/dashboard/market-card.tsx
tests:
  - __tests__/dashboard/dashboard-redesign.test.tsx
components:
  - MarketCard
personas:
  - established-practitioner
status: specced
created: 2026-03-18
updated: 2026-03-18
---

# Market Card Photo Tiles

**Source File**: components/dashboard/market-card.tsx
**Design System**: .specs/design-system/tokens.md
**Personas**: .specs/personas/established-practitioner.md

## Feature: City Photo Market Cards

Premium editorial tiles showing each market as a clickable photo card. The entire tile is a link — hovering reveals a "Generate New Report" CTA overlay. City name is shown in serif font, centered on the card. The tier pill and price floor sit below the city name. No redundant "Luxury" text in the title — the pill handles that.

---

### Scenario: Card shows city name only (no tier suffix)

Given a market with name "Los Angeles Luxury" and luxuryTier "ultra_luxury"
When the card renders
Then the displayed title is "Los Angeles" (city from `geography.city`, not `market.name`)
And the tier pill reads "ULTRA LUXURY" separately
And the title does NOT contain the word "Luxury"

### Scenario: City name is centered in serif font

Given any market card
When the card renders
Then the city name uses `font-serif` (Playfair Display)
And the city name is centered horizontally on the card
And the tier pill and price floor are centered below the city name

### Scenario: Entire tile is clickable

Given any market card
When the user clicks anywhere on the tile
Then the user navigates to `/reports/create?marketId={id}`
And the entire card is wrapped in a single `<a>` or `<Link>` element

### Scenario: Hover reveals Generate New Report overlay

Given any market card at rest
When the user hovers over the tile
Then a semi-transparent dark overlay fades in over the photo
And a "Generate New Report" label appears centered in the overlay
And the card shadow elevates from `shadow-sm` to `shadow-md`

### Scenario: Hover overlay disappears on mouse leave

Given a market card with the hover overlay visible
When the user moves the cursor away
Then the overlay fades out
And the card returns to its resting state

### Scenario: Card renders with city photo

Given a market with geography that resolves to a stored image
When the dashboard loads
Then the card shows a full-width AI-generated city photo from Supabase CDN
And the photo has `aria-hidden="true"`

### Scenario: Card renders with branded gradient fallback

Given a market whose city/state does not resolve to a stored image
When the dashboard loads
Then the card shows a branded navy gradient

### Scenario: Photo loads gracefully on error

Given a card whose image URL returns an error
When the `onError` event fires
Then the card falls back to the branded navy gradient
And no layout shift occurs (fixed height container)

### Scenario: Cards maintain consistent fixed height

Given multiple markets on the dashboard
When rendered in the grid
Then all cards share the same height (220px)

---

## UI Mockup

### Resting state

```
┌─────────────────────────────────────────────────┐
│                                                   │
│        [AI-generated city photo — full bleed]     │
│                                                   │
│   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░    │  ← gradient overlay
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│                                                   │
│              Los Angeles                          │  ← font-serif, text-xl,
│          (centered, text-inverse)                  │     font-semibold, white
│                                                   │
│       [ULTRA LUXURY]  ·  $10M+ floor              │  ← tier pill + price, centered
│                                                   │
└─────────────────────────────────────────────────┘

Entire card = <Link href="/reports/create?marketId={id}">
```

### Hover state

```
┌─────────────────────────────────────────────────┐
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│  ← darker overlay (0.5 opacity)
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│                                                   │
│            Generate New Report                    │  ← text-inverse, font-sans,
│                                                   │     font-semibold, centered
│              Los Angeles                          │
│       [ULTRA LUXURY]  ·  $10M+ floor              │
│                                                   │
└─────────────────────────────────────────────────┘

shadow: shadow-md (elevated)
transition: opacity 200ms ease (duration-default)
```

---

## Implementation Notes

- **City name**: Use `market.geography.city` instead of `market.name` for the display title. This strips the tier suffix automatically.
- **Entire tile clickable**: Wrap the entire card in `<Link>`. Remove the standalone "New Report" button.
- **Hover overlay**: Use CSS `opacity-0 group-hover:opacity-100` with Tailwind's `group` pattern. No JS state needed.
- **Centered layout**: Switch from bottom-anchored flex-between to centered flex-col with `items-center justify-center`.
- **Gradient**: Keep existing bottom gradient for text legibility, but lighten it since text is now centered (not bottom-anchored).

---

## User Journey

1. User logs in → sees dashboard with welcome hero
2. **Sees market tiles as premium photo cards** ← this feature
3. Hovers a tile → sees "Generate New Report" overlay
4. Clicks tile → enters report creation flow for that market

---

## Image Pipeline

Images are AI-generated (xAI grok-imagine-image) and hosted on Supabase Storage:

1. `scripts/generate-market-images.ts` — generates images for all 168 LUXURY_CITIES
2. `scripts/upload-market-images.ts` — uploads to `market-images` public bucket on Supabase
3. Images served from: `{NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/market-images/{city-slug}-{state-abbr}.jpg`

---

## Component References

- MarketCard: components/dashboard/market-card.tsx

---

## Learnings

- AI image generation ($0.02/image) is more cost-effective and consistent than curating stock photos for 168+ cities.
- xAI grok-imagine-image: do NOT include aspect ratio instructions in prompts — causes 500 errors.
- Storing images on Supabase Storage keeps the git repo clean (~85MB of images).
