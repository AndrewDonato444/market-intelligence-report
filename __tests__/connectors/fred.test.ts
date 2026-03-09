jest.mock("@/lib/db", () => ({
  db: {},
  schema: { cache: {}, apiUsage: {} },
}));
jest.mock("@/lib/services/cache");
jest.mock("@/lib/services/api-usage");
jest.mock("@/lib/config/env", () => ({
  env: { FRED_API_KEY: "test-fred-key" },
}));

import { fetchSeries, fetchMultipleSeries, FRED_SERIES } from "@/lib/connectors/fred";
import * as cacheModule from "@/lib/services/cache";
import * as apiUsageModule from "@/lib/services/api-usage";

const mockCacheGet = cacheModule.get as jest.MockedFunction<typeof cacheModule.get>;
const mockCacheSet = cacheModule.set as jest.MockedFunction<typeof cacheModule.set>;
const mockCacheBuildKey = cacheModule.buildKey as jest.MockedFunction<typeof cacheModule.buildKey>;
const mockLogApiCall = apiUsageModule.logApiCall as jest.MockedFunction<typeof apiUsageModule.logApiCall>;

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("FRED API Connector", () => {
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
  });

  describe("FRED_SERIES constants", () => {
    it("exports key series IDs for luxury real estate", () => {
      expect(FRED_SERIES.MORTGAGE_30YR).toBe("MORTGAGE30US");
      expect(FRED_SERIES.MORTGAGE_15YR).toBe("MORTGAGE15US");
      expect(FRED_SERIES.CASE_SHILLER_NATIONAL).toBe("CSUSHPINSA");
      expect(FRED_SERIES.MEDIAN_SALES_PRICE).toBe("MSPUS");
      expect(FRED_SERIES.HOUSING_STARTS).toBe("HOUST");
      expect(FRED_SERIES.UNEMPLOYMENT_RATE).toBe("UNRATE");
      expect(FRED_SERIES.CPI).toBe("CPIAUCSL");
      expect(FRED_SERIES.GDP).toBe("GDP");
      expect(FRED_SERIES.FED_FUNDS_RATE).toBe("DFF");
    });
  });

  describe("fetchSeries", () => {
    const mockFredResponse = {
      realtime_start: "2026-03-09",
      realtime_end: "2026-03-09",
      observation_start: "2025-03-09",
      observation_end: "2026-03-09",
      units: "lin",
      count: 3,
      observations: [
        { realtime_start: "2026-03-09", realtime_end: "2026-03-09", date: "2026-01-01", value: "6.50" },
        { realtime_start: "2026-03-09", realtime_end: "2026-03-09", date: "2026-02-01", value: "6.45" },
        { realtime_start: "2026-03-09", realtime_end: "2026-03-09", date: "2026-03-01", value: "6.40" },
      ],
    };

    it("returns parsed observations from FRED API on cache miss", async () => {
      mockCacheGet.mockResolvedValue(null);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockFredResponse),
      });

      const result = await fetchSeries("MORTGAGE30US");

      expect(result.seriesId).toBe("MORTGAGE30US");
      expect(result.observations).toHaveLength(3);
      expect(result.observations[0]).toEqual({ date: "2026-01-01", value: 6.5 });
      expect(result.observations[2]).toEqual({ date: "2026-03-01", value: 6.4 });
      expect(result.stale).toBe(false);
    });

    it("checks cache before calling API", async () => {
      const cachedData = {
        seriesId: "MORTGAGE30US",
        observations: [{ date: "2026-03-01", value: 6.4 }],
      };
      mockCacheGet.mockResolvedValue(cachedData);

      const result = await fetchSeries("MORTGAGE30US");

      expect(mockCacheGet).toHaveBeenCalled();
      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.observations).toEqual(cachedData.observations);
      expect(result.stale).toBe(false);
    });

    it("stores API response in cache after fetch", async () => {
      mockCacheGet.mockResolvedValue(null);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockFredResponse),
      });

      await fetchSeries("MORTGAGE30US");

      expect(mockCacheSet).toHaveBeenCalledWith(
        expect.any(String),
        "fred",
        expect.objectContaining({ seriesId: "MORTGAGE30US" })
      );
    });

    it("logs API call on cache miss", async () => {
      mockCacheGet.mockResolvedValue(null);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockFredResponse),
      });

      await fetchSeries("MORTGAGE30US", { userId: "user-1" });

      expect(mockLogApiCall).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: "fred",
          endpoint: expect.stringContaining("MORTGAGE30US"),
          cached: false,
          userId: "user-1",
        })
      );
    });

    it("logs cache hit with cost 0", async () => {
      mockCacheGet.mockResolvedValue({
        seriesId: "MORTGAGE30US",
        observations: [{ date: "2026-03-01", value: 6.4 }],
      });

      await fetchSeries("MORTGAGE30US", { userId: "user-1" });

      expect(mockLogApiCall).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: "fred",
          cached: true,
          userId: "user-1",
        })
      );
    });

    it("passes date range parameters to FRED API", async () => {
      mockCacheGet.mockResolvedValue(null);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockFredResponse),
      });

      await fetchSeries("MORTGAGE30US", {
        start: "2025-01-01",
        end: "2026-03-09",
      });

      const fetchUrl = mockFetch.mock.calls[0][0];
      expect(fetchUrl).toContain("observation_start=2025-01-01");
      expect(fetchUrl).toContain("observation_end=2026-03-09");
    });

    it("handles FRED values of '.' as null", async () => {
      const responseWithDots = {
        ...mockFredResponse,
        observations: [
          { realtime_start: "2026-03-09", realtime_end: "2026-03-09", date: "2026-01-01", value: "." },
          { realtime_start: "2026-03-09", realtime_end: "2026-03-09", date: "2026-02-01", value: "6.45" },
        ],
      };
      mockCacheGet.mockResolvedValue(null);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(responseWithDots),
      });

      const result = await fetchSeries("MORTGAGE30US");

      expect(result.observations[0].value).toBeNull();
      expect(result.observations[1].value).toBe(6.45);
    });

    it("throws typed error on API failure", async () => {
      mockCacheGet.mockResolvedValue(null);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
      });

      await expect(fetchSeries("MORTGAGE30US", { userId: "user-1" })).rejects.toThrow(
        /FRED API error/
      );

      expect(mockLogApiCall).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 429,
          cached: false,
        })
      );
    });

    it("returns stale cached data when API fails and expired cache exists", async () => {
      // First call: cache miss
      mockCacheGet
        .mockResolvedValueOnce(null) // fresh cache check
        .mockResolvedValueOnce({     // stale fallback check
          seriesId: "MORTGAGE30US",
          observations: [{ date: "2026-02-01", value: 6.45 }],
        });

      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      const result = await fetchSeries("MORTGAGE30US", { userId: "user-1" });

      expect(result.stale).toBe(true);
      expect(result.observations[0].value).toBe(6.45);
    });
  });

  describe("fetchMultipleSeries", () => {
    it("fetches multiple series in parallel", async () => {
      const mockResponse = (seriesId: string, value: string) => ({
        realtime_start: "2026-03-09",
        realtime_end: "2026-03-09",
        observation_start: "2025-03-09",
        observation_end: "2026-03-09",
        units: "lin",
        count: 1,
        observations: [
          { realtime_start: "2026-03-09", realtime_end: "2026-03-09", date: "2026-03-01", value },
        ],
      });

      mockCacheGet.mockResolvedValue(null);
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse("MORTGAGE30US", "6.40")),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse("UNRATE", "3.80")),
        });

      const results = await fetchMultipleSeries(["MORTGAGE30US", "UNRATE"]);

      expect(results).toHaveLength(2);
      expect(results[0].seriesId).toBe("MORTGAGE30US");
      expect(results[1].seriesId).toBe("UNRATE");
    });

    it("returns results even if some series fail", async () => {
      mockCacheGet.mockResolvedValue(null);
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              realtime_start: "2026-03-09",
              realtime_end: "2026-03-09",
              observation_start: "2025-03-09",
              observation_end: "2026-03-09",
              units: "lin",
              count: 1,
              observations: [
                { realtime_start: "2026-03-09", realtime_end: "2026-03-09", date: "2026-03-01", value: "6.40" },
              ],
            }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
        });

      const results = await fetchMultipleSeries(["MORTGAGE30US", "BAD_SERIES"]);

      // Should have at least the successful one
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.find((r) => r.seriesId === "MORTGAGE30US")).toBeDefined();
    });
  });
});
