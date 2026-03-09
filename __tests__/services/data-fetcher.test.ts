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

import { fetchAllMarketData, type DataFetchOptions } from "@/lib/services/data-fetcher";
import * as reapi from "@/lib/connectors/realestateapi";
import * as scrapingdog from "@/lib/connectors/scrapingdog";
import type { MarketData } from "@/lib/agents/orchestrator";

const mockSearchProperties = reapi.searchProperties as jest.MockedFunction<typeof reapi.searchProperties>;
const mockGetPropertyDetail = reapi.getPropertyDetail as jest.MockedFunction<typeof reapi.getPropertyDetail>;
const mockGetPropertyComps = reapi.getPropertyComps as jest.MockedFunction<typeof reapi.getPropertyComps>;
const mockBuildSearchParams = reapi.buildSearchParamsFromMarket as jest.MockedFunction<typeof reapi.buildSearchParamsFromMarket>;
const mockSearchLocal = scrapingdog.searchLocal as jest.MockedFunction<typeof scrapingdog.searchLocal>;
const mockBuildLocalQuery = scrapingdog.buildLocalQuery as jest.MockedFunction<typeof scrapingdog.buildLocalQuery>;

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
    mockBuildSearchParams.mockReturnValue({
      city: "Naples",
      state: "FL",
      priceMin: 5000000,
    });
    mockBuildLocalQuery.mockImplementation((cat, market) => `${cat} ${market.city} ${market.state}`);
  });

  describe("fetchAllMarketData", () => {
    it("fetches target market properties", async () => {
      const props = [makeProperty("p1", 8000000), makeProperty("p2", 6000000)];
      mockSearchProperties.mockResolvedValue({ properties: props, total: 2, stale: false });
      mockGetPropertyDetail.mockResolvedValue(makeDetail("p1"));
      mockGetPropertyComps.mockResolvedValue({
        subjectProperty: "p1", comps: [], avm: null, stale: false,
      });
      mockSearchLocal.mockResolvedValue({ businesses: [], query: "", stale: false });

      const result = await fetchAllMarketData(makeOptions());

      expect(result.targetMarket.properties).toHaveLength(2);
      expect(result.targetMarket.stale).toBe(false);
    });

    it("throws when target market fetch fails", async () => {
      mockSearchProperties.mockRejectedValue(new Error("API down"));

      await expect(fetchAllMarketData(makeOptions())).rejects.toThrow(
        /Failed to fetch target market/
      );
    });

    it("fetches property details for top-N by price", async () => {
      const props = [
        makeProperty("p1", 10000000),
        makeProperty("p2", 8000000),
        makeProperty("p3", 6000000),
      ];
      mockSearchProperties.mockResolvedValue({ properties: props, total: 3, stale: false });
      mockGetPropertyDetail.mockResolvedValue(makeDetail("p1"));
      mockGetPropertyComps.mockResolvedValue({
        subjectProperty: "addr", comps: [], avm: null, stale: false,
      });
      mockSearchLocal.mockResolvedValue({ businesses: [], query: "", stale: false });

      const result = await fetchAllMarketData(makeOptions({ topNDetails: 2 }));

      // Should call detail for top 2 by price: p1 ($10M), p2 ($8M)
      expect(mockGetPropertyDetail).toHaveBeenCalledTimes(2);
      expect(result.targetMarket.details).toHaveLength(2);
    });

    it("fetches peer market data", async () => {
      const targetProps = [makeProperty("p1", 8000000)];
      const peerProps = [makeProperty("peer-1", 7000000)];

      // First call = target, second = peer
      mockSearchProperties
        .mockResolvedValueOnce({ properties: targetProps, total: 1, stale: false })
        .mockResolvedValueOnce({ properties: peerProps, total: 1, stale: false });
      mockGetPropertyDetail.mockResolvedValue(makeDetail("p1"));
      mockGetPropertyComps.mockResolvedValue({
        subjectProperty: "addr", comps: [], avm: null, stale: false,
      });
      mockSearchLocal.mockResolvedValue({ businesses: [], query: "", stale: false });

      const result = await fetchAllMarketData(makeOptions());

      expect(result.peerMarkets).toHaveLength(1);
      expect(result.peerMarkets[0].name).toBe("Palm Beach");
      expect(result.peerMarkets[0].properties).toHaveLength(1);
    });

    it("continues when peer market fetch fails", async () => {
      mockSearchProperties
        .mockResolvedValueOnce({ properties: [makeProperty("p1", 8000000)], total: 1, stale: false })
        .mockRejectedValueOnce(new Error("Peer API error"));
      mockGetPropertyDetail.mockResolvedValue(makeDetail("p1"));
      mockGetPropertyComps.mockResolvedValue({
        subjectProperty: "addr", comps: [], avm: null, stale: false,
      });
      mockSearchLocal.mockResolvedValue({ businesses: [], query: "", stale: false });

      const result = await fetchAllMarketData(makeOptions());

      expect(result.peerMarkets).toHaveLength(0);
      expect(result.fetchMetadata.errors).toHaveLength(1);
      expect(result.fetchMetadata.errors[0].source).toBe("realestateapi");
    });

    it("fetches neighborhood amenities", async () => {
      mockSearchProperties.mockResolvedValue({
        properties: [makeProperty("p1", 8000000)],
        total: 1,
        stale: false,
      });
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
      mockSearchProperties
        .mockResolvedValueOnce({ properties: [makeProperty("p1", 8000000)], total: 1, stale: false })
        .mockResolvedValueOnce({ properties: [], total: 0, stale: false }); // peer
      mockGetPropertyDetail.mockResolvedValue(makeDetail("p1"));
      mockGetPropertyComps.mockResolvedValue({
        subjectProperty: "addr", comps: [], avm: null, stale: false,
      });
      mockSearchLocal.mockResolvedValue({ businesses: [], query: "", stale: false });

      const result = await fetchAllMarketData(makeOptions());

      // 1 target search + 1 detail + 1 comp + 1 peer search + 1 amenity = 5
      expect(result.fetchMetadata.totalApiCalls).toBe(5);
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

      expect(result.peerMarkets).toHaveLength(0);
      // Only 1 searchProperties call (target, no peers)
      expect(mockSearchProperties).toHaveBeenCalledTimes(1);
    });

    it("continues when PropertyDetail fails for individual properties", async () => {
      const props = [makeProperty("p1", 10000000), makeProperty("p2", 8000000)];
      mockSearchProperties.mockResolvedValue({ properties: props, total: 2, stale: false });
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
      mockSearchProperties.mockResolvedValue({
        properties: [], total: 0, stale: false,
      });
      mockSearchLocal.mockResolvedValue({ businesses: [], query: "", stale: false });

      const result = await fetchAllMarketData(makeOptions({ market: { ...testMarket, peerMarkets: undefined } }));

      expect(result.fetchMetadata.totalDurationMs).toBeGreaterThanOrEqual(0);
      expect(result.fetchMetadata.errors).toEqual([]);
    });
  });
});
