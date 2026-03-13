# HorizontalBarChart

**Status**: 📝 Stub (pending implementation)
**File**: `lib/pdf/components/data-viz.tsx`
**Created**: 2026-03-13

## Purpose

React-PDF native horizontal bar chart for rendering 0-10 scale dimension scores. Used in the "At a Glance" Market Intelligence Summary page to visualize the Market Insights Index (Liquidity, Timing, Risk, Value).

## Props

| Prop | Type | Description |
|------|------|-------------|
| `dimensions` | `Array<{ label: string; score: number }>` | Array of dimension labels and their 0-10 scores |
| `maxScore` | `number` | Maximum score value (default: 10) |
| `showComposite` | `boolean` | Whether to show the composite (average) score |

## Visual Spec

- Each dimension is a row: label (left) + bar (center) + score (right)
- Bar fill uses `color-primary`, track uses `color-primary-light`
- Scale axis at bottom with gridlines at 2, 4, 6, 8, 10
- Composite score in `text-3xl`, `font-light`, `color-accent`

## Design Tokens

- Bar fill: `color-primary` (#0F172A)
- Bar track: `color-primary-light` (#F1F5F9)
- Score text: `font-sans`, `font-semibold`
- Labels: `font-sans`, `text-sm`, `color-text`
- Gridlines: `color-border` (#E2E8F0)

## Variants

_(To be documented after implementation)_

## Usage Examples

_(To be documented after implementation)_
