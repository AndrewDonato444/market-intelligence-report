/**
 * Data Analyst Agent
 *
 * First agent in the pipeline. Fetches property data via connectors,
 * computes segment-level metrics, YoY calculations, price-per-sqft ratios,
 * intelligence ratings, and market health scores.
 *
 * Pure computation — no AI/Claude calls. Structured JSON output feeds
 * all downstream agents.
 */

import type {
  AgentContext,
  AgentDefinition,
  AgentResult,
  SectionOutput,
} from "@/lib/agents/orchestrator";
import {
  searchProperties,
  buildSearchParamsFromMarket,
  type PropertySummary,
} from "@/lib/connectors/realestateapi";

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
}

export interface YoYMetrics {
  medianPriceChange: number | null;
  volumeChange: number | null;
  pricePerSqftChange: number | null;
}

// --- Helpers ---

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
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

  return { medianPriceChange, volumeChange, pricePerSqftChange };
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

// --- Main execution ---

export async function executeDataAnalyst(
  context: AgentContext
): Promise<AgentResult> {
  const start = Date.now();
  const { market } = context;

  // Fetch property data
  const searchParams = buildSearchParamsFromMarket(market);
  const searchResult = await searchProperties(searchParams, {
    userId: context.userId,
    reportId: context.reportId,
  });

  const { properties, stale } = searchResult;

  // Handle empty results
  if (properties.length === 0) {
    const emptyAnalysis: DataAnalystOutput = {
      market: {
        totalProperties: 0,
        medianPrice: 0,
        averagePrice: 0,
        medianPricePerSqft: null,
        totalVolume: 0,
        rating: "C",
      },
      segments: [],
      yoy: { medianPriceChange: null, volumeChange: null, pricePerSqftChange: null },
      confidence: {
        level: "low",
        staleDataSources: stale ? ["realestateapi"] : [],
        sampleSize: 0,
      },
    };

    return {
      agentName: "data-analyst",
      sections: buildSections(emptyAnalysis),
      metadata: { analysis: emptyAnalysis, insufficientData: true },
      durationMs: Date.now() - start,
    };
  }

  // Group by property type
  const grouped = new Map<string, PropertySummary[]>();
  for (const prop of properties) {
    const type = prop.propertyType ?? "unknown";
    const group = grouped.get(type) ?? [];
    group.push(prop);
    grouped.set(type, group);
  }

  // Compute per-segment metrics
  const segments: SegmentMetrics[] = [];
  for (const [type, props] of grouped) {
    segments.push(computeSegmentMetrics(props, type));
  }

  // Split by year for YoY
  const currentYear = new Date().getFullYear();
  const currentYearProps = properties.filter((p) => {
    if (!p.lastSaleDate) return false;
    return new Date(p.lastSaleDate).getFullYear() === currentYear;
  });
  const priorYearProps = properties.filter((p) => {
    if (!p.lastSaleDate) return false;
    return new Date(p.lastSaleDate).getFullYear() === currentYear - 1;
  });

  const yoy = computeYoY(currentYearProps, priorYearProps);

  // Assign ratings to segments
  for (const segment of segments) {
    segment.rating = assignRating(
      yoy.medianPriceChange,
      yoy.volumeChange,
      segment.count
    );
  }

  // Overall market metrics
  const allPrices = properties
    .map((p) => p.price ?? p.lastSalePrice)
    .filter((p): p is number => p != null);
  const allPsf = properties
    .filter((p) => p.price != null && p.sqft != null)
    .map((p) => p.price! / p.sqft!);

  const overallRating = assignRating(
    yoy.medianPriceChange,
    yoy.volumeChange,
    properties.length
  );

  // Confidence level
  const confidenceLevel: "high" | "medium" | "low" = stale
    ? "low"
    : properties.length < 10
      ? "medium"
      : "high";

  const analysis: DataAnalystOutput = {
    market: {
      totalProperties: properties.length,
      medianPrice: median(allPrices),
      averagePrice: average(allPrices),
      medianPricePerSqft: allPsf.length > 0 ? median(allPsf) : null,
      totalVolume: allPrices.reduce((sum, p) => sum + p, 0),
      rating: overallRating,
    },
    segments,
    yoy,
    confidence: {
      level: confidenceLevel,
      staleDataSources: stale ? ["realestateapi"] : [],
      sampleSize: properties.length,
    },
  };

  return {
    agentName: "data-analyst",
    sections: buildSections(analysis),
    metadata: { analysis },
    durationMs: Date.now() - start,
  };
}

function buildSections(analysis: DataAnalystOutput): SectionOutput[] {
  return [
    {
      sectionType: "market_overview",
      title: "Strategic Market Overview",
      content: {
        totalProperties: analysis.market.totalProperties,
        medianPrice: analysis.market.medianPrice,
        averagePrice: analysis.market.averagePrice,
        medianPricePerSqft: analysis.market.medianPricePerSqft,
        totalVolume: analysis.market.totalVolume,
        rating: analysis.market.rating,
        confidence: analysis.confidence,
      },
    },
    {
      sectionType: "executive_summary",
      title: "Market Analysis Matrix",
      content: {
        segments: analysis.segments,
        yoy: analysis.yoy,
        overallRating: analysis.market.rating,
      },
    },
  ];
}

// --- Agent Definition (for pipeline registration) ---

export const dataAnalystAgent: AgentDefinition = {
  name: "data-analyst",
  description:
    "Fetches property data, computes segment metrics, YoY calculations, and intelligence ratings",
  dependencies: [],
  execute: executeDataAnalyst,
};
