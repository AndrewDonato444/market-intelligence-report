// Mock DB to avoid connection
jest.mock("@/lib/db", () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue([]),
  },
  schema: {
    cache: {
      key: "key",
      source: "source",
      expiresAt: "expires_at",
      createdAt: "created_at",
      ttlSeconds: "ttl_seconds",
    },
  },
}));

import { db } from "@/lib/db";
import {
  checkFreshness,
  checkMultiple,
  checkSourceFreshness,
} from "@/lib/services/data-freshness";

describe("Data Freshness Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-03-09T12:00:00Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("checkFreshness", () => {
    it("returns 'fresh' for non-expired entry", async () => {
      const mockEntry = {
        key: "fred:series:MORTGAGE30US",
        source: "fred",
        ttlSeconds: 43200,
        createdAt: new Date("2026-03-09T06:00:00Z"), // 6h ago
        expiresAt: new Date("2026-03-09T18:00:00Z"), // 6h from now
      };

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockEntry]),
          }),
        }),
      });

      const result = await checkFreshness("fred:series:MORTGAGE30US");

      expect(result.status).toBe("fresh");
      expect(result.ageSeconds).toBe(21600); // 6h
      expect(result.ttlRemainingSeconds).toBe(21600); // 6h
      expect(result.source).toBe("fred");
    });

    it("returns 'stale' for expired entry", async () => {
      const mockEntry = {
        key: "fred:series:GDP",
        source: "fred",
        ttlSeconds: 43200,
        createdAt: new Date("2026-03-08T12:00:00Z"), // 24h ago
        expiresAt: new Date("2026-03-09T00:00:00Z"), // expired 12h ago
      };

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockEntry]),
          }),
        }),
      });

      const result = await checkFreshness("fred:series:GDP");

      expect(result.status).toBe("stale");
      expect(result.ttlRemainingSeconds).toBeLessThan(0);
    });

    it("returns 'missing' when no entry exists", async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await checkFreshness("reapi:property-search:missing");

      expect(result.status).toBe("missing");
      expect(result.ageSeconds).toBeNull();
      expect(result.cachedAt).toBeNull();
    });
  });

  describe("checkMultiple", () => {
    it("returns 'high' confidence when all entries are fresh", async () => {
      const freshEntry = {
        source: "fred",
        ttlSeconds: 43200,
        createdAt: new Date("2026-03-09T06:00:00Z"),
        expiresAt: new Date("2026-03-09T18:00:00Z"),
      };

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn()
              .mockResolvedValueOnce([{ ...freshEntry, key: "fred:series:MORTGAGE30US" }])
              .mockResolvedValueOnce([{ ...freshEntry, key: "fred:series:UNRATE", source: "fred" }]),
          }),
        }),
      });

      const result = await checkMultiple([
        "fred:series:MORTGAGE30US",
        "fred:series:UNRATE",
      ]);

      expect(result.confidence).toBe("high");
      expect(result.freshCount).toBe(2);
      expect(result.staleCount).toBe(0);
      expect(result.missingCount).toBe(0);
    });

    it("returns 'medium' confidence when some data is stale", async () => {
      const freshEntry = {
        key: "fred:series:MORTGAGE30US",
        source: "fred",
        ttlSeconds: 43200,
        createdAt: new Date("2026-03-09T06:00:00Z"),
        expiresAt: new Date("2026-03-09T18:00:00Z"),
      };
      const staleEntry = {
        key: "reapi:property-search:naples",
        source: "realestateapi",
        ttlSeconds: 86400,
        createdAt: new Date("2026-03-07T12:00:00Z"),
        expiresAt: new Date("2026-03-08T12:00:00Z"),
      };

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn()
              .mockResolvedValueOnce([freshEntry])
              .mockResolvedValueOnce([staleEntry]),
          }),
        }),
      });

      const result = await checkMultiple([
        "fred:series:MORTGAGE30US",
        "reapi:property-search:naples",
      ]);

      expect(result.confidence).toBe("medium");
      expect(result.freshCount).toBe(1);
      expect(result.staleCount).toBe(1);
    });

    it("returns 'low' confidence when data is missing", async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await checkMultiple([
        "fred:series:MORTGAGE30US",
        "reapi:property-search:naples",
      ]);

      expect(result.confidence).toBe("low");
      expect(result.missingCount).toBe(2);
    });
  });

  describe("checkSourceFreshness", () => {
    it("checks all entries for a given source", async () => {
      const entries = [
        {
          key: "fred:series:MORTGAGE30US",
          source: "fred",
          ttlSeconds: 43200,
          createdAt: new Date("2026-03-09T06:00:00Z"),
          expiresAt: new Date("2026-03-09T18:00:00Z"),
        },
        {
          key: "fred:series:UNRATE",
          source: "fred",
          ttlSeconds: 43200,
          createdAt: new Date("2026-03-09T08:00:00Z"),
          expiresAt: new Date("2026-03-09T20:00:00Z"),
        },
      ];

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(entries),
        }),
      });

      const result = await checkSourceFreshness("fred");

      expect(result.entries).toHaveLength(2);
      expect(result.freshCount).toBe(2);
      expect(result.confidence).toBe("high");
    });
  });
});
