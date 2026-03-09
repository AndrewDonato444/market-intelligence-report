jest.mock("@/lib/db", () => ({
  db: {},
  schema: { cache: {}, apiUsage: {} },
}));
jest.mock("@/lib/services/cache");
jest.mock("@/lib/services/api-usage");
jest.mock("@/lib/config/env", () => ({
  env: { SCRAPINGDOG_API_KEY: "test-sd-key" },
}));

import { searchLocal, scrapeUrl, buildLocalQuery } from "@/lib/connectors/scrapingdog";
import * as cacheModule from "@/lib/services/cache";
import * as apiUsageModule from "@/lib/services/api-usage";

const mockCacheGet = cacheModule.get as jest.MockedFunction<typeof cacheModule.get>;
const mockCacheSet = cacheModule.set as jest.MockedFunction<typeof cacheModule.set>;
const mockCacheBuildKey = cacheModule.buildKey as jest.MockedFunction<typeof cacheModule.buildKey>;
const mockLogApiCall = apiUsageModule.logApiCall as jest.MockedFunction<typeof apiUsageModule.logApiCall>;

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("ScrapingDog Connector", () => {
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

  describe("searchLocal", () => {
    const mockLocalResponse = {
      local_results: [
        {
          title: "The French Brasserie",
          type: "French Restaurant",
          rating: 4.7,
          reviews: 342,
          address: "123 5th Ave S, Naples, FL",
        },
        {
          title: "Ocean Prime",
          type: "Seafood Restaurant",
          rating: 4.5,
          reviews: 891,
          address: "456 Gulf Shore Blvd, Naples, FL",
        },
      ],
    };

    it("returns parsed local business results on cache miss", async () => {
      mockCacheGet.mockResolvedValue(null);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockLocalResponse),
      });

      const result = await searchLocal("luxury restaurants Naples", "Naples, FL");

      expect(result.businesses).toHaveLength(2);
      expect(result.businesses[0].name).toBe("The French Brasserie");
      expect(result.businesses[0].rating).toBe(4.7);
      expect(result.businesses[0].reviewCount).toBe(342);
      expect(result.stale).toBe(false);
    });

    it("checks cache before calling API", async () => {
      mockCacheGet.mockResolvedValue({
        businesses: [{ name: "The French Brasserie", category: "French Restaurant" }],
        query: "luxury restaurants Naples",
      });

      const result = await searchLocal("luxury restaurants Naples", "Naples, FL");

      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.businesses).toHaveLength(1);
      expect(result.stale).toBe(false);
    });

    it("passes correct API key and query params", async () => {
      mockCacheGet.mockResolvedValue(null);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockLocalResponse),
      });

      await searchLocal("luxury restaurants Naples", "Naples, FL");

      const fetchUrl = mockFetch.mock.calls[0][0];
      expect(fetchUrl).toContain("api_key=test-sd-key");
      expect(fetchUrl).toContain("query=luxury+restaurants+Naples");
    });

    it("stores result in cache after fetch", async () => {
      mockCacheGet.mockResolvedValue(null);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockLocalResponse),
      });

      await searchLocal("luxury restaurants Naples", "Naples, FL");

      expect(mockCacheSet).toHaveBeenCalledWith(
        expect.any(String),
        "scrapingdog",
        expect.objectContaining({ businesses: expect.any(Array) })
      );
    });

    it("logs API call on cache miss", async () => {
      mockCacheGet.mockResolvedValue(null);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockLocalResponse),
      });

      await searchLocal("luxury restaurants Naples", "Naples, FL", { userId: "user-1" });

      expect(mockLogApiCall).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: "scrapingdog",
          endpoint: "/google_local",
          cached: false,
        })
      );
    });

    it("throws on API error", async () => {
      mockCacheGet.mockResolvedValue(null);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        statusText: "Forbidden",
      });

      await expect(
        searchLocal("luxury restaurants Naples", "Naples, FL", { userId: "user-1" })
      ).rejects.toThrow(/ScrapingDog error/);
    });

    it("returns stale data on API failure when expired cache exists", async () => {
      mockCacheGet
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          businesses: [{ name: "Stale Restaurant" }],
          query: "luxury restaurants Naples",
        });

      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      const result = await searchLocal("luxury restaurants Naples", "Naples, FL", {
        userId: "user-1",
      });

      expect(result.stale).toBe(true);
    });
  });

  describe("scrapeUrl", () => {
    it("returns HTML content on cache miss", async () => {
      mockCacheGet.mockResolvedValue(null);
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve("<html><body>Naples neighborhood info</body></html>"),
      });

      const result = await scrapeUrl("https://example.com/naples-neighborhood");

      expect(result.html).toContain("Naples neighborhood info");
      expect(result.url).toBe("https://example.com/naples-neighborhood");
      expect(result.stale).toBe(false);
    });

    it("checks cache before scraping", async () => {
      mockCacheGet.mockResolvedValue({
        html: "<html>cached</html>",
        url: "https://example.com/naples",
      });

      const result = await scrapeUrl("https://example.com/naples");

      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.html).toContain("cached");
    });
  });

  describe("buildLocalQuery", () => {
    it("builds query from category and market", () => {
      const query = buildLocalQuery("luxury restaurants", { city: "Naples", state: "FL" });
      expect(query).toBe("luxury restaurants Naples FL");
    });

    it("handles different categories", () => {
      const query = buildLocalQuery("golf country club", { city: "Miami Beach", state: "FL" });
      expect(query).toBe("golf country club Miami Beach FL");
    });
  });
});
