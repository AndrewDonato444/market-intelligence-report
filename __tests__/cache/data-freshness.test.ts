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
        key: "reapi:property-search:naples",
        source: "realestateapi",
        ttlSeconds: 86400,
        createdAt: new Date("2026-03-09T06:00:00Z"), // 6h ago
        expiresAt: new Date("2026-03-10T06:00:00Z"), // 18h from now
      };

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockEntry]),
          }),
        }),
      });

      const result = await checkFreshness("reapi:property-search:naples");

      expect(result.status).toBe("fresh");
      expect(result.ageSeconds).toBe(21600); // 6h
      expect(result.source).toBe("realestateapi");
    });

    it("returns 'stale' for expired entry", async () => {
      const mockEntry = {
        key: "reapi:property-detail:expired",
        source: "realestateapi",
        ttlSeconds: 86400,
        createdAt: new Date("2026-03-07T12:00:00Z"), // 48h ago
        expiresAt: new Date("2026-03-08T12:00:00Z"), // expired 24h ago
      };

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockEntry]),
          }),
        }),
      });

      const result = await checkFreshness("reapi:property-detail:expired");

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
        source: "realestateapi",
        ttlSeconds: 86400,
        createdAt: new Date("2026-03-09T06:00:00Z"),
        expiresAt: new Date("2026-03-10T06:00:00Z"),
      };

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn()
              .mockResolvedValueOnce([{ ...freshEntry, key: "reapi:property-search:naples" }])
              .mockResolvedValueOnce([{ ...freshEntry, key: "reapi:property-comps:naples" }]),
          }),
        }),
      });

      const result = await checkMultiple([
        "reapi:property-search:naples",
        "reapi:property-comps:naples",
      ]);

      expect(result.confidence).toBe("high");
      expect(result.freshCount).toBe(2);
      expect(result.staleCount).toBe(0);
      expect(result.missingCount).toBe(0);
    });

    it("returns 'medium' confidence when some data is stale", async () => {
      const freshEntry = {
        key: "reapi:property-search:naples",
        source: "realestateapi",
        ttlSeconds: 86400,
        createdAt: new Date("2026-03-09T06:00:00Z"),
        expiresAt: new Date("2026-03-10T06:00:00Z"),
      };
      const staleEntry = {
        key: "scrapingdog:local:naples",
        source: "scrapingdog",
        ttlSeconds: 604800,
        createdAt: new Date("2026-02-20T12:00:00Z"),
        expiresAt: new Date("2026-02-27T12:00:00Z"),
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
        "reapi:property-search:naples",
        "scrapingdog:local:naples",
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
        "reapi:property-search:naples",
        "scrapingdog:local:naples",
      ]);

      expect(result.confidence).toBe("low");
      expect(result.missingCount).toBe(2);
    });
  });

  describe("checkSourceFreshness", () => {
    it("checks all entries for a given source", async () => {
      const entries = [
        {
          key: "reapi:property-search:naples",
          source: "realestateapi",
          ttlSeconds: 86400,
          createdAt: new Date("2026-03-09T06:00:00Z"),
          expiresAt: new Date("2026-03-10T06:00:00Z"),
        },
        {
          key: "reapi:property-comps:naples",
          source: "realestateapi",
          ttlSeconds: 86400,
          createdAt: new Date("2026-03-09T08:00:00Z"),
          expiresAt: new Date("2026-03-10T08:00:00Z"),
        },
      ];

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(entries),
        }),
      });

      const result = await checkSourceFreshness("realestateapi");

      expect(result.entries).toHaveLength(2);
      expect(result.freshCount).toBe(2);
      expect(result.confidence).toBe("high");
    });
  });
});
