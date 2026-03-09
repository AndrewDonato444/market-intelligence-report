/**
 * Market Analytics Engine — Layer 1
 *
 * Pure computation layer. Takes CompiledMarketData from the data fetcher
 * and produces ComputedAnalytics for all 9 report sections.
 *
 * No API calls, no Claude calls. Every function is pure and testable
 * with fixture data.
 */

import type { MarketData } from "@/lib/agents/orchestrator";
import type { CompiledMarketData, PeerMarketData } from "@/lib/services/data-fetcher";
import type { PropertySummary, PropertyDetail } from "@/lib/connectors/realestateapi";
import { median, average, clamp, percentChange } from "@/lib/utils/math";

// Re-export computation functions from data-analyst for backward compat
export {
  computeSegmentMetrics,
  computeYoY,
  assignRating,
  type SegmentMetrics,
  type YoYMetrics,
  type DataAnalystOutput,
} from "@/lib/agents/data-analyst";

import {
  computeSegmentMetrics,
  computeYoY,
  assignRating,
  type SegmentMetrics,
  type YoYMetrics,
} from "@/lib/agents/data-analyst";

// --- Output Types ---

export interface ComputedAnalytics {
  /** Target market core metrics */
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

  /** Section 2: Market Insights Index — 4 dimensions scored 1-10 */
  insightsIndex: {
    liquidity: DimensionScore;
    timing: DimensionScore;
    risk: DimensionScore;
    value: DimensionScore;
  };

  /** Section 3: Luxury Market Dashboard — tiered indicators */
  dashboard: {
    powerFive: DashboardIndicator[];
    tierTwo: DashboardIndicator[];
    tierThree: DashboardIndicator[];
  };

  /** Section 4: Neighborhood breakdowns */
  neighborhoods: NeighborhoodBreakdown[];

  /** Section 7: Peer market comparisons */
  peerComparisons: PeerComparisonData[];
  peerRankings: PeerRanking[];

  /** Section 8: Segment scorecard */
  scorecard: SegmentScorecard[];

  /** Confidence metadata */
  confidence: {
    level: "high" | "medium" | "low";
    sampleSize: number;
    detailCoverage: number;
    staleDataSources: string[];
  };

  /** Metrics derived from PropertyDetail records */
  detailMetrics: DetailDerivedMetrics;
}

export interface DimensionScore {
  score: number;
  label: string;
  components: Record<string, number | null>;
}

export interface DashboardIndicator {
  name: string;
  value: number | string | null;
  trend: "up" | "down" | "flat" | null;
  trendValue: number | null;
  category: "power_five" | "tier_two" | "tier_three";
}

export interface NeighborhoodBreakdown {
  name: string;
  zipCode: string;
  propertyCount: number;
  medianPrice: number;
  medianPricePerSqft: number | null;
  yoyPriceChange: number | null;
  amenities: Array<{ name: string; category: string; rating: number | null }>;
}

export interface PeerComparisonData {
  name: string;
  geography: { city: string; state: string };
  medianPrice: number;
  averagePrice: number;
  medianPricePerSqft: number | null;
  totalProperties: number;
  totalVolume: number;
  rating: string;
  yoy: YoYMetrics;
}

export interface PeerRanking {
  metric: string;
  targetRank: number;
  totalMarkets: number;
}

export interface SegmentScorecard {
  segment: string;
  rating: string;
  propertyCount: number;
  medianPrice: number;
  yoyChange: number | null;
  trend: "up" | "down" | "flat";
}

export interface DetailDerivedMetrics {
  medianDaysOnMarket: number | null;
  cashBuyerPercentage: number | null;
  listToSaleRatio: number | null;
  floodZonePercentage: number | null;
  investorBuyerPercentage: number | null;
  freeClearPercentage: number | null;
}

// --- Main computation ---

export function computeMarketAnalytics(
  data: CompiledMarketData,
  market: MarketData
): ComputedAnalytics {
  const { properties, details } = data.targetMarket;
  const currentYear = new Date().getFullYear();

  // --- Core metrics (same logic as current data-analyst) ---
  const grouped = groupByPropertyType(properties);
  const segments = computeAllSegments(grouped);
  const { currentYearProps, priorYearProps } = splitByYear(properties, currentYear);
  const yoy = computeYoY(currentYearProps, priorYearProps);

  // Assign ratings
  for (const segment of segments) {
    segment.rating = assignRating(yoy.medianPriceChange, yoy.volumeChange, segment.count);
  }

  const marketMetrics = computeOverallMetrics(properties, yoy);

  // --- Detail-derived metrics ---
  const detailMetrics = computeDetailMetrics(details);

  // --- Confidence ---
  const confidence = computeConfidence(data);

  // --- Insights Index (Section 2) ---
  const insightsIndex = computeInsightsIndex(marketMetrics, yoy, detailMetrics, segments);

  // --- Dashboard (Section 3) ---
  const dashboard = computeDashboard(marketMetrics, yoy, detailMetrics, segments);

  // --- Neighborhoods (Section 4) ---
  const neighborhoods = computeNeighborhoods(properties, currentYear, data.neighborhood.amenities);

  // --- Peer comparisons (Section 7) ---
  const { peerComparisons, peerRankings } = computePeerComparisons(
    marketMetrics,
    yoy,
    data.peerMarkets,
    currentYear
  );

  // --- Scorecard (Section 8) ---
  const scorecard = computeScorecard(segments, yoy);

  return {
    market: marketMetrics,
    segments,
    yoy,
    insightsIndex,
    dashboard,
    neighborhoods,
    peerComparisons,
    peerRankings,
    scorecard,
    confidence,
    detailMetrics,
  };
}

// --- Computation helpers ---

function groupByPropertyType(properties: PropertySummary[]): Map<string, PropertySummary[]> {
  const grouped = new Map<string, PropertySummary[]>();
  for (const prop of properties) {
    const type = prop.propertyType ?? "unknown";
    const group = grouped.get(type) ?? [];
    group.push(prop);
    grouped.set(type, group);
  }
  return grouped;
}

function computeAllSegments(grouped: Map<string, PropertySummary[]>): SegmentMetrics[] {
  const segments: SegmentMetrics[] = [];
  for (const [type, props] of grouped) {
    segments.push(computeSegmentMetrics(props, type));
  }
  return segments;
}

function splitByYear(properties: PropertySummary[], currentYear: number) {
  const currentYearProps = properties.filter((p) => {
    if (!p.lastSaleDate) return false;
    return new Date(p.lastSaleDate).getFullYear() === currentYear;
  });
  const priorYearProps = properties.filter((p) => {
    if (!p.lastSaleDate) return false;
    return new Date(p.lastSaleDate).getFullYear() === currentYear - 1;
  });
  return { currentYearProps, priorYearProps };
}

function computeOverallMetrics(
  properties: PropertySummary[],
  yoy: YoYMetrics
): ComputedAnalytics["market"] {
  const allPrices = properties
    .map((p) => p.price ?? p.lastSalePrice)
    .filter((p): p is number => p != null);
  const allPsf = properties
    .filter((p) => p.price != null && p.sqft != null)
    .map((p) => p.price! / p.sqft!);

  return {
    totalProperties: properties.length,
    medianPrice: median(allPrices),
    averagePrice: average(allPrices),
    medianPricePerSqft: allPsf.length > 0 ? median(allPsf) : null,
    totalVolume: allPrices.reduce((sum, p) => sum + p, 0),
    rating: assignRating(yoy.medianPriceChange, yoy.volumeChange, properties.length),
  };
}

// --- Detail-derived metrics ---

export function computeDetailMetrics(details: PropertyDetail[]): DetailDerivedMetrics {
  if (details.length === 0) {
    return {
      medianDaysOnMarket: null,
      cashBuyerPercentage: null,
      listToSaleRatio: null,
      floodZonePercentage: null,
      investorBuyerPercentage: null,
      freeClearPercentage: null,
    };
  }

  // Days on market from MLS history
  const domValues = details
    .flatMap((d) => d.mlsHistory)
    .map((m) => (m.daysOnMarket != null ? parseInt(String(m.daysOnMarket), 10) : null))
    .filter((v): v is number => v != null && !isNaN(v));

  // Cash buyer percentage
  const cashCount = details.filter((d) => d.flags.cashBuyer || d.flags.cashSale).length;

  // List-to-sale ratio
  const ratios: number[] = [];
  for (const detail of details) {
    const lastMls = detail.mlsHistory.find((m) => m.price != null);
    const lastSale = detail.saleHistory[0];
    if (lastMls?.price && lastSale?.price) {
      const listPrice = parseFloat(String(lastMls.price));
      if (listPrice > 0) {
        ratios.push(lastSale.price / listPrice);
      }
    }
  }

  // Flood zone
  const floodCount = details.filter((d) => d.flags.floodZone).length;

  // Investor buyers
  const investorCount = details.filter((d) => d.flags.investorBuyer).length;

  // Free & clear
  const freeClearCount = details.filter((d) => d.flags.freeClear).length;

  return {
    medianDaysOnMarket: domValues.length > 0 ? median(domValues) : null,
    cashBuyerPercentage: cashCount / details.length,
    listToSaleRatio: ratios.length > 0 ? median(ratios) : null,
    floodZonePercentage: floodCount / details.length,
    investorBuyerPercentage: investorCount / details.length,
    freeClearPercentage: freeClearCount / details.length,
  };
}

// --- Confidence ---

function computeConfidence(data: CompiledMarketData): ComputedAnalytics["confidence"] {
  const propCount = data.targetMarket.properties.length;
  const detailCount = data.targetMarket.details.length;
  const stale = data.targetMarket.stale;

  const level: "high" | "medium" | "low" = stale
    ? "low"
    : propCount < 10
      ? "medium"
      : "high";

  return {
    level,
    sampleSize: propCount,
    detailCoverage: propCount > 0 ? detailCount / propCount : 0,
    staleDataSources: data.fetchMetadata.staleDataSources,
  };
}

// --- Insights Index (Section 2) ---

export function computeInsightsIndex(
  market: ComputedAnalytics["market"],
  yoy: YoYMetrics,
  detailMetrics: DetailDerivedMetrics,
  segments: SegmentMetrics[]
): ComputedAnalytics["insightsIndex"] {
  return {
    liquidity: computeLiquidityScore(detailMetrics, market),
    timing: computeTimingScore(yoy, detailMetrics),
    risk: computeRiskScore(detailMetrics, segments),
    value: computeValueScore(yoy, segments),
  };
}

function computeLiquidityScore(
  detail: DetailDerivedMetrics,
  market: ComputedAnalytics["market"]
): DimensionScore {
  // Cash buyer concentration drives liquidity
  const cashScore = detail.cashBuyerPercentage != null
    ? clamp(detail.cashBuyerPercentage * 15, 1, 10)
    : 5;
  // Transaction volume (more = more liquid)
  const volumeScore = clamp(Math.min(market.totalProperties / 10, 10), 1, 10);
  // Free & clear = capital independence
  const freeClearScore = detail.freeClearPercentage != null
    ? clamp(detail.freeClearPercentage * 12, 1, 10)
    : 5;

  const score = clamp(Math.round((cashScore + volumeScore + freeClearScore) / 3), 1, 10);

  return {
    score,
    label: score >= 7 ? "Strong" : score >= 4 ? "Moderate" : "Weak",
    components: {
      cashBuyerPct: detail.cashBuyerPercentage,
      transactionVolume: market.totalProperties,
      freeClearPct: detail.freeClearPercentage,
    },
  };
}

function computeTimingScore(yoy: YoYMetrics, detail: DetailDerivedMetrics): DimensionScore {
  // Price momentum
  const momentumScore = yoy.medianPriceChange != null
    ? clamp(5 + yoy.medianPriceChange * 30, 1, 10)
    : 5;
  // DOM trend (lower DOM = better timing for sellers)
  const domScore = detail.medianDaysOnMarket != null
    ? clamp(10 - detail.medianDaysOnMarket / 30, 1, 10)
    : 5;
  // List-to-sale ratio (closer to 1 = strong market)
  const ratioScore = detail.listToSaleRatio != null
    ? clamp((detail.listToSaleRatio - 0.85) * 40, 1, 10)
    : 5;

  const score = clamp(Math.round((momentumScore + domScore + ratioScore) / 3), 1, 10);

  return {
    score,
    label: score >= 7 ? "Favorable" : score >= 4 ? "Neutral" : "Challenging",
    components: {
      priceMomentum: yoy.medianPriceChange,
      medianDOM: detail.medianDaysOnMarket,
      listToSaleRatio: detail.listToSaleRatio,
    },
  };
}

function computeRiskScore(detail: DetailDerivedMetrics, segments: SegmentMetrics[]): DimensionScore {
  // Flood zone exposure (lower = better)
  const floodScore = detail.floodZonePercentage != null
    ? clamp(10 - detail.floodZonePercentage * 15, 1, 10)
    : 7;
  // Concentration risk: how much volume is in top segment
  const totalCount = segments.reduce((s, seg) => s + seg.count, 0);
  const maxSegment = Math.max(...segments.map((s) => s.count), 0);
  const concentrationPct = totalCount > 0 ? maxSegment / totalCount : 1;
  const diversityScore = clamp(10 - concentrationPct * 8, 1, 10);

  const score = clamp(Math.round((floodScore + diversityScore) / 2), 1, 10);

  return {
    score,
    label: score >= 7 ? "Low Risk" : score >= 4 ? "Moderate Risk" : "Elevated Risk",
    components: {
      floodZonePct: detail.floodZonePercentage,
      concentrationPct,
    },
  };
}

function computeValueScore(yoy: YoYMetrics, segments: SegmentMetrics[]): DimensionScore {
  // YoY appreciation potential
  const growthScore = yoy.medianPriceChange != null
    ? clamp(5 + yoy.medianPriceChange * 25, 1, 10)
    : 5;
  // Price/sqft spread across segments (wider = more opportunity)
  const psfValues = segments
    .map((s) => s.medianPricePerSqft)
    .filter((v): v is number => v != null);
  const psfSpread = psfValues.length >= 2
    ? (Math.max(...psfValues) - Math.min(...psfValues)) / average(psfValues)
    : 0;
  const spreadScore = clamp(psfSpread * 10, 1, 10);

  const score = clamp(Math.round((growthScore + spreadScore) / 2), 1, 10);

  return {
    score,
    label: score >= 7 ? "Strong Opportunity" : score >= 4 ? "Moderate Opportunity" : "Limited Opportunity",
    components: {
      yoyGrowth: yoy.medianPriceChange,
      psfSpread,
    },
  };
}

// --- Dashboard (Section 3) ---

export function computeDashboard(
  market: ComputedAnalytics["market"],
  yoy: YoYMetrics,
  detailMetrics: DetailDerivedMetrics,
  segments: SegmentMetrics[]
): ComputedAnalytics["dashboard"] {
  const trendDir = (val: number | null): "up" | "down" | "flat" | null =>
    val == null ? null : val > 0.01 ? "up" : val < -0.01 ? "down" : "flat";

  const powerFive: DashboardIndicator[] = [
    {
      name: "Median Sold Price",
      value: market.medianPrice,
      trend: trendDir(yoy.medianPriceChange),
      trendValue: yoy.medianPriceChange,
      category: "power_five",
    },
    {
      name: "Median Price/SqFt",
      value: market.medianPricePerSqft,
      trend: trendDir(yoy.pricePerSqftChange),
      trendValue: yoy.pricePerSqftChange,
      category: "power_five",
    },
    {
      name: "Median Days on Market",
      value: detailMetrics.medianDaysOnMarket,
      trend: null,
      trendValue: null,
      category: "power_five",
    },
    {
      name: "List-to-Sale Ratio",
      value: detailMetrics.listToSaleRatio != null
        ? Math.round(detailMetrics.listToSaleRatio * 10000) / 100
        : null,
      trend: null,
      trendValue: null,
      category: "power_five",
    },
    {
      name: "Transaction Volume",
      value: market.totalProperties,
      trend: trendDir(yoy.volumeChange),
      trendValue: yoy.volumeChange,
      category: "power_five",
    },
  ];

  const tierTwo: DashboardIndicator[] = [
    {
      name: "Cash Buyer %",
      value: detailMetrics.cashBuyerPercentage != null
        ? Math.round(detailMetrics.cashBuyerPercentage * 100)
        : null,
      trend: null,
      trendValue: null,
      category: "tier_two",
    },
    {
      name: "Total Sales Volume",
      value: market.totalVolume,
      trend: null,
      trendValue: null,
      category: "tier_two",
    },
    {
      name: "Average Price",
      value: market.averagePrice,
      trend: null,
      trendValue: null,
      category: "tier_two",
    },
    {
      name: "Property Type Split",
      value: segments.map((s) => `${s.name}: ${s.count}`).join(", "),
      trend: null,
      trendValue: null,
      category: "tier_two",
    },
  ];

  const tierThree: DashboardIndicator[] = [
    {
      name: "Flood Zone Exposure",
      value: detailMetrics.floodZonePercentage != null
        ? Math.round(detailMetrics.floodZonePercentage * 100)
        : null,
      trend: null,
      trendValue: null,
      category: "tier_three",
    },
    {
      name: "Investor Activity Rate",
      value: detailMetrics.investorBuyerPercentage != null
        ? Math.round(detailMetrics.investorBuyerPercentage * 100)
        : null,
      trend: null,
      trendValue: null,
      category: "tier_three",
    },
    {
      name: "Free & Clear %",
      value: detailMetrics.freeClearPercentage != null
        ? Math.round(detailMetrics.freeClearPercentage * 100)
        : null,
      trend: null,
      trendValue: null,
      category: "tier_three",
    },
  ];

  return { powerFive, tierTwo, tierThree };
}

// --- Neighborhoods (Section 4) ---

export function computeNeighborhoods(
  properties: PropertySummary[],
  currentYear: number,
  amenities: Record<string, Array<{ name: string; category: string; rating: number | null }>>
): NeighborhoodBreakdown[] {
  // Group properties by zip code
  const byZip = new Map<string, PropertySummary[]>();
  for (const prop of properties) {
    const zip = prop.zip ?? "unknown";
    const group = byZip.get(zip) ?? [];
    group.push(prop);
    byZip.set(zip, group);
  }

  const neighborhoods: NeighborhoodBreakdown[] = [];

  for (const [zip, props] of byZip) {
    const prices = props
      .map((p) => p.price ?? p.lastSalePrice)
      .filter((p): p is number => p != null);
    const psfValues = props
      .filter((p) => p.price != null && p.sqft != null)
      .map((p) => p.price! / p.sqft!);

    // YoY for this neighborhood
    const currentProps = props.filter(
      (p) => p.lastSaleDate && new Date(p.lastSaleDate).getFullYear() === currentYear
    );
    const priorProps = props.filter(
      (p) => p.lastSaleDate && new Date(p.lastSaleDate).getFullYear() === currentYear - 1
    );
    const localYoY = computeYoY(currentProps, priorProps);

    // Flatten amenities for this neighborhood (we don't have per-zip amenities,
    // so all amenities apply to the market as a whole)
    const flatAmenities: NeighborhoodBreakdown["amenities"] = [];
    for (const [category, businesses] of Object.entries(amenities)) {
      for (const biz of businesses) {
        flatAmenities.push({ name: biz.name, category, rating: biz.rating });
      }
    }

    neighborhoods.push({
      name: zip,
      zipCode: zip,
      propertyCount: props.length,
      medianPrice: median(prices),
      medianPricePerSqft: psfValues.length > 0 ? median(psfValues) : null,
      yoyPriceChange: localYoY.medianPriceChange,
      amenities: flatAmenities,
    });
  }

  // Sort by property count descending
  neighborhoods.sort((a, b) => b.propertyCount - a.propertyCount);

  return neighborhoods;
}

// --- Peer Comparisons (Section 7) ---

export function computePeerComparisons(
  targetMetrics: ComputedAnalytics["market"],
  targetYoY: YoYMetrics,
  peerData: PeerMarketData[],
  currentYear: number
): { peerComparisons: PeerComparisonData[]; peerRankings: PeerRanking[] } {
  const peerComparisons: PeerComparisonData[] = [];

  for (const peer of peerData) {
    const prices = peer.properties
      .map((p) => p.price ?? p.lastSalePrice)
      .filter((p): p is number => p != null);
    const psf = peer.properties
      .filter((p) => p.price != null && p.sqft != null)
      .map((p) => p.price! / p.sqft!);

    const { currentYearProps, priorYearProps } = splitByYear(peer.properties, currentYear);
    const peerYoY = computeYoY(currentYearProps, priorYearProps);
    const rating = assignRating(peerYoY.medianPriceChange, peerYoY.volumeChange, peer.properties.length);

    peerComparisons.push({
      name: peer.name,
      geography: peer.geography,
      medianPrice: median(prices),
      averagePrice: average(prices),
      medianPricePerSqft: psf.length > 0 ? median(psf) : null,
      totalProperties: peer.properties.length,
      totalVolume: prices.reduce((s, p) => s + p, 0),
      rating,
      yoy: peerYoY,
    });
  }

  // Compute rankings (target vs all peers)
  const allMarkets = [
    { name: "target", medianPrice: targetMetrics.medianPrice, yoyChange: targetYoY.medianPriceChange, volume: targetMetrics.totalProperties, psf: targetMetrics.medianPricePerSqft },
    ...peerComparisons.map((p) => ({
      name: p.name, medianPrice: p.medianPrice, yoyChange: p.yoy.medianPriceChange, volume: p.totalProperties, psf: p.medianPricePerSqft,
    })),
  ];

  const totalMarkets = allMarkets.length;

  const rankByDesc = (arr: typeof allMarkets, key: "medianPrice" | "volume") => {
    const sorted = [...arr].sort((a, b) => (b[key] ?? 0) - (a[key] ?? 0));
    return sorted.findIndex((m) => m.name === "target") + 1;
  };

  const rankByYoY = () => {
    const sorted = [...allMarkets].sort((a, b) => (b.yoyChange ?? -Infinity) - (a.yoyChange ?? -Infinity));
    return sorted.findIndex((m) => m.name === "target") + 1;
  };

  const peerRankings: PeerRanking[] = [
    { metric: "Median Price", targetRank: rankByDesc(allMarkets, "medianPrice"), totalMarkets },
    { metric: "YoY Growth", targetRank: rankByYoY(), totalMarkets },
    { metric: "Transaction Volume", targetRank: rankByDesc(allMarkets, "volume"), totalMarkets },
  ];

  return { peerComparisons, peerRankings };
}

// --- Scorecard (Section 8) ---

export function computeScorecard(segments: SegmentMetrics[], yoy: YoYMetrics): SegmentScorecard[] {
  return segments.map((seg) => ({
    segment: seg.name,
    rating: seg.rating,
    propertyCount: seg.count,
    medianPrice: seg.medianPrice,
    yoyChange: yoy.medianPriceChange,
    trend: yoy.medianPriceChange == null
      ? "flat" as const
      : yoy.medianPriceChange > 0.01
        ? "up" as const
        : yoy.medianPriceChange < -0.01
          ? "down" as const
          : "flat" as const,
  }));
}
