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
jest.mock("@/lib/services/data-source-registry", () => ({
  registry: {
    getAll: jest.fn().mockReturnValue([]),
    envVarsPresent: jest.fn().mockReturnValue(true),
    getHealthSnapshot: jest.fn().mockReturnValue(null),
  },
}));

import { fetchAllMarketData, computePeriodBounds, type DataFetchOptions } from "@/lib/services/data-fetcher";
import * as reapi from "@/lib/connectors/realestateapi";
import * as scrapingdog from "@/lib/connectors/scrapingdog";
import type { MarketData } from "@/lib/agents/orchestrator";

const mockSearchProperties = reapi.searchProperties as jest.MockedFunction<typeof reapi.searchProperties>;
const mockGetPropertyDetail = reapi.getPropertyDetail as jest.MockedFunction<typeof reapi.getPropertyDetail>;
const mockGetPropertyComps = reapi.getPropertyComps as jest.MockedFunction<typeof reapi.getPropertyComps>;
const mockBuildSearchParams = reapi.buildSearchParamsFromMarket as jest.MockedFunction<typeof reapi.buildSearchParamsFromMarket>;
const mockSearchLocal = scrapingdog.searchLocal as jest.MockedFunction<typeof scrapingdog.searchLocal>;
const mockBuildLocalQuery = scrapingdog.buildLocalQuery as jest.MockedFunction<typeof scrapingdog.buildLocalQuery>;
const mockSearchNews = scrapingdog.searchNews as jest.MockedFunction<typeof scrapingdog.searchNews>;
const mockBuildNewsQuery = scrapingdog.buildNewsQuery as jest.MockedFunction<typeof scrapingdog.buildNewsQuery>;

// --- Fixtures ---

const testMarket: MarketData = {
  name: "Naples Ultra-Luxury",
  geography: { city: "Naples", state: "FL" },
  luxuryTier: "ultra_luxury",
  priceFloor: 5000000,
  peerMarkets: [
    { name: "Palm Beach", geography: { city: "Palm Beach", state: "FL" } },
  ],
};

function makeProperty(id: string, price: number) {
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
    lastSaleDate: "2026-01-15",
    lastSalePrice: price,
  };
}

function makeDetail(id: string) {
  return {
    id,
    address: `${id} Ocean Blvd, Naples, FL 34102`,
    propertyType: "SFR",
    stale: false,
    propertyInfo: null,
    flags: {
      absenteeOwner: false, ownerOccupied: true, corporateOwned: false,
      investorBuyer: false, vacant: false, freeClear: false, highEquity: false,
      cashBuyer: false, cashSale: false, mlsActive: false, mlsPending: false,
      mlsSold: true, preForeclosure: false, auction: false, floodZone: false,
    },
    estimatedValue: null, estimatedEquity: null, equityPercent: null,
    lastSaleDate: null, lastSalePrice: null,
    ownerInfo: null, taxInfo: null, lotInfo: null,
    saleHistory: [], currentMortgages: [], mlsHistory: [],
    demographics: null, schools: [], neighborhood: null,
    floodZoneType: null, floodZoneDescription: null, linkedProperties: null,
  };
}

function makeOptions(overrides: Partial<DataFetchOptions> = {}): DataFetchOptions {
  return {
    userId: "user-1",
    reportId: "report-1",
    market: testMarket,
    abortSignal: new AbortController().signal,
    topNDetails: 2,
    representativeComps: 2,
    amenityCategories: ["luxury restaurants"],
    ...overrides,
  };
}

// --- Tests ---

describe("Data Fetch Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchProperties.mockResolvedValue({ properties: [], total: 0, stale: false });
    mockBuildSearchParams.mockReturnValue({
      city: "Naples",
      state: "FL",
      priceMin: 5000000,
    });
    mockBuildLocalQuery.mockImplementation((cat, market) => `${cat} ${market.city} ${market.state}`);
    mockBuildNewsQuery.mockImplementation((topic, geo) => `${topic} ${geo.city} ${geo.state}`);
    mockSearchNews.mockResolvedValue({ articles: [], query: "", stale: false });
  });

  describe("fetchAllMarketData", () => {
    it("fetches target market properties with two date-bounded searches", async () => {
      // Current period returns 1 prop, prior period returns 1 prop, peer returns 0
      mockSearchProperties
        .mockResolvedValueOnce({ properties: [makeProperty("p1", 8000000)], total: 1, stale: false })
        .mockResolvedValueOnce({ properties: [makeProperty("p2", 6000000)], total: 1, stale: false })
        .mockResolvedValueOnce({ properties: [], total: 0, stale: false }); // peer
      mockGetPropertyDetail.mockResolvedValue(makeDetail("p1"));
      mockGetPropertyComps.mockResolvedValue({
        subjectProperty: "p1", comps: [], avm: null, stale: false,
      });
      mockSearchLocal.mockResolvedValue({ businesses: [], query: "", stale: false });

      const result = await fetchAllMarketData(makeOptions());

      // Combined: current + prior
      expect(result.targetMarket.properties).toHaveLength(2);
      expect(result.targetMarket.stale).toBe(false);
      // 2 target searches (current + prior)
      expect(mockSearchProperties).toHaveBeenCalledTimes(5); // 2 target + 3 peers (1 configured + 2 auto-filled)
    });

    it("throws when target market fetch fails", async () => {
      mockSearchProperties.mockRejectedValue(new Error("API down"));

      await expect(fetchAllMarketData(makeOptions())).rejects.toThrow(
        /Failed to fetch target market/
      );
    });

    it("fetches property details for each period cohort", async () => {
      // 2 current props, 1 prior prop, 0 peer
      mockSearchProperties
        .mockResolvedValueOnce({ properties: [makeProperty("p1", 10000000), makeProperty("p2", 8000000)], total: 2, stale: false })
        .mockResolvedValueOnce({ properties: [makeProperty("p3", 6000000)], total: 1, stale: false })
        .mockResolvedValueOnce({ properties: [], total: 0, stale: false }); // peer
      mockGetPropertyDetail.mockResolvedValue(makeDetail("p1"));
      mockGetPropertyComps.mockResolvedValue({
        subjectProperty: "addr", comps: [], avm: null, stale: false,
      });
      mockSearchLocal.mockResolvedValue({ businesses: [], query: "", stale: false });

      // topNDetails=6 → detailsPerCohort=max(3,3)=3
      const result = await fetchAllMarketData(makeOptions({ topNDetails: 6 }));

      // Details from current (min(2,3)=2) + prior (min(1,3)=1) = 3 total
      expect(mockGetPropertyDetail).toHaveBeenCalledTimes(3);
      expect(result.targetMarket.details).toHaveLength(3);
      expect(result.targetMarket.currentPeriodDetails).toHaveLength(2);
      expect(result.targetMarket.priorPeriodDetails).toHaveLength(1);
    });

    it("fetches peer market data", async () => {
      const peerProps = [makeProperty("peer-1", 7000000)];

      // 2 target searches (current + prior) + 1 peer
      mockSearchProperties
        .mockResolvedValueOnce({ properties: [makeProperty("p1", 8000000)], total: 1, stale: false })
        .mockResolvedValueOnce({ properties: [], total: 0, stale: false })
        .mockResolvedValueOnce({ properties: peerProps, total: 1, stale: false });
      mockGetPropertyDetail.mockResolvedValue(makeDetail("p1"));
      mockGetPropertyComps.mockResolvedValue({
        subjectProperty: "addr", comps: [], avm: null, stale: false,
      });
      mockSearchLocal.mockResolvedValue({ businesses: [], query: "", stale: false });

      const result = await fetchAllMarketData(makeOptions());

      expect(result.peerMarkets).toHaveLength(3); // 1 configured + 2 auto-filled
      expect(result.peerMarkets[0].name).toBe("Palm Beach");
      expect(result.peerMarkets[0].properties).toHaveLength(1);
    });

    it("continues when peer market fetch fails", async () => {
      // 2 target searches succeed, peer fails
      mockSearchProperties
        .mockResolvedValueOnce({ properties: [makeProperty("p1", 8000000)], total: 1, stale: false })
        .mockResolvedValueOnce({ properties: [], total: 0, stale: false })
        .mockRejectedValueOnce(new Error("Peer API error"));
      mockGetPropertyDetail.mockResolvedValue(makeDetail("p1"));
      mockGetPropertyComps.mockResolvedValue({
        subjectProperty: "addr", comps: [], avm: null, stale: false,
      });
      mockSearchLocal.mockResolvedValue({ businesses: [], query: "", stale: false });

      const result = await fetchAllMarketData(makeOptions());

      expect(result.peerMarkets).toHaveLength(2); // 2 auto-filled peers succeed
      expect(result.fetchMetadata.errors).toHaveLength(1);
      expect(result.fetchMetadata.errors[0].source).toBe("realestateapi");
    });

    it("fetches neighborhood amenities", async () => {
      mockSearchProperties
        .mockResolvedValueOnce({ properties: [makeProperty("p1", 8000000)], total: 1, stale: false })
        .mockResolvedValueOnce({ properties: [], total: 0, stale: false })
        .mockResolvedValueOnce({ properties: [], total: 0, stale: false }); // peer
      mockGetPropertyDetail.mockResolvedValue(makeDetail("p1"));
      mockGetPropertyComps.mockResolvedValue({
        subjectProperty: "addr", comps: [], avm: null, stale: false,
      });
      mockSearchLocal.mockResolvedValue({
        businesses: [{ name: "Café Lurcat", category: "Restaurant", rating: 4.5, reviewCount: 200, address: "123 5th Ave" }],
        query: "luxury restaurants Naples FL",
        stale: false,
      });

      const result = await fetchAllMarketData(makeOptions());

      expect(result.neighborhood.amenities["luxury restaurants"]).toHaveLength(1);
      expect(result.neighborhood.amenities["luxury restaurants"][0].name).toBe("Café Lurcat");
    });

    it("tracks stale data sources", async () => {
      // All calls return stale data
      mockSearchProperties.mockResolvedValue({
        properties: [makeProperty("p1", 8000000)],
        total: 1,
        stale: true,
      });
      mockGetPropertyDetail.mockResolvedValue({ ...makeDetail("p1"), stale: true });
      mockGetPropertyComps.mockResolvedValue({
        subjectProperty: "addr", comps: [], avm: null, stale: true,
      });
      mockSearchLocal.mockResolvedValue({ businesses: [], query: "", stale: true });

      const result = await fetchAllMarketData(makeOptions());

      expect(result.fetchMetadata.staleDataSources).toContain("realestateapi:search");
      expect(result.fetchMetadata.staleDataSources).toContain("realestateapi:detail");
    });

    it("tracks total API calls", async () => {
      // 2 target searches + 1 peer search
      mockSearchProperties
        .mockResolvedValueOnce({ properties: [makeProperty("p1", 8000000)], total: 1, stale: false })
        .mockResolvedValueOnce({ properties: [], total: 0, stale: false })  // prior
        .mockResolvedValueOnce({ properties: [], total: 0, stale: false }); // peer
      mockGetPropertyDetail.mockResolvedValue(makeDetail("p1"));
      mockGetPropertyComps.mockResolvedValue({
        subjectProperty: "addr", comps: [], avm: null, stale: false,
      });
      mockSearchLocal.mockResolvedValue({ businesses: [], query: "", stale: false });

      const result = await fetchAllMarketData(makeOptions());

      // 2 target searches + details + comps + 1 peer search + amenities
      expect(result.fetchMetadata.totalApiCalls).toBeGreaterThanOrEqual(5);
    });

    it("respects abort signal", async () => {
      const controller = new AbortController();
      controller.abort();

      await expect(
        fetchAllMarketData(makeOptions({ abortSignal: controller.signal }))
      ).rejects.toThrow(/aborted/);
    });

    it("skips peers when market has no peerMarkets", async () => {
      const marketNoPeers = { ...testMarket, peerMarkets: undefined };
      mockSearchProperties.mockResolvedValue({
        properties: [makeProperty("p1", 8000000)],
        total: 1,
        stale: false,
      });
      mockGetPropertyDetail.mockResolvedValue(makeDetail("p1"));
      mockGetPropertyComps.mockResolvedValue({
        subjectProperty: "addr", comps: [], avm: null, stale: false,
      });
      mockSearchLocal.mockResolvedValue({ businesses: [], query: "", stale: false });

      const result = await fetchAllMarketData(makeOptions({ market: marketNoPeers }));

      expect(result.peerMarkets).toHaveLength(3); // 3 auto-filled peers from STATE_LUXURY_CITIES
      // 2 target searches (current + prior) + 3 auto-filled peers
      expect(mockSearchProperties).toHaveBeenCalledTimes(5);
    });

    it("continues when PropertyDetail fails for individual properties", async () => {
      // 2 props in current, 0 in prior
      mockSearchProperties
        .mockResolvedValueOnce({ properties: [makeProperty("p1", 10000000), makeProperty("p2", 8000000)], total: 2, stale: false })
        .mockResolvedValueOnce({ properties: [], total: 0, stale: false })
        .mockResolvedValueOnce({ properties: [], total: 0, stale: false }); // peer
      mockGetPropertyDetail
        .mockResolvedValueOnce(makeDetail("p1"))
        .mockRejectedValueOnce(new Error("Detail API error"));
      mockGetPropertyComps.mockResolvedValue({
        subjectProperty: "addr", comps: [], avm: null, stale: false,
      });
      mockSearchLocal.mockResolvedValue({ businesses: [], query: "", stale: false });

      const result = await fetchAllMarketData(makeOptions());

      expect(result.targetMarket.details).toHaveLength(1);
      expect(result.fetchMetadata.errors).toHaveLength(1);
      expect(result.fetchMetadata.errors[0].endpoint).toBe("/v2/PropertyDetail");
    });

    it("returns fetchMetadata with duration", async () => {
      // 2 target searches return empty
      mockSearchProperties.mockResolvedValue({
        properties: [], total: 0, stale: false,
      });
      mockSearchLocal.mockResolvedValue({ businesses: [], query: "", stale: false });

      const result = await fetchAllMarketData(makeOptions({ market: { ...testMarket, peerMarkets: undefined } }));

      expect(result.fetchMetadata.totalDurationMs).toBeGreaterThanOrEqual(0);
      expect(result.fetchMetadata.errors).toEqual([]);
    });

    it("passes date bounds to target market searches", async () => {
      mockSearchProperties.mockResolvedValue({ properties: [], total: 0, stale: false });
      mockSearchLocal.mockResolvedValue({ businesses: [], query: "", stale: false });

      await fetchAllMarketData(makeOptions({ market: { ...testMarket, peerMarkets: undefined } }));

      // First call: current period should have date params
      const firstCallParams = mockSearchProperties.mock.calls[0][0];
      expect(firstCallParams.lastSaleDateMin).toBeDefined();
      expect(firstCallParams.lastSaleDateMax).toBeDefined();

      // Second call: prior period should have date params
      const secondCallParams = mockSearchProperties.mock.calls[1][0];
      expect(secondCallParams.lastSaleDateMin).toBeDefined();
      expect(secondCallParams.lastSaleDateMax).toBeDefined();

      // Current period max should be > prior period max
      expect(firstCallParams.lastSaleDateMax! > secondCallParams.lastSaleDateMax!).toBe(true);
    });
  });

  describe("computePeriodBounds", () => {
    it("computes rolling 12-month periods", () => {
      const now = new Date(2026, 2, 10); // March 10, 2026
      const result = computePeriodBounds(now);

      // Current: March 11 2025 → March 10 2026
      expect(result.current.min).toBe("2025-03-11");
      expect(result.current.max).toBe("2026-03-10");

      // Prior: March 11 2024 → March 10 2025
      expect(result.prior.min).toBe("2024-03-11");
      expect(result.prior.max).toBe("2025-03-10");
    });

    it("returns non-overlapping periods", () => {
      const result = computePeriodBounds(new Date(2026, 5, 15));
      // Prior max should be exactly 1 day before current min
      const priorMax = new Date(result.prior.max);
      const currentMin = new Date(result.current.min);
      const diffDays = (currentMin.getTime() - priorMax.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBe(1);
    });
  });
});
