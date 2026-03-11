# ToggleCard

**Status**: Stub (pending implementation)
**Created**: 2026-03-10

## Purpose

A reusable toggleable card component for multi-select scenarios. Used in the creation flow for selecting market segments and property types (Step 3: Your Focus).

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `string` | Yes | The value identifier for this option |
| `label` | `string` | Yes | Display label |
| `description` | `string` | No | One-line description shown below label |
| `icon` | `string` | No | Icon/emoji displayed on the card |
| `selected` | `boolean` | Yes | Whether the card is currently selected |
| `popular` | `boolean` | No | Shows "Popular in your area" badge |
| `onToggle` | `(value: string) => void` | Yes | Called when the card is clicked |

## Variants

- **Default**: `bg: surface, border: border, radius: md, shadow: sm`
- **Hover**: `border: border-strong, shadow: md`
- **Selected**: `bg: accent-light, border: accent, shadow: sm`

## Animation

- Selection: `scale: 1.02` with `easing-spring`, then settle to `1.0`
- Deselection: `scale: 1.0` with default easing
- `whileTap={{ scale: 0.98 }}`
- Border/background transitions use `duration-default`

## Accessibility

- Renders as `<button>` with `role="switch"` and `aria-checked`
- Keyboard: Tab to focus, Enter/Space to toggle
- "Popular" badge includes screen reader text

## Usage

```tsx
<ToggleCard
  value="waterfront"
  label="Waterfront"
  description="Lakefront, riverfront, and canal-front properties"
  icon="🏖"
  selected={selectedSegments.includes("waterfront")}
  popular={smartDefaults.segments.includes("waterfront")}
  onToggle={handleSegmentToggle}
/>
```

## Design Tokens Used

- `color-surface`, `color-accent-light`, `color-accent`
- `color-border`, `color-border-strong`
- `color-text`, `color-text-secondary`
- `radius-md`, `radius-full` (badge)
- `shadow-sm`, `shadow-md`
- `spacing-2`, `spacing-3`, `spacing-4`
- `text-sm`, `text-xs`
- `duration-default`, `easing-spring`
