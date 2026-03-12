/**
 * Usage Tracking Service Tests
 *
 * Tests for lib/services/usage-tracking.ts:
 * - Period resolution (monthly vs cumulative)
 * - incrementUsage behavior (creates new record, updates existing)
 * - getCurrentUsage behavior (monthly, cumulative, no record)
 * - getUsageForPeriod behavior
 * - Graceful degradation on DB errors
 * - Service function exports
 *
 * Spec: .specs/features/subscription/usage-tracking.feature.md
 */

import {
  getEntitlementPeriod,
  incrementUsage,
  getCurrentUsage,
  getUsageForPeriod,
} from "@/lib/services/usage-tracking";

// Mock the database module
jest.mock("@/lib/db", () => {
  const mockInsert = jest.fn();
  const mockSelect = jest.fn();
  const mockFrom = jest.fn();
  const mockWhere = jest.fn();
  const mockLimit = jest.fn();
  const mockValues = jest.fn();
  const mockOnConflictDoUpdate = jest.fn();

  // Chain: db.insert(table).values({}).onConflictDoUpdate({})
  mockInsert.mockReturnValue({ values: mockValues });
  mockValues.mockReturnValue({ onConflictDoUpdate: mockOnConflictDoUpdate });
  mockOnConflictDoUpdate.mockResolvedValue(undefined);

  // Chain: db.select({}).from(table).where(cond).limit(n)
  mockSelect.mockReturnValue({ from: mockFrom });
  mockFrom.mockReturnValue({ where: mockWhere });
  mockWhere.mockReturnValue({ limit: mockLimit });
  mockLimit.mockResolvedValue([]);

  return {
    db: {
      insert: mockInsert,
      select: mockSelect,
    },
    schema: {
      usageRecords: {
        userId: { name: "user_id" },
        entitlementType: { name: "entitlement_type" },
        periodStart: { name: "period_start" },
        periodEnd: { name: "period_end" },
        count: { name: "count" },
      },
    },
  };
});

// Access the mocks
const { db } = jest.requireMock("@/lib/db") as {
  db: {
    insert: jest.Mock;
    select: jest.Mock;
  };
};

beforeEach(() => {
  jest.clearAllMocks();
  // Reset mock chains
  const mockValues = jest.fn();
  const mockOnConflictDoUpdate = jest.fn();
  mockValues.mockReturnValue({ onConflictDoUpdate: mockOnConflictDoUpdate });
  mockOnConflictDoUpdate.mockResolvedValue(undefined);
  db.insert.mockReturnValue({ values: mockValues });

  const mockFrom = jest.fn();
  const mockWhere = jest.fn();
  const mockLimit = jest.fn();
  mockFrom.mockReturnValue({ where: mockWhere });
  mockWhere.mockReturnValue({ limit: mockLimit });
  mockLimit.mockResolvedValue([]);
  db.select.mockReturnValue({ from: mockFrom });
});

// ============================================================
// SECTION 1: Period Resolution
// ============================================================

describe("Usage Tracking — Period Resolution", () => {
  describe("monthly entitlements use calendar month periods", () => {
    it("reports_per_month: periodStart is 1st of current month UTC", () => {
      const { periodStart } = getEntitlementPeriod("reports_per_month");
      const now = new Date();
      const expected = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
      );
      expect(periodStart.getTime()).toBe(expected.getTime());
    });

    it("reports_per_month: periodEnd is 1st of next month UTC", () => {
      const { periodEnd } = getEntitlementPeriod("reports_per_month");
      const now = new Date();
      const expected = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)
      );
      expect(periodEnd!.getTime()).toBe(expected.getTime());
    });

    it("social_media_kits uses monthly period", () => {
      const { periodStart, periodEnd } =
        getEntitlementPeriod("social_media_kits");
      const now = new Date();
      expect(periodStart.getUTCDate()).toBe(1);
      expect(periodEnd).not.toBeNull();
      expect(periodEnd!.getUTCDate()).toBe(1);
    });
  });

  describe("cumulative entitlements use null periodEnd", () => {
    it("markets_created: periodStart is fixed epoch (2024-01-01T00:00:00Z)", () => {
      const { periodStart } = getEntitlementPeriod("markets_created");
      expect(periodStart.toISOString()).toBe("2024-01-01T00:00:00.000Z");
    });

    it("markets_created: periodEnd is null (no reset)", () => {
      const { periodEnd } = getEntitlementPeriod("markets_created");
      expect(periodEnd).toBeNull();
    });
  });

  describe("unknown entitlement types default to monthly", () => {
    it("unknown type gets monthly period", () => {
      const { periodStart, periodEnd } =
        getEntitlementPeriod("some_future_type");
      expect(periodStart.getUTCDate()).toBe(1);
      expect(periodEnd).not.toBeNull();
    });
  });
});

// ============================================================
// SECTION 2: incrementUsage
// ============================================================

describe("Usage Tracking — incrementUsage", () => {
  it("calls db.insert with correct values for monthly entitlement", async () => {
    await incrementUsage("user-123", "reports_per_month");
    expect(db.insert).toHaveBeenCalled();

    const valuesCall = db.insert.mock.results[0].value.values;
    expect(valuesCall).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-123",
        entitlementType: "reports_per_month",
        count: 1,
      })
    );
  });

  it("calls db.insert with correct values for cumulative entitlement", async () => {
    await incrementUsage("user-123", "markets_created");
    expect(db.insert).toHaveBeenCalled();

    const valuesCall = db.insert.mock.results[0].value.values;
    expect(valuesCall).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-123",
        entitlementType: "markets_created",
        periodEnd: null,
        count: 1,
      })
    );
  });

  it("uses onConflictDoUpdate for atomic upsert", async () => {
    await incrementUsage("user-123", "reports_per_month");

    const valuesResult = db.insert.mock.results[0].value.values;
    const onConflict = valuesResult.mock.results[0].value.onConflictDoUpdate;
    expect(onConflict).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.any(Array),
        set: expect.any(Object),
      })
    );
  });

  it("does not throw on DB error (graceful degradation)", async () => {
    db.insert.mockImplementationOnce(() => {
      throw new Error("DB unavailable");
    });

    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    await expect(
      incrementUsage("user-123", "reports_per_month")
    ).resolves.toBeUndefined();
    consoleSpy.mockRestore();
  });
});

// ============================================================
// SECTION 3: getCurrentUsage
// ============================================================

describe("Usage Tracking — getCurrentUsage", () => {
  it("returns 0 when no record exists for monthly entitlement", async () => {
    const result = await getCurrentUsage("user-123", "reports_per_month");
    expect(result).toBe(0);
  });

  it("returns 0 when no record exists for cumulative entitlement", async () => {
    const result = await getCurrentUsage("user-123", "markets_created");
    expect(result).toBe(0);
  });

  it("returns count when record exists for monthly entitlement", async () => {
    // Setup mock to return a record
    const mockLimit = jest.fn().mockResolvedValue([{ count: 5 }]);
    const mockWhere = jest.fn().mockReturnValue({ limit: mockLimit });
    const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });
    db.select.mockReturnValue({ from: mockFrom });

    const result = await getCurrentUsage("user-123", "reports_per_month");
    expect(result).toBe(5);
  });

  it("returns count when record exists for cumulative entitlement", async () => {
    const mockLimit = jest.fn().mockResolvedValue([{ count: 2 }]);
    const mockWhere = jest.fn().mockReturnValue({ limit: mockLimit });
    const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });
    db.select.mockReturnValue({ from: mockFrom });

    const result = await getCurrentUsage("user-123", "markets_created");
    expect(result).toBe(2);
  });

  it("returns 0 on DB error (graceful degradation)", async () => {
    db.select.mockImplementationOnce(() => {
      throw new Error("DB unavailable");
    });

    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const result = await getCurrentUsage("user-123", "reports_per_month");
    expect(result).toBe(0);
    consoleSpy.mockRestore();
  });
});

// ============================================================
// SECTION 4: getUsageForPeriod
// ============================================================

describe("Usage Tracking — getUsageForPeriod", () => {
  it("returns 0 when no record exists for the period", async () => {
    const periodStart = new Date("2026-02-01T00:00:00Z");
    const result = await getUsageForPeriod(
      "user-123",
      "reports_per_month",
      periodStart
    );
    expect(result).toBe(0);
  });

  it("returns count when record exists for the period", async () => {
    const mockLimit = jest.fn().mockResolvedValue([{ count: 8 }]);
    const mockWhere = jest.fn().mockReturnValue({ limit: mockLimit });
    const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });
    db.select.mockReturnValue({ from: mockFrom });

    const periodStart = new Date("2026-02-01T00:00:00Z");
    const result = await getUsageForPeriod(
      "user-123",
      "reports_per_month",
      periodStart
    );
    expect(result).toBe(8);
  });

  it("returns 0 on DB error (graceful degradation)", async () => {
    db.select.mockImplementationOnce(() => {
      throw new Error("DB unavailable");
    });

    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const periodStart = new Date("2026-02-01T00:00:00Z");
    const result = await getUsageForPeriod(
      "user-123",
      "reports_per_month",
      periodStart
    );
    expect(result).toBe(0);
    consoleSpy.mockRestore();
  });
});

// ============================================================
// SECTION 5: Service Function Exports
// ============================================================

describe("Usage Tracking — Service Exports", () => {
  it("exports incrementUsage function", () => {
    expect(typeof incrementUsage).toBe("function");
  });

  it("exports getCurrentUsage function", () => {
    expect(typeof getCurrentUsage).toBe("function");
  });

  it("exports getUsageForPeriod function", () => {
    expect(typeof getUsageForPeriod).toBe("function");
  });

  it("exports getEntitlementPeriod function", () => {
    expect(typeof getEntitlementPeriod).toBe("function");
  });
});
