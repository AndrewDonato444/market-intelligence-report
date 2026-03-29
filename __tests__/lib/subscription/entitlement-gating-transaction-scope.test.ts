/**
 * Entitlement Gating for Expanded Transaction Scope Tests
 *
 * Tests for #183: Pro users can analyze beyond last 100 transactions.
 * Covers:
 * - TierEntitlements type includes transaction_limit
 * - Seed data has correct transaction_limit per tier
 * - DEFAULT_ENTITLEMENTS fallback includes transaction_limit: 100
 * - Data fetcher applies transactionLimit to search params
 *
 * Spec: .specs/features/subscription/entitlement-gating-expanded-transaction-scope.feature.md
 */

export {};

// ============================================================================
// SVC-TX-01: TierEntitlements type includes transaction_limit
// ============================================================================

describe("TierEntitlements type", () => {
  test("SVC-TX-01: transaction_limit is a required field in TierEntitlements", () => {
    const { DEFAULT_TIERS } = require("@/lib/db/seed-subscription-tiers");
    for (const tier of DEFAULT_TIERS) {
      expect(tier.entitlements).toHaveProperty("transaction_limit");
      expect(typeof tier.entitlements.transaction_limit).toBe("number");
    }
  });
});

// ============================================================================
// SVC-TX-02: Seed data has correct transaction_limit per tier
// ============================================================================

describe("Seed tier transaction_limit values", () => {
  test("SVC-TX-02a: Starter tier has transaction_limit = 100", () => {
    const { DEFAULT_TIERS } = require("@/lib/db/seed-subscription-tiers");
    const starter = DEFAULT_TIERS.find((t: any) => t.slug === "starter");
    expect(starter.entitlements.transaction_limit).toBe(100);
  });

  test("SVC-TX-02b: Professional tier has transaction_limit = 500", () => {
    const { DEFAULT_TIERS } = require("@/lib/db/seed-subscription-tiers");
    const pro = DEFAULT_TIERS.find((t: any) => t.slug === "professional");
    expect(pro.entitlements.transaction_limit).toBe(500);
  });

  test("SVC-TX-02c: Enterprise tier has transaction_limit = -1 (unlimited)", () => {
    const { DEFAULT_TIERS } = require("@/lib/db/seed-subscription-tiers");
    const enterprise = DEFAULT_TIERS.find((t: any) => t.slug === "enterprise");
    expect(enterprise.entitlements.transaction_limit).toBe(-1);
  });
});

// ============================================================================
// SVC-TX-03: DEFAULT_ENTITLEMENTS fallback includes transaction_limit
// ============================================================================

describe("DEFAULT_ENTITLEMENTS fallback", () => {
  test("SVC-TX-03: checkEntitlement returns transaction_limit from default when no subscription", async () => {
    jest.resetModules();

    jest.doMock("@/lib/db", () => {
      let callCount = 0;
      const mockSelect = jest.fn(() => {
        callCount++;
        const currentCall = callCount;
        const mockLimit = jest.fn();
        const mockWhere = jest.fn();
        const mockFrom = jest.fn();

        if (currentCall === 1) {
          // Subscription lookup: .select().from().where().limit(1) -> []
          mockLimit.mockResolvedValue([]);
          mockWhere.mockReturnValue({ limit: mockLimit });
        } else {
          // Overrides lookup: .select().from().where() -> Promise<[]>
          mockWhere.mockResolvedValue([]);
        }

        mockFrom.mockReturnValue({ where: mockWhere });
        return { from: mockFrom };
      });

      return {
        db: { select: mockSelect },
        schema: {
          subscriptions: { userId: "user_id", tierId: "tier_id" },
          subscriptionTiers: { id: "id", entitlements: "entitlements" },
          entitlementOverrides: {
            userId: "user_id",
            entitlementType: "entitlement_type",
            value: "value",
            expiresAt: "expires_at",
          },
        },
      };
    });

    jest.doMock("@/lib/services/usage-tracking", () => ({
      getCurrentUsage: jest.fn(async () => 0),
    }));

    jest.doMock("@/lib/services/resolve-user-id", () => ({
      resolveUserId: jest.fn(async (id: string) => id),
    }));

    const { checkEntitlement } = await import("@/lib/services/entitlement-check");
    const result = await checkEntitlement("user-no-sub", "transaction_limit");

    expect(result.limit).toBe(100);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(100);
  });
});

// ============================================================================
// SVC-TX-04: Data fetcher applies transactionLimit to search params
// ============================================================================

describe("Data fetcher transactionLimit", () => {
  let capturedSearchParams: any[] = [];

  beforeEach(() => {
    jest.resetModules();
    capturedSearchParams = [];
  });

  test("SVC-TX-04a: transactionLimit is applied to PropertySearchParams.limit", async () => {
    const mockSearchProperties = jest.fn(async () => ({ properties: [], stale: false }));

    jest.doMock("@/lib/connectors/realestateapi", () => ({
      searchProperties: mockSearchProperties,
      getPropertyDetail: jest.fn(),
      getPropertyComps: jest.fn(),
      buildSearchParamsFromMarket: jest.fn((market: any) => ({
        city: market.geography.city,
        state: market.geography.state,
        priceMin: market.priceFloor,
      })),
    }));

    jest.doMock("@/lib/connectors/scrapingdog", () => ({
      searchLocal: jest.fn(async () => ({ businesses: [], stale: false })),
      buildLocalQuery: jest.fn((cat: string) => cat),
      searchNews: jest.fn(async () => ({ articles: [], stale: false })),
      buildNewsQuery: jest.fn((topic: string) => topic),
    }));

    jest.doMock("@/lib/connectors/grok", () => ({
      searchXSentiment: jest.fn(async () => null),
    }));

    jest.doMock("@/lib/services/data-source-registry", () => ({
      registry: {
        getAll: jest.fn(() => []),
        envVarsPresent: jest.fn(() => true),
        getHealthSnapshot: jest.fn(() => null),
      },
    }));

    const { fetchAllMarketData } = await import("@/lib/services/data-fetcher");

    await fetchAllMarketData({
      userId: "test-user",
      reportId: "test-report",
      market: {
        geography: { city: "Naples", state: "FL" },
        priceFloor: 1000000,
        priceCeiling: null,
        luxuryTier: "luxury",
        segments: [],
        propertyTypes: [],
        peerMarkets: [],
      } as any,
      abortSignal: new AbortController().signal,
      transactionLimit: 500,
    });

    // searchProperties is called at least twice (current + prior period for target market)
    // Peer market calls build their own params without transactionLimit
    expect(mockSearchProperties.mock.calls.length).toBeGreaterThanOrEqual(2);

    // First two calls are target market (current + prior period) — these get the limit
    const targetCalls = mockSearchProperties.mock.calls.filter(
      (call: any) => call[0].lastSaleDateMin !== undefined
    );
    expect(targetCalls.length).toBe(2);
    for (const call of targetCalls) {
      expect((call as any)[0].limit).toBe(500);
    }
  });

  test("SVC-TX-04b: no transactionLimit means no limit on search params", async () => {
    const mockSearchProperties = jest.fn(async () => ({ properties: [], stale: false }));

    jest.doMock("@/lib/connectors/realestateapi", () => ({
      searchProperties: mockSearchProperties,
      getPropertyDetail: jest.fn(),
      getPropertyComps: jest.fn(),
      buildSearchParamsFromMarket: jest.fn((market: any) => ({
        city: market.geography.city,
        state: market.geography.state,
        priceMin: market.priceFloor,
      })),
    }));

    jest.doMock("@/lib/connectors/scrapingdog", () => ({
      searchLocal: jest.fn(async () => ({ businesses: [], stale: false })),
      buildLocalQuery: jest.fn((cat: string) => cat),
      searchNews: jest.fn(async () => ({ articles: [], stale: false })),
      buildNewsQuery: jest.fn((topic: string) => topic),
    }));

    jest.doMock("@/lib/connectors/grok", () => ({
      searchXSentiment: jest.fn(async () => null),
    }));

    jest.doMock("@/lib/services/data-source-registry", () => ({
      registry: {
        getAll: jest.fn(() => []),
        envVarsPresent: jest.fn(() => true),
        getHealthSnapshot: jest.fn(() => null),
      },
    }));

    const { fetchAllMarketData } = await import("@/lib/services/data-fetcher");

    await fetchAllMarketData({
      userId: "test-user",
      reportId: "test-report",
      market: {
        geography: { city: "Naples", state: "FL" },
        priceFloor: 1000000,
        priceCeiling: null,
        luxuryTier: "luxury",
        segments: [],
        propertyTypes: [],
        peerMarkets: [],
      } as any,
      abortSignal: new AbortController().signal,
    });

    expect(mockSearchProperties.mock.calls.length).toBeGreaterThanOrEqual(2);
    // Target market calls (with date bounds) should NOT have a limit
    const targetCalls = mockSearchProperties.mock.calls.filter(
      (call: any) => call[0].lastSaleDateMin !== undefined
    );
    expect(targetCalls.length).toBe(2);
    for (const call of targetCalls) {
      expect((call as any)[0].limit).toBeUndefined();
    }
  });
});

// ============================================================================
// SVC-TX-05: Seed data contract validation
// ============================================================================

describe("Transaction scope entitlement API contract", () => {
  test("SVC-TX-05: seed data has correct transaction_limit values", () => {
    const { DEFAULT_TIERS } = require("@/lib/db/seed-subscription-tiers");

    const starter = DEFAULT_TIERS.find((t: any) => t.slug === "starter");
    const pro = DEFAULT_TIERS.find((t: any) => t.slug === "professional");
    const enterprise = DEFAULT_TIERS.find((t: any) => t.slug === "enterprise");

    expect(starter.entitlements.transaction_limit).toBe(100);
    expect(pro.entitlements.transaction_limit).toBe(500);
    expect(enterprise.entitlements.transaction_limit).toBe(-1);
  });
});
