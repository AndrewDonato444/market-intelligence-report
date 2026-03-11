jest.mock("@/lib/db", () => ({
  db: {},
  schema: { cache: {}, apiUsage: {} },
}));
jest.mock("@/lib/services/cache");

import {
  computeInputHash,
  getCachedAgentResult,
  cacheAgentResult,
  AGENT_OUTPUT_TTL,
} from "@/lib/services/agent-cache";
import * as cache from "@/lib/services/cache";
import type { AgentResult, MarketData } from "@/lib/agents/orchestrator";
import type { ComputedAnalytics } from "@/lib/services/market-analytics";

const mockCacheGet = cache.get as jest.MockedFunction<typeof cache.get>;
const mockCacheSet = cache.set as jest.MockedFunction<typeof cache.set>;

// --- Fixtures ---

const testMarket: MarketData = {
  name: "Naples Ultra-Luxury",
  geography: { city: "Naples", state: "FL" },
  luxuryTier: "ultra_luxury",
  priceFloor: 5000000,
};

// Minimal ComputedAnalytics — just enough for hashing
const testAnalytics: ComputedAnalytics = {
  market: {
    totalProperties: 50,
    medianPrice: 8000000,
    averagePrice: 9500000,
    medianPricePerSqft: 1200,
    totalVolume: 475000000,
    rating: "A",
  },
  segments: [],
  yoy: {
    medianPriceChange: 0.08,
    volumeChange: 0.12,
    pricePerSqftChange: 0.06,
    averagePriceChange: 0.09,
    totalVolumeChange: 0.15,
    domChange: null,
    listToSaleChange: null,
  },
  insightsIndex: {
    liquidity: { score: 7, label: "Strong", components: {} },
    timing: { score: 6, label: "Favorable", components: {} },
    risk: { score: 8, label: "Low Risk", components: {} },
    value: { score: 7, label: "Strong Opportunity", components: {} },
  },
  dashboard: { powerFive: [], tierTwo: [], tierThree: [] },
  neighborhoods: [],
  peerComparisons: [],
  peerRankings: [],
  scorecard: [],
  news: { targetMarket: [], peerMarkets: {} },
  confidence: {
    level: "high",
    sampleSize: 50,
    detailCoverage: 0.2,
    staleDataSources: [],
  },
  detailMetrics: {
    medianDaysOnMarket: null,
    cashBuyerPercentage: null,
    listToSaleRatio: null,
    floodZonePercentage: null,
    investorBuyerPercentage: null,
    freeClearPercentage: null,
  },
} as ComputedAnalytics;

function makeAgentResult(name: string): AgentResult {
  return {
    agentName: name,
    sections: [
      {
        sectionType: "test_section",
        title: "Test Section",
        content: { narrative: "Test narrative" },
      },
    ],
    metadata: { model: "claude-sonnet" },
    durationMs: 5000,
  };
}

// --- Tests ---

describe("Agent Output Cache", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCacheSet.mockResolvedValue(undefined);
  });

  describe("computeInputHash", () => {
    it("SVC-AOC-01 | produces deterministic hash for same input", () => {
      const hash1 = computeInputHash("insight-generator", testMarket, testAnalytics, {});
      const hash2 = computeInputHash("insight-generator", testMarket, testAnalytics, {});
      expect(hash1).toBe(hash2);
    });

    it("SVC-AOC-02 | different agent names produce different hashes", () => {
      const hash1 = computeInputHash("insight-generator", testMarket, testAnalytics, {});
      const hash2 = computeInputHash("forecast-modeler", testMarket, testAnalytics, {});
      expect(hash1).not.toBe(hash2);
    });

    it("SVC-AOC-03 | different analytics produce different hashes", () => {
      const modified = {
        ...testAnalytics,
        market: { ...testAnalytics.market, totalProperties: 100 },
      };
      const hash1 = computeInputHash("insight-generator", testMarket, testAnalytics, {});
      const hash2 = computeInputHash("insight-generator", testMarket, modified as ComputedAnalytics, {});
      expect(hash1).not.toBe(hash2);
    });

    it("SVC-AOC-04 | includes upstream results in hash", () => {
      const upstream = { "insight-generator": makeAgentResult("insight-generator") };
      const hash1 = computeInputHash("polish", testMarket, testAnalytics, {});
      const hash2 = computeInputHash("polish", testMarket, testAnalytics, upstream);
      expect(hash1).not.toBe(hash2);
    });

    it("SVC-AOC-05 | hash ignores object key ordering", () => {
      const market1 = { name: "Test", geography: { city: "Naples", state: "FL" }, luxuryTier: "ultra_luxury" as const, priceFloor: 5000000 };
      const market2 = { priceFloor: 5000000, luxuryTier: "ultra_luxury" as const, name: "Test", geography: { state: "FL", city: "Naples" } };
      const hash1 = computeInputHash("insight-generator", market1, testAnalytics, {});
      const hash2 = computeInputHash("insight-generator", market2, testAnalytics, {});
      expect(hash1).toBe(hash2);
    });

    it("SVC-AOC-06 | handles undefined computedAnalytics", () => {
      const hash = computeInputHash("insight-generator", testMarket, undefined, {});
      expect(hash).toBeDefined();
      expect(typeof hash).toBe("string");
      expect(hash.length).toBeGreaterThan(0);
    });

    it("SVC-AOC-07 | returns a hex string", () => {
      const hash = computeInputHash("insight-generator", testMarket, testAnalytics, {});
      expect(hash).toMatch(/^[0-9a-f]+$/);
    });
  });

  describe("getCachedAgentResult", () => {
    it("SVC-AOC-10 | returns cached result on hit", async () => {
      const cachedResult = makeAgentResult("insight-generator");
      mockCacheGet.mockResolvedValue(cachedResult);

      const result = await getCachedAgentResult("insight-generator", "abc123");

      expect(result).toEqual(cachedResult);
      expect(mockCacheGet).toHaveBeenCalledWith("agent-output:insight-generator:abc123");
    });

    it("SVC-AOC-11 | returns null on cache miss", async () => {
      mockCacheGet.mockResolvedValue(null);

      const result = await getCachedAgentResult("insight-generator", "abc123");

      expect(result).toBeNull();
    });

    it("SVC-AOC-12 | returns null when cache throws (DB unavailable)", async () => {
      mockCacheGet.mockRejectedValue(new Error("DB connection failed"));

      const result = await getCachedAgentResult("insight-generator", "abc123");

      expect(result).toBeNull();
    });
  });

  describe("cacheAgentResult", () => {
    it("SVC-AOC-20 | stores result with correct cache key and TTL", async () => {
      const result = makeAgentResult("insight-generator");

      await cacheAgentResult("insight-generator", "abc123", result);

      expect(mockCacheSet).toHaveBeenCalledWith(
        "agent-output:insight-generator:abc123",
        "agent-output",
        result,
        AGENT_OUTPUT_TTL
      );
    });

    it("SVC-AOC-21 | accepts custom TTL", async () => {
      const result = makeAgentResult("insight-generator");

      await cacheAgentResult("insight-generator", "abc123", result, 3600);

      expect(mockCacheSet).toHaveBeenCalledWith(
        "agent-output:insight-generator:abc123",
        "agent-output",
        result,
        3600
      );
    });

    it("SVC-AOC-22 | does not throw when cache write fails", async () => {
      mockCacheSet.mockRejectedValue(new Error("DB write error"));
      const result = makeAgentResult("insight-generator");

      await expect(
        cacheAgentResult("insight-generator", "abc123", result)
      ).resolves.toBeUndefined();
    });
  });

  describe("AGENT_OUTPUT_TTL", () => {
    it("SVC-AOC-30 | is 7 days (604800 seconds)", () => {
      expect(AGENT_OUTPUT_TTL).toBe(604800);
    });
  });
});
