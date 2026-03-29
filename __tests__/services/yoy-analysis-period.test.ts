/**
 * Tests for YoY Analysis Period Transparency
 *
 * Covers:
 * - Period-aligned YoY computation (rolling windows, not calendar years)
 * - analysisPeriod metadata flows through pipeline
 * - Transaction count reflects current period only
 * - Edge cases: insufficient data, no prior period
 */

// Mock the DB/connector chain so imports resolve without DATABASE_URL
jest.mock("@/lib/db", () => ({
  db: {},
  schema: { cache: {}, apiUsage: {} },
}));
jest.mock("@/lib/services/cache");
jest.mock("@/lib/services/api-usage");
jest.mock("@/lib/config/env", () => ({
  env: { REALESTATEAPI_KEY: "test-key", SCRAPINGDOG_API_KEY: "test-key" },
}));
jest.mock("@/lib/connectors/realestateapi");
jest.mock("@/lib/connectors/scrapingdog");
jest.mock("@/lib/connectors/grok");
jest.mock("@/lib/services/data-source-registry", () => ({
  registry: {
    getAll: jest.fn().mockReturnValue([]),
    envVarsPresent: jest.fn().mockReturnValue(true),
    getHealthSnapshot: jest.fn().mockReturnValue(null),
  },
}));

import { computePeriodBounds } from "@/lib/services/data-fetcher";
import {
  computeMarketAnalytics,
  type ComputedAnalytics,
} from "@/lib/services/market-analytics";
import type { CompiledMarketData } from "@/lib/services/data-fetcher";
import type { MarketData } from "@/lib/agents/orchestrator";
import type { PropertySummary } from "@/lib/connectors/realestateapi";

// --- Fixtures ---

const testMarket: MarketData = {
  name: "Test Luxury Market",
  geography: { city: "Naples", state: "FL" },
  luxuryTier: "ultra_luxury",
  priceFloor: 5000000,
  peerMarkets: [],
};

function makeProperty(
  id: string,
  price: number,
  lastSaleDate: string,
  overrides: Partial<PropertySummary> = {}
): PropertySummary {
  return {
    id,
    address: `${id} Ocean Blvd`,
    city: "Naples",
    state: "FL",
    zip: "34102",
    price,
    sqft: 4000,
    bedrooms: 4,
    bathrooms: 3,
    propertyType: "SFR",
    yearBuilt: 2020,
    lastSaleDate,
    lastSalePrice: price,
    ...overrides,
  } as PropertySummary;
}

function makeEmptyCompiledData(
  currentProps: PropertySummary[],
  priorProps: PropertySummary[]
): CompiledMarketData {
  return {
    targetMarket: {
      properties: [...currentProps, ...priorProps],
      stale: false,
      details: [],
      currentPeriodDetails: [],
      priorPeriodDetails: [],
      comps: [],
    },
    peerMarkets: [],
    neighborhood: { amenities: [] },
    news: { targetMarket: [], peerMarkets: {} },
    fetchMetadata: { staleDataSources: [], totalApiCalls: 0, totalDurationMs: 0, errors: [] },
    analysisPeriod: computePeriodBounds(),
  } as unknown as CompiledMarketData;
}

// --- Tests ---

describe("computePeriodBounds", () => {
  it("returns rolling 12-month windows relative to now", () => {
    const now = new Date("2026-03-17");
    const periods = computePeriodBounds(now);

    // Verify structure: current and prior each have min/max date strings
    expect(periods.current.min).toBeDefined();
    expect(periods.current.max).toBeDefined();
    expect(periods.prior.min).toBeDefined();
    expect(periods.prior.max).toBeDefined();

    // Current max should be the "now" date
    // Prior max should be ~1 year before now
    // Current min should be ~1 year before now (adjacent to prior max)
    expect(periods.current.max >= periods.current.min).toBe(true);
    expect(periods.prior.max >= periods.prior.min).toBe(true);
    expect(periods.current.min > periods.prior.max).toBe(true);
  });

  it("produces non-overlapping, contiguous periods", () => {
    const now = new Date("2026-06-15");
    const periods = computePeriodBounds(now);

    // Prior max should be exactly 1 day before current min
    const priorMaxDate = new Date(periods.prior.max);
    const currentMinDate = new Date(periods.current.min);
    const diffMs = currentMinDate.getTime() - priorMaxDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    expect(diffDays).toBe(1);
  });
});

describe("YoY Period Alignment", () => {
  it("uses rolling period bounds for YoY, not calendar years", () => {
    // Create properties that straddle calendar year boundary but are
    // within the same rolling period. If splitByYear uses calendar years,
    // properties from Jan-Mar 2025 would be in "prior year" even though
    // they're in the "current" rolling period (Mar 2025-Mar 2026).
    const now = new Date("2026-03-17");
    const periods = computePeriodBounds(now);

    // Current period: Mar 18 2025 - Mar 17 2026
    const currentProps = [
      makeProperty("c1", 5000000, "2025-04-15"), // clearly current
      makeProperty("c2", 6000000, "2025-08-20"), // clearly current
      makeProperty("c3", 7000000, "2025-12-10"), // calendar year 2025, but current period
      makeProperty("c4", 5500000, "2026-01-15"), // calendar year 2026, current period
      makeProperty("c5", 6500000, "2026-02-20"), // calendar year 2026, current period
    ];

    // Prior period: Mar 18 2024 - Mar 17 2025
    const priorProps = [
      makeProperty("p1", 4800000, "2024-05-10"), // prior
      makeProperty("p2", 5200000, "2024-09-15"), // prior
      makeProperty("p3", 5800000, "2025-01-20"), // calendar year 2025, but PRIOR period
      makeProperty("p4", 5000000, "2025-02-28"), // calendar year 2025, but PRIOR period
    ];

    const data = makeEmptyCompiledData(currentProps, priorProps);
    const analytics = computeMarketAnalytics(data, testMarket);

    // totalProperties should reflect current period only
    expect(analytics.market.totalProperties).toBe(currentProps.length);

    // YoY should compare 5 current vs 4 prior (by rolling period, not calendar year)
    // If calendar-year grouping were used, this would be wrong because
    // p3 and p4 (prior period, but calendar 2025) would be mixed with c3 (also 2025)
    expect(analytics.yoy.volumeChange).toBeCloseTo(
      (currentProps.length - priorProps.length) / priorProps.length,
      2
    );
  });
});

describe("Analysis Period Metadata", () => {
  it("CompiledMarketData includes analysisPeriod with date ranges", () => {
    const now = new Date("2026-03-17");
    const periods = computePeriodBounds(now);
    const data = makeEmptyCompiledData(
      [makeProperty("c1", 5000000, "2025-06-15")],
      [makeProperty("p1", 4800000, "2024-06-15")]
    );

    // analysisPeriod should exist on CompiledMarketData
    expect(data.analysisPeriod).toBeDefined();
    expect(data.analysisPeriod.current.min).toBeDefined();
    expect(data.analysisPeriod.current.max).toBeDefined();
    expect(data.analysisPeriod.prior.min).toBeDefined();
    expect(data.analysisPeriod.prior.max).toBeDefined();
  });

  it("ComputedAnalytics includes analysisPeriod with counts", () => {
    const currentProps = [
      makeProperty("c1", 5000000, "2025-06-15"),
      makeProperty("c2", 6000000, "2025-09-20"),
      makeProperty("c3", 7000000, "2026-01-10"),
    ];
    const priorProps = [
      makeProperty("p1", 4800000, "2024-06-15"),
      makeProperty("p2", 5200000, "2024-11-20"),
    ];

    const data = makeEmptyCompiledData(currentProps, priorProps);
    const analytics = computeMarketAnalytics(data, testMarket);

    // analysisPeriod should exist on ComputedAnalytics with per-period counts
    expect(analytics.analysisPeriod).toBeDefined();
    expect(analytics.analysisPeriod.current.count).toBe(currentProps.length);
    expect(analytics.analysisPeriod.prior.count).toBe(priorProps.length);
    expect(analytics.analysisPeriod.current.min).toBeDefined();
    expect(analytics.analysisPeriod.current.max).toBeDefined();
    expect(analytics.analysisPeriod.prior.min).toBeDefined();
    expect(analytics.analysisPeriod.prior.max).toBeDefined();
  });
});

describe("Transaction Count — Current Period Only", () => {
  it("totalProperties reflects current period count, not combined total", () => {
    const currentProps = [
      makeProperty("c1", 5000000, "2025-06-15"),
      makeProperty("c2", 6000000, "2025-09-20"),
      makeProperty("c3", 7000000, "2026-01-10"),
    ];
    const priorProps = [
      makeProperty("p1", 4800000, "2024-06-15"),
      makeProperty("p2", 5200000, "2024-11-20"),
      makeProperty("p3", 5500000, "2024-08-10"),
      makeProperty("p4", 5900000, "2025-02-15"),
    ];

    const data = makeEmptyCompiledData(currentProps, priorProps);
    const analytics = computeMarketAnalytics(data, testMarket);

    // Should be 3 (current period), NOT 7 (combined)
    expect(analytics.market.totalProperties).toBe(3);
  });
});

describe("YoY Edge Cases", () => {
  it("nulls YoY when current period has fewer than 3 transactions", () => {
    const currentProps = [
      makeProperty("c1", 5000000, "2025-06-15"),
      makeProperty("c2", 6000000, "2025-09-20"),
      // Only 2 — below MIN_SAMPLE of 3
    ];
    const priorProps = [
      makeProperty("p1", 4800000, "2024-06-15"),
      makeProperty("p2", 5200000, "2024-11-20"),
      makeProperty("p3", 5500000, "2024-08-10"),
      makeProperty("p4", 5900000, "2025-02-15"),
    ];

    const data = makeEmptyCompiledData(currentProps, priorProps);
    const analytics = computeMarketAnalytics(data, testMarket);

    expect(analytics.yoy.medianPriceChange).toBeNull();
    expect(analytics.yoy.volumeChange).toBeNull();
    expect(analytics.yoy.totalVolumeChange).toBeNull();
  });

  it("nulls YoY when prior period has 0 transactions", () => {
    const currentProps = [
      makeProperty("c1", 5000000, "2025-06-15"),
      makeProperty("c2", 6000000, "2025-09-20"),
      makeProperty("c3", 7000000, "2026-01-10"),
    ];
    const priorProps: PropertySummary[] = [];

    const data = makeEmptyCompiledData(currentProps, priorProps);
    const analytics = computeMarketAnalytics(data, testMarket);

    expect(analytics.yoy.medianPriceChange).toBeNull();
    expect(analytics.yoy.volumeChange).toBeNull();
    expect(analytics.yoy.totalVolumeChange).toBeNull();
  });

  it("nulls YoY when prior period has fewer than 3 transactions", () => {
    const currentProps = [
      makeProperty("c1", 5000000, "2025-06-15"),
      makeProperty("c2", 6000000, "2025-09-20"),
      makeProperty("c3", 7000000, "2026-01-10"),
    ];
    const priorProps = [
      makeProperty("p1", 4800000, "2024-06-15"),
      makeProperty("p2", 5200000, "2024-11-20"),
      // Only 2
    ];

    const data = makeEmptyCompiledData(currentProps, priorProps);
    const analytics = computeMarketAnalytics(data, testMarket);

    expect(analytics.yoy.medianPriceChange).toBeNull();
    expect(analytics.yoy.volumeChange).toBeNull();
    expect(analytics.yoy.totalVolumeChange).toBeNull();
  });
});
