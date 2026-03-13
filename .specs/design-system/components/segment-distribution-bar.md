# SegmentDistributionBar

**Status**: 📝 Stub (pending implementation)
**File**: `lib/pdf/components/data-viz.tsx`
**Created**: 2026-03-13

## Purpose

React-PDF native horizontal bar chart for rendering transaction distribution by market segment. Used in the "At a Glance" Market Intelligence Summary page to show how transactions are distributed across price tiers.

## Props

| Prop | Type | Description |
|------|------|-------------|
| `segments` | `Array<{ name: string; count: number; percentage: number }>` | Segments with name, count, and share percentage |
| `totalCount` | `number` | Total transactions across all segments |

## Visual Spec

- Each segment is a horizontal bar with proportional width
- Legend below shows segment name, count, and percentage
- Colors from chart palette: `chart-primary`, `chart-secondary`, `chart-tertiary`, `chart-accent`
- Segments < 3% grouped into "Other"

## Design Tokens

- Bar colors: `chart-primary`, `chart-secondary`, `chart-tertiary`, `chart-accent`
- Labels: `font-sans`, `text-xs`, `color-text`
- Legend: `font-sans`, `text-xs`, `color-text-secondary`

## Variants

_(To be documented after implementation)_

## Usage Examples

_(To be documented after implementation)_
