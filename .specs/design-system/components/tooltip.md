# Tooltip

**Status**: ✅ Documented
**Created**: 2026-03-10
**Source**: `components/ui/tooltip.tsx`
**Spec**: `.specs/features/ux-redesign/animation-ux-infrastructure.feature.md`

## Purpose

Contextual guidance component that appears on hover/focus. Used throughout the creation flow to explain what each field does in the agent's language — not developer jargon.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `content` | `React.ReactNode` | required | Text or rich content to display |
| `placement` | `"top" \| "bottom" \| "left" \| "right"` | `"top"` | Where to position relative to trigger |
| `children` | `React.ReactNode` | required | The trigger element |
| `className` | `string` | — | Extra class on the tooltip container |

## Variants

- **Placement**: top, bottom, left, right — automatically repositions to avoid viewport overflow
- **Entrance**: scale 0.95 → 1.0 + fade, 100ms
- **Exit**: scale 1.0 → 0.95 + fade out, 100ms

## Usage Examples

```tsx
<Tooltip content="We'll use this to find luxury transactions in your area">
  <HelpIcon />
</Tooltip>

<Tooltip
  content={<div><strong>Pro tip:</strong> Use ZIP codes for precision</div>}
  placement="bottom"
>
  <InfoButton />
</Tooltip>
```

## Accessibility

- `role="tooltip"` with unique `id`
- Trigger has `aria-describedby` pointing to tooltip
- Trigger is focusable (`tabIndex={0}`)
- Enter toggles, Escape dismisses
- Renders via `createPortal` to `document.body`

## Design Tokens

- Background: `color-surface-elevated`
- Shadow: `shadow-lg`
- Text: `font-sans`, `text-sm`, `color-text`
- Border: `color-border`, `radius-md`
- Padding: `spacing-2` × `spacing-3`
- Animation: `duration-fast` (100ms), scale 0.95 → 1.0
