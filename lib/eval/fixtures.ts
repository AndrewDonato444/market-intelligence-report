/**
 * Eval Suite — Market Data Fixtures
 *
 * Pre-built ComputedAnalytics and MarketData objects for eval test cases.
 * Each fixture represents a different market condition to test agent behavior.
 */

import type { MarketData, AgentResult, SectionOutput } from "@/lib/agents/orchestrator";
import type {
  ComputedAnalytics,
  DimensionScore,
  DetailDerivedMetrics,
} from "@/lib/services/market-analytics";
import type { SegmentMetrics, YoYMetrics } from "@/lib/agents/data-analyst";

// --- Fixture container ---

export interface EvalFixture {
  id: string;
  name: string;
  description: string;
  market: MarketData;
  computedAnalytics: ComputedAnalytics;
  upstreamResults?: Record<string, AgentResult>;
}

// --- Reusable helpers ---

function dimScore(score: number, label: string, components: Record<string, number | null> = {}): DimensionScore {
  return { score, label, components };
}

const defaultDetailMetrics: DetailDerivedMetrics = {
  medianDaysOnMarket: 45,
  cashBuyerPercentage: 0.32,
  listToSaleRatio: 1.04,
  floodZonePercentage: 0.02,
  investorBuyerPercentage: 0.08,
  freeClearPercentage: 0.15,
  dataSources: { dom: "mls", listToSale: "mls" },
};

function segment(
  name: string,
  count: number,
  medianPrice: number,
  opts: Partial<SegmentMetrics> = {}
): SegmentMetrics {
  return {
    name,
    propertyType: opts.propertyType ?? "single_family",
    count,
    medianPrice,
    averagePrice: opts.averagePrice ?? medianPrice * 1.15,
    minPrice: opts.minPrice ?? medianPrice * 0.6,
    maxPrice: opts.maxPrice ?? medianPrice * 2.5,
    medianPricePerSqft: opts.medianPricePerSqft ?? null,
    rating: opts.rating ?? "B+",
    lowSample: opts.lowSample ?? count < 10,
    yoy: opts.yoy ?? null,
  };
}

// ============================================================
// FIXTURE 1: Strong Market (Palm Beach, FL)
// ============================================================

const strongMarket: MarketData = {
  name: "Palm Beach",
  geography: { city: "Palm Beach", state: "FL", county: "Palm Beach County" },
  luxuryTier: "luxury",
  priceFloor: 1_000_000,
  priceCeiling: 5_000_000,
  segments: ["waterfront", "golf_community", "historic_district", "new_construction", "condo"],
  peerMarkets: [
    { name: "Naples", geography: { city: "Naples", state: "FL" } },
    { name: "Miami Beach", geography: { city: "Miami Beach", state: "FL" } },
  ],
};

const strongAnalytics: ComputedAnalytics = {
  market: {
    totalProperties: 847,
    medianPrice: 3_500_000,
    averagePrice: 4_100_000,
    medianPricePerSqft: 1_250,
    totalVolume: 2_960_000_000,
    rating: "A-",
  },
  segments: [
    segment("Waterfront", 124, 5_100_000, { medianPricePerSqft: 1_450, rating: "A" }),
    segment("Golf Community", 215, 3_200_000, { medianPricePerSqft: 1_100, rating: "B+" }),
    segment("Historic District", 178, 3_800_000, { medianPricePerSqft: 1_350, rating: "A-" }),
    segment("New Construction", 198, 3_400_000, { medianPricePerSqft: 1_200, rating: "B+" }),
    segment("Condo", 132, 2_100_000, { medianPricePerSqft: 950, rating: "B" }),
  ],
  yoy: {
    medianPriceChange: 0.082,
    volumeChange: 0.05,
    pricePerSqftChange: 0.065,
    averagePriceChange: null,
    totalVolumeChange: null,
    domChange: null,
    listToSaleChange: null,
  },
  insightsIndex: {
    liquidity: dimScore(8, "Strong", { daysOnMarket: 45, turnover: 0.24 }),
    timing: dimScore(7, "Favorable", { seasonality: 0.8, momentum: 0.7 }),
    risk: dimScore(6, "Moderate", { volatility: 0.12, concentration: 0.3 }),
    value: dimScore(5, "Neutral", { priceToRent: 22, affordability: 0.15 }),
  },
  dashboard: {
    powerFour: [
      { name: "Median Price", value: 3_500_000, trend: "up", trendValue: 0.082, category: "power_four" },
      { name: "Days On Market", value: 45, trend: "down", trendValue: -5, category: "power_four" },
      { name: "List-to-Sale Ratio", value: 1.04, trend: "up", trendValue: 0.01, category: "power_four" },
      { name: "Absorption Rate", value: 4.2, trend: "down", trendValue: -0.3, category: "power_four" },
    ],
    supportingMetrics: [
      { name: "Price Per SqFt", value: 1_250, trend: "up", trendValue: 0.065, category: "supporting" },
    ],
  },
  neighborhoods: [
    {
      name: "South of Southern Blvd",
      zipCode: "33480",
      propertyCount: 245,
      medianPrice: 4_200_000,
      medianPricePerSqft: 1_380,
      yoyPriceChange: 0.095,
      amenities: [
        { name: "Beach Access", category: "recreation", rating: 9 },
        { name: "Fine Dining", category: "dining", rating: 8 },
      ],
    },
    {
      name: "North End",
      zipCode: "33480",
      propertyCount: 189,
      medianPrice: 3_800_000,
      medianPricePerSqft: 1_250,
      yoyPriceChange: 0.072,
      amenities: [
        { name: "Golf Courses", category: "recreation", rating: 9 },
        { name: "Country Clubs", category: "social", rating: 8 },
      ],
    },
  ],
  peerComparisons: [
    {
      name: "Naples",
      geography: { city: "Naples", state: "FL" },
      medianPrice: 3_200_000,
      averagePrice: 3_800_000,
      medianPricePerSqft: 1_100,
      totalProperties: 620,
      totalVolume: 1_980_000_000,
      rating: "B+",
      yoy: { medianPriceChange: 0.065, volumeChange: 0.03, pricePerSqftChange: 0.05, averagePriceChange: null, totalVolumeChange: null, domChange: null, listToSaleChange: null },
    },
    {
      name: "Miami Beach",
      geography: { city: "Miami Beach", state: "FL" },
      medianPrice: 2_800_000,
      averagePrice: 3_500_000,
      medianPricePerSqft: 1_050,
      totalProperties: 1_200,
      totalVolume: 3_360_000_000,
      rating: "B+",
      yoy: { medianPriceChange: 0.045, volumeChange: 0.08, pricePerSqftChange: 0.035, averagePriceChange: null, totalVolumeChange: null, domChange: null, listToSaleChange: null },
    },
  ],
  peerRankings: [
    { metric: "Median Price", targetRank: 1, totalMarkets: 3 },
    { metric: "YoY Growth", targetRank: 1, totalMarkets: 3 },
    { metric: "Volume", targetRank: 2, totalMarkets: 3 },
  ],
  scorecard: [
    { segment: "Waterfront", rating: "A", propertyCount: 124, medianPrice: 5_100_000, yoyChange: 0.095, trend: "up" },
    { segment: "Golf Community", rating: "B+", propertyCount: 215, medianPrice: 3_200_000, yoyChange: 0.07, trend: "up" },
    { segment: "Historic District", rating: "A-", propertyCount: 178, medianPrice: 3_800_000, yoyChange: 0.08, trend: "up" },
    { segment: "New Construction", rating: "B+", propertyCount: 198, medianPrice: 3_400_000, yoyChange: 0.06, trend: "up" },
    { segment: "Condo", rating: "B", propertyCount: 132, medianPrice: 2_100_000, yoyChange: 0.04, trend: "up" },
  ],
  confidence: {
    level: "high",
    sampleSize: 847,
    detailCoverage: 0.82,
    staleDataSources: [],
  },
  news: { targetMarket: [], peerMarkets: {} },
  detailMetrics: defaultDetailMetrics,
  dataAsOfDate: null,
  analysisPeriod: {
    current: { min: "2025-03-18", max: "2026-03-17", count: 0 },
    prior: { min: "2024-03-18", max: "2025-03-17", count: 0 },
  },
};

// ============================================================
// FIXTURE 2: Low Data (Small Town, MT)
// ============================================================

const lowDataMarket: MarketData = {
  name: "Big Sky",
  geography: { city: "Big Sky", state: "MT", county: "Gallatin County" },
  luxuryTier: "luxury",
  priceFloor: 1_000_000,
};

const lowDataAnalytics: ComputedAnalytics = {
  market: {
    totalProperties: 5,
    medianPrice: 1_200_000,
    averagePrice: 1_350_000,
    medianPricePerSqft: null,
    totalVolume: 6_750_000,
    rating: "C",
  },
  segments: [
    segment("Mountain", 5, 1_200_000, { lowSample: true, rating: "C" }),
  ],
  yoy: { medianPriceChange: null, volumeChange: null, pricePerSqftChange: null, averagePriceChange: null, totalVolumeChange: null, domChange: null, listToSaleChange: null },
  insightsIndex: {
    liquidity: dimScore(2, "Weak", {}),
    timing: dimScore(3, "Uncertain", {}),
    risk: dimScore(8, "High", {}),
    value: dimScore(4, "Uncertain", {}),
  },
  dashboard: {
    powerFour: [
      { name: "Median Price", value: 1_200_000, trend: null, trendValue: null, category: "power_four" },
      { name: "Active Listings", value: 5, trend: null, trendValue: null, category: "power_four" },
    ],
    supportingMetrics: [],
  },
  neighborhoods: [],
  peerComparisons: [],
  peerRankings: [],
  scorecard: [
    { segment: "Mountain", rating: "C", propertyCount: 5, medianPrice: 1_200_000, yoyChange: null, trend: "flat" },
  ],
  confidence: {
    level: "low",
    sampleSize: 5,
    detailCoverage: 0.2,
    staleDataSources: [],
  },
  news: { targetMarket: [], peerMarkets: {} },
  detailMetrics: {
    medianDaysOnMarket: null,
    cashBuyerPercentage: null,
    listToSaleRatio: null,
    floodZonePercentage: null,
    investorBuyerPercentage: null,
    freeClearPercentage: null,
    dataSources: { dom: "none", listToSale: "none" },
  },
  dataAsOfDate: null,
  analysisPeriod: {
    current: { min: "2025-03-18", max: "2026-03-17", count: 0 },
    prior: { min: "2024-03-18", max: "2025-03-17", count: 0 },
  },
};

// ============================================================
// FIXTURE 3: Single Segment (Aspen, CO)
// ============================================================

const singleSegmentMarket: MarketData = {
  name: "Aspen",
  geography: { city: "Aspen", state: "CO", county: "Pitkin County" },
  luxuryTier: "high_luxury",
  priceFloor: 5_000_000,
};

const singleSegmentAnalytics: ComputedAnalytics = {
  market: {
    totalProperties: 120,
    medianPrice: 8_000_000,
    averagePrice: 9_500_000,
    medianPricePerSqft: 2_200,
    totalVolume: 1_140_000_000,
    rating: "A",
  },
  segments: [
    segment("Mountain Estate", 120, 8_000_000, { medianPricePerSqft: 2_200, rating: "A" }),
  ],
  yoy: { medianPriceChange: 0.11, volumeChange: -0.03, pricePerSqftChange: 0.09, averagePriceChange: null, totalVolumeChange: null, domChange: null, listToSaleChange: null },
  insightsIndex: {
    liquidity: dimScore(6, "Moderate", { daysOnMarket: 68, turnover: 0.15 }),
    timing: dimScore(5, "Neutral", {}),
    risk: dimScore(5, "Moderate", {}),
    value: dimScore(4, "Below Average", {}),
  },
  dashboard: {
    powerFour: [
      { name: "Median Price", value: 8_000_000, trend: "up", trendValue: 0.11, category: "power_four" },
      { name: "Active Listings", value: 120, trend: "down", trendValue: -0.03, category: "power_four" },
    ],
    supportingMetrics: [],
  },
  neighborhoods: [],
  peerComparisons: [],
  peerRankings: [],
  scorecard: [
    { segment: "Mountain Estate", rating: "A", propertyCount: 120, medianPrice: 8_000_000, yoyChange: 0.11, trend: "up" },
  ],
  confidence: { level: "high", sampleSize: 120, detailCoverage: 0.75, staleDataSources: [] },
  news: { targetMarket: [], peerMarkets: {} },
  detailMetrics: { ...defaultDetailMetrics, medianDaysOnMarket: 68 },
  dataAsOfDate: null,
  analysisPeriod: {
    current: { min: "2025-03-18", max: "2026-03-17", count: 0 },
    prior: { min: "2024-03-18", max: "2025-03-17", count: 0 },
  },
};

// ============================================================
// FIXTURE 4: No YoY Data (New Market, AZ)
// ============================================================

const noYoyMarket: MarketData = {
  name: "Scottsdale",
  geography: { city: "Scottsdale", state: "AZ", county: "Maricopa County" },
  luxuryTier: "luxury",
  priceFloor: 1_000_000,
};

const noYoyAnalytics: ComputedAnalytics = {
  ...strongAnalytics,
  market: {
    totalProperties: 200,
    medianPrice: 2_100_000,
    averagePrice: 2_500_000,
    medianPricePerSqft: 850,
    totalVolume: 500_000_000,
    rating: "B",
  },
  segments: [
    segment("Desert Estate", 120, 2_500_000, { medianPricePerSqft: 900, rating: "B+" }),
    segment("Golf Course", 80, 1_800_000, { medianPricePerSqft: 750, rating: "B" }),
  ],
  yoy: { medianPriceChange: null, volumeChange: null, pricePerSqftChange: null, averagePriceChange: null, totalVolumeChange: null, domChange: null, listToSaleChange: null },
  confidence: { level: "medium", sampleSize: 200, detailCoverage: 0.5, staleDataSources: [] },
};

// ============================================================
// FIXTURE 5: Stale Data Sources (Miami Beach, FL)
// ============================================================

const staleSourcesMarket: MarketData = {
  name: "Miami Beach",
  geography: { city: "Miami Beach", state: "FL", county: "Miami-Dade County" },
  luxuryTier: "luxury",
  priceFloor: 1_000_000,
};

const staleSourcesAnalytics: ComputedAnalytics = {
  ...strongAnalytics,
  market: {
    totalProperties: 500,
    medianPrice: 2_800_000,
    averagePrice: 3_400_000,
    medianPricePerSqft: 1_050,
    totalVolume: 1_700_000_000,
    rating: "B+",
  },
  confidence: {
    level: "high",
    sampleSize: 500,
    detailCoverage: 0.6,
    staleDataSources: ["RealEstateAPI (Property Detail)", "ScrapingDog (Local Search)"],
  },
};

// ============================================================
// FIXTURE 6: Ultra Luxury (Beverly Hills, CA)
// ============================================================

const ultraLuxuryMarket: MarketData = {
  name: "Beverly Hills",
  geography: { city: "Beverly Hills", state: "CA", county: "Los Angeles County" },
  luxuryTier: "ultra_luxury",
  priceFloor: 10_000_000,
};

const ultraLuxuryAnalytics: ComputedAnalytics = {
  ...strongAnalytics,
  market: {
    totalProperties: 89,
    medianPrice: 15_000_000,
    averagePrice: 22_000_000,
    medianPricePerSqft: 3_800,
    totalVolume: 1_958_000_000,
    rating: "A",
  },
  segments: [
    segment("Estate", 45, 18_000_000, { medianPricePerSqft: 4_200, rating: "A+" }),
    segment("Modern", 28, 14_000_000, { medianPricePerSqft: 3_600, rating: "A" }),
    segment("Condo/Penthouse", 16, 8_500_000, { medianPricePerSqft: 3_200, rating: "A-" }),
  ],
  yoy: { medianPriceChange: 0.045, volumeChange: -0.08, pricePerSqftChange: 0.055, averagePriceChange: null, totalVolumeChange: null, domChange: null, listToSaleChange: null },
  confidence: { level: "high", sampleSize: 89, detailCoverage: 0.9, staleDataSources: [] },
};

// ============================================================
// FIXTURE 7: Mixed Confidence (Hamptons, NY)
// ============================================================

const mixedConfidenceMarket: MarketData = {
  name: "The Hamptons",
  geography: { city: "Southampton", state: "NY", county: "Suffolk County" },
  luxuryTier: "high_luxury",
  priceFloor: 5_000_000,
};

const mixedConfidenceAnalytics: ComputedAnalytics = {
  ...strongAnalytics,
  market: {
    totalProperties: 300,
    medianPrice: 6_500_000,
    averagePrice: 8_200_000,
    medianPricePerSqft: 1_800,
    totalVolume: 2_460_000_000,
    rating: "A-",
  },
  segments: [
    segment("Oceanfront", 45, 12_000_000, { medianPricePerSqft: 2_800, rating: "A" }),
    segment("Village Estate", 120, 6_000_000, { medianPricePerSqft: 1_700, rating: "A-" }),
    segment("Farm/Vineyard", 15, 5_500_000, { medianPricePerSqft: 1_200, rating: "B", lowSample: true }),
    segment("New Build", 60, 7_200_000, { medianPricePerSqft: 2_000, rating: "B+" }),
    segment("Tear-Down Lot", 60, 4_000_000, { medianPricePerSqft: null, rating: "C+", lowSample: false }),
  ],
  yoy: { medianPriceChange: 0.06, volumeChange: -0.02, pricePerSqftChange: 0.07, averagePriceChange: null, totalVolumeChange: null, domChange: null, listToSaleChange: null },
  confidence: { level: "medium", sampleSize: 300, detailCoverage: 0.55, staleDataSources: ["ScrapingDog (Local Search)"] },
};

// ============================================================
// FIXTURE 8: Empty Market (Ghost Town, NV)
// ============================================================

const emptyMarket: MarketData = {
  name: "Eureka",
  geography: { city: "Eureka", state: "NV", county: "Eureka County" },
  luxuryTier: "luxury",
  priceFloor: 1_000_000,
};

const emptyAnalytics: ComputedAnalytics = {
  market: {
    totalProperties: 0,
    medianPrice: 0,
    averagePrice: 0,
    medianPricePerSqft: null,
    totalVolume: 0,
    rating: "F",
  },
  segments: [],
  yoy: { medianPriceChange: null, volumeChange: null, pricePerSqftChange: null, averagePriceChange: null, totalVolumeChange: null, domChange: null, listToSaleChange: null },
  insightsIndex: {
    liquidity: dimScore(0, "None", {}),
    timing: dimScore(0, "None", {}),
    risk: dimScore(10, "Extreme", {}),
    value: dimScore(0, "None", {}),
  },
  dashboard: { powerFour: [], supportingMetrics: [] },
  neighborhoods: [],
  peerComparisons: [],
  peerRankings: [],
  scorecard: [],
  confidence: { level: "low", sampleSize: 0, detailCoverage: 0, staleDataSources: [] },
  news: { targetMarket: [], peerMarkets: {} },
  detailMetrics: {
    medianDaysOnMarket: null,
    cashBuyerPercentage: null,
    listToSaleRatio: null,
    floodZonePercentage: null,
    investorBuyerPercentage: null,
    freeClearPercentage: null,
    dataSources: { dom: "none", listToSale: "none" },
  },
  dataAsOfDate: null,
  analysisPeriod: {
    current: { min: "2025-03-18", max: "2026-03-17", count: 0 },
    prior: { min: "2024-03-18", max: "2025-03-17", count: 0 },
  },
};

// ============================================================
// UPSTREAM RESULT FIXTURES (for polish-agent tests)
// ============================================================

const insightGeneratorUpstream: AgentResult = {
  agentName: "insight-generator",
  sections: [
    {
      sectionType: "market_overview",
      title: "Strategic Market Overview & Insights",
      content: {
        narrative: "The Palm Beach luxury segment commands a $3.5M median price with 847 active properties, representing an 8.2% year-over-year appreciation. Waterfront inventory has tightened significantly, with only 124 listings at a $5.1M median — creating competitive dynamics across the segment.",
        highlights: [
          "Median price: $3.5M (+8.2% YoY)",
          "Waterfront segment leads at $5.1M median, $1,450/sqft",
          "Cash buyers represent 32% of transactions",
        ],
        recommendations: [
          "Sellers in waterfront segment: list aggressively given supply constraints",
          "Buyers: consider golf community segment for relative value at $3.2M median",
        ],
      },
    },
    {
      sectionType: "key_drivers",
      title: "Key Market Drivers & Strategic Themes",
      content: {
        themes: [
          { name: "Waterfront Compression", impact: "high", trend: "up", narrative: "Only 124 waterfront listings remain..." },
          { name: "Investor Activity Surge", impact: "medium", trend: "up", narrative: "20% of transactions involve investor buyers..." },
        ],
      },
    },
    {
      sectionType: "executive_summary",
      title: "Executive Summary",
      content: {
        narrative: "Palm Beach's luxury market demonstrates robust strength with an A- rating...",
        highlights: ["8.2% median price appreciation", "847 active listings"],
        timing: {
          buyers: "Consider acting in Q2 before seasonal inventory tightens further",
          sellers: "Waterfront sellers hold significant leverage; non-waterfront should price competitively",
        },
      },
    },
  ],
  metadata: {
    executiveBriefing: "Palm Beach luxury market commands $3.5M median...",
    neighborhoodAnalysis: "South of Southern Blvd leads with $4.2M median...",
    editorial: "The defining story of Palm Beach luxury real estate...",
    themes: ["Waterfront Compression", "Investor Activity Surge"],
  },
  durationMs: 12000,
};

const forecastModelerUpstream: AgentResult = {
  agentName: "forecast-modeler",
  sections: [
    {
      sectionType: "forecasts",
      title: "Forward Outlook & Strategic Forecasts",
      content: {
        projections: [
          {
            segment: "Waterfront",
            sixMonth: { medianPrice: 5_350_000, priceRange: { low: 5_100_000, high: 5_600_000 }, confidence: "medium" },
            twelveMonth: { medianPrice: 5_550_000, priceRange: { low: 5_000_000, high: 6_100_000 }, confidence: "low" },
          },
        ],
        scenarios: {
          base: { narrative: "Continuation of 8.2% trend...", assumptions: ["Stable rates"], medianPriceChange: 0.082, volumeChange: 0.03 },
          bull: { narrative: "Rate cuts accelerate demand...", assumptions: ["Rate cut by Q3"], medianPriceChange: 0.12, volumeChange: 0.1 },
          bear: { narrative: "Recession dampens luxury...", assumptions: ["Recession in H2"], medianPriceChange: -0.02, volumeChange: -0.15 },
        },
      },
    },
    {
      sectionType: "strategic_summary",
      title: "Strategic Summary & Timing",
      content: {
        timing: { buyers: "Act in Q2 window", sellers: "List waterfront now" },
        outlook: { narrative: "Forward outlook remains positive...", monitoringAreas: ["Interest rates", "Inventory levels"] },
      },
    },
  ],
  metadata: {
    forecast: "Forward outlook remains positive...",
    guidance: { buyers: "Act in Q2 window", sellers: "List waterfront now" },
  },
  durationMs: 10000,
};

// Contradictory upstream: insight says "robust growth" but forecast says negative volume
const contradictoryUpstream: Record<string, AgentResult> = {
  "insight-generator": {
    ...insightGeneratorUpstream,
    sections: insightGeneratorUpstream.sections.map((s) =>
      s.sectionType === "market_overview"
        ? {
            ...s,
            content: {
              ...(s.content as Record<string, unknown>),
              narrative:
                "Palm Beach is experiencing robust growth across all segments with strong buyer demand driving prices to new highs. The market shows no signs of slowing down.",
            },
          }
        : s
    ),
  },
  "forecast-modeler": {
    ...forecastModelerUpstream,
    sections: forecastModelerUpstream.sections.map((s) =>
      s.sectionType === "forecasts"
        ? {
            ...s,
            content: {
              ...(s.content as Record<string, unknown>),
              scenarios: {
                base: {
                  narrative: "Transaction volume is projected to decline 5-8% as buyer fatigue sets in...",
                  assumptions: ["Rates stay elevated", "Inventory increases 15%"],
                  medianPriceChange: 0.02,
                  volumeChange: -0.06,
                },
                bull: { narrative: "...", assumptions: [], medianPriceChange: 0.05, volumeChange: 0.02 },
                bear: { narrative: "...", assumptions: [], medianPriceChange: -0.05, volumeChange: -0.15 },
              },
            },
          }
        : s
    ),
  },
};

// ============================================================
// FIXTURE REGISTRY
// ============================================================

export const EVAL_FIXTURES: Record<string, EvalFixture> = {
  "fixture-strong-market": {
    id: "fixture-strong-market",
    name: "Palm Beach Strong Market",
    description: "Healthy luxury market with 847 properties, 5 segments, high confidence, positive YoY",
    market: strongMarket,
    computedAnalytics: strongAnalytics,
  },
  "fixture-low-data": {
    id: "fixture-low-data",
    name: "Big Sky Low Data",
    description: "Only 5 properties, null YoY, low confidence — tests graceful degradation",
    market: lowDataMarket,
    computedAnalytics: lowDataAnalytics,
  },
  "fixture-single-segment": {
    id: "fixture-single-segment",
    name: "Aspen Single Segment",
    description: "120 properties but all in one segment — tests single-segment handling",
    market: singleSegmentMarket,
    computedAnalytics: singleSegmentAnalytics,
  },
  "fixture-no-yoy": {
    id: "fixture-no-yoy",
    name: "Scottsdale No YoY",
    description: "200 properties but no historical data — all YoY fields null",
    market: noYoyMarket,
    computedAnalytics: noYoyAnalytics,
  },
  "fixture-stale-sources": {
    id: "fixture-stale-sources",
    name: "Miami Beach Stale Sources",
    description: "500 properties but 2 data sources flagged as stale",
    market: staleSourcesMarket,
    computedAnalytics: staleSourcesAnalytics,
  },
  "fixture-ultra-luxury": {
    id: "fixture-ultra-luxury",
    name: "Beverly Hills Ultra Luxury",
    description: "$10M+ tier with $15M median — tests ultra-luxury vocabulary and scaling",
    market: ultraLuxuryMarket,
    computedAnalytics: ultraLuxuryAnalytics,
  },
  "fixture-mixed-confidence": {
    id: "fixture-mixed-confidence",
    name: "Hamptons Mixed Confidence",
    description: "Some segments high confidence, some low sample — tests per-segment differentiation",
    market: mixedConfidenceMarket,
    computedAnalytics: mixedConfidenceAnalytics,
  },
  "fixture-empty-market": {
    id: "fixture-empty-market",
    name: "Eureka Empty Market",
    description: "Zero properties — tests agent behavior with completely empty data",
    market: emptyMarket,
    computedAnalytics: emptyAnalytics,
  },
  "fixture-strong-market-upstream": {
    id: "fixture-strong-market-upstream",
    name: "Palm Beach Full Upstream",
    description: "Strong market with complete upstream results for polish agent testing",
    market: strongMarket,
    computedAnalytics: strongAnalytics,
    upstreamResults: {
      "insight-generator": insightGeneratorUpstream,
      "forecast-modeler": forecastModelerUpstream,
    },
  },
  "fixture-contradictory-upstream": {
    id: "fixture-contradictory-upstream",
    name: "Contradictory Upstream Results",
    description: "Insight says 'robust growth' but forecast projects negative volume — tests contradiction detection",
    market: strongMarket,
    computedAnalytics: strongAnalytics,
    upstreamResults: contradictoryUpstream,
  },
  "fixture-partial-upstream": {
    id: "fixture-partial-upstream",
    name: "Partial Upstream (No Forecast)",
    description: "Only insight-generator results — forecast-modeler missing — tests graceful handling",
    market: strongMarket,
    computedAnalytics: strongAnalytics,
    upstreamResults: {
      "insight-generator": insightGeneratorUpstream,
    },
  },
};

/** Helper: get a fixture by ID or throw */
export function getFixture(id: string): EvalFixture {
  const fixture = EVAL_FIXTURES[id];
  if (!fixture) throw new Error(`Unknown eval fixture: ${id}`);
  return fixture;
}

/** Helper: summarize a fixture for the judge prompt.
 *  Includes segment-level detail so the judge can verify data grounding
 *  against the actual numbers the agent received, not just top-level metrics. */
export function summarizeFixture(fixture: EvalFixture): string {
  const { market, computedAnalytics: a } = fixture;
  const lines: string[] = [];

  // Top-level
  const header = [
    `${market.name}, ${market.geography.state}`,
    `${market.luxuryTier.replace(/_/g, " ")} tier`,
    `${a.market.totalProperties} properties`,
    a.market.medianPrice > 0 ? `$${(a.market.medianPrice / 1_000_000).toFixed(1)}M median` : "no data",
  ];
  if (a.market.averagePrice > 0) {
    header.push(`$${(a.market.averagePrice / 1_000_000).toFixed(1)}M avg`);
  }
  if (a.market.medianPricePerSqft) {
    header.push(`$${a.market.medianPricePerSqft}/sqft`);
  }
  if (a.market.totalVolume > 0) {
    header.push(`$${(a.market.totalVolume / 1_000_000_000).toFixed(2)}B volume`);
  }
  header.push(`rating: ${a.market.rating}`);
  lines.push(header.join(" — "));

  // YoY
  const yoyParts: string[] = [];
  if (a.yoy.medianPriceChange != null) yoyParts.push(`price ${(a.yoy.medianPriceChange * 100).toFixed(1)}%`);
  if (a.yoy.volumeChange != null) yoyParts.push(`volume ${(a.yoy.volumeChange * 100).toFixed(1)}%`);
  if (a.yoy.pricePerSqftChange != null) yoyParts.push(`psf ${(a.yoy.pricePerSqftChange * 100).toFixed(1)}%`);
  if (yoyParts.length > 0) {
    lines.push(`YoY: ${yoyParts.join(", ")}`);
  } else {
    lines.push("YoY: no historical data");
  }

  // Segments
  if (a.segments.length > 0) {
    lines.push(`Segments (${a.segments.length}):`);
    for (const s of a.segments) {
      const seg = [
        `  ${s.name}: ${s.count} properties`,
        `$${(s.medianPrice / 1_000_000).toFixed(1)}M median`,
      ];
      if (s.medianPricePerSqft) seg.push(`$${s.medianPricePerSqft}/sqft`);
      seg.push(`rating ${s.rating}`);
      if (s.lowSample) seg.push("(LOW SAMPLE)");
      lines.push(seg.join(", "));
    }
  } else {
    lines.push("Segments: none");
  }

  // Confidence
  lines.push(`Confidence: ${a.confidence.level} (sample: ${a.confidence.sampleSize})`);
  if (a.confidence.staleDataSources.length > 0) {
    lines.push(`Stale sources: ${a.confidence.staleDataSources.join(", ")}`);
  }

  return lines.join("\n");
}
