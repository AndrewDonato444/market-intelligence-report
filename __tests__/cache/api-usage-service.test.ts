import { db, schema } from "@/lib/db";

// Mock the database
jest.mock("@/lib/db", () => {
  const mockDb = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue([]),
    groupBy: jest.fn().mockReturnThis(),
  };
  return {
    db: mockDb,
    schema: {
      apiUsage: {
        userId: "user_id",
        reportId: "report_id",
        provider: "provider",
        endpoint: "endpoint",
        cost: "cost",
        tokensUsed: "tokens_used",
        responseTimeMs: "response_time_ms",
        statusCode: "status_code",
        cached: "cached",
        createdAt: "created_at",
      },
    },
  };
});

import * as apiUsageService from "@/lib/services/api-usage";

describe("API Usage Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("logApiCall", () => {
    it("inserts an api_usage record for an external call", async () => {
      const mockValues = jest.fn().mockResolvedValue(undefined);
      (db.insert as jest.Mock).mockReturnValue({
        values: mockValues,
      });

      await apiUsageService.logApiCall({
        userId: "user-uuid-1",
        provider: "realestateapi",
        endpoint: "/v2/PropertySearch",
        cost: 0.005,
        responseTimeMs: 340,
        statusCode: 200,
        cached: false,
      });

      expect(db.insert).toHaveBeenCalled();
      const passedValues = mockValues.mock.calls[0][0];
      expect(passedValues.provider).toBe("realestateapi");
      expect(passedValues.endpoint).toBe("/v2/PropertySearch");
      expect(passedValues.cached).toBe(0);
      expect(passedValues.cost).toBe("0.005");
    });

    it("logs cache hits with cost 0 and cached = 1", async () => {
      const mockValues = jest.fn().mockResolvedValue(undefined);
      (db.insert as jest.Mock).mockReturnValue({
        values: mockValues,
      });

      await apiUsageService.logApiCall({
        userId: "user-uuid-1",
        provider: "fred",
        endpoint: "/series/observations",
        cached: true,
      });

      const passedValues = mockValues.mock.calls[0][0];
      expect(passedValues.cached).toBe(1);
      expect(passedValues.cost).toBe("0");
    });

    it("includes optional reportId when provided", async () => {
      const mockValues = jest.fn().mockResolvedValue(undefined);
      (db.insert as jest.Mock).mockReturnValue({
        values: mockValues,
      });

      await apiUsageService.logApiCall({
        userId: "user-uuid-1",
        reportId: "report-uuid-1",
        provider: "realestateapi",
        endpoint: "/v2/PropertyDetail",
        cost: 0.01,
        responseTimeMs: 220,
        statusCode: 200,
        cached: false,
      });

      const passedValues = mockValues.mock.calls[0][0];
      expect(passedValues.reportId).toBe("report-uuid-1");
    });

    it("handles missing optional fields gracefully", async () => {
      const mockValues = jest.fn().mockResolvedValue(undefined);
      (db.insert as jest.Mock).mockReturnValue({
        values: mockValues,
      });

      await apiUsageService.logApiCall({
        userId: "user-uuid-1",
        provider: "scrapingdog",
        endpoint: "/scrape",
        cached: false,
      });

      const passedValues = mockValues.mock.calls[0][0];
      expect(passedValues.tokensUsed).toBeUndefined();
      expect(passedValues.responseTimeMs).toBeUndefined();
    });
  });

  describe("getUsageSummary", () => {
    it("returns aggregated usage by provider", async () => {
      const mockRows = [
        { provider: "realestateapi", totalCost: "0.250", callCount: 50, cacheHits: 35 },
        { provider: "fred", totalCost: "0.000", callCount: 20, cacheHits: 18 },
        { provider: "scrapingdog", totalCost: "0.100", callCount: 10, cacheHits: 5 },
      ];

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            groupBy: jest.fn().mockResolvedValue(mockRows),
          }),
        }),
      });

      const summary = await apiUsageService.getUsageSummary("user-uuid-1");

      expect(summary).toBeDefined();
      expect(summary.byProvider).toHaveLength(3);
      expect(summary.totalCost).toBeCloseTo(0.35);
      expect(summary.totalCalls).toBe(80);
      expect(summary.cacheHitRate).toBeCloseTo(72.5); // 58/80 = 72.5%
    });

    it("filters by date when since parameter is provided", async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            groupBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const since = new Date("2026-03-01T00:00:00Z");
      const summary = await apiUsageService.getUsageSummary("user-uuid-1", since);

      expect(summary.byProvider).toHaveLength(0);
      expect(summary.totalCost).toBe(0);
      expect(summary.totalCalls).toBe(0);
    });
  });
});
