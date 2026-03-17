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
  computeDetailYoY,
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
      currentPeriodDetails: [makeDetail({ id: "p1" })],
      priorPeriodDetails: [makeDetail({ id: "p2" })],
      comps: [],
    },
    peerMarkets: [],
    neighborhood: { amenities: {} },
    news: { targetMarket: [], peerMarkets: {}, stale: false },
    fetchMetadata: {
      totalApiCalls: 5,
      totalDurationMs: 1200,
      staleDataSources: [],
      errors: [],
    },
    // All 4 test properties fall within the current period (2024-03-18 to 2026-03-17)
    analysisPeriod: {
      current: { min: "2025-03-18", max: "2026-03-17" },
      prior: { min: "2024-03-18", max: "2025-03-17" },
    },
    ...overrides,
  } as CompiledMarketData;
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

  describe("computeDetailYoY", () => {
    it("computes DOM and list-to-sale changes from two cohorts", () => {
      const currentDetails = [
        makeDetail({
          mlsHistory: [
            { price: "10000000", status: "Sold", statusDate: "2026-01-01", daysOnMarket: "40", agentName: null, agentOffice: null, beds: null, baths: null },
          ],
          saleHistory: [{ date: "2026-01-15", price: 9700000, buyerNames: null, sellerNames: null, documentType: null, transactionType: null, purchaseMethod: null }],
        }),
      ];
      const priorDetails = [
        makeDetail({
          id: "p2",
          mlsHistory: [
            { price: "9000000", status: "Sold", statusDate: "2025-01-01", daysOnMarket: "50", agentName: null, agentOffice: null, beds: null, baths: null },
          ],
          saleHistory: [{ date: "2025-01-20", price: 8800000, buyerNames: null, sellerNames: null, documentType: null, transactionType: null, purchaseMethod: null }],
        }),
      ];

      const result = computeDetailYoY(currentDetails, priorDetails);

      // DOM: current=40, prior=50 → (40-50)/50 = -0.20
      expect(result.domChange).toBeCloseTo(-0.20, 2);
      // LTS: current=9.7M/10M=0.97, prior=8.8M/9M≈0.9778 → (0.97-0.9778)/0.9778
      expect(result.listToSaleChange).toBeDefined();
      expect(result.listToSaleChange).not.toBeNull();
    });

    it("returns null when prior cohort is empty", () => {
      const currentDetails = [
        makeDetail({
          mlsHistory: [
            { price: "10000000", status: "Sold", statusDate: "2026-01-01", daysOnMarket: "40", agentName: null, agentOffice: null, beds: null, baths: null },
          ],
        }),
      ];

      const result = computeDetailYoY(currentDetails, []);

      expect(result.domChange).toBeNull();
      expect(result.listToSaleChange).toBeNull();
    });

    it("returns null when both cohorts are empty", () => {
      const result = computeDetailYoY([], []);
      expect(result.domChange).toBeNull();
      expect(result.listToSaleChange).toBeNull();
    });

    it("returns null when no MLS history exists in either cohort", () => {
      const currentDetails = [makeDetail()];
      const priorDetails = [makeDetail({ id: "p2" })];

      const result = computeDetailYoY(currentDetails, priorDetails);

      expect(result.domChange).toBeNull();
      expect(result.listToSaleChange).toBeNull();
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
      averagePriceChange: null,
      totalVolumeChange: null,
      domChange: null,
      listToSaleChange: null,
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
      { name: "SFR", propertyType: "SFR", count: 30, medianPrice: 8000000, averagePrice: 8500000, minPrice: 5000000, maxPrice: 15000000, medianPricePerSqft: 1500, rating: "A", lowSample: false, yoy: null },
      { name: "Condo", propertyType: "Condo", count: 20, medianPrice: 5000000, averagePrice: 5500000, minPrice: 3000000, maxPrice: 9000000, medianPricePerSqft: 1200, rating: "B+", lowSample: false, yoy: null },
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
      // Cash buyer eliminated from liquidity — only transactionVolume and freeClearPct
      expect(result.liquidity.components.cashBuyerPct).toBeUndefined();
      expect(result.liquidity.components.transactionVolume).toBe(50);
      expect(result.liquidity.components.freeClearPct).toBe(0.3);
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
      averagePriceChange: 0.07,
      totalVolumeChange: 0.12,
      domChange: -0.15,
      listToSaleChange: 0.02,
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
      { name: "SFR", propertyType: "SFR", count: 20, medianPrice: 8000000, averagePrice: 8500000, minPrice: 5000000, maxPrice: 15000000, medianPricePerSqft: 1500, rating: "A", lowSample: false, yoy: null },
    ];

    it("returns 4 Power Four indicators (Transaction Volume removed)", () => {
      const result = computeDashboard(market, yoy, detailMetrics, segments);
      expect(result.powerFour).toHaveLength(4);
      expect(result.powerFour.every((i) => i.category === "power_four")).toBe(true);
      expect(result.powerFour.find((i) => i.name === "Transaction Volume")).toBeUndefined();
    });

    it("returns 4 Supporting Metrics (combined tier two + three, minus removed metrics)", () => {
      const result = computeDashboard(market, yoy, detailMetrics, segments);
      expect(result.supportingMetrics).toHaveLength(4);
      expect(result.supportingMetrics.every((i) => i.category === "supporting")).toBe(true);
      expect(result.supportingMetrics.find((i) => i.name === "Cash Buyer %")).toBeUndefined();
      expect(result.supportingMetrics.find((i) => i.name === "Flood Zone Exposure")).toBeUndefined();
      expect(result.supportingMetrics.find((i) => i.name === "Free & Clear %")).toBeUndefined();
      expect(result.supportingMetrics.find((i) => i.name === "Investor Activity Rate")).toBeDefined();
    });

    it("assigns trend directions based on YoY", () => {
      const result = computeDashboard(market, yoy, detailMetrics, segments);
      const medianSold = result.powerFour.find((i) => i.name === "Median Sold Price");
      expect(medianSold?.trend).toBe("up"); // 8% growth
      expect(medianSold?.trendValue).toBe(0.08);
    });

    it("assigns flat trend for small changes", () => {
      const flatYoY = { medianPriceChange: 0.005, volumeChange: -0.005, pricePerSqftChange: 0.003, averagePriceChange: 0.004, totalVolumeChange: -0.002, domChange: 0.005, listToSaleChange: -0.003 };
      const result = computeDashboard(market, flatYoY, detailMetrics, segments);
      const medianSold = result.powerFour.find((i) => i.name === "Median Sold Price");
      expect(medianSold?.trend).toBe("flat");
    });

    it("assigns down trend for negative changes", () => {
      const downYoY = { medianPriceChange: -0.05, volumeChange: -0.1, pricePerSqftChange: -0.03, averagePriceChange: -0.04, totalVolumeChange: -0.15, domChange: 0.20, listToSaleChange: -0.05 };
      const result = computeDashboard(market, downYoY, detailMetrics, segments);
      const medianSold = result.powerFour.find((i) => i.name === "Median Sold Price");
      expect(medianSold?.trend).toBe("down");
    });

    it("assigns DOM trend from yoy.domChange", () => {
      const result = computeDashboard(market, yoy, detailMetrics, segments);
      const dom = result.powerFour.find((i) => i.name === "Median Days on Market");
      expect(dom?.trend).toBe("down"); // -15% DOM change
      expect(dom?.trendValue).toBe(-0.15);
    });

    it("assigns list-to-sale trend from yoy.listToSaleChange", () => {
      const result = computeDashboard(market, yoy, detailMetrics, segments);
      const lts = result.powerFour.find((i) => i.name === "List-to-Sale Ratio");
      expect(lts?.trend).toBe("up"); // +2% change
      expect(lts?.trendValue).toBe(0.02);
    });

    it("shows null trends for DOM/LTS when YoY data unavailable", () => {
      const noDetailYoY = { ...yoy, domChange: null, listToSaleChange: null };
      const result = computeDashboard(market, noDetailYoY, detailMetrics, segments);
      const dom = result.powerFour.find((i) => i.name === "Median Days on Market");
      expect(dom?.trend).toBeNull();
      const lts = result.powerFour.find((i) => i.name === "List-to-Sale Ratio");
      expect(lts?.trend).toBeNull();
    });

    it("passes raw list-to-sale ratio decimal", () => {
      const result = computeDashboard(market, yoy, detailMetrics, segments);
      const lts = result.powerFour.find((i) => i.name === "List-to-Sale Ratio");
      // Raw decimal passed through — formatting happens in renderer
      expect(lts?.value).toBe(0.97);
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
      const dom = result.powerFour.find((i) => i.name === "Median Days on Market");
      expect(dom?.value).toBeNull();
      // Cash Buyer % no longer in dashboard
      expect(result.supportingMetrics.find((i) => i.name === "Cash Buyer %")).toBeUndefined();
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
      averagePriceChange: null,
      totalVolumeChange: null,
      domChange: null,
      listToSaleChange: null,
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
      { name: "SFR", propertyType: "SFR", count: 25, medianPrice: 8000000, averagePrice: 8500000, minPrice: 5000000, maxPrice: 15000000, medianPricePerSqft: 1500, rating: "A", lowSample: false, yoy: null },
      { name: "Condo", propertyType: "Condo", count: 10, medianPrice: 5000000, averagePrice: 5500000, minPrice: 3000000, maxPrice: 9000000, medianPricePerSqft: 1200, rating: "B+", lowSample: false, yoy: null },
    ];

    it("creates a scorecard entry per segment", () => {
      const yoy = { medianPriceChange: 0.08, volumeChange: 0.05, pricePerSqftChange: 0.06, averagePriceChange: null, totalVolumeChange: null, domChange: null, listToSaleChange: null };
      const result = computeScorecard(segments, yoy);
      expect(result).toHaveLength(2);
      expect(result[0].segment).toBe("SFR");
      expect(result[1].segment).toBe("Condo");
    });

    it("assigns trend based on YoY median price change", () => {
      const yoyUp = { medianPriceChange: 0.08, volumeChange: null, pricePerSqftChange: null, averagePriceChange: null, totalVolumeChange: null, domChange: null, listToSaleChange: null };
      const result = computeScorecard(segments, yoyUp);
      expect(result[0].trend).toBe("up");

      const yoyDown = { medianPriceChange: -0.05, volumeChange: null, pricePerSqftChange: null, averagePriceChange: null, totalVolumeChange: null, domChange: null, listToSaleChange: null };
      const resultDown = computeScorecard(segments, yoyDown);
      expect(resultDown[0].trend).toBe("down");

      const yoyFlat = { medianPriceChange: 0.005, volumeChange: null, pricePerSqftChange: null, averagePriceChange: null, totalVolumeChange: null, domChange: null, listToSaleChange: null };
      const resultFlat = computeScorecard(segments, yoyFlat);
      expect(resultFlat[0].trend).toBe("flat");
    });

    it("assigns flat trend when YoY is null", () => {
      const yoy = { medianPriceChange: null, volumeChange: null, pricePerSqftChange: null, averagePriceChange: null, totalVolumeChange: null, domChange: null, listToSaleChange: null };
      const result = computeScorecard(segments, yoy);
      expect(result[0].trend).toBe("flat");
    });

    it("preserves segment ratings and prices", () => {
      const yoy = { medianPriceChange: 0.08, volumeChange: 0.05, pricePerSqftChange: 0.06, averagePriceChange: null, totalVolumeChange: null, domChange: null, listToSaleChange: null };
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
      expect(result.dashboard.powerFour).toHaveLength(4);
      expect(result.dashboard.supportingMetrics).toHaveLength(4);

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
          currentPeriodDetails: [],
          priorPeriodDetails: [],
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
        targetMarket: { properties: props, stale: false, details: [], currentPeriodDetails: [], priorPeriodDetails: [], comps: [] },
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
        targetMarket: { properties: props, stale: false, details: [], currentPeriodDetails: [], priorPeriodDetails: [], comps: [] },
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
          currentPeriodDetails: [],
          priorPeriodDetails: [],
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
          currentPeriodDetails: [],
          priorPeriodDetails: [],
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
          currentPeriodDetails: [],
          priorPeriodDetails: [],
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
          currentPeriodDetails: [],
          priorPeriodDetails: [],
          comps: [],
        },
      });
      const result = computeMarketAnalytics(data, testMarket);
      expect(result.market.totalVolume).toBe(15000000);
    });
  });

  // --- Regression tests for data quality bugs ---

  describe("SVC-MA: Regression — neighborhood names (Bug 2)", () => {
    it("SVC-MA-01 | uses well-known zip lookup when PropertyDetail has no neighborhood.name", () => {
      const data = makeCompiledData({
        targetMarket: {
          properties: [
            makeProperty({ id: "p1", zip: "90210", price: 15000000, lastSalePrice: 15000000 }),
            makeProperty({ id: "p2", zip: "90210", price: 20000000, lastSalePrice: 20000000 }),
            makeProperty({ id: "p3", zip: "90077", price: 25000000, lastSalePrice: 25000000 }),
          ],
          stale: false,
          details: [
            // neighborhood.name is null — simulating LA data
            makeDetail({ id: "p1", propertyInfo: { address: { zip: "90210" } } as any, neighborhood: null }),
          ],
          currentPeriodDetails: [],
          priorPeriodDetails: [],
          comps: [],
        },
      });
      const result = computeMarketAnalytics(data, testMarket);
      const bh = result.neighborhoods.find((n) => n.zipCode === "90210");
      const ba = result.neighborhoods.find((n) => n.zipCode === "90077");
      expect(bh?.name).toBe("Beverly Hills");
      expect(ba?.name).toBe("Bel Air");
    });

    it("SVC-MA-02 | falls back to zip code when no known mapping exists", () => {
      const data = makeCompiledData({
        targetMarket: {
          properties: [
            makeProperty({ id: "p1", zip: "99999", price: 10000000, lastSalePrice: 10000000 }),
          ],
          stale: false,
          details: [],
          currentPeriodDetails: [],
          priorPeriodDetails: [],
          comps: [],
        },
      });
      const result = computeMarketAnalytics(data, testMarket);
      expect(result.neighborhoods[0].name).toBe("99999");
    });
  });

  describe("SVC-MA: Regression — detail YoY empty cohorts (Bug 3)", () => {
    it("SVC-MA-03 | returns null domChange/listToSaleChange when prior cohort is empty", () => {
      const current = [makeDetail({ id: "d1", mlsHistory: [{ daysOnMarket: 30, price: 10000000 } as any] })];
      const result = computeDetailYoY(current, []);
      expect(result.domChange).toBeNull();
      expect(result.listToSaleChange).toBeNull();
    });

    it("SVC-MA-04 | returns null when current cohort is empty", () => {
      const prior = [makeDetail({ id: "d1", mlsHistory: [{ daysOnMarket: 45, price: 8000000 } as any] })];
      const result = computeDetailYoY([], prior);
      expect(result.domChange).toBeNull();
      expect(result.listToSaleChange).toBeNull();
    });
  });

  describe("SVC-MA: Regression — outlier price filtering (Bug 4)", () => {
    it("SVC-MA-05 | outlier prices do not skew median", () => {
      const data = makeCompiledData({
        targetMarket: {
          properties: [
            makeProperty({ id: "p1", price: 10000000, lastSalePrice: 10000000 }),
            makeProperty({ id: "p2", price: 12000000, lastSalePrice: 12000000 }),
            makeProperty({ id: "p3", price: 11000000, lastSalePrice: 11000000 }),
            makeProperty({ id: "p4", price: 13000000, lastSalePrice: 13000000 }),
            makeProperty({ id: "p5", price: 9000000, lastSalePrice: 9000000 }),
            // Wild outlier — $403M on a single transaction
            makeProperty({ id: "p6", price: 403000000, lastSalePrice: 403000000 }),
          ],
          stale: false,
          details: [],
          currentPeriodDetails: [],
          priorPeriodDetails: [],
          comps: [],
        },
      });
      const result = computeMarketAnalytics(data, testMarket);
      // Without outlier filtering, median would be skewed by the $403M outlier
      // With filtering, median should be around $10M-$13M range
      expect(result.market.medianPrice).toBeLessThan(50000000);
      expect(result.market.medianPrice).toBeGreaterThan(5000000);
    });
  });

  describe("SVC-MA: Regression — per-neighborhood MIN_SAMPLE for YoY (Bug 5)", () => {
    it("SVC-MA-06 | neighborhoods with tiny samples show null YoY instead of -100%", () => {
      // Create a neighborhood with only 1 current-year and 0 prior-year transactions
      const data = makeCompiledData({
        targetMarket: {
          properties: [
            makeProperty({ id: "p1", zip: "90210", price: 15000000, lastSalePrice: 15000000, lastSaleDate: "2026-01-15" }),
            // No 2025 properties for this zip
          ],
          stale: false,
          details: [],
          currentPeriodDetails: [],
          priorPeriodDetails: [],
          comps: [],
        },
      });
      const result = computeMarketAnalytics(data, testMarket);
      const bh = result.neighborhoods.find((n) => n.zipCode === "90210");
      // Should be null (insufficient sample) instead of -100%
      expect(bh?.yoyPriceChange).toBeNull();
    });

    it("SVC-MA-07 | neighborhoods with sufficient samples compute YoY normally", () => {
      const data = makeCompiledData({
        targetMarket: {
          properties: [
            // 3 current year (2026)
            makeProperty({ id: "c1", zip: "34102", price: 10000000, lastSalePrice: 10000000, lastSaleDate: "2026-01-15" }),
            makeProperty({ id: "c2", zip: "34102", price: 12000000, lastSalePrice: 12000000, lastSaleDate: "2026-02-15" }),
            makeProperty({ id: "c3", zip: "34102", price: 11000000, lastSalePrice: 11000000, lastSaleDate: "2026-03-15" }),
            // 3 prior year (2025)
            makeProperty({ id: "p1", zip: "34102", price: 9000000, lastSalePrice: 9000000, lastSaleDate: "2025-06-01" }),
            makeProperty({ id: "p2", zip: "34102", price: 10000000, lastSalePrice: 10000000, lastSaleDate: "2025-07-01" }),
            makeProperty({ id: "p3", zip: "34102", price: 8000000, lastSalePrice: 8000000, lastSaleDate: "2025-08-01" }),
          ],
          stale: false,
          details: [],
          currentPeriodDetails: [],
          priorPeriodDetails: [],
          comps: [],
        },
      });
      const result = computeMarketAnalytics(data, testMarket);
      const naples = result.neighborhoods.find((n) => n.zipCode === "34102");
      // With 3 samples each, YoY should be computed (not null)
      expect(naples?.yoyPriceChange).not.toBeNull();
      // Median current = 11M, median prior = 9M → ~22% increase
      expect(naples!.yoyPriceChange!).toBeGreaterThan(0);
    });
  });
});
