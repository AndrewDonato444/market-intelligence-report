import { db, schema } from "@/lib/db";
import { eq, and, lt } from "drizzle-orm";

// Mock the database
jest.mock("@/lib/db", () => {
  const mockDb = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    onConflictDoUpdate: jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
  };
  return {
    db: mockDb,
    schema: {
      cache: {
        key: "key",
        source: "source",
        data: "data",
        ttlSeconds: "ttl_seconds",
        expiresAt: "expires_at",
        updatedAt: "updated_at",
        id: "id",
      },
      apiUsage: {},
    },
  };
});

// Import after mock
import * as cacheService from "@/lib/services/cache";

describe("Cache Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-03-09T12:00:00Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("get", () => {
    it("returns data for a valid, non-expired cache entry", async () => {
      const mockData = { rate: 6.5, date: "2026-03-09" };
      const mockEntry = {
        id: "uuid-1",
        key: "fred:mortgage-rate-30yr",
        source: "fred",
        data: mockData,
        ttlSeconds: 43200,
        expiresAt: new Date("2026-03-10T00:00:00Z"), // future
        createdAt: new Date("2026-03-09T00:00:00Z"),
        updatedAt: new Date("2026-03-09T00:00:00Z"),
      };

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockEntry]),
          }),
        }),
      });

      const result = await cacheService.get("fred:mortgage-rate-30yr");
      expect(result).toEqual(mockData);
    });

    it("returns null when no cache entry exists", async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await cacheService.get("reapi:property-search:naples-fl-6m");
      expect(result).toBeNull();
    });

    it("returns null for expired entries", async () => {
      const mockEntry = {
        id: "uuid-2",
        key: "fred:gdp-growth",
        source: "fred",
        data: { growth: 2.1 },
        ttlSeconds: 43200,
        expiresAt: new Date("2026-03-09T06:00:00Z"), // past
        createdAt: new Date("2026-03-08T18:00:00Z"),
        updatedAt: new Date("2026-03-08T18:00:00Z"),
      };

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockEntry]),
          }),
        }),
      });

      const result = await cacheService.get("fred:gdp-growth");
      expect(result).toBeNull();
    });
  });

  describe("set", () => {
    it("stores data with the correct TTL and expiration", async () => {
      const mockInsert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          onConflictDoUpdate: jest.fn().mockResolvedValue(undefined),
        }),
      });
      (db.insert as jest.Mock).mockImplementation(mockInsert);

      await cacheService.set(
        "fred:mortgage-rate-30yr",
        "fred",
        { rate: 6.5 }
      );

      expect(db.insert).toHaveBeenCalled();
    });

    it("uses default TTL for source when ttlSeconds not provided", async () => {
      const mockInsert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          onConflictDoUpdate: jest.fn().mockResolvedValue(undefined),
        }),
      });
      (db.insert as jest.Mock).mockImplementation(mockInsert);

      await cacheService.set(
        "fred:series:MORTGAGE30US",
        "fred",
        { value: 6.5 }
      );

      // Should use FRED's default TTL (43200s = 12h)
      const valuesCall = mockInsert.mock.results[0].value.values;
      expect(valuesCall).toHaveBeenCalled();
      const passedValues = valuesCall.mock.calls[0][0];
      expect(passedValues.ttlSeconds).toBe(43200);
    });

    it("upserts on duplicate key (does not create duplicates)", async () => {
      const mockOnConflict = jest.fn().mockResolvedValue(undefined);
      const mockInsert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          onConflictDoUpdate: mockOnConflict,
        }),
      });
      (db.insert as jest.Mock).mockImplementation(mockInsert);

      await cacheService.set(
        "fred:mortgage-rate-30yr",
        "fred",
        { rate: 7.0 }
      );

      expect(mockOnConflict).toHaveBeenCalled();
    });
  });

  describe("delete", () => {
    it("removes a cache entry by key", async () => {
      const mockWhere = jest.fn().mockResolvedValue(undefined);
      (db.delete as jest.Mock).mockReturnValue({
        where: mockWhere,
      });

      await cacheService.del("reapi:property-detail:12345");

      expect(db.delete).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalled();
    });
  });

  describe("deleteBySource", () => {
    it("removes all entries for a given source", async () => {
      const mockWhere = jest.fn().mockResolvedValue(undefined);
      (db.delete as jest.Mock).mockReturnValue({
        where: mockWhere,
      });

      await cacheService.deleteBySource("scrapingdog");

      expect(db.delete).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalled();
    });
  });

  describe("cleanup", () => {
    it("deletes all expired entries", async () => {
      const mockWhere = jest.fn().mockResolvedValue(undefined);
      (db.delete as jest.Mock).mockReturnValue({
        where: mockWhere,
      });

      await cacheService.cleanup();

      expect(db.delete).toHaveBeenCalled();
    });
  });

  describe("buildKey", () => {
    it("produces deterministic keys for same params", () => {
      const key1 = cacheService.buildKey("realestateapi", "property-search", {
        city: "Naples",
        state: "FL",
        priceFloor: 6000000,
      });
      const key2 = cacheService.buildKey("realestateapi", "property-search", {
        city: "Naples",
        state: "FL",
        priceFloor: 6000000,
      });
      expect(key1).toBe(key2);
    });

    it("produces different keys for different params", () => {
      const key1 = cacheService.buildKey("realestateapi", "property-search", {
        city: "Naples",
        state: "FL",
      });
      const key2 = cacheService.buildKey("realestateapi", "property-search", {
        city: "Miami",
        state: "FL",
      });
      expect(key1).not.toBe(key2);
    });

    it("includes source prefix in key", () => {
      const key = cacheService.buildKey("fred", "series", {
        id: "MORTGAGE30US",
      });
      expect(key).toMatch(/^fred:/);
    });

    it("is order-independent for params", () => {
      const key1 = cacheService.buildKey("reapi", "search", {
        city: "Naples",
        state: "FL",
      });
      const key2 = cacheService.buildKey("reapi", "search", {
        state: "FL",
        city: "Naples",
      });
      expect(key1).toBe(key2);
    });
  });

  describe("TTL defaults", () => {
    it("exports TTL constants by source", () => {
      expect(cacheService.SOURCE_TTLS.fred).toBe(43200); // 12h
      expect(cacheService.SOURCE_TTLS.realestateapi).toBe(86400); // 24h
      expect(cacheService.SOURCE_TTLS.scrapingdog).toBe(604800); // 7d
      expect(cacheService.SOURCE_TTLS.anthropic).toBe(0); // never
    });
  });
});
