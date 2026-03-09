jest.mock("@/lib/db", () => ({
  db: {},
  schema: { cache: {}, apiUsage: {} },
}));
jest.mock("@/lib/services/cache");
jest.mock("@/lib/services/api-usage");
jest.mock("@/lib/config/env", () => ({
  env: { REALESTATEAPI_KEY: "test-reapi-key" },
}));

import {
  searchProperties,
  getPropertyDetail,
  getPropertyComps,
  buildSearchParamsFromMarket,
} from "@/lib/connectors/realestateapi";
import * as cacheModule from "@/lib/services/cache";
import * as apiUsageModule from "@/lib/services/api-usage";

const mockCacheGet = cacheModule.get as jest.MockedFunction<typeof cacheModule.get>;
const mockCacheSet = cacheModule.set as jest.MockedFunction<typeof cacheModule.set>;
const mockCacheBuildKey = cacheModule.buildKey as jest.MockedFunction<typeof cacheModule.buildKey>;
const mockLogApiCall = apiUsageModule.logApiCall as jest.MockedFunction<typeof apiUsageModule.logApiCall>;

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("RealEstateAPI Connector", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCacheBuildKey.mockImplementation(
      (source: string, endpoint: string, params: Record<string, unknown>) => {
        const sorted = Object.keys(params)
          .sort()
          .map((k) => `${k}=${params[k]}`)
          .join("&");
        return `${source}:${endpoint}:${sorted}`;
      }
    );
    mockCacheSet.mockResolvedValue(undefined);
    mockLogApiCall.mockResolvedValue(undefined);
  });

  describe("searchProperties", () => {
    const mockSearchResponse = {
      status: 200,
      resultCount: 2,
      data: [
        {
          id: "prop-1",
          address: { full: "123 Ocean Blvd", city: "Naples", state: "FL", zip: "34102" },
          summary: {
            proptype: "SFR",
            yearbuilt: 2020,
            sqft: 5200,
            beds: 5,
            baths: 4,
          },
          sale: { saledate: "2025-12-15", saleprice: 8500000 },
        },
        {
          id: "prop-2",
          address: { full: "456 Gulf Shore Dr", city: "Naples", state: "FL", zip: "34102" },
          summary: {
            proptype: "CONDO",
            yearbuilt: 2018,
            sqft: 3100,
            beds: 3,
            baths: 3,
          },
          sale: { saledate: "2025-11-20", saleprice: 6200000 },
        },
      ],
    };

    it("returns parsed property results on cache miss", async () => {
      mockCacheGet.mockResolvedValue(null);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSearchResponse),
      });

      const result = await searchProperties({
        city: "Naples",
        state: "FL",
        priceMin: 6000000,
      });

      expect(result.properties).toHaveLength(2);
      expect(result.properties[0].address).toBe("123 Ocean Blvd");
      expect(result.properties[0].price).toBe(8500000);
      expect(result.properties[0].sqft).toBe(5200);
      expect(result.stale).toBe(false);
    });

    it("checks cache before calling API", async () => {
      const cachedResult = {
        properties: [{ id: "prop-1", address: "123 Ocean Blvd" }],
        total: 1,
      };
      mockCacheGet.mockResolvedValue(cachedResult);

      const result = await searchProperties({ city: "Naples", state: "FL" });

      expect(mockCacheGet).toHaveBeenCalled();
      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.stale).toBe(false);
    });

    it("sends correct auth header", async () => {
      mockCacheGet.mockResolvedValue(null);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSearchResponse),
      });

      await searchProperties({ city: "Naples", state: "FL" });

      const fetchCall = mockFetch.mock.calls[0];
      expect(fetchCall[1].headers["x-api-key"]).toBe("test-reapi-key");
      expect(fetchCall[1].method).toBe("POST");
    });

    it("stores result in cache after fetch", async () => {
      mockCacheGet.mockResolvedValue(null);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSearchResponse),
      });

      await searchProperties({ city: "Naples", state: "FL" });

      expect(mockCacheSet).toHaveBeenCalledWith(
        expect.any(String),
        "realestateapi",
        expect.objectContaining({ properties: expect.any(Array) })
      );
    });

    it("logs API call on cache miss", async () => {
      mockCacheGet.mockResolvedValue(null);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSearchResponse),
      });

      await searchProperties(
        { city: "Naples", state: "FL" },
        { userId: "user-1" }
      );

      expect(mockLogApiCall).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: "realestateapi",
          endpoint: "/v2/PropertySearch",
          cached: false,
        })
      );
    });

    it("throws on API error", async () => {
      mockCacheGet.mockResolvedValue(null);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      });

      await expect(
        searchProperties({ city: "Naples", state: "FL" }, { userId: "user-1" })
      ).rejects.toThrow(/RealEstateAPI error/);
    });

    it("returns stale data on API failure when expired cache exists", async () => {
      mockCacheGet
        .mockResolvedValueOnce(null) // fresh check
        .mockResolvedValueOnce({     // stale fallback
          properties: [{ id: "prop-1", address: "123 Ocean Blvd" }],
          total: 1,
        });

      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      const result = await searchProperties(
        { city: "Naples", state: "FL" },
        { userId: "user-1" }
      );

      expect(result.stale).toBe(true);
      expect(result.properties).toHaveLength(1);
    });
  });

  describe("getPropertyDetail", () => {
    const mockDetailResponse = {
      status: 200,
      data: {
        id: "prop-1",
        address: { full: "123 Ocean Blvd", city: "Naples", state: "FL", zip: "34102" },
        owner: { name: "John Smith", mailingAddress: "123 Ocean Blvd, Naples FL 34102" },
        summary: { proptype: "SFR", yearbuilt: 2020, sqft: 5200, beds: 5, baths: 4, lotsize: 12000 },
        sale: [
          { saledate: "2025-12-15", saleprice: 8500000 },
          { saledate: "2020-06-01", saleprice: 5200000 },
        ],
        mortgage: { amount: 4000000, lender: "First National", date: "2025-12-15" },
        valuation: { estimated: 8800000, low: 8200000, high: 9400000 },
      },
    };

    it("returns parsed property detail on cache miss", async () => {
      mockCacheGet.mockResolvedValue(null);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockDetailResponse),
      });

      const result = await getPropertyDetail("prop-1");

      expect(result.id).toBe("prop-1");
      expect(result.address).toBe("123 Ocean Blvd");
      expect(result.saleHistory).toHaveLength(2);
      expect(result.valuation?.estimated).toBe(8800000);
      expect(result.stale).toBe(false);
    });

    it("checks cache before calling API", async () => {
      mockCacheGet.mockResolvedValue({
        id: "prop-1",
        address: "123 Ocean Blvd",
        saleHistory: [],
      });

      const result = await getPropertyDetail("prop-1");
      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.id).toBe("prop-1");
    });
  });

  describe("getPropertyComps", () => {
    const mockCompsResponse = {
      status: 200,
      data: {
        subject: { address: "123 Ocean Blvd, Naples FL 34102" },
        comps: [
          {
            address: "125 Ocean Blvd",
            saleprice: 8200000,
            sqft: 4800,
            pricePerSqft: 1708,
            distance: 0.1,
            similarity: 92,
          },
          {
            address: "200 Gulf Shore Dr",
            saleprice: 9100000,
            sqft: 5500,
            pricePerSqft: 1655,
            distance: 0.3,
            similarity: 87,
          },
        ],
        avm: { estimated: 8800000, low: 8200000, high: 9400000 },
      },
    };

    it("returns parsed comps on cache miss", async () => {
      mockCacheGet.mockResolvedValue(null);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockCompsResponse),
      });

      const result = await getPropertyComps("123 Ocean Blvd, Naples FL 34102");

      expect(result.comps).toHaveLength(2);
      expect(result.comps[0].price).toBe(8200000);
      expect(result.avm?.estimated).toBe(8800000);
      expect(result.stale).toBe(false);
    });
  });

  describe("buildSearchParamsFromMarket", () => {
    it("maps market definition to search params", () => {
      const market = {
        geography: { city: "Naples", state: "FL", zipCodes: ["34102", "34103"] },
        luxuryTier: "ultra_luxury" as const,
        priceFloor: 10000000,
        priceCeiling: null,
        propertyTypes: ["Single Family", "Condo"],
      };

      const params = buildSearchParamsFromMarket(market);

      expect(params.city).toBe("Naples");
      expect(params.state).toBe("FL");
      expect(params.zipCodes).toEqual(["34102", "34103"]);
      expect(params.priceMin).toBe(10000000);
      expect(params.propertyTypes).toEqual(["Single Family", "Condo"]);
    });

    it("handles market with no optional fields", () => {
      const market = {
        geography: { city: "Miami", state: "FL" },
        luxuryTier: "luxury" as const,
        priceFloor: 1000000,
        priceCeiling: 5000000,
      };

      const params = buildSearchParamsFromMarket(market);

      expect(params.city).toBe("Miami");
      expect(params.priceMin).toBe(1000000);
      expect(params.priceMax).toBe(5000000);
      expect(params.zipCodes).toBeUndefined();
    });
  });
});
