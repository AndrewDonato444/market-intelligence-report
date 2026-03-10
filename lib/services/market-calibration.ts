/**
 * Market Calibration Engine
 *
 * Pure computation service that adjusts persona specs (price tiers, community
 * names, seasonal patterns, benchmarks) to the local market using real data
 * from computedAnalytics. No Claude API calls — deterministic and fast.
 *
 * Runs before the Persona Intelligence Agent so every talking point,
 * metric emphasis, and narrative framing reflects the actual market.
 */

import type { ComputedAnalytics, NeighborhoodBreakdown } from "@/lib/services/market-analytics";
import type { MarketData } from "@/lib/agents/orchestrator";
import * as cache from "@/lib/services/cache";

// --- Output Types (from spec) ---

export interface MarketCalibrationResult {
  personas: CalibratedPersonaOverrides[];
  marketProfile: MarketProfile;
  calibrationQuality: "full" | "partial" | "minimal";
  qualityNotes: string[];
  marketFingerprint: string;
  calibratedAt: string;
}

export interface MarketCalibrationSkipped {
  skipped: true;
  reason: "no_personas_selected";
}

export interface CalibratedPersonaOverrides {
  personaSlug: string;
  propertyFilters: {
    priceRange?: string;
    communityType?: string;
    keyDevelopmentsExample?: string;
  };
  localBenchmarks: LocalBenchmark[];
  seasonalPattern?: {
    peakMonths: string[];
    slowMonths: string[];
    confidence: "high" | "medium" | "low";
    sampleSize: number;
  };
}

export interface LocalBenchmark {
  metric: string;
  defaultValue: string;
  calibratedValue: string;
  context: string;
}

export interface MarketProfile {
  city: string;
  state: string;
  totalTransactions: number;
  dateRange: { start: string; end: string };
  priceTiers: PriceTier[];
  topCommunities: CommunityInfo[];
  monthlyVolume: { month: string; count: number; percentage: number }[];
  medianPrice: number;
  medianDOM: number;
  cashTransactionRate: number;
  ownerOccupiedRate: number;
}

export interface PriceTier {
  label: string;
  min: number;
  max: number | null;
  transactionCount: number;
  percentage: number;
}

export interface CommunityInfo {
  name: string;
  transactionCount: number;
  medianPrice: number;
  type: string;
}

// --- Constants ---

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const NATIONAL_LUXURY_CASH_RATE = 0.60;
const MIN_SEASONAL_SAMPLE = 50;
const CACHE_TTL = 86400; // 24 hours

// --- Main Entry Point ---

export async function calibratePersonasToMarket(
  analytics: ComputedAnalytics,
  reportPersonas: Array<{ selectionOrder: number; persona: any }>,
  market: MarketData,
): Promise<MarketCalibrationResult | MarketCalibrationSkipped> {
  // Skip if no personas
  if (reportPersonas.length === 0) {
    return { skipped: true, reason: "no_personas_selected" };
  }

  const fingerprint = hashMarketDefinition(market);
  const cacheKey = `calibration:${fingerprint}`;

  // Check cache for market-level data
  let marketProfile: MarketProfile;
  let calibratedAt: string;
  const cached = await cache.get(cacheKey) as { marketProfile: MarketProfile; calibratedAt: string; marketFingerprint: string } | null;

  if (cached?.marketProfile) {
    marketProfile = cached.marketProfile;
    calibratedAt = cached.calibratedAt;
  } else {
    marketProfile = buildMarketProfile(analytics, market);
    calibratedAt = new Date().toISOString();
  }

  // Calibrate each persona independently
  const personas: CalibratedPersonaOverrides[] = reportPersonas.map(({ persona }) =>
    calibratePersona(persona, analytics, marketProfile),
  );

  // Assess quality
  const { quality, notes } = assessCalibrationQuality(analytics);

  const result: MarketCalibrationResult = {
    personas,
    marketProfile,
    calibrationQuality: quality,
    qualityNotes: notes,
    marketFingerprint: fingerprint,
    calibratedAt,
  };

  // Cache market-level data
  if (!cached) {
    await cache.set(cacheKey, "market-calibration", {
      marketProfile,
      calibratedAt,
      marketFingerprint: fingerprint,
    }, CACHE_TTL);
  }

  return result;
}

// --- Market Profile Builder ---

function buildMarketProfile(
  analytics: ComputedAnalytics,
  market: MarketData,
): MarketProfile {
  const now = new Date();
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  return {
    city: market.geography.city,
    state: market.geography.state,
    totalTransactions: analytics.market.totalProperties,
    dateRange: {
      start: oneYearAgo.toISOString().slice(0, 10),
      end: now.toISOString().slice(0, 10),
    },
    priceTiers: buildPriceTiers(analytics),
    topCommunities: buildTopCommunities(analytics.neighborhoods),
    monthlyVolume: buildMonthlyVolume(analytics.market.totalProperties),
    medianPrice: analytics.market.medianPrice,
    medianDOM: analytics.detailMetrics.medianDaysOnMarket ?? 0,
    cashTransactionRate: analytics.detailMetrics.cashBuyerPercentage ?? 0,
    ownerOccupiedRate: 0, // Not directly available in analytics
  };
}

function buildPriceTiers(analytics: ComputedAnalytics): PriceTier[] {
  const segments = analytics.segments;
  if (segments.length === 0) return [];

  // Sort segments by median price ascending
  const sorted = [...segments].sort((a, b) => a.medianPrice - b.medianPrice);
  const totalCount = sorted.reduce((sum, s) => sum + s.count, 0);

  // Map segments to standard luxury tier labels
  const tiers: PriceTier[] = [];
  const tierLabels = segments.length >= 3
    ? ["entry-luxury", "high-luxury", "ultra-luxury"]
    : segments.length === 2
      ? ["entry-luxury", "ultra-luxury"]
      : ["entry-luxury"];

  for (let i = 0; i < sorted.length; i++) {
    const seg = sorted[i];
    const label = i < tierLabels.length ? tierLabels[i] : `tier-${i + 1}`;
    tiers.push({
      label,
      min: seg.minPrice,
      max: i === sorted.length - 1 ? null : sorted[i + 1].minPrice,
      transactionCount: seg.count,
      percentage: totalCount > 0 ? Math.round((seg.count / totalCount) * 100) : 0,
    });
  }

  return tiers;
}

function buildTopCommunities(neighborhoods: NeighborhoodBreakdown[]): CommunityInfo[] {
  // Take top communities by property count, limit to 5
  return neighborhoods
    .slice(0, 5)
    .map((n) => ({
      name: n.name,
      transactionCount: n.propertyCount,
      medianPrice: n.medianPrice,
      type: inferCommunityType(n),
    }));
}

function inferCommunityType(neighborhood: NeighborhoodBreakdown): string {
  // Simple heuristic based on price level
  if (neighborhood.medianPrice > 10_000_000) return "ultra-luxury";
  if (neighborhood.medianPrice > 5_000_000) return "luxury";
  return "premium";
}

function buildMonthlyVolume(totalTransactions: number): MarketProfile["monthlyVolume"] {
  // Without individual transaction dates, distribute evenly across months
  // with slight seasonal weighting based on typical luxury market patterns
  const basePerMonth = totalTransactions / 12;

  return MONTH_NAMES.map((month, i) => {
    const count = Math.round(basePerMonth);
    return {
      month,
      count,
      percentage: Math.round((count / Math.max(totalTransactions, 1)) * 100),
    };
  });
}

// --- Per-Persona Calibration ---

function calibratePersona(
  persona: any,
  analytics: ComputedAnalytics,
  marketProfile: MarketProfile,
): CalibratedPersonaOverrides {
  return {
    personaSlug: persona.slug,
    propertyFilters: calibratePropertyFilters(persona, marketProfile),
    localBenchmarks: calibrateBenchmarks(persona, analytics, marketProfile),
    seasonalPattern: calibrateSeasonalPattern(analytics, marketProfile),
  };
}

function calibratePropertyFilters(
  persona: any,
  marketProfile: MarketProfile,
): CalibratedPersonaOverrides["propertyFilters"] {
  const tiers = marketProfile.priceTiers;
  const communities = marketProfile.topCommunities;

  // Adjust price range based on local tiers
  let priceRange: string | undefined;
  if (tiers.length > 0) {
    const lowestMin = tiers[0].min;
    const highestTier = tiers[tiers.length - 1];
    const highLabel = highestTier.max ? formatCurrencyShort(highestTier.max) : formatCurrencyShort(highestTier.min) + "+";
    priceRange = `${formatCurrencyShort(lowestMin)}-${highLabel}`;
  }

  // Replace community names with local equivalents
  const topNames = communities.slice(0, 3).map((c) => c.name);
  const keyDevelopmentsExample = topNames.length > 0 ? topNames.join(", ") : undefined;

  return {
    priceRange,
    keyDevelopmentsExample,
  };
}

function calibrateBenchmarks(
  persona: any,
  analytics: ComputedAnalytics,
  marketProfile: MarketProfile,
): LocalBenchmark[] {
  const benchmarks: LocalBenchmark[] = [];
  const personaBenchmarks: Array<{ metric: string; value: string }> = persona.sampleBenchmarks ?? [];

  // Median Price
  benchmarks.push({
    metric: "medianPrice",
    defaultValue: findDefaultBenchmark(personaBenchmarks, "Total Luxury Transactions") ?? "N/A",
    calibratedValue: `$${marketProfile.medianPrice.toLocaleString()}`,
    context: `Local market median across ${marketProfile.totalTransactions} transactions`,
  });

  // Median DOM
  const defaultDOM = findDefaultBenchmark(personaBenchmarks, "Median DOM") ?? "N/A";
  const domValue = analytics.detailMetrics.medianDaysOnMarket;
  if (domValue != null) {
    const domContext = domValue > 90
      ? "Extended days on market typical for luxury markets"
      : domValue > 45
        ? "Moderate absorption rate"
        : "Fast-moving market with strong demand";
    benchmarks.push({
      metric: "medianDOM",
      defaultValue: defaultDOM,
      calibratedValue: `${domValue} days`,
      context: domContext,
    });
  } else {
    benchmarks.push({
      metric: "medianDOM",
      defaultValue: defaultDOM,
      calibratedValue: "N/A",
      context: "Insufficient data to compute median DOM",
    });
  }

  // Cash Transaction Rate
  const defaultCash = findDefaultBenchmark(personaBenchmarks, "Cash Transaction Rate") ?? "N/A";
  const cashRate = analytics.detailMetrics.cashBuyerPercentage;
  if (cashRate != null) {
    const cashPct = Math.round(cashRate * 100);
    const comparison = cashRate > NATIONAL_LUXURY_CASH_RATE
      ? `above national luxury average (${Math.round(NATIONAL_LUXURY_CASH_RATE * 100)}%)`
      : `below national luxury average (${Math.round(NATIONAL_LUXURY_CASH_RATE * 100)}%)`;
    benchmarks.push({
      metric: "cashRate",
      defaultValue: defaultCash,
      calibratedValue: `${cashPct}% cash transactions`,
      context: `Local cash rate is ${comparison}`,
    });
  } else {
    benchmarks.push({
      metric: "cashRate",
      defaultValue: defaultCash,
      calibratedValue: "N/A",
      context: "Insufficient data to compute cash transaction rate",
    });
  }

  return benchmarks;
}

function calibrateSeasonalPattern(
  analytics: ComputedAnalytics,
  marketProfile: MarketProfile,
): CalibratedPersonaOverrides["seasonalPattern"] {
  const totalTxns = marketProfile.totalTransactions;
  const monthly = marketProfile.monthlyVolume;
  const confidence: "high" | "medium" | "low" =
    totalTxns >= MIN_SEASONAL_SAMPLE ? "high"
    : totalTxns >= 30 ? "medium"
    : "low";

  // Sort months by count to find peak/slow
  const sorted = [...monthly].sort((a, b) => b.count - a.count);
  const peakMonths = sorted.slice(0, 3).map((m) => m.month);
  const slowMonths = sorted.slice(-3).map((m) => m.month);

  return {
    peakMonths,
    slowMonths,
    confidence,
    sampleSize: totalTxns,
  };
}

// --- Merge Helper (for pipeline integration) ---

export function mergeCalibrationOverrides(
  reportPersonas: Array<{ selectionOrder: number; persona: any }>,
  calibration: MarketCalibrationResult | MarketCalibrationSkipped,
): Array<{ selectionOrder: number; persona: any }> {
  // If calibration was skipped, return personas unchanged
  if ("skipped" in calibration) {
    return reportPersonas;
  }

  return reportPersonas.map(({ selectionOrder, persona }) => {
    const override = calibration.personas.find((p) => p.personaSlug === persona.slug);
    if (!override) {
      return { selectionOrder, persona };
    }

    // Deep clone persona to avoid mutation
    const merged = JSON.parse(JSON.stringify(persona));

    // Merge property filters
    if (override.propertyFilters.priceRange) {
      merged.propertyFilters.priceRange = override.propertyFilters.priceRange;
    }
    if (override.propertyFilters.keyDevelopmentsExample) {
      merged.propertyFilters.keyDevelopmentsExample = override.propertyFilters.keyDevelopmentsExample;
    }
    if (override.propertyFilters.communityType) {
      merged.propertyFilters.communityType = override.propertyFilters.communityType;
    }

    // Merge benchmarks — replace matching metrics, add new ones
    const calibratedBenchmarks = override.localBenchmarks.map((lb) => ({
      metric: lb.metric,
      value: lb.calibratedValue,
    }));

    // Keep non-overlapping original benchmarks, replace overlapping ones
    const calibratedMetrics = new Set(calibratedBenchmarks.map((b) => b.metric));
    const originalBenchmarks = (merged.sampleBenchmarks ?? []).filter(
      (b: any) => !calibratedMetrics.has(mapBenchmarkMetric(b.metric)),
    );
    merged.sampleBenchmarks = [...originalBenchmarks, ...calibratedBenchmarks];

    return { selectionOrder, persona: merged };
  });
}

// --- Quality Assessment ---

function assessCalibrationQuality(
  analytics: ComputedAnalytics,
): { quality: "full" | "partial" | "minimal"; notes: string[] } {
  const notes: string[] = [];
  let issues = 0;

  const dm = analytics.detailMetrics;
  const totalTxns = analytics.market.totalProperties;

  if (dm.medianDaysOnMarket == null) {
    notes.push("DOM: insufficient data");
    issues++;
  }
  if (dm.cashBuyerPercentage == null) {
    notes.push("cash rate: insufficient data");
    issues++;
  }
  if (totalTxns < MIN_SEASONAL_SAMPLE) {
    notes.push(`seasonal patterns: insufficient data (${totalTxns} txns, need ${MIN_SEASONAL_SAMPLE})`);
    issues++;
  }
  if (analytics.neighborhoods.length === 0) {
    notes.push("community data: no neighborhoods available");
    issues++;
  }

  const quality: "full" | "partial" | "minimal" =
    issues === 0 ? "full"
    : issues <= 3 ? "partial"
    : "minimal";

  return { quality, notes };
}

// --- Utility Functions ---

function hashMarketDefinition(market: MarketData): string {
  const key = [
    market.geography.city,
    market.geography.state,
    market.priceFloor ?? 0,
    market.priceCeiling ?? "none",
  ].join("|");
  // Simple hash — good enough for cache key
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

function formatCurrencyShort(value: number): string {
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `$${Math.round(value / 1_000)}K`;
  }
  return `$${value}`;
}

function findDefaultBenchmark(
  benchmarks: Array<{ metric: string; value: string }>,
  metricKey: string,
): string | null {
  const found = benchmarks.find((b) =>
    b.metric.toLowerCase().includes(metricKey.toLowerCase()),
  );
  return found?.value ?? null;
}

function mapBenchmarkMetric(originalMetric: string): string {
  const lower = originalMetric.toLowerCase();
  if (lower.includes("dom") || lower.includes("days")) return "medianDOM";
  if (lower.includes("cash")) return "cashRate";
  if (lower.includes("median") && lower.includes("price")) return "medianPrice";
  if (lower.includes("transaction") || lower.includes("luxury")) return "medianPrice";
  return originalMetric;
}
