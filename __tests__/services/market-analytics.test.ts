// Mock DB/cache/env to avoid DATABASE_URL requirement
jest.mock("@/lib/db", () => ({
  db: {},
  schema: { cache: {}, apiUsage: {} },
}));
jest.mock("@/lib/services/cache");
jest.mock("@/lib/services/api-usage");
jest.mock("@/lib/config/env", () => ({
  env: { REALESTATEAPI_KEY: "test-key", SCRAPINGDOG_API_KEY: "test-key" },
}));

import {
  computeMarketAnalytics,
  computeDetailMetrics,
  computeInsightsIndex,
  computeDashboard,
  computeNeighborhoods,
  computePeerComparisons,
  computeScorecard,
  type ComputedAnalytics,
  type DetailDerivedMetrics,
} from "@/lib/services/market-analytics";
import { computeSegmentMetrics, computeYoY, assignRating } from "@/lib/agents/data-analyst";
import type { CompiledMarketData, PeerMarketData } from "@/lib/services/data-fetcher";
import type { PropertySummary, PropertyDetail } from "@/lib/connectors/realestateapi";
import type { MarketData } from "@/lib/agents/orchestrator";

// --- Fixture helpers ---

function makeProperty(overrides: Partial<PropertySummary> = {}): PropertySummary {
  return {
    id: "prop-1",
    address: "100 Ocean Blvd",
    city: "Naples",
    state: "FL",
    zip: "34102",
    price: 8000000,
    sqft: 5000,
    bedrooms: 5,
    bathrooms: 4,
    propertyType: "SFR",
    yearBuilt: 2020,
    lastSaleDate: "2026-01-15",
    lastSalePrice: 8000000,
    ...overrides,
  };
}

function makeDetail(overrides: Partial<PropertyDetail> = {}): PropertyDetail {
  return {
    id: "prop-1",
    address: "100 Ocean Blvd, Naples, FL 34102",
    propertyType: "SFR",
    stale: false,
    propertyInfo: null,
    flags: {
      absenteeOwner: false,
      ownerOccupied: true,
      corporateOwned: false,
      investorBuyer: false,
      vacant: false,
      freeClear: false,
      highEquity: false,
      cashBuyer: false,
      cashSale: false,
      mlsActive: false,
      mlsPending: false,
      mlsSold: true,
      preForeclosure: false,
      auction: false,
      floodZone: false,
    },
    estimatedValue: null,
    estimatedEquity: null,
    equityPercent: null,
    lastSaleDate: null,
    lastSalePrice: null,
    ownerInfo: null,
    taxInfo: null,
    lotInfo: null,
    saleHistory: [],
    currentMortgages: [],
    mlsHistory: [],
    demographics: null,
    schools: [],
    neighborhood: null,
    floodZoneType: null,
    floodZoneDescription: null,
    linkedProperties: null,
    ...overrides,
  };
}

function makeCompiledData(
  overrides: Partial<CompiledMarketData> = {}
): CompiledMarketData {
  return {
    targetMarket: {
      properties: [
        makeProperty({ id: "p1", price: 10000000, lastSalePrice: 10000000, lastSaleDate: "2026-02-01" }),
        makeProperty({ id: "p2", price: 8000000, lastSalePrice: 8000000, lastSaleDate: "2026-03-01" }),
        makeProperty({ id: "p3", price: 6000000, lastSalePrice: 6000000, lastSaleDate: "2025-06-15" }),
        makeProperty({ id: "p4", price: 12000000, lastSalePrice: 12000000, lastSaleDate: "2025-08-20" }),
      ],
      stale: false,
      details: [
        makeDetail({ id: "p1" }),
        makeDetail({ id: "p2" }),
      ],
      comps: [],
    },
    peerMarkets: [],
    neighborhood: { amenities: {} },
    fetchMetadata: {
      totalApiCalls: 5,
      totalDurationMs: 1200,
      staleDataSources: [],
      errors: [],
    },
    ...overrides,
  };
}

const testMarket: MarketData = {
  name: "Naples Ultra-Luxury",
  geography: { city: "Naples", state: "FL" },
  luxuryTier: "ultra_luxury",
  priceFloor: 5000000,
  peerMarkets: [],
};

// --- Tests ---

describe("Market Analytics Engine", () => {
  describe("computeDetailMetrics", () => {
    it("returns all nulls for empty details", () => {
      const result = computeDetailMetrics([]);
      expect(result.medianDaysOnMarket).toBeNull();
      expect(result.cashBuyerPercentage).toBeNull();
      expect(result.listToSaleRatio).toBeNull();
      expect(result.floodZonePercentage).toBeNull();
      expect(result.investorBuyerPercentage).toBeNull();
      expect(result.freeClearPercentage).toBeNull();
    });

    it("computes cash buyer percentage", () => {
      const details = [
        makeDetail({ flags: { ...makeDetail().flags, cashBuyer: true } }),
        makeDetail({ id: "p2", flags: { ...makeDetail().flags, cashSale: true } }),
        makeDetail({ id: "p3" }),
        makeDetail({ id: "p4" }),
      ];
      const result = computeDetailMetrics(details);
      expect(result.cashBuyerPercentage).toBe(0.5); // 2 out of 4
    });

    it("computes flood zone percentage", () => {
      const details = [
        makeDetail({ flags: { ...makeDetail().flags, floodZone: true } }),
        makeDetail({ id: "p2" }),
        makeDetail({ id: "p3" }),
      ];
      const result = computeDetailMetrics(details);
      expect(result.floodZonePercentage).toBeCloseTo(1 / 3);
    });

    it("computes investor buyer percentage", () => {
      const details = [
        makeDetail({ flags: { ...makeDetail().flags, investorBuyer: true } }),
        makeDetail({ id: "p2" }),
      ];
      const result = computeDetailMetrics(details);
      expect(result.investorBuyerPercentage).toBe(0.5);
    });

    it("computes free and clear percentage", () => {
      const details = [
        makeDetail({ flags: { ...makeDetail().flags, freeClear: true } }),
        makeDetail({ id: "p2", flags: { ...makeDetail().flags, freeClear: true } }),
        makeDetail({ id: "p3" }),
      ];
      const result = computeDetailMetrics(details);
      expect(result.freeClearPercentage).toBeCloseTo(2 / 3);
    });

    it("computes median days on market from MLS history", () => {
      const details = [
        makeDetail({
          mlsHistory: [
            { price: "8000000", status: "Sold", statusDate: "2026-01-01", daysOnMarket: "30", agentName: null, agentOffice: null, beds: null, baths: null },
          ],
        }),
        makeDetail({
          id: "p2",
          mlsHistory: [
            { price: "6000000", status: "Sold", statusDate: "2026-02-01", daysOnMarket: "60", agentName: null, agentOffice: null, beds: null, baths: null },
          ],
        }),
      ];
      const result = computeDetailMetrics(details);
      expect(result.medianDaysOnMarket).toBe(45); // median of [30, 60]
    });

    it("computes list-to-sale ratio", () => {
      const details = [
        makeDetail({
          mlsHistory: [
            { price: "10000000", status: "Active", statusDate: "2025-12-01", daysOnMarket: null, agentName: null, agentOffice: null, beds: null, baths: null },
          ],
          saleHistory: [{ date: "2026-01-15", price: 9500000, buyerNames: null, sellerNames: null, documentType: null, transactionType: null, purchaseMethod: null }],
        }),
      ];
      const result = computeDetailMetrics(details);
      expect(result.listToSaleRatio).toBeCloseTo(0.95); // 9.5M / 10M
    });
  });

  describe("computeInsightsIndex", () => {
    const baseMarket: ComputedAnalytics["market"] = {
      totalProperties: 50,
      medianPrice: 8000000,
      averagePrice: 9000000,
      medianPricePerSqft: 1600,
      totalVolume: 400000000,
      rating: "A",
    };

    const baseYoY = {
      medianPriceChange: 0.08,
      volumeChange: 0.05,
      pricePerSqftChange: 0.06,
    };

    const baseDetailMetrics: DetailDerivedMetrics = {
      medianDaysOnMarket: 45,
      cashBuyerPercentage: 0.4,
      listToSaleRatio: 0.97,
      floodZonePercentage: 0.1,
      investorBuyerPercentage: 0.2,
      freeClearPercentage: 0.3,
    };

    const baseSegments = [
      { name: "SFR", propertyType: "SFR", count: 30, medianPrice: 8000000, averagePrice: 8500000, minPrice: 5000000, maxPrice: 15000000, medianPricePerSqft: 1500, rating: "A", lowSample: false },
      { name: "Condo", propertyType: "Condo", count: 20, medianPrice: 5000000, averagePrice: 5500000, minPrice: 3000000, maxPrice: 9000000, medianPricePerSqft: 1200, rating: "B+", lowSample: false },
    ];

    it("returns 4 dimension scores", () => {
      const result = computeInsightsIndex(baseMarket, baseYoY, baseDetailMetrics, baseSegments);
      expect(result.liquidity).toBeDefined();
      expect(result.timing).toBeDefined();
      expect(result.risk).toBeDefined();
      expect(result.value).toBeDefined();
    });

    it("scores are between 1 and 10", () => {
      const result = computeInsightsIndex(baseMarket, baseYoY, baseDetailMetrics, baseSegments);
      for (const dim of [result.liquidity, result.timing, result.risk, result.value]) {
        expect(dim.score).toBeGreaterThanOrEqual(1);
        expect(dim.score).toBeLessThanOrEqual(10);
      }
    });

    it("assigns labels based on score thresholds", () => {
      const result = computeInsightsIndex(baseMarket, baseYoY, baseDetailMetrics, baseSegments);
      // Each dimension should have a label
      for (const dim of [result.liquidity, result.timing, result.risk, result.value]) {
        expect(dim.label).toBeTruthy();
        expect(typeof dim.label).toBe("string");
      }
    });

    it("includes component breakdowns", () => {
      const result = computeInsightsIndex(baseMarket, baseYoY, baseDetailMetrics, baseSegments);
      expect(result.liquidity.components.cashBuyerPct).toBe(0.4);
      expect(result.timing.components.medianDOM).toBe(45);
      expect(result.risk.components.floodZonePct).toBe(0.1);
      expect(result.value.components.yoyGrowth).toBe(0.08);
    });

    it("handles null detail metrics gracefully", () => {
      const nullMetrics: DetailDerivedMetrics = {
        medianDaysOnMarket: null,
        cashBuyerPercentage: null,
        listToSaleRatio: null,
        floodZonePercentage: null,
        investorBuyerPercentage: null,
        freeClearPercentage: null,
      };
      const result = computeInsightsIndex(baseMarket, baseYoY, nullMetrics, baseSegments);
      // Should still produce valid scores using defaults
      for (const dim of [result.liquidity, result.timing, result.risk, result.value]) {
        expect(dim.score).toBeGreaterThanOrEqual(1);
        expect(dim.score).toBeLessThanOrEqual(10);
      }
    });
  });

  describe("computeDashboard", () => {
    const market: ComputedAnalytics["market"] = {
      totalProperties: 30,
      medianPrice: 8000000,
      averagePrice: 9000000,
      medianPricePerSqft: 1600,
      totalVolume: 240000000,
      rating: "A",
    };

    const yoy = {
      medianPriceChange: 0.08,
      volumeChange: 0.05,
      pricePerSqftChange: 0.06,
    };

    const detailMetrics: DetailDerivedMetrics = {
      medianDaysOnMarket: 45,
      cashBuyerPercentage: 0.4,
      listToSaleRatio: 0.97,
      floodZonePercentage: 0.1,
      investorBuyerPercentage: 0.2,
      freeClearPercentage: 0.3,
    };

    const segments = [
      { name: "SFR", propertyType: "SFR", count: 20, medianPrice: 8000000, averagePrice: 8500000, minPrice: 5000000, maxPrice: 15000000, medianPricePerSqft: 1500, rating: "A", lowSample: false },
    ];

    it("returns 5 Power Five indicators", () => {
      const result = computeDashboard(market, yoy, detailMetrics, segments);
      expect(result.powerFive).toHaveLength(5);
      expect(result.powerFive.every((i) => i.category === "power_five")).toBe(true);
    });

    it("returns 4 Tier Two indicators", () => {
      const result = computeDashboard(market, yoy, detailMetrics, segments);
      expect(result.tierTwo).toHaveLength(4);
      expect(result.tierTwo.every((i) => i.category === "tier_two")).toBe(true);
    });

    it("returns 3 Tier Three indicators", () => {
      const result = computeDashboard(market, yoy, detailMetrics, segments);
      expect(result.tierThree).toHaveLength(3);
      expect(result.tierThree.every((i) => i.category === "tier_three")).toBe(true);
    });

    it("assigns trend directions based on YoY", () => {
      const result = computeDashboard(market, yoy, detailMetrics, segments);
      const medianSold = result.powerFive.find((i) => i.name === "Median Sold Price");
      expect(medianSold?.trend).toBe("up"); // 8% growth
      expect(medianSold?.trendValue).toBe(0.08);
    });

    it("assigns flat trend for small changes", () => {
      const flatYoY = { medianPriceChange: 0.005, volumeChange: -0.005, pricePerSqftChange: 0.003 };
      const result = computeDashboard(market, flatYoY, detailMetrics, segments);
      const medianSold = result.powerFive.find((i) => i.name === "Median Sold Price");
      expect(medianSold?.trend).toBe("flat");
    });

    it("assigns down trend for negative changes", () => {
      const downYoY = { medianPriceChange: -0.05, volumeChange: -0.1, pricePerSqftChange: -0.03 };
      const result = computeDashboard(market, downYoY, detailMetrics, segments);
      const medianSold = result.powerFive.find((i) => i.name === "Median Sold Price");
      expect(medianSold?.trend).toBe("down");
    });

    it("formats list-to-sale ratio as percentage", () => {
      const result = computeDashboard(market, yoy, detailMetrics, segments);
      const lts = result.powerFive.find((i) => i.name === "List-to-Sale Ratio");
      // 0.97 * 10000 / 100 = 97.00
      expect(lts?.value).toBe(97);
    });

    it("handles null detail metrics", () => {
      const nullMetrics: DetailDerivedMetrics = {
        medianDaysOnMarket: null,
        cashBuyerPercentage: null,
        listToSaleRatio: null,
        floodZonePercentage: null,
        investorBuyerPercentage: null,
        freeClearPercentage: null,
      };
      const result = computeDashboard(market, yoy, nullMetrics, segments);
      const dom = result.powerFive.find((i) => i.name === "Median Days on Market");
      expect(dom?.value).toBeNull();
      const cash = result.tierTwo.find((i) => i.name === "Cash Buyer %");
      expect(cash?.value).toBeNull();
    });
  });

  describe("computeNeighborhoods", () => {
    it("groups properties by zip code", () => {
      const properties = [
        makeProperty({ id: "p1", zip: "34102", price: 10000000, lastSalePrice: 10000000 }),
        makeProperty({ id: "p2", zip: "34102", price: 8000000, lastSalePrice: 8000000 }),
        makeProperty({ id: "p3", zip: "34103", price: 6000000, lastSalePrice: 6000000 }),
      ];
      const result = computeNeighborhoods(properties, 2026, {});
      expect(result).toHaveLength(2);
    });

    it("sorts neighborhoods by property count descending", () => {
      const properties = [
        makeProperty({ id: "p1", zip: "34102" }),
        makeProperty({ id: "p2", zip: "34102" }),
        makeProperty({ id: "p3", zip: "34102" }),
        makeProperty({ id: "p4", zip: "34103" }),
      ];
      const result = computeNeighborhoods(properties, 2026, {});
      expect(result[0].zipCode).toBe("34102");
      expect(result[0].propertyCount).toBe(3);
      expect(result[1].zipCode).toBe("34103");
      expect(result[1].propertyCount).toBe(1);
    });

    it("computes median price per neighborhood", () => {
      const properties = [
        makeProperty({ id: "p1", zip: "34102", price: 10000000, lastSalePrice: 10000000 }),
        makeProperty({ id: "p2", zip: "34102", price: 8000000, lastSalePrice: 8000000 }),
        makeProperty({ id: "p3", zip: "34102", price: 6000000, lastSalePrice: 6000000 }),
      ];
      const result = computeNeighborhoods(properties, 2026, {});
      const hood = result.find((n) => n.zipCode === "34102")!;
      expect(hood.medianPrice).toBe(8000000); // median of [6M, 8M, 10M]
    });

    it("computes YoY price change per neighborhood", () => {
      // Need >= 3 current-year properties to avoid fallback to prior years
      const properties = [
        makeProperty({ id: "p1", zip: "34102", price: 10000000, lastSaleDate: "2026-03-15", lastSalePrice: 10000000 }),
        makeProperty({ id: "p2", zip: "34102", price: 11000000, lastSaleDate: "2026-02-15", lastSalePrice: 11000000 }),
        makeProperty({ id: "p3", zip: "34102", price: 12000000, lastSaleDate: "2026-01-15", lastSalePrice: 12000000 }),
        makeProperty({ id: "p4", zip: "34102", price: 9000000, lastSaleDate: "2025-06-15", lastSalePrice: 9000000 }),
        makeProperty({ id: "p5", zip: "34102", price: 9500000, lastSaleDate: "2025-04-15", lastSalePrice: 9500000 }),
        makeProperty({ id: "p6", zip: "34102", price: 8500000, lastSaleDate: "2025-08-15", lastSalePrice: 8500000 }),
      ];
      const result = computeNeighborhoods(properties, 2026, {});
      const hood = result.find((n) => n.zipCode === "34102")!;
      // Current year (2026): median of [10M, 11M, 12M] = 11M
      // Prior year (2025): median of [8.5M, 9M, 9.5M] = 9M
      // YoY: (11M - 9M) / 9M ≈ 0.222
      expect(hood.yoyPriceChange).toBeCloseTo(2000000 / 9000000);
    });

    it("includes amenity data", () => {
      const properties = [makeProperty({ zip: "34102" })];
      const amenities = {
        "luxury restaurants": [
          { name: "Café Lurcat", category: "Restaurant", rating: 4.5, reviewCount: 200, address: "123 5th Ave" },
        ],
      };
      const result = computeNeighborhoods(properties, 2026, amenities as any);
      expect(result[0].amenities).toHaveLength(1);
      expect(result[0].amenities[0].name).toBe("Café Lurcat");
    });

    it("handles properties with no zip", () => {
      const properties = [
        makeProperty({ id: "p1", zip: undefined as any }),
      ];
      const result = computeNeighborhoods(properties, 2026, {});
      expect(result).toHaveLength(1);
      expect(result[0].zipCode).toBe("unknown");
    });
  });

  describe("computePeerComparisons", () => {
    const targetMetrics: ComputedAnalytics["market"] = {
      totalProperties: 30,
      medianPrice: 8000000,
      averagePrice: 9000000,
      medianPricePerSqft: 1600,
      totalVolume: 240000000,
      rating: "A",
    };

    const targetYoY = {
      medianPriceChange: 0.08,
      volumeChange: 0.05,
      pricePerSqftChange: 0.06,
    };

    it("computes metrics for each peer market", () => {
      const peers: PeerMarketData[] = [
        {
          name: "Palm Beach",
          geography: { city: "Palm Beach", state: "FL" },
          properties: [
            makeProperty({ id: "pb1", price: 7000000, lastSalePrice: 7000000, lastSaleDate: "2026-01-01" }),
            makeProperty({ id: "pb2", price: 9000000, lastSalePrice: 9000000, lastSaleDate: "2026-02-01" }),
          ],
          stale: false,
        },
      ];

      const { peerComparisons } = computePeerComparisons(targetMetrics, targetYoY, peers, 2026);
      expect(peerComparisons).toHaveLength(1);
      expect(peerComparisons[0].name).toBe("Palm Beach");
      expect(peerComparisons[0].medianPrice).toBe(8000000); // median of [7M, 9M]
      expect(peerComparisons[0].totalProperties).toBe(2);
    });

    it("computes peer rankings", () => {
      const peers: PeerMarketData[] = [
        {
          name: "Palm Beach",
          geography: { city: "Palm Beach", state: "FL" },
          properties: [
            makeProperty({ id: "pb1", price: 12000000, lastSalePrice: 12000000, lastSaleDate: "2026-01-01" }),
          ],
          stale: false,
        },
        {
          name: "Aspen",
          geography: { city: "Aspen", state: "CO" },
          properties: [
            makeProperty({ id: "as1", price: 5000000, lastSalePrice: 5000000, lastSaleDate: "2026-01-01" }),
          ],
          stale: false,
        },
      ];

      const { peerRankings } = computePeerComparisons(targetMetrics, targetYoY, peers, 2026);
      expect(peerRankings).toHaveLength(3);
      // Target median=$8M, Palm Beach=$12M, Aspen=$5M → target ranks 2nd
      const priceRank = peerRankings.find((r) => r.metric === "Median Price")!;
      expect(priceRank.targetRank).toBe(2);
      expect(priceRank.totalMarkets).toBe(3);
    });

    it("returns empty arrays when no peers", () => {
      const { peerComparisons, peerRankings } = computePeerComparisons(
        targetMetrics, targetYoY, [], 2026
      );
      expect(peerComparisons).toHaveLength(0);
      // Rankings still computed (target alone)
      expect(peerRankings).toHaveLength(3);
      peerRankings.forEach((r) => {
        expect(r.targetRank).toBe(1);
        expect(r.totalMarkets).toBe(1);
      });
    });
  });

  describe("computeScorecard", () => {
    const segments = [
      { name: "SFR", propertyType: "SFR", count: 25, medianPrice: 8000000, averagePrice: 8500000, minPrice: 5000000, maxPrice: 15000000, medianPricePerSqft: 1500, rating: "A", lowSample: false },
      { name: "Condo", propertyType: "Condo", count: 10, medianPrice: 5000000, averagePrice: 5500000, minPrice: 3000000, maxPrice: 9000000, medianPricePerSqft: 1200, rating: "B+", lowSample: false },
    ];

    it("creates a scorecard entry per segment", () => {
      const yoy = { medianPriceChange: 0.08, volumeChange: 0.05, pricePerSqftChange: 0.06 };
      const result = computeScorecard(segments, yoy);
      expect(result).toHaveLength(2);
      expect(result[0].segment).toBe("SFR");
      expect(result[1].segment).toBe("Condo");
    });

    it("assigns trend based on YoY median price change", () => {
      const yoyUp = { medianPriceChange: 0.08, volumeChange: null, pricePerSqftChange: null };
      const result = computeScorecard(segments, yoyUp);
      expect(result[0].trend).toBe("up");

      const yoyDown = { medianPriceChange: -0.05, volumeChange: null, pricePerSqftChange: null };
      const resultDown = computeScorecard(segments, yoyDown);
      expect(resultDown[0].trend).toBe("down");

      const yoyFlat = { medianPriceChange: 0.005, volumeChange: null, pricePerSqftChange: null };
      const resultFlat = computeScorecard(segments, yoyFlat);
      expect(resultFlat[0].trend).toBe("flat");
    });

    it("assigns flat trend when YoY is null", () => {
      const yoy = { medianPriceChange: null, volumeChange: null, pricePerSqftChange: null };
      const result = computeScorecard(segments, yoy);
      expect(result[0].trend).toBe("flat");
    });

    it("preserves segment ratings and prices", () => {
      const yoy = { medianPriceChange: 0.08, volumeChange: 0.05, pricePerSqftChange: 0.06 };
      const result = computeScorecard(segments, yoy);
      expect(result[0].rating).toBe("A");
      expect(result[0].medianPrice).toBe(8000000);
      expect(result[0].propertyCount).toBe(25);
    });
  });

  describe("computeMarketAnalytics (integration)", () => {
    it("returns a complete ComputedAnalytics object", () => {
      const data = makeCompiledData();
      const result = computeMarketAnalytics(data, testMarket);

      // Core metrics
      expect(result.market.totalProperties).toBe(4);
      expect(result.market.medianPrice).toBeGreaterThan(0);
      expect(result.market.averagePrice).toBeGreaterThan(0);
      expect(result.market.rating).toBeTruthy();

      // Segments
      expect(result.segments.length).toBeGreaterThan(0);

      // YoY
      expect(result.yoy).toBeDefined();

      // Insights Index
      expect(result.insightsIndex.liquidity.score).toBeGreaterThanOrEqual(1);
      expect(result.insightsIndex.timing.score).toBeGreaterThanOrEqual(1);
      expect(result.insightsIndex.risk.score).toBeGreaterThanOrEqual(1);
      expect(result.insightsIndex.value.score).toBeGreaterThanOrEqual(1);

      // Dashboard
      expect(result.dashboard.powerFive).toHaveLength(5);
      expect(result.dashboard.tierTwo).toHaveLength(4);
      expect(result.dashboard.tierThree).toHaveLength(3);

      // Neighborhoods
      expect(result.neighborhoods.length).toBeGreaterThan(0);

      // Scorecard
      expect(result.scorecard.length).toBeGreaterThan(0);

      // Confidence
      expect(["high", "medium", "low"]).toContain(result.confidence.level);
      expect(result.confidence.sampleSize).toBe(4);

      // Detail metrics
      expect(result.detailMetrics).toBeDefined();
    });

    it("handles empty property list", () => {
      const data = makeCompiledData({
        targetMarket: {
          properties: [],
          stale: false,
          details: [],
          comps: [],
        },
      });
      const result = computeMarketAnalytics(data, testMarket);

      expect(result.market.totalProperties).toBe(0);
      expect(result.market.medianPrice).toBe(0);
      expect(result.segments).toHaveLength(0);
      expect(result.neighborhoods).toHaveLength(0);
      expect(result.scorecard).toHaveLength(0);
    });

    it("assigns high confidence for fresh data with 10+ properties", () => {
      const props = Array.from({ length: 15 }, (_, i) =>
        makeProperty({ id: `p${i}`, price: 8000000 + i * 100000, lastSalePrice: 8000000 + i * 100000 })
      );
      const data = makeCompiledData({
        targetMarket: { properties: props, stale: false, details: [], comps: [] },
      });
      const result = computeMarketAnalytics(data, testMarket);
      expect(result.confidence.level).toBe("high");
    });

    it("assigns medium confidence for small sample", () => {
      const props = [
        makeProperty({ id: "p1", price: 8000000, lastSalePrice: 8000000 }),
        makeProperty({ id: "p2", price: 9000000, lastSalePrice: 9000000 }),
      ];
      const data = makeCompiledData({
        targetMarket: { properties: props, stale: false, details: [], comps: [] },
      });
      const result = computeMarketAnalytics(data, testMarket);
      expect(result.confidence.level).toBe("medium");
    });

    it("assigns low confidence for stale data", () => {
      const data = makeCompiledData({
        targetMarket: {
          properties: Array.from({ length: 20 }, (_, i) =>
            makeProperty({ id: `p${i}`, price: 8000000 })
          ),
          stale: true,
          details: [],
          comps: [],
        },
      });
      const result = computeMarketAnalytics(data, testMarket);
      expect(result.confidence.level).toBe("low");
    });

    it("computes detail coverage ratio", () => {
      const data = makeCompiledData({
        targetMarket: {
          properties: Array.from({ length: 10 }, (_, i) =>
            makeProperty({ id: `p${i}` })
          ),
          stale: false,
          details: [makeDetail(), makeDetail({ id: "p2" }), makeDetail({ id: "p3" })],
          comps: [],
        },
      });
      const result = computeMarketAnalytics(data, testMarket);
      expect(result.confidence.detailCoverage).toBeCloseTo(0.3); // 3/10
    });

    it("includes peer comparisons when peer data provided", () => {
      const data = makeCompiledData({
        peerMarkets: [
          {
            name: "Palm Beach",
            geography: { city: "Palm Beach", state: "FL" },
            properties: [
              makeProperty({ id: "pb1", price: 7000000, lastSalePrice: 7000000, lastSaleDate: "2026-01-01" }),
            ],
            stale: false,
          },
        ],
      });
      const result = computeMarketAnalytics(data, testMarket);
      expect(result.peerComparisons).toHaveLength(1);
      expect(result.peerComparisons[0].name).toBe("Palm Beach");
      expect(result.peerRankings.length).toBeGreaterThan(0);
    });

    it("groups properties by type into segments", () => {
      const data = makeCompiledData({
        targetMarket: {
          properties: [
            makeProperty({ id: "p1", propertyType: "SFR", price: 10000000, lastSalePrice: 10000000 }),
            makeProperty({ id: "p2", propertyType: "SFR", price: 8000000, lastSalePrice: 8000000 }),
            makeProperty({ id: "p3", propertyType: "Condo", price: 5000000, lastSalePrice: 5000000 }),
          ],
          stale: false,
          details: [],
          comps: [],
        },
      });
      const result = computeMarketAnalytics(data, testMarket);
      expect(result.segments.length).toBe(2);
      const sfr = result.segments.find((s) => s.name === "SFR");
      expect(sfr?.count).toBe(2);
    });

    it("computes total volume as sum of all prices", () => {
      const data = makeCompiledData({
        targetMarket: {
          properties: [
            makeProperty({ id: "p1", price: 10000000, lastSalePrice: 10000000 }),
            makeProperty({ id: "p2", price: 5000000, lastSalePrice: 5000000 }),
          ],
          stale: false,
          details: [],
          comps: [],
        },
      });
      const result = computeMarketAnalytics(data, testMarket);
      expect(result.market.totalVolume).toBe(15000000);
    });
  });
});
