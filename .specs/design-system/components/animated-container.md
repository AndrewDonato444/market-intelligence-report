# AnimatedContainer

**Status**: ✅ Documented
**Created**: 2026-03-10
**Source**: `components/ui/animated-container.tsx`
**Spec**: `.specs/features/ux-redesign/animation-ux-infrastructure.feature.md`

## Purpose

Wrapper component that applies Framer Motion entrance animations to its children. Supports fade, slide, scale, and stagger variants. Used as the building block for all animated sections in the creation flow.

## Props

### AnimatedContainer

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"fade" \| "slide" \| "scale" \| "stagger"` | `"fade"` | Animation variant |
| `direction` | `"left" \| "right" \| "up" \| "down"` | `"up"` | Direction for slide variant |
| `className` | `string` | — | Class on the wrapper div |
| `children` | `React.ReactNode` | required | Content to animate |

### StaggerItem

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"fade" \| "slide" \| "scale"` | `"fade"` | Animation for each child |
| `direction` | `SlideDirection` | `"up"` | Direction for slide variant |
| `className` | `string` | — | Class on the wrapper div |
| `children` | `React.ReactNode` | required | Content |

## Variants

- **fade**: opacity 0 → 1, 300ms
- **slide**: offset 20px + fade, 300ms, configurable direction
- **scale**: 0.95 → 1.0 + fade, 200ms
- **stagger**: children animate in sequence with 50ms delay

## Usage Examples

```tsx
// Simple fade-in section
<AnimatedContainer>
  <DashboardCard />
</AnimatedContainer>

// Slide up from below
<AnimatedContainer variant="slide" direction="up">
  <FormSection />
</AnimatedContainer>

// Staggered list
<AnimatedContainer variant="stagger">
  {markets.map(m => (
    <StaggerItem key={m.id}>
      <MarketCard market={m} />
    </StaggerItem>
  ))}
</AnimatedContainer>
```

## Design Tokens

- Fade: `duration-slow` (300ms), `easing-default`
- Scale: `duration-default` (200ms), `easing-default`
- Stagger: 50ms delay between children
