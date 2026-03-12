/**
 * Data Analyst — Types & Computation Functions
 *
 * Originally the first agent in the v1 pipeline. In v2, the agent execution
 * logic has been replaced by:
 *   - Layer 0: data-fetcher.ts (API calls)
 *   - Layer 1: market-analytics.ts (computation)
 *
 * This module is kept as a re-export shim for types and pure computation
 * functions that are used across the codebase.
 */

import type { PropertySummary } from "@/lib/connectors/realestateapi";
import { median, average } from "@/lib/utils/math";

// Re-export math utilities for backward compatibility
export { median, average } from "@/lib/utils/math";

// --- Output types ---

export interface DataAnalystOutput {
  market: {
    totalProperties: number;
    medianPrice: number;
    averagePrice: number;
    medianPricePerSqft: number | null;
    totalVolume: number;
    rating: string;
  };
  segments: SegmentMetrics[];
  yoy: YoYMetrics;
  confidence: {
    level: "high" | "medium" | "low";
    staleDataSources: string[];
    sampleSize: number;
  };
}

export interface SegmentMetrics {
  name: string;
  propertyType: string;
  count: number;
  medianPrice: number;
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  medianPricePerSqft: number | null;
  rating: string;
  lowSample: boolean;
  /** Segment-specific YoY metrics (computed per property type, not market-wide) */
  yoy: YoYMetrics | null;
}

export interface YoYMetrics {
  medianPriceChange: number | null;
  volumeChange: number | null;
  pricePerSqftChange: number | null;
  averagePriceChange: number | null;
  totalVolumeChange: number | null;
  /** Median Days on Market change (set from PropertyDetail cohort data) */
  domChange: number | null;
  /** List-to-Sale Ratio change (set from PropertyDetail cohort data) */
  listToSaleChange: number | null;
}

// --- Core computations ---

export function computeSegmentMetrics(
  properties: PropertySummary[],
  segmentName: string
): SegmentMetrics {
  const prices = properties
    .map((p) => p.price ?? p.lastSalePrice)
    .filter((p): p is number => p != null);

  const sqftValues = properties
    .map((p) => (p.price != null && p.sqft != null ? p.price / p.sqft : null))
    .filter((v): v is number => v != null);

  const medianPsf = sqftValues.length > 0 ? median(sqftValues) : null;

  return {
    name: segmentName,
    propertyType: segmentName,
    count: properties.length,
    medianPrice: median(prices),
    averagePrice: average(prices),
    minPrice: prices.length > 0 ? Math.min(...prices) : 0,
    maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
    medianPricePerSqft: medianPsf,
    rating: "B", // Placeholder — assigned later with YoY context
    lowSample: properties.length < 3,
    yoy: null, // Set later by computeMarketAnalytics with per-segment YoY
  };
}

export function computeYoY(
  currentYear: PropertySummary[],
  priorYear: PropertySummary[]
): YoYMetrics {
  if (priorYear.length === 0) {
    return {
      medianPriceChange: null,
      volumeChange: null,
      pricePerSqftChange: null,
      averagePriceChange: null,
      totalVolumeChange: null,
      domChange: null,
      listToSaleChange: null,
    };
  }

  const currentPrices = currentYear
    .map((p) => p.lastSalePrice)
    .filter((p): p is number => p != null);
  const priorPrices = priorYear
    .map((p) => p.lastSalePrice)
    .filter((p): p is number => p != null);

  const currentMedian = median(currentPrices);
  const priorMedian = median(priorPrices);

  const medianPriceChange =
    priorMedian > 0 ? (currentMedian - priorMedian) / priorMedian : null;

  const volumeChange =
    priorYear.length > 0
      ? (currentYear.length - priorYear.length) / priorYear.length
      : null;

  // Price per sqft YoY
  const currentPsf = currentYear
    .filter((p) => p.lastSalePrice != null && p.sqft != null)
    .map((p) => p.lastSalePrice! / p.sqft!);
  const priorPsf = priorYear
    .filter((p) => p.lastSalePrice != null && p.sqft != null)
    .map((p) => p.lastSalePrice! / p.sqft!);

  const currentMedianPsf = currentPsf.length > 0 ? median(currentPsf) : null;
  const priorMedianPsf = priorPsf.length > 0 ? median(priorPsf) : null;

  const pricePerSqftChange =
    currentMedianPsf != null && priorMedianPsf != null && priorMedianPsf > 0
      ? (currentMedianPsf - priorMedianPsf) / priorMedianPsf
      : null;

  // Average price YoY
  const currentAvg = average(currentPrices);
  const priorAvg = average(priorPrices);
  const averagePriceChange =
    priorAvg > 0 ? (currentAvg - priorAvg) / priorAvg : null;

  // Total sales volume YoY
  const currentTotal = currentPrices.reduce((sum, p) => sum + p, 0);
  const priorTotal = priorPrices.reduce((sum, p) => sum + p, 0);
  const totalVolumeChange =
    priorTotal > 0 ? (currentTotal - priorTotal) / priorTotal : null;

  return {
    medianPriceChange, volumeChange, pricePerSqftChange, averagePriceChange, totalVolumeChange,
    domChange: null,        // Set later from PropertyDetail cohort data
    listToSaleChange: null, // Set later from PropertyDetail cohort data
  };
}

export function assignRating(
  priceChange: number | null,
  volumeChange: number | null,
  sampleSize: number
): string {
  // Insufficient data
  if (sampleSize < 3 || priceChange == null) {
    return "C";
  }

  // Both declining
  if (priceChange < 0 && (volumeChange ?? 0) < 0) {
    return "C+";
  }

  // Flat or slight decline
  if (priceChange <= 0) {
    return "B";
  }

  // Slight growth 0-5%
  if (priceChange < 0.05) {
    return "B+";
  }

  // Moderate growth 5-10%
  if (priceChange < 0.10) {
    return "A";
  }

  // Strong growth > 10%
  return "A+";
}

