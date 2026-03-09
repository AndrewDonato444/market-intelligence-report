import {
  executeDataAnalyst,
  computeSegmentMetrics,
  computeYoY,
  assignRating,
  dataAnalystAgent,
  type DataAnalystOutput,
} from "@/lib/agents/data-analyst";
import type { AgentContext, AgentResult } from "@/lib/agents/orchestrator";

// --- Test fixtures ---

function makeProperty(overrides: Record<string, unknown> = {}) {
  return {
    id: "prop-1",
    address: "123 Ocean Blvd",
    city: "Palm Beach",
    state: "FL",
    zip: "33480",
    price: 5500000,
    sqft: 4200,
    bedrooms: 5,
    bathrooms: 4,
    propertyType: "single_family",
    yearBuilt: 2015,
    lastSaleDate: "2026-01-15",
    lastSalePrice: 5500000,
    ...overrides,
  };
}

function makeContext(overrides: Partial<AgentContext> = {}): AgentContext {
  return {
    reportId: "report-1",
    userId: "user-1",
    market: {
      name: "Palm Beach",
      geography: { city: "Palm Beach", state: "Florida", county: "Palm Beach County" },
      luxuryTier: "ultra_luxury",
      priceFloor: 5000000,
      segments: ["waterfront", "golf course"],
      propertyTypes: ["single_family", "condo", "estate"],
    },
    reportConfig: {
      sections: ["market_overview", "executive_summary"],
    },
    upstreamResults: {},
    abortSignal: new AbortController().signal,
    ...overrides,
  };
}

// Mock the RealEstateAPI connector
jest.mock("@/lib/connectors/realestateapi", () => ({
  searchProperties: jest.fn(),
  buildSearchParamsFromMarket: jest.fn((market: Record<string, unknown>) => ({
    city: (market.geography as Record<string, string>).city,
    state: (market.geography as Record<string, string>).state,
    priceMin: market.priceFloor,
  })),
}));

import { searchProperties } from "@/lib/connectors/realestateapi";
const mockSearch = searchProperties as jest.MockedFunction<typeof searchProperties>;

describe("Data Analyst Agent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Agent definition", () => {
    it("exports a valid AgentDefinition", () => {
      expect(dataAnalystAgent.name).toBe("data-analyst");
      expect(dataAnalystAgent.dependencies).toEqual([]);
      expect(typeof dataAnalystAgent.execute).toBe("function");
    });

    it("has a description", () => {
      expect(dataAnalystAgent.description.length).toBeGreaterThan(0);
    });
  });

  describe("computeSegmentMetrics", () => {
    it("computes metrics for a segment with multiple properties", () => {
      const properties = [
        makeProperty({ price: 5000000, sqft: 4000, propertyType: "single_family" }),
        makeProperty({ price: 7000000, sqft: 5000, propertyType: "single_family" }),
        makeProperty({ price: 6000000, sqft: 4500, propertyType: "single_family" }),
      ];

      const metrics = computeSegmentMetrics(properties, "single_family");

      expect(metrics.name).toBe("single_family");
      expect(metrics.count).toBe(3);
      expect(metrics.medianPrice).toBe(6000000);
      expect(metrics.averagePrice).toBeCloseTo(6000000);
      expect(metrics.minPrice).toBe(5000000);
      expect(metrics.maxPrice).toBe(7000000);
      expect(metrics.medianPricePerSqft).toBeCloseTo(1333.33, 0);
      expect(metrics.lowSample).toBe(false);
    });

    it("flags segments with fewer than 3 properties as low sample", () => {
      const properties = [
        makeProperty({ price: 5000000, propertyType: "estate" }),
        makeProperty({ price: 7000000, propertyType: "estate" }),
      ];

      const metrics = computeSegmentMetrics(properties, "estate");

      expect(metrics.count).toBe(2);
      expect(metrics.lowSample).toBe(true);
    });

    it("handles null sqft gracefully", () => {
      const properties = [
        makeProperty({ price: 5000000, sqft: null }),
        makeProperty({ price: 6000000, sqft: null }),
        makeProperty({ price: 7000000, sqft: null }),
      ];

      const metrics = computeSegmentMetrics(properties, "single_family");

      expect(metrics.medianPricePerSqft).toBeNull();
    });

    it("handles single property", () => {
      const properties = [makeProperty({ price: 8000000, sqft: 5000 })];
      const metrics = computeSegmentMetrics(properties, "single_family");

      expect(metrics.count).toBe(1);
      expect(metrics.medianPrice).toBe(8000000);
      expect(metrics.averagePrice).toBe(8000000);
      expect(metrics.lowSample).toBe(true);
    });
  });

  describe("computeYoY", () => {
    it("calculates year-over-year changes", () => {
      const currentYear = [
        makeProperty({ lastSalePrice: 6000000, sqft: 4000 }),
        makeProperty({ lastSalePrice: 7000000, sqft: 5000 }),
      ];
      const priorYear = [
        makeProperty({ lastSalePrice: 5000000, sqft: 4000 }),
        makeProperty({ lastSalePrice: 6000000, sqft: 5000 }),
      ];

      const yoy = computeYoY(currentYear, priorYear);

      // Median current: 6.5M, median prior: 5.5M → change ≈ 0.1818
      expect(yoy.medianPriceChange).toBeCloseTo(0.1818, 2);
      // Volume: 2 vs 2 → 0
      expect(yoy.volumeChange).toBe(0);
    });

    it("returns null YoY values when prior year has no data", () => {
      const currentYear = [makeProperty({ lastSalePrice: 6000000 })];
      const priorYear: ReturnType<typeof makeProperty>[] = [];

      const yoy = computeYoY(currentYear, priorYear);

      expect(yoy.medianPriceChange).toBeNull();
      expect(yoy.volumeChange).toBeNull();
    });

    it("computes price-per-sqft change", () => {
      const currentYear = [
        makeProperty({ lastSalePrice: 6000000, sqft: 4000 }),
      ];
      const priorYear = [
        makeProperty({ lastSalePrice: 5000000, sqft: 4000 }),
      ];

      const yoy = computeYoY(currentYear, priorYear);

      // 1500 vs 1250 → 0.20
      expect(yoy.pricePerSqftChange).toBeCloseTo(0.20, 2);
    });
  });

  describe("assignRating", () => {
    it("assigns A+ for strong growth and volume", () => {
      const rating = assignRating(0.12, 0.05, 50);
      expect(rating).toBe("A+");
    });

    it("assigns A for moderate growth", () => {
      const rating = assignRating(0.07, 0.0, 50);
      expect(rating).toBe("A");
    });

    it("assigns B+ for slight growth", () => {
      const rating = assignRating(0.03, 0.0, 50);
      expect(rating).toBe("B+");
    });

    it("assigns B for flat market", () => {
      const rating = assignRating(0.0, 0.0, 50);
      expect(rating).toBe("B");
    });

    it("assigns C+ for declining metrics", () => {
      const rating = assignRating(-0.03, -0.05, 50);
      expect(rating).toBe("C+");
    });

    it("assigns C for insufficient data", () => {
      const rating = assignRating(null, null, 2);
      expect(rating).toBe("C");
    });
  });

  describe("executeDataAnalyst", () => {
    it("produces structured output with segments and market metrics", async () => {
      mockSearch.mockResolvedValue({
        properties: [
          makeProperty({ id: "1", price: 5000000, sqft: 4000, propertyType: "single_family", lastSaleDate: "2026-02-01", lastSalePrice: 5000000 }),
          makeProperty({ id: "2", price: 7000000, sqft: 5000, propertyType: "single_family", lastSaleDate: "2026-01-15", lastSalePrice: 7000000 }),
          makeProperty({ id: "3", price: 6000000, sqft: 4500, propertyType: "single_family", lastSaleDate: "2026-03-01", lastSalePrice: 6000000 }),
          makeProperty({ id: "4", price: 8000000, sqft: 3500, propertyType: "condo", lastSaleDate: "2026-02-15", lastSalePrice: 8000000 }),
          makeProperty({ id: "5", price: 9000000, sqft: 4000, propertyType: "condo", lastSaleDate: "2026-01-20", lastSalePrice: 9000000 }),
          makeProperty({ id: "6", price: 10000000, sqft: 5500, propertyType: "condo", lastSaleDate: "2026-02-28", lastSalePrice: 10000000 }),
        ],
        total: 6,
        stale: false,
      });

      const context = makeContext();
      const result = await executeDataAnalyst(context);

      expect(result.agentName).toBe("data-analyst");
      expect(result.sections.length).toBeGreaterThan(0);

      const analysis = result.metadata.analysis as DataAnalystOutput;
      expect(analysis.market.totalProperties).toBe(6);
      expect(analysis.segments.length).toBe(2); // single_family + condo
      expect(analysis.confidence.level).toBe("medium"); // 6 properties < 10 threshold
    });

    it("produces market_overview and executive_summary sections", async () => {
      mockSearch.mockResolvedValue({
        properties: [
          makeProperty({ id: "1", price: 5000000, propertyType: "single_family", lastSaleDate: "2026-02-01", lastSalePrice: 5000000 }),
          makeProperty({ id: "2", price: 6000000, propertyType: "single_family", lastSaleDate: "2026-01-15", lastSalePrice: 6000000 }),
          makeProperty({ id: "3", price: 7000000, propertyType: "single_family", lastSaleDate: "2026-03-01", lastSalePrice: 7000000 }),
        ],
        total: 3,
        stale: false,
      });

      const result = await executeDataAnalyst(makeContext());

      const sectionTypes = result.sections.map((s) => s.sectionType);
      expect(sectionTypes).toContain("market_overview");
      expect(sectionTypes).toContain("executive_summary");
    });

    it("handles empty property results gracefully", async () => {
      mockSearch.mockResolvedValue({
        properties: [],
        total: 0,
        stale: false,
      });

      const result = await executeDataAnalyst(makeContext());

      expect(result.agentName).toBe("data-analyst");
      const analysis = result.metadata.analysis as DataAnalystOutput;
      expect(analysis.market.totalProperties).toBe(0);
      expect(analysis.segments).toEqual([]);
      expect(analysis.metadata?.insufficientData ?? analysis.confidence.sampleSize).toBeDefined();
    });

    it("marks confidence as low when data is stale", async () => {
      mockSearch.mockResolvedValue({
        properties: [
          makeProperty({ id: "1", price: 5000000, lastSaleDate: "2026-02-01", lastSalePrice: 5000000 }),
        ],
        total: 1,
        stale: true,
      });

      const result = await executeDataAnalyst(makeContext());

      const analysis = result.metadata.analysis as DataAnalystOutput;
      expect(analysis.confidence.level).toBe("low");
    });

    it("calls searchProperties with market params", async () => {
      mockSearch.mockResolvedValue({
        properties: [],
        total: 0,
        stale: false,
      });

      await executeDataAnalyst(makeContext());

      expect(mockSearch).toHaveBeenCalledTimes(1);
    });

    it("conforms to AgentResult interface", async () => {
      mockSearch.mockResolvedValue({
        properties: [makeProperty()],
        total: 1,
        stale: false,
      });

      const result = await executeDataAnalyst(makeContext());

      // Verify shape matches AgentResult
      expect(result).toHaveProperty("agentName");
      expect(result).toHaveProperty("sections");
      expect(result).toHaveProperty("metadata");
      expect(result).toHaveProperty("durationMs");
      expect(Array.isArray(result.sections)).toBe(true);
      for (const section of result.sections) {
        expect(section).toHaveProperty("sectionType");
        expect(section).toHaveProperty("title");
        expect(section).toHaveProperty("content");
      }
    });

    it("includes YoY calculations when multi-year data exists", async () => {
      mockSearch.mockResolvedValue({
        properties: [
          makeProperty({ id: "1", price: 6000000, lastSaleDate: "2026-02-01", lastSalePrice: 6000000 }),
          makeProperty({ id: "2", price: 7000000, lastSaleDate: "2026-01-15", lastSalePrice: 7000000 }),
          makeProperty({ id: "3", price: 5000000, lastSaleDate: "2025-02-01", lastSalePrice: 5000000 }),
          makeProperty({ id: "4", price: 5500000, lastSaleDate: "2025-03-15", lastSalePrice: 5500000 }),
        ],
        total: 4,
        stale: false,
      });

      const result = await executeDataAnalyst(makeContext());

      const analysis = result.metadata.analysis as DataAnalystOutput;
      expect(analysis.yoy.medianPriceChange).not.toBeNull();
    });
  });
});
