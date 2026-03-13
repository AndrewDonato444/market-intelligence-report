# TrendIndicator

**Status**: 📝 Stub (pending implementation)
**File**: `lib/pdf/components/data-viz.tsx`
**Created**: 2026-03-13

## Purpose

React-PDF native compact trend indicator showing a metric name, percentage change, and directional arrow. Used in the "At a Glance" Market Intelligence Summary page for YoY trend display.

## Props

| Prop | Type | Description |
|------|------|-------------|
| `label` | `string` | Metric name (e.g., "Median Price") |
| `change` | `number` | Percentage change (e.g., 8.2 or -12.4) |

## Visual Spec

- Single row: label (left) + formatted percentage (right) + directional arrow
- Positive: `color-success` + up arrow
- Negative: `color-error` + down arrow
- Flat (within ±1%): `color-text-secondary` + right arrow

## Design Tokens

- Label: `font-sans`, `text-sm`, `color-text`
- Value: `font-sans`, `text-sm`, `font-semibold`
- Positive: `color-success` (#15803D)
- Negative: `color-error` (#B91C1C)
- Neutral: `color-text-secondary` (#475569)

## Variants

_(To be documented after implementation)_

## Usage Examples

_(To be documented after implementation)_
