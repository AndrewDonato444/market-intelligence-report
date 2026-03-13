jest.mock("@/lib/db", () => ({
  db: {},
  schema: { cache: {}, apiUsage: {} },
}));
jest.mock("@/lib/services/cache");
jest.mock("@/lib/services/api-usage");

// XAI_API_KEY must be set BEFORE the module is imported for most tests.
// We control it per-test via process.env manipulation + dynamic imports for the "no key" case.
const ORIGINAL_ENV = process.env;

import * as cacheModule from "@/lib/services/cache";
import * as apiUsageModule from "@/lib/services/api-usage";

const mockCacheGet = cacheModule.get as jest.MockedFunction<typeof cacheModule.get>;
const mockCacheSet = cacheModule.set as jest.MockedFunction<typeof cacheModule.set>;
const mockCacheBuildKey = cacheModule.buildKey as jest.MockedFunction<typeof cacheModule.buildKey>;
const mockLogApiCall = apiUsageModule.logApiCall as jest.MockedFunction<typeof apiUsageModule.logApiCall>;

const mockFetch = jest.fn();
global.fetch = mockFetch;

// Standard mock Grok response matching xAI Responses API structure
const mockGrokApiResponse = {
  output: [
    {
      type: "message",
      content: [
        {
          type: "output_text",
          text: JSON.stringify({
            summary: "Palm Beach luxury market sentiment is strongly positive on X.",
            bullThemes: [
              "strong buyer demand from Northeast relocators",
              "inventory tightening in waterfront segment",
              "record sales prices in Q1",
            ],
            bearSignals: [
              "insurance costs rising sharply",
              "some agents noting longer days-on-market",
            ],
            notableQuotes: [
              {
                text: "Palm Beach waterfront under $5M is essentially gone",
                attribution: "@LuxuryBrokerPB",
              },
            ],
            sentiment: "positive",
          }),
        },
      ],
    },
  ],
};

describe("Grok x_search Connector", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...ORIGINAL_ENV, XAI_API_KEY: "test-xai-key" };
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

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  describe("searchXSentiment", () => {
    it("returns null when XAI_API_KEY is not set", async () => {
      delete process.env.XAI_API_KEY;
      const { searchXSentiment } = await import("@/lib/connectors/grok");
      const result = await searchXSentiment({ city: "Palm Beach", state: "FL" });

      expect(result).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockCacheGet).not.toHaveBeenCalled();
    });

    it("returns cached data on cache hit", async () => {
      const { searchXSentiment } = await import("@/lib/connectors/grok");
      const cachedData = {
        summary: "Cached sentiment",
        bullThemes: ["cached bull"],
        bearSignals: [],
        notableQuotes: [],
        sentiment: "positive",
        query: "Palm Beach, FL luxury real estate",
      };
      mockCacheGet.mockResolvedValue(cachedData);

      const result = await searchXSentiment({ city: "Palm Beach", state: "FL" });

      expect(result).not.toBeNull();
      expect(result!.summary).toBe("Cached sentiment");
      expect(result!.stale).toBe(false);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("calls xAI API on cache miss and returns parsed result", async () => {
      const { searchXSentiment } = await import("@/lib/connectors/grok");
      mockCacheGet.mockResolvedValue(null);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockGrokApiResponse),
      });

      const result = await searchXSentiment({ city: "Palm Beach", state: "FL" });

      expect(result).not.toBeNull();
      expect(result!.summary).toContain("Palm Beach");
      expect(result!.bullThemes).toHaveLength(3);
      expect(result!.bearSignals).toHaveLength(2);
      expect(result!.notableQuotes).toHaveLength(1);
      expect(result!.sentiment).toBe("positive");
      expect(result!.stale).toBe(false);
    });

    it("sends correct API payload with x_search tool", async () => {
      const { searchXSentiment } = await import("@/lib/connectors/grok");
      mockCacheGet.mockResolvedValue(null);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockGrokApiResponse),
      });

      await searchXSentiment({ city: "Palm Beach", state: "FL" });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.x.ai/v1/responses",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-xai-key",
            "Content-Type": "application/json",
          }),
        })
      );

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.model).toBe("grok-4");
      expect(body.tools).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: "x_search" }),
        ])
      );
    });

    it("writes both normal cache and stale fallback copy", async () => {
      const { searchXSentiment } = await import("@/lib/connectors/grok");
      mockCacheGet.mockResolvedValue(null);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockGrokApiResponse),
      });

      await searchXSentiment({ city: "Palm Beach", state: "FL" });

      const setCalls = mockCacheSet.mock.calls;
      const normalWrite = setCalls.find(
        (c: unknown[]) => typeof c[0] === "string" && !String(c[0]).endsWith(":stale")
      );
      const staleWrite = setCalls.find(
        (c: unknown[]) => typeof c[0] === "string" && String(c[0]).endsWith(":stale")
      );

      expect(normalWrite).toBeDefined();
      expect(staleWrite).toBeDefined();
      // Stale copy has 14-day TTL
      expect(staleWrite![3]).toBe(1209600);
    });

    it("returns stale data on API failure when stale cache exists", async () => {
      const { searchXSentiment } = await import("@/lib/connectors/grok");
      mockCacheGet
        .mockResolvedValueOnce(null) // normal cache miss
        .mockResolvedValueOnce({     // stale cache hit
          summary: "Stale sentiment data",
          bullThemes: ["old bull"],
          bearSignals: [],
          notableQuotes: [],
          sentiment: "mixed",
          query: "Palm Beach, FL luxury real estate",
        });

      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve("Internal Server Error"),
      });

      const result = await searchXSentiment({ city: "Palm Beach", state: "FL" });

      expect(result).not.toBeNull();
      expect(result!.summary).toBe("Stale sentiment data");
      expect(result!.stale).toBe(true);
    });

    it("returns null on API failure with no stale cache", async () => {
      const { searchXSentiment } = await import("@/lib/connectors/grok");
      mockCacheGet.mockResolvedValue(null); // both normal and stale miss

      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve("Unauthorized"),
      });

      const result = await searchXSentiment({ city: "Palm Beach", state: "FL" });

      expect(result).toBeNull();
    });

    it("logs API call on cache miss with userId", async () => {
      const { searchXSentiment } = await import("@/lib/connectors/grok");
      mockCacheGet.mockResolvedValue(null);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockGrokApiResponse),
      });

      await searchXSentiment({ city: "Palm Beach", state: "FL" }, { userId: "user-1" });

      expect(mockLogApiCall).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: "grok",
          endpoint: "/v1/responses",
          cached: false,
          statusCode: 200,
        })
      );
    });

    it("handles response with markdown code fences", async () => {
      const { searchXSentiment } = await import("@/lib/connectors/grok");
      mockCacheGet.mockResolvedValue(null);

      const responseWithFences = {
        output: [
          {
            type: "message",
            content: [
              {
                type: "output_text",
                text: '```json\n{"summary":"fenced","bullThemes":[],"bearSignals":[],"notableQuotes":[],"sentiment":"neutral"}\n```',
              },
            ],
          },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(responseWithFences),
      });

      const result = await searchXSentiment({ city: "Naples", state: "FL" });

      expect(result).not.toBeNull();
      expect(result!.summary).toBe("fenced");
    });

    it("returns null on unparseable JSON response", async () => {
      const { searchXSentiment } = await import("@/lib/connectors/grok");
      mockCacheGet.mockResolvedValue(null);

      const badResponse = {
        output: [
          {
            type: "message",
            content: [
              {
                type: "output_text",
                text: "This is not JSON at all",
              },
            ],
          },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(badResponse),
      });

      const result = await searchXSentiment({ city: "Naples", state: "FL" });

      // Should fall through to null (no stale cache)
      expect(result).toBeNull();
    });
  });

  describe("buildXSentimentQuery", () => {
    it("builds a query mentioning the market geography", () => {
      const { buildXSentimentQuery } = require("@/lib/connectors/grok");
      const query = buildXSentimentQuery({ city: "Palm Beach", state: "FL" });

      expect(query).toContain("Palm Beach");
      expect(query).toContain("FL");
      expect(query).toContain("luxury real estate");
      expect(query).toContain("JSON");
    });

    it("requests specific XSentimentBrief fields", () => {
      const { buildXSentimentQuery } = require("@/lib/connectors/grok");
      const query = buildXSentimentQuery({ city: "Naples", state: "FL" });

      expect(query).toContain("bullThemes");
      expect(query).toContain("bearSignals");
      expect(query).toContain("notableQuotes");
      expect(query).toContain("sentiment");
    });
  });
});
