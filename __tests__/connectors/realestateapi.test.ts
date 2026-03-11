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
      statusCode: 200,
      resultCount: 2,
      data: [
        {
          id: "prop-1",
          address: { address: "123 Ocean Blvd", city: "Naples", state: "FL", zip: "34102" },
          propertyType: "SFR",
          yearBuilt: 2020,
          squareFeet: 5200,
          bedrooms: 5,
          bathrooms: 4,
          lastSaleDate: "2025-12-15",
          lastSaleAmount: 8500000,
          estimatedValue: 8600000,
        },
        {
          id: "prop-2",
          address: { address: "456 Gulf Shore Dr", city: "Naples", state: "FL", zip: "34102" },
          propertyType: "CONDO",
          yearBuilt: 2018,
          squareFeet: 3100,
          bedrooms: 3,
          bathrooms: 3,
          lastSaleDate: "2025-11-20",
          lastSaleAmount: 6200000,
          estimatedValue: 6300000,
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

    it("Regression: writes stale fallback copy alongside normal cache", async () => {
      mockCacheGet.mockResolvedValue(null);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSearchResponse),
      });

      await searchProperties({ city: "Naples", state: "FL" });

      // Must write both: normal cache key AND stale fallback key
      const setCalls = mockCacheSet.mock.calls;
      const normalWrite = setCalls.find(
        (c: unknown[]) => typeof c[0] === "string" && !c[0].endsWith(":stale")
      );
      const staleWrite = setCalls.find(
        (c: unknown[]) => typeof c[0] === "string" && c[0].endsWith(":stale")
      );

      expect(normalWrite).toBeDefined();
      expect(staleWrite).toBeDefined();
      // Stale copy should have a 7-day TTL
      expect(staleWrite![3]).toBe(604800);
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
        text: () => Promise.resolve('{"error":"Unauthorized"}'),
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
        id: 8195564,
        propertyType: "SFR",
        absenteeOwner: false,
        ownerOccupied: true,
        corporateOwned: false,
        freeClear: true,
        highEquity: true,
        cashBuyer: true,
        mlsActive: false,
        floodZone: true,
        floodZoneType: "X",
        floodZoneDescription: "AREA OF MINIMAL FLOOD HAZARD",
        estimatedValue: 8800000,
        estimatedEquity: 8800000,
        equityPercent: 100,
        lastSaleDate: "2025-12-15",
        lastSalePrice: "8500000",
        propertyInfo: {
          address: {
            address: "123 Ocean Blvd",
            city: "Naples",
            state: "FL",
            zip: "34102",
            county: "Collier",
            label: "123 Ocean Blvd, Naples, FL 34102",
          },
          latitude: 26.142,
          longitude: -81.795,
          livingSquareFeet: 5200,
          bedrooms: 5,
          bathrooms: 4,
          yearBuilt: 2020,
          stories: 2,
          construction: "Concrete Block",
          pool: true,
          fireplace: true,
          garageType: "Garage, Attached",
          garageSquareFeet: 800,
          lotSquareFeet: 12000,
          pricePerSquareFoot: 1635,
          propertyUse: "Single Family Residence",
        },
        ownerInfo: {
          owner1FullName: "John Smith",
          owner1Type: "Individual",
          mailAddress: { label: "123 Ocean Blvd, Naples FL 34102" },
          ownershipLength: 3,
        },
        taxInfo: {
          assessedValue: 7500000,
          assessedLandValue: 3000000,
          assessedImprovementValue: "4500000",
          marketValue: 8500000,
          taxAmount: "85000.00",
          year: 2025,
        },
        lotInfo: {
          apn: "12345678",
          lotAcres: 0.28,
          lotSquareFeet: 12000,
          zoning: "RSF-4",
          landUse: "Residential",
        },
        saleHistory: [
          {
            saleDate: "2025-12-15",
            saleAmount: 8500000,
            buyerNames: "John Smith",
            sellerNames: "Jane Doe",
            documentType: "Warranty Deed",
            transactionType: "Resale",
            purchaseMethod: "Mortgage Purchase",
          },
          {
            saleDate: "2020-06-01",
            saleAmount: 5200000,
            buyerNames: "Jane Doe",
            sellerNames: "Builder Corp",
            documentType: "Warranty Deed",
            transactionType: "Resale",
          },
        ],
        currentMortgages: [
          {
            amount: 4000000,
            interestRate: 6.5,
            interestRateType: "Fixed Rate",
            lenderName: "First National",
            documentDate: "2025-12-15",
            position: "First",
          },
        ],
        demographics: {
          medianIncome: "125000",
          suggestedRent: "5200",
          fmrYear: "2025",
        },
        schools: [
          { name: "Naples Academy", type: "Public", grades: "K-5", rating: "9" },
        ],
        neighborhood: { name: "Port Royal", type: "subdivision" },
      },
    };

    it("returns parsed property detail on cache miss", async () => {
      mockCacheGet.mockResolvedValue(null);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockDetailResponse),
      });

      const result = await getPropertyDetail("8195564");

      expect(result.id).toBe("8195564");
      expect(result.address).toBe("123 Ocean Blvd, Naples, FL 34102");
      expect(result.propertyType).toBe("SFR");
      expect(result.saleHistory).toHaveLength(2);
      expect(result.saleHistory[0].price).toBe(8500000);
      expect(result.saleHistory[0].buyerNames).toBe("John Smith");
      expect(result.estimatedValue).toBe(8800000);
      expect(result.flags.freeClear).toBe(true);
      expect(result.flags.ownerOccupied).toBe(true);
      expect(result.propertyInfo?.pool).toBe(true);
      expect(result.propertyInfo?.sqft).toBe(5200);
      expect(result.ownerInfo?.ownerName).toBe("John Smith");
      expect(result.taxInfo?.taxAmount).toBe("85000.00");
      expect(result.currentMortgages).toHaveLength(1);
      expect(result.currentMortgages[0].lenderName).toBe("First National");
      expect(result.mlsHistory).toHaveLength(0);
      expect(result.demographics?.medianIncome).toBe("125000");
      expect(result.schools).toHaveLength(1);
      expect(result.neighborhood?.name).toBe("Port Royal");
      expect(result.floodZoneType).toBe("X");
      expect(result.stale).toBe(false);
    });

    it("checks cache before calling API", async () => {
      mockCacheGet.mockResolvedValue({
        id: "8195564",
        address: "123 Ocean Blvd",
        saleHistory: [],
      });

      const result = await getPropertyDetail("8195564");
      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.id).toBe("8195564");
    });

    it("handles minimal response with missing optional objects", async () => {
      mockCacheGet.mockResolvedValue(null);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          status: 200,
          data: {
            id: 123,
            propertyType: "SFR",
            estimatedValue: 500000,
          },
        }),
      });

      const result = await getPropertyDetail("123");

      expect(result.id).toBe("123");
      expect(result.propertyInfo).toBeNull();
      expect(result.ownerInfo).toBeNull();
      expect(result.taxInfo).toBeNull();
      expect(result.saleHistory).toHaveLength(0);
      expect(result.currentMortgages).toHaveLength(0);
      expect(result.flags.freeClear).toBe(false);
      expect(result.estimatedValue).toBe(500000);
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
    it("maps market definition to search params with REAPI property types", () => {
      const market = {
        geography: { city: "Naples", state: "FL", zipCodes: ["34102", "34103"] },
        luxuryTier: "ultra_luxury" as const,
        priceFloor: 10000000,
        priceCeiling: null,
        propertyTypes: ["single_family", "condo"],
      };

      const params = buildSearchParamsFromMarket(market);

      expect(params.city).toBe("Naples");
      expect(params.state).toBe("FL");
      expect(params.zipCodes).toEqual(["34102", "34103"]);
      expect(params.priceMin).toBe(10000000);
      // Property types should be mapped to REAPI enums at param-building time
      expect(params.propertyTypes).toEqual(["SFR", "CONDO"]);
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

    it("CONN-STA-01 | Regression: converts full state names to 2-letter codes", () => {
      const market = {
        geography: { city: "Palm Beach", state: "Florida" },
        luxuryTier: "luxury" as const,
        priceFloor: 1000000,
      };

      const params = buildSearchParamsFromMarket(market);
      expect(params.state).toBe("FL");
    });

    it("CONN-STA-02 | Regression: preserves 2-letter state codes", () => {
      const market = {
        geography: { city: "Naples", state: "FL" },
        luxuryTier: "luxury" as const,
        priceFloor: 1000000,
      };

      const params = buildSearchParamsFromMarket(market);
      expect(params.state).toBe("FL");
    });
  });

  describe("searchProperties — property type mapping", () => {
    const mockSearchResponse = {
      statusCode: 200,
      resultCount: 1,
      data: [
        {
          id: "prop-1",
          address: { address: "123 Ocean Blvd", city: "Palm Beach", state: "FL", zip: "33480" },
          propertyType: "SFR",
          yearBuilt: 2020,
          squareFeet: 5200,
          bedrooms: 5,
          bathrooms: 4,
          lastSaleDate: "2025-12-15",
          lastSaleAmount: 8500000,
          estimatedValue: 8600000,
        },
      ],
    };

    beforeEach(() => {
      mockCacheGet.mockResolvedValue(null);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSearchResponse),
      });
    });

    it("CONN-PT-01 | Regression: omits property_type when multiple REAPI types result (price range suffices)", async () => {
      await searchProperties({
        city: "Palm Beach",
        state: "FL",
        priceMin: 1000000,
        propertyTypes: ["single_family", "estate", "condo", "townhouse", "co-op"],
      });

      const fetchBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      // Maps to ["SFR", "CONDO"] (2 types) — REAPI only accepts a single string,
      // so we omit property_type and let the price range filter do the work.
      expect(fetchBody.property_type).toBeUndefined();
    });

    it("CONN-PT-02 | Regression: sends single string when one REAPI type (penthouse → CONDO)", async () => {
      await searchProperties({
        city: "Palm Beach",
        state: "FL",
        propertyTypes: ["penthouse"],
      });

      const fetchBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(fetchBody.property_type).toBe("CONDO");
    });

    it("CONN-PT-03 | Regression: sends single string when one REAPI type (chalet → SFR)", async () => {
      await searchProperties({
        city: "Aspen",
        state: "CO",
        propertyTypes: ["chalet"],
      });

      const fetchBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(fetchBody.property_type).toBe("SFR");
    });

    it("CONN-PT-04 | Regression: sends single string when one REAPI type (houseboat → OTHER)", async () => {
      await searchProperties({
        city: "Miami",
        state: "FL",
        propertyTypes: ["houseboat"],
      });

      const fetchBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(fetchBody.property_type).toBe("OTHER");
    });

    it("CONN-PT-05 | Regression: deduplicates to single string when all map to same type", async () => {
      await searchProperties({
        city: "Palm Beach",
        state: "FL",
        propertyTypes: ["single_family", "estate", "sfr"],
      });

      const fetchBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      // All three map to SFR — single type, sent as string
      expect(fetchBody.property_type).toBe("SFR");
    });

    it("CONN-PT-06 | Regression: omits property_type when no types provided", async () => {
      await searchProperties({
        city: "Naples",
        state: "FL",
      });

      const fetchBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(fetchBody.property_type).toBeUndefined();
    });

    it("CONN-DATE-01 | sends date params in request body when provided", async () => {
      await searchProperties({
        city: "Naples",
        state: "FL",
        lastSaleDateMin: "2025-03-11",
        lastSaleDateMax: "2026-03-10",
      });

      const fetchBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(fetchBody.last_sale_date_min).toBe("2025-03-11");
      expect(fetchBody.last_sale_date_max).toBe("2026-03-10");
    });

    it("CONN-DATE-02 | omits date params when not provided", async () => {
      await searchProperties({
        city: "Naples",
        state: "FL",
      });

      const fetchBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(fetchBody.last_sale_date_min).toBeUndefined();
      expect(fetchBody.last_sale_date_max).toBeUndefined();
    });

    it("CONN-DATE-03 | includes date params in cache key", async () => {
      await searchProperties({
        city: "Naples",
        state: "FL",
        lastSaleDateMin: "2025-03-11",
        lastSaleDateMax: "2026-03-10",
      });

      const cacheKeyCall = mockCacheBuildKey.mock.calls[0];
      const params = cacheKeyCall[2];
      expect(params.dateMin).toBe("2025-03-11");
      expect(params.dateMax).toBe("2026-03-10");
    });

    it("CONN-STA-03 | Regression: sends 2-letter state code in API body even when given full name", async () => {
      await searchProperties({
        city: "Palm Beach",
        state: "Florida",
        priceMin: 1000000,
      });

      const fetchBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(fetchBody.state).toBe("FL");
      expect(fetchBody.state).not.toBe("Florida");
    });
  });
});
