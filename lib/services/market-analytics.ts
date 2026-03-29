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
import type { NewsArticle } from "@/lib/connectors/scrapingdog";
import type { XSentimentBrief } from "@/lib/connectors/grok";
import { median, average, clamp, percentChange, removeOutliers } from "@/lib/utils/math";

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
    powerFour: DashboardIndicator[];
    supportingMetrics: DashboardIndicator[];
  };

  /** Section 4: Neighborhood breakdowns */
  neighborhoods: NeighborhoodBreakdown[];

  /** Section 7: Peer market comparisons */
  peerComparisons: PeerComparisonData[];
  peerRankings: PeerRanking[];

  /** Section 8: Segment scorecard */
  scorecard: SegmentScorecard[];

  /** News articles about the market (passthrough from Layer 0) */
  news: {
    targetMarket: NewsArticle[];
    peerMarkets: Record<string, NewsArticle[]>;
  };

  /** X social sentiment (passthrough from Layer 0, optional — requires XAI_API_KEY) */
  xSentiment?: XSentimentBrief | null;

  /** Confidence metadata */
  confidence: {
    level: "high" | "medium" | "low";
    sampleSize: number;
    detailCoverage: number;
    staleDataSources: string[];
  };

  /** Metrics derived from PropertyDetail records */
  detailMetrics: DetailDerivedMetrics;

  /** Most recent transaction sale date in the dataset (ISO string) — for data freshness display */
  dataAsOfDate: string | null;

  /** Rolling period bounds and per-period sample sizes for YoY transparency */
  analysisPeriod: {
    current: { min: string; max: string; count: number };
    prior: { min: string; max: string; count: number };
  };
}

export interface DimensionScore {
  score: number;
  label: string;
  components: Record<string, number | null>;
  /** Plain-language interpretation of what drives this score */
  interpretation?: string;
}

export interface DashboardIndicator {
  name: string;
  value: number | string | null;
  trend: "up" | "down" | "flat" | null;
  trendValue: number | null;
  category: "power_four" | "supporting";
  /** Optional footnote when metric uses a fallback data source */
  footnote?: string;
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

export type MetricSource = "mls" | "mls_statusdate" | "tax_market_value" | "estimated_value" | "none";

export interface DetailDerivedMetrics {
  medianDaysOnMarket: number | null;
  cashBuyerPercentage: number | null;
  listToSaleRatio: number | null;
  floodZonePercentage: number | null;
  investorBuyerPercentage: number | null;
  freeClearPercentage: number | null;
  /** Tracks where DOM and list-to-sale data originated for labeling transparency */
  dataSources: {
    dom: MetricSource;
    listToSale: MetricSource;
  };
}

// --- Main computation ---

export function computeMarketAnalytics(
  data: CompiledMarketData,
  market: MarketData
): ComputedAnalytics {
  const { properties, details } = data.targetMarket;
  const currentYear = new Date().getFullYear();

  // --- Split by rolling period bounds (not calendar year) ---
  const periods = data.analysisPeriod;
  const { currentPeriodProps, priorPeriodProps } = periods
    ? splitByPeriodBounds(properties, periods)
    : splitByYearFallback(properties, currentYear);

  const currentPeriodCount = currentPeriodProps.length;
  const priorPeriodCount = priorPeriodProps.length;

  // --- Core metrics computed on current-period properties only ---
  const grouped = groupByPropertyType(currentPeriodProps);
  const segments = computeAllSegments(grouped);

  // Enforce minimum sample size for YoY — both periods need >= 3 transactions
  const MIN_YOY_SAMPLE = 3;
  const yoy = (currentPeriodCount >= MIN_YOY_SAMPLE && priorPeriodCount >= MIN_YOY_SAMPLE)
    ? computeYoY(currentPeriodProps, priorPeriodProps)
    : computeYoY([], []); // Returns all-null metrics

  // Compute per-segment YoY and assign segment-specific ratings
  const priorGrouped = groupByPropertyType(priorPeriodProps);
  const currentGrouped = groupByPropertyType(currentPeriodProps);
  for (const segment of segments) {
    const segCurrentProps = currentGrouped.get(segment.propertyType) ?? [];
    const segPriorProps = priorGrouped.get(segment.propertyType) ?? [];
    const segYoY = computeYoY(segCurrentProps, segPriorProps);
    segment.yoy = segYoY;
    segment.rating = assignRating(segYoY.medianPriceChange, segYoY.volumeChange, segment.count);
  }

  const marketMetrics = computeOverallMetrics(currentPeriodProps, yoy);

  // --- Detail-derived metrics ---
  const detailMetrics = computeDetailMetrics(details);

  // --- Detail-derived YoY (DOM, List-to-Sale) ---
  const currentPeriodDetails = data.targetMarket.currentPeriodDetails ?? [];
  const priorPeriodDetails = data.targetMarket.priorPeriodDetails ?? [];
  const detailYoY = computeDetailYoY(currentPeriodDetails, priorPeriodDetails);
  yoy.domChange = detailYoY.domChange;
  yoy.listToSaleChange = detailYoY.listToSaleChange;

  // --- Confidence ---
  const confidence = computeConfidence(data);

  // --- Insights Index (Section 2) ---
  const insightsIndex = computeInsightsIndex(marketMetrics, yoy, detailMetrics, segments);

  // --- Dashboard (Section 3) ---
  const dashboard = computeDashboard(marketMetrics, yoy, detailMetrics, segments);

  // --- Neighborhoods (Section 4) ---
  // Build zip → neighborhood name mapping from PropertyDetail records
  const zipToNeighborhood = buildZipToNeighborhoodMap(details);
  const neighborhoods = computeNeighborhoods(properties, currentYear, data.neighborhood.amenities, zipToNeighborhood);

  // --- Peer comparisons (Section 7) ---
  const { peerComparisons, peerRankings } = computePeerComparisons(
    marketMetrics,
    yoy,
    data.peerMarkets,
    currentYear
  );

  // --- Scorecard (Section 8) ---
  const scorecard = computeScorecard(segments, yoy);

  // --- Data freshness (most recent sale date) ---
  const dataAsOfDate = computeDataAsOfDate(properties);

  // --- Analysis period metadata ---
  const defaultPeriodBounds = { min: "N/A", max: "N/A" };
  const analysisPeriod = {
    current: { ...(periods?.current ?? defaultPeriodBounds), count: currentPeriodCount },
    prior: { ...(periods?.prior ?? defaultPeriodBounds), count: priorPeriodCount },
  };

  return {
    market: marketMetrics,
    segments,
    yoy,
    insightsIndex,
    dashboard,
    neighborhoods,
    peerComparisons,
    peerRankings,
    news: {
      targetMarket: data.news?.targetMarket ?? [],
      peerMarkets: data.news?.peerMarkets ?? {},
    },
    xSentiment: data.xSentiment ?? null,
    scorecard,
    confidence,
    detailMetrics,
    dataAsOfDate,
    analysisPeriod,
  };
}

// --- Data freshness ---

export function computeDataAsOfDate(properties: PropertySummary[]): string | null {
  let latest: Date | null = null;
  for (const prop of properties) {
    if (!prop.lastSaleDate) continue;
    const d = new Date(prop.lastSaleDate);
    if (isNaN(d.getTime())) continue;
    if (!latest || d > latest) latest = d;
  }
  return latest ? latest.toISOString().slice(0, 10) : null;
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

/**
 * Split properties using the actual rolling period bounds from computePeriodBounds().
 * This ensures YoY compares the same windows used to fetch the data.
 */
function splitByPeriodBounds(
  properties: PropertySummary[],
  periods: { current: { min: string; max: string }; prior: { min: string; max: string } }
) {
  const currentPeriodProps = properties.filter((p) => {
    if (!p.lastSaleDate) return false;
    return p.lastSaleDate >= periods.current.min && p.lastSaleDate <= periods.current.max;
  });
  const priorPeriodProps = properties.filter((p) => {
    if (!p.lastSaleDate) return false;
    return p.lastSaleDate >= periods.prior.min && p.lastSaleDate <= periods.prior.max;
  });
  return { currentPeriodProps, priorPeriodProps };
}

/**
 * Legacy fallback: split by calendar year when no period bounds are available.
 * Used only when CompiledMarketData lacks analysisPeriod (e.g. fixtures, legacy data).
 */
function splitByYearFallback(properties: PropertySummary[], currentYear: number) {
  // Lowered from 3→2 to align with per-neighborhood NEIGHBORHOOD_MIN_SAMPLE.
  // This function is only called from computeNeighborhoods where samples are
  // already small (100 properties / 35+ zips).
  const MIN_SAMPLE = 2;

  let recentYear = currentYear;
  let priorYear = currentYear - 1;

  const currentYearCount = properties.filter(
    (p) => p.lastSaleDate && new Date(p.lastSaleDate).getFullYear() === currentYear
  ).length;

  if (currentYearCount < MIN_SAMPLE) {
    recentYear = currentYear - 1;
    priorYear = currentYear - 2;
  }

  const currentPeriodProps = properties.filter((p) => {
    if (!p.lastSaleDate) return false;
    return new Date(p.lastSaleDate).getFullYear() === recentYear;
  });
  const priorPeriodProps = properties.filter((p) => {
    if (!p.lastSaleDate) return false;
    return new Date(p.lastSaleDate).getFullYear() === priorYear;
  });
  return { currentPeriodProps, priorPeriodProps };
}

function computeOverallMetrics(
  properties: PropertySummary[],
  yoy: YoYMetrics
): ComputedAnalytics["market"] {
  const rawPrices = properties
    .map((p) => p.price ?? p.lastSalePrice)
    .filter((p): p is number => p != null);

  // Apply IQR outlier filtering to prices to remove wild outliers
  // (e.g. $403M on 1 transaction). Use k=2.0 for luxury markets (wider fences).
  const allPrices = removeOutliers(rawPrices, 2.0);

  const allPsf = properties
    .filter((p) => p.price != null && p.sqft != null)
    .map((p) => p.price! / p.sqft!);
  const filteredPsf = removeOutliers(allPsf, 2.0);

  return {
    totalProperties: properties.length,
    medianPrice: median(allPrices),
    averagePrice: average(allPrices),
    medianPricePerSqft: filteredPsf.length > 0 ? median(filteredPsf) : null,
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
      dataSources: { dom: "none", listToSale: "none" },
    };
  }

  // --- Days on market ---
  let domSource: MetricSource = "none";

  // Primary: MLS history daysOnMarket field
  const domValues = details
    .flatMap((d) => d.mlsHistory)
    .map((m) => (m.daysOnMarket != null ? parseInt(String(m.daysOnMarket), 10) : null))
    .filter((v): v is number => v != null && !isNaN(v));

  if (domValues.length > 0) {
    domSource = "mls";
  }

  // Fallback DOM: compute from MLS statusDate range when daysOnMarket is null.
  // For each detail with 2+ MLS entries, estimate DOM as the day span between
  // the earliest and latest statusDate.
  if (domValues.length === 0) {
    for (const detail of details) {
      if (detail.mlsHistory.length < 2) continue;
      const dates = detail.mlsHistory
        .map((m) => m.statusDate ? new Date(m.statusDate).getTime() : NaN)
        .filter((t) => !isNaN(t));
      if (dates.length >= 2) {
        const span = Math.round((Math.max(...dates) - Math.min(...dates)) / (1000 * 60 * 60 * 24));
        if (span > 0 && span < 365) domValues.push(span);
      }
    }
    if (domValues.length > 0) domSource = "mls_statusdate";
  }

  // --- Cash buyer percentage ---
  const cashCount = details.filter((d) => d.flags.cashBuyer || d.flags.cashSale).length;

  // --- List-to-sale ratio ---
  // Compare most recent sale price to most recent MLS list price.
  // Only include ratios in the plausible range (0.7–1.5) to filter out data mismatches
  // where MLS price may be per-sqft, in thousands, or from a different listing.
  let ltsSource: MetricSource = "none";
  const ratios: number[] = [];
  for (const detail of details) {
    const lastMls = detail.mlsHistory.find((m) => m.price != null);
    // Sale price: try saleHistory first, fall back to root lastSalePrice
    const salePrice =
      (detail.saleHistory[0]?.price ?? null) ?? detail.lastSalePrice;

    // List price: try MLS price first, fall back to taxInfo.marketValue or estimatedValue
    let listPrice: number | null = null;
    let thisSource: MetricSource = "none";
    if (lastMls?.price) {
      listPrice = parseFloat(String(lastMls.price));
      thisSource = "mls";
    } else if (detail.taxInfo?.marketValue && detail.taxInfo.marketValue > 0) {
      listPrice = detail.taxInfo.marketValue;
      thisSource = "tax_market_value";
    } else if (detail.estimatedValue && detail.estimatedValue > 0) {
      listPrice = detail.estimatedValue;
      thisSource = "estimated_value";
    }

    if (listPrice && listPrice > 0 && salePrice && salePrice > 0) {
      const ratio = salePrice / listPrice;
      // Plausible list-to-sale ratios fall between 70% and 150%
      if (ratio >= 0.7 && ratio <= 1.5) {
        ratios.push(ratio);
        // Track the least-preferred (worst-quality) source used across all valid ratios.
        // Priority: mls > mls_statusdate > tax_market_value > estimated_value > none
        const SOURCE_RANK: Record<MetricSource, number> = {
          mls: 4, mls_statusdate: 3, tax_market_value: 2, estimated_value: 1, none: 0,
        };
        if (SOURCE_RANK[thisSource] < SOURCE_RANK[ltsSource] || ltsSource === "none") {
          ltsSource = thisSource;
        }
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
    dataSources: { dom: domSource, listToSale: ltsSource },
  };
}

// --- Detail-derived YoY ---

export function computeDetailYoY(
  currentDetails: PropertyDetail[],
  priorDetails: PropertyDetail[]
): { domChange: number | null; listToSaleChange: number | null } {
  // Need both cohorts with at least 1 detail record to compute meaningful YoY
  if (currentDetails.length === 0 || priorDetails.length === 0) {
    return { domChange: null, listToSaleChange: null };
  }

  const current = computeDetailMetrics(currentDetails);
  const prior = computeDetailMetrics(priorDetails);

  return {
    domChange: percentChange(current.medianDaysOnMarket, prior.medianDaysOnMarket),
    listToSaleChange: percentChange(current.listToSaleRatio, prior.listToSaleRatio),
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
  const raw = {
    liquidity: computeLiquidityScore(detailMetrics, market),
    timing: computeTimingScore(yoy, detailMetrics),
    risk: computeRiskScore(detailMetrics, segments),
    value: computeValueScore(yoy, segments),
  };

  // Enforce score variance: no more than 2 of 4 dimensions may score 8+.
  // If 3+ score 8+, pull the weakest ones down to 7 to produce realistic spread.
  return enforceScoreVariance(raw);
}

function enforceScoreVariance(
  index: ComputedAnalytics["insightsIndex"]
): ComputedAnalytics["insightsIndex"] {
  const entries = Object.entries(index) as [string, DimensionScore][];
  const high = entries.filter(([, d]) => d.score >= 8);

  if (high.length <= 2) return index; // Already has enough variance

  // Sort high-scorers by score ascending (weakest first), cap extras at 7
  const sorted = [...high].sort((a, b) => a[1].score - b[1].score);
  const toCap = sorted.slice(0, high.length - 2); // Keep only the top 2

  const result = { ...index };
  for (const [key, dim] of toCap) {
    const label = dim.score >= 7 ? dim.label : dim.label; // Keep original label mapping
    (result as Record<string, DimensionScore>)[key] = {
      ...dim,
      score: 7,
      label: relabelScore(key, 7),
    };
  }
  return result;
}

function relabelScore(dimension: string, score: number): string {
  if (dimension === "liquidity") return score >= 7 ? "Strong" : score >= 4 ? "Moderate" : "Weak";
  if (dimension === "timing") return score >= 7 ? "Favorable" : score >= 4 ? "Neutral" : "Challenging";
  if (dimension === "risk") return score >= 7 ? "Low Risk" : score >= 4 ? "Moderate Risk" : "Elevated Risk";
  if (dimension === "value") return score >= 7 ? "Strong Opportunity" : score >= 4 ? "Moderate Opportunity" : "Limited Opportunity";
  return "Moderate";
}

function computeLiquidityScore(
  detail: DetailDerivedMetrics,
  market: ComputedAnalytics["market"]
): DimensionScore {
  // Transaction volume (more = more liquid)
  const volumeScore = clamp(Math.min(market.totalProperties / 10, 10), 1, 10);
  // Free & clear = capital independence
  const freeClearScore = detail.freeClearPercentage != null
    ? clamp(detail.freeClearPercentage * 12, 1, 10)
    : 5;

  const score = clamp(Math.round((volumeScore + freeClearScore) / 2), 1, 10);

  // Build plain-language interpretation
  const parts: string[] = [];
  if (market.totalProperties > 50) parts.push(`${market.totalProperties} transactions indicate active trading volume`);
  else if (market.totalProperties > 0) parts.push(`Limited transaction count (${market.totalProperties}) — thinner market`);
  if (detail.freeClearPercentage != null) {
    const pct = Math.round(detail.freeClearPercentage * 100);
    parts.push(pct >= 30 ? `${pct}% free & clear ownership signals strong capital independence` : pct >= 15 ? `${pct}% free & clear — moderate capital independence` : `Low free & clear share (${pct}%) — financing-dependent market`);
  }

  return {
    score,
    label: score >= 7 ? "Strong" : score >= 4 ? "Moderate" : "Weak",
    components: {
      transactionVolume: market.totalProperties,
      freeClearPct: detail.freeClearPercentage,
    },
    interpretation: parts.join(". ") || undefined,
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

  const parts: string[] = [];
  if (yoy.medianPriceChange != null) {
    const pct = Math.round(yoy.medianPriceChange * 100);
    parts.push(pct > 5 ? `Strong price momentum (+${pct}% YoY) favors sellers` : pct > 0 ? `Modest price growth (+${pct}% YoY) — balanced conditions` : pct > -5 ? `Flat pricing (${pct}% YoY) — buyers gaining leverage` : `Declining prices (${pct}% YoY) — buyer's market conditions`);
  }
  if (detail.medianDaysOnMarket != null) {
    const dom = Math.round(detail.medianDaysOnMarket);
    parts.push(dom < 30 ? `Fast-moving inventory (${dom} days median) — urgency required` : dom < 90 ? `${dom}-day median time on market — measured pace` : `Extended marketing times (${dom} days) — patience rewarded`);
  }
  if (detail.listToSaleRatio != null) {
    const ratio = Math.round(detail.listToSaleRatio * 100);
    parts.push(ratio >= 98 ? `Sellers achieving ${ratio}% of ask — strong pricing power` : ratio >= 93 ? `${ratio}% list-to-sale ratio — moderate negotiation room` : `Significant discounting (${ratio}% of ask) — negotiation leverage for buyers`);
  }

  return {
    score,
    label: score >= 7 ? "Favorable" : score >= 4 ? "Neutral" : "Challenging",
    components: {
      priceMomentum: yoy.medianPriceChange,
      medianDOM: detail.medianDaysOnMarket,
      listToSaleRatio: detail.listToSaleRatio,
    },
    interpretation: parts.join(". ") || undefined,
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

  const parts: string[] = [];
  if (detail.floodZonePercentage != null) {
    const pct = Math.round(detail.floodZonePercentage * 100);
    parts.push(pct === 0 ? "No flood zone exposure — minimal climate risk" : pct <= 10 ? `Low flood zone exposure (${pct}%) — manageable climate risk` : `${pct}% of properties in flood zones — elevated climate risk`);
  }
  const concPct = Math.round(concentrationPct * 100);
  parts.push(concPct <= 40 ? `Diversified property mix (${concPct}% top segment) — balanced portfolio risk` : concPct <= 60 ? `Moderate concentration (${concPct}% in top segment)` : `High segment concentration (${concPct}% in one type) — limited diversification`);

  return {
    score,
    label: score >= 7 ? "Low Risk" : score >= 4 ? "Moderate Risk" : "Elevated Risk",
    components: {
      floodZonePct: detail.floodZonePercentage,
      concentrationPct,
    },
    interpretation: parts.join(". ") || undefined,
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

  const parts: string[] = [];
  if (yoy.medianPriceChange != null) {
    const pct = Math.round(yoy.medianPriceChange * 100);
    parts.push(pct > 5 ? `${pct}% appreciation suggests continued value growth` : pct > 0 ? `Modest ${pct}% growth — steady value trajectory` : `${pct}% price movement — value stabilization phase`);
  }
  if (psfSpread > 0.3) parts.push("Wide price-per-sqft range across segments creates entry-point diversity");
  else if (psfSpread > 0) parts.push("Narrow pricing spread — fewer value arbitrage opportunities");

  return {
    score,
    label: score >= 7 ? "Strong Opportunity" : score >= 4 ? "Moderate Opportunity" : "Limited Opportunity",
    components: {
      yoyGrowth: yoy.medianPriceChange,
      psfSpread,
    },
    interpretation: parts.join(". ") || undefined,
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

  const powerFour: DashboardIndicator[] = [
    {
      name: "Median Sold Price",
      value: market.medianPrice,
      trend: trendDir(yoy.medianPriceChange),
      trendValue: yoy.medianPriceChange,
      category: "power_four",
    },
    {
      name: "Median Price/SqFt",
      value: market.medianPricePerSqft,
      trend: trendDir(yoy.pricePerSqftChange),
      trendValue: yoy.pricePerSqftChange,
      category: "power_four",
    },
    {
      name: detailMetrics.dataSources.dom === "mls_statusdate"
        ? "Est. Days on Market"
        : "Median Days on Market",
      value: detailMetrics.medianDaysOnMarket,
      trend: trendDir(yoy.domChange),
      trendValue: yoy.domChange,
      category: "power_four",
      ...(detailMetrics.dataSources.dom === "mls_statusdate" && {
        footnote: "Estimated from MLS listing date range (daysOnMarket field unavailable)",
      }),
    },
    {
      name: detailMetrics.dataSources.listToSale === "tax_market_value"
        ? "Sale-to-Assessed Ratio"
        : detailMetrics.dataSources.listToSale === "estimated_value"
          ? "Sale-to-Estimated Value"
          : "List-to-Sale Ratio",
      value: detailMetrics.listToSaleRatio != null
        ? detailMetrics.listToSaleRatio
        : null,
      trend: trendDir(yoy.listToSaleChange),
      trendValue: yoy.listToSaleChange,
      category: "power_four",
      ...(detailMetrics.dataSources.listToSale !== "mls" &&
        detailMetrics.dataSources.listToSale !== "none" && {
          footnote: detailMetrics.dataSources.listToSale === "tax_market_value"
            ? "MLS list price unavailable; using tax-assessed market value as proxy"
            : "MLS list price unavailable; using automated valuation estimate as proxy",
        }),
    },
  ];

  const supportingMetrics: DashboardIndicator[] = [
    {
      name: "Total Sales Volume",
      value: market.totalVolume,
      trend: trendDir(yoy.totalVolumeChange),
      trendValue: yoy.totalVolumeChange,
      category: "supporting",
    },
    {
      name: "Average Price",
      value: market.averagePrice,
      trend: trendDir(yoy.averagePriceChange),
      trendValue: yoy.averagePriceChange,
      category: "supporting",
    },
    {
      name: "Property Type Split",
      value: segments.map((s) => `${s.name}: ${s.count}`).join(", "),
      trend: null,
      trendValue: null,
      category: "supporting",
    },
    {
      name: "Investor Activity Rate",
      value: detailMetrics.investorBuyerPercentage ?? null,
      trend: null,
      trendValue: null,
      category: "supporting",
    },
  ];

  return { powerFour, supportingMetrics };
}

// --- Well-known zip-to-neighborhood fallback ---
// When PropertyDetail.neighborhood.name is null (common for LA, Miami, etc.),
// this static map provides human-readable names instead of raw zip codes.

const WELL_KNOWN_ZIP_NEIGHBORHOODS: Record<string, string> = {
  // Los Angeles
  "90077": "Bel Air", "90210": "Beverly Hills", "90212": "Beverly Hills",
  "90024": "Westwood", "90049": "Brentwood", "90046": "Hollywood Hills",
  "90069": "West Hollywood", "90272": "Pacific Palisades", "90265": "Malibu",
  "90291": "Venice", "90402": "Santa Monica", "90403": "Santa Monica",
  "90048": "Beverly Grove", "90036": "Miracle Mile / Hancock Park",
  "90028": "Hollywood", "90068": "Hollywood Hills", "90027": "Los Feliz",
  "90039": "Silver Lake", "90026": "Echo Park", "90004": "Larchmont",
  "90019": "Mid-City", "90035": "Beverlywood", "90064": "Rancho Park",
  "90025": "West LA", "90067": "Century City", "90095": "UCLA / Westwood",
  "90274": "Palos Verdes", "90275": "Rancho Palos Verdes",
  "91436": "Encino", "91316": "Encino", "91356": "Tarzana",
  "91423": "Sherman Oaks", "91403": "Sherman Oaks",
  "91604": "Studio City", "91602": "Studio City",
  "90041": "Eagle Rock", "90065": "Mount Washington",
  "90032": "El Sereno", "90042": "Highland Park",
  // Naples / SW Florida
  "34102": "Old Naples", "34103": "Park Shore / Pelican Bay",
  "34104": "East Naples", "34105": "Pine Ridge", "34108": "Pelican Marsh / Bay Colony",
  "34109": "North Naples", "34110": "North Naples / Vanderbilt Beach",
  "34112": "East Naples", "34113": "Marco Island Corridor",
  "34119": "Livingston Corridor", "34120": "Golden Gate Estates",
  "34134": "Bonita Springs",
  // Miami-Dade — comprehensive coverage
  "33101": "Downtown Miami", "33109": "Key Biscayne", "33122": "Miami Lakes / Doral",
  "33125": "Little Havana / Flagami", "33126": "Flagami / West Miami",
  "33127": "Wynwood / Overtown", "33128": "Downtown Miami",
  "33129": "Brickell", "33130": "Brickell / Downtown",
  "33131": "Brickell", "33132": "Edgewater / Wynwood",
  "33133": "Coconut Grove", "33134": "Coral Gables",
  "33135": "Little Havana / Shenandoah", "33136": "Overtown / Civic Center",
  "33137": "Wynwood / Design District", "33138": "Upper East Side / MiMo",
  "33139": "Miami Beach / South Beach", "33140": "Miami Beach / Mid-Beach",
  "33141": "Miami Beach / Surfside", "33142": "Allapattah / Liberty City",
  "33143": "South Miami / High Pines", "33144": "Westchester / Coral Way",
  "33145": "The Roads / Shenandoah", "33146": "Coral Gables / Riviera",
  "33147": "Opa-locka / Liberty City", "33149": "Key Biscayne",
  "33150": "Little Haiti / Lemon City", "33154": "Bal Harbour",
  "33155": "Westchester / Coral Way", "33156": "Pinecrest",
  "33157": "Perrine / Palmetto Bay", "33158": "Palmetto Bay",
  "33160": "North Miami Beach / Sunny Isles", "33161": "North Miami",
  "33162": "North Miami Beach", "33165": "Westchester / Olympia Heights",
  "33166": "Medley / Hialeah Gardens", "33167": "North Miami / West Little River",
  "33168": "North Miami / Biscayne Gardens", "33169": "Miami Gardens",
  "33170": "Homestead / Naranja", "33173": "Kendall / The Hammocks",
  "33174": "Fontainebleau / Sweetwater", "33175": "Kendall / Sunset",
  "33176": "Kendall / The Falls", "33177": "Richmond Heights / Cutler Bay",
  "33178": "Doral / Sweetwater", "33179": "Ives Estates / Ojus",
  "33180": "Aventura / Ojus", "33181": "North Miami Beach / Eastern Shores",
  "33182": "Kendale Lakes / Tamiami", "33183": "Kendale Lakes",
  "33184": "Sweetwater / Tamiami", "33185": "Kendall West",
  "33186": "Kendall / The Crossings", "33187": "South Kendall / Lakes by the Bay",
  "33189": "Cutler Bay", "33190": "Cutler Bay / Palmetto Bay",
  "33193": "Country Walk / West Kendall", "33196": "Country Walk / The Hammocks",
  // Palm Beach
  "33480": "Palm Beach", "33401": "West Palm Beach",
  // New York
  "10065": "Upper East Side", "10021": "Upper East Side",
  "10022": "Midtown East", "10019": "Midtown West / Hell's Kitchen",
  "10013": "Tribeca / SoHo", "10012": "SoHo / NoHo", "10014": "West Village",
  "10011": "Chelsea", "10023": "Upper West Side", "10024": "Upper West Side",
  "10128": "Upper East Side / Yorkville", "10075": "Upper East Side",
  "10007": "Financial District / Tribeca",
};

// --- Zip to Neighborhood Name ---

function buildZipToNeighborhoodMap(details: PropertyDetail[]): Map<string, string> {
  const zipNames = new Map<string, Map<string, number>>();

  for (const detail of details) {
    const zip = detail.propertyInfo?.address?.zip;
    const name = detail.neighborhood?.name;
    if (!zip || !name) continue;

    if (!zipNames.has(zip)) zipNames.set(zip, new Map());
    const counts = zipNames.get(zip)!;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  // For each zip, pick the most common neighborhood name
  const result = new Map<string, string>();
  for (const [zip, counts] of zipNames) {
    let best = "";
    let bestCount = 0;
    for (const [name, count] of counts) {
      if (count > bestCount) {
        best = name;
        bestCount = count;
      }
    }
    if (best) result.set(zip, best);
  }

  return result;
}

// --- Neighborhoods (Section 4) ---

export function computeNeighborhoods(
  properties: PropertySummary[],
  currentYear: number,
  amenities: Record<string, Array<{ name: string; category: string; rating: number | null }>>,
  zipToNeighborhood?: Map<string, string>
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

  // Minimum sample size for per-neighborhood YoY (Bug 5 fix).
  // Lowered from 3→2: with 100 properties spread across 35+ zips, requiring 3
  // per period left most neighborhoods without YoY data. 2 per period still
  // filters out single-transaction noise while allowing mid-size zips to report.
  const NEIGHBORHOOD_MIN_SAMPLE = 2;

  for (const [zip, props] of byZip) {
    const rawPrices = props
      .map((p) => p.price ?? p.lastSalePrice)
      .filter((p): p is number => p != null);

    // Apply outlier filtering per-neighborhood (Bug 4 fix)
    const prices = removeOutliers(rawPrices, 2.0);

    const rawPsf = props
      .filter((p) => p.price != null && p.sqft != null)
      .map((p) => p.price! / p.sqft!);
    const psfValues = removeOutliers(rawPsf, 2.0);

    // YoY for this neighborhood (uses calendar-year fallback — neighborhoods don't have period bounds)
    const { currentPeriodProps: currentProps, priorPeriodProps: priorProps } =
      splitByYearFallback(props, currentYear);

    // Bug 5 fix: enforce per-segment MIN_SAMPLE before computing YoY.
    // Without this, neighborhoods with 1 transaction in one year and 0 in the
    // other produce -100% YoY which is misleading, not a real crash.
    let yoyPriceChange: number | null = null;
    if (currentProps.length >= NEIGHBORHOOD_MIN_SAMPLE && priorProps.length >= NEIGHBORHOOD_MIN_SAMPLE) {
      const localYoY = computeYoY(currentProps, priorProps);
      yoyPriceChange = localYoY.medianPriceChange;
    }

    // Flatten amenities for this neighborhood (we don't have per-zip amenities,
    // so all amenities apply to the market as a whole)
    const flatAmenities: NeighborhoodBreakdown["amenities"] = [];
    for (const [category, businesses] of Object.entries(amenities)) {
      for (const biz of businesses) {
        flatAmenities.push({ name: biz.name, category, rating: biz.rating });
      }
    }

    neighborhoods.push({
      name: zipToNeighborhood?.get(zip) ?? WELL_KNOWN_ZIP_NEIGHBORHOODS[zip] ?? zip,
      zipCode: zip,
      propertyCount: props.length,
      medianPrice: median(prices),
      medianPricePerSqft: psfValues.length > 0 ? median(psfValues) : null,
      yoyPriceChange,
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

    const { currentPeriodProps: currentYearProps, priorPeriodProps: priorYearProps } = splitByYearFallback(peer.properties, currentYear);
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
  return segments.map((seg) => {
    // Use segment-specific YoY when available, fall back to market-wide
    const segYoyChange = seg.yoy?.medianPriceChange ?? yoy.medianPriceChange;
    return {
      segment: seg.name,
      rating: seg.rating,
      propertyCount: seg.count,
      medianPrice: seg.medianPrice,
      yoyChange: segYoyChange,
      trend: segYoyChange == null
        ? "flat" as const
        : segYoyChange > 0.01
          ? "up" as const
          : segYoyChange < -0.01
            ? "down" as const
            : "flat" as const,
    };
  });
}
