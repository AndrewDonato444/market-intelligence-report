/**
 * Shared math utilities for market analytics computation.
 */

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Clamp a value between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Calculate percentage change between two values.
 * Returns null if prior is zero or either value is null.
 */
export function percentChange(
  current: number | null,
  prior: number | null
): number | null {
  if (current == null || prior == null || prior === 0) return null;
  return (current - prior) / prior;
}
