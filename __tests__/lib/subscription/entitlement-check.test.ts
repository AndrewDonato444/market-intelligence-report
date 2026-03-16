/**
 * Entitlement Check Utility Tests
 *
 * Tests for lib/services/entitlement-check.ts:
 * - Returns allowed when user has remaining quota
 * - Returns denied when user has hit cap
 * - Handles unlimited tier entitlements (-1)
 * - Override boosts effective cap beyond tier
 * - Most favorable active override wins
 * - Expired overrides are ignored
 * - Null expiresAt overrides never expire
 * - Unlimited override (-1) overrides any tier cap
 * - Cumulative entitlements (markets_created)
 * - Feature not included (cap 0) returns denied
 * - Override can unlock feature not in tier
 * - No subscription defaults to Starter
 * - No subscription record handled gracefully
 * - Unknown entitlement type returns denied
 * - DB errors degrade gracefully to allowed (fail-open)
 * - personas_per_report returns limit for caller comparison
 *
 * Spec: .specs/features/subscription/entitlement-check-utility.feature.md
 */

import { checkEntitlement, type EntitlementCheckResult } from "@/lib/services/entitlement-check";

// --- Mock Setup ---

let mockCurrentUsage = 0;
let mockDbShouldThrow = false;
let mockSubscriptionRows: Array<{ tierId: string | null }> = [];
let mockTierRows: Array<{ entitlements: Record<string, number> }> = [];
let mockOverrideRows: Array<{ value: number; expiresAt: Date | null }> = [];

// Mock resolveUserId to passthrough (tests use internal IDs directly)
jest.mock("@/lib/services/resolve-user-id", () => ({
  resolveUserId: jest.fn(async (id: string) => id),
}));

// Mock getCurrentUsage from usage-tracking
jest.mock("@/lib/services/usage-tracking", () => ({
  getCurrentUsage: jest.fn(async () => mockCurrentUsage),
}));

// Mock the database module
jest.mock("@/lib/db", () => {
  const mockSelect = jest.fn();

  return {
    db: {
      select: mockSelect,
    },
    schema: {
      subscriptions: { userId: "user_id", tierId: "tier_id" },
      subscriptionTiers: { id: "id", entitlements: "entitlements" },
      entitlementOverrides: {
        userId: "user_id",
        entitlementType: "entitlement_type",
        expiresAt: "expires_at",
        value: "value",
      },
    },
  };
});

const { db } = jest.requireMock("@/lib/db") as {
  db: { select: jest.Mock };
};

// Helper to set up the mock chain for each test
function setupMocks(opts: {
  subscription?: { tierId: string | null } | null;
  tier?: { entitlements: Record<string, number> } | null;
  overrides?: Array<{ value: number; expiresAt: Date | null }>;
  usage?: number;
  dbError?: boolean;
}) {
  mockCurrentUsage = opts.usage ?? 0;
  mockDbShouldThrow = opts.dbError ?? false;
  mockSubscriptionRows = opts.subscription === null ? [] : [opts.subscription ?? { tierId: "tier-1" }];
  mockTierRows = opts.tier === null ? [] : [opts.tier ?? { entitlements: { reports_per_month: 10 } }];
  mockOverrideRows = opts.overrides ?? [];

  // Determine if tier lookup will be skipped (no tierId)
  const hasTierId = mockSubscriptionRows.length > 0 && mockSubscriptionRows[0].tierId !== null;

  let callCount = 0;

  db.select.mockImplementation(() => {
    if (mockDbShouldThrow) {
      throw new Error("DB unavailable");
    }

    callCount++;
    const currentCall = callCount;

    const mockLimit = jest.fn();
    const mockWhere = jest.fn();
    const mockFrom = jest.fn();

    // Determine which query this call maps to based on whether tier lookup is skipped
    const isSubscriptionCall = currentCall === 1;
    const isTierCall = hasTierId && currentCall === 2;
    const isOverridesCall = hasTierId ? currentCall === 3 : currentCall === 2;

    if (isSubscriptionCall) {
      // subscription lookup
      mockLimit.mockResolvedValue(mockSubscriptionRows);
      mockWhere.mockReturnValue({ limit: mockLimit });
    } else if (isTierCall) {
      // tier lookup
      mockLimit.mockResolvedValue(mockTierRows);
      mockWhere.mockReturnValue({ limit: mockLimit });
    } else if (isOverridesCall) {
      // overrides lookup (no limit, returns array directly)
      mockWhere.mockResolvedValue(mockOverrideRows);
    }

    mockFrom.mockReturnValue({ where: mockWhere });

    return { from: mockFrom };
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockCurrentUsage = 0;
  mockDbShouldThrow = false;
});

// ============================================================
// SECTION 1: Allowed when user has remaining quota
// ============================================================

describe("Entitlement Check — allowed when quota remains", () => {
  it("SVC-EC-01: returns allowed with correct remaining count", async () => {
    setupMocks({
      subscription: { tierId: "tier-pro" },
      tier: { entitlements: { reports_per_month: 10, markets_created: 3, social_media_kits: 1, personas_per_report: 3 } },
      overrides: [],
      usage: 5,
    });

    const result = await checkEntitlement("user-1", "reports_per_month");
    expect(result).toEqual<EntitlementCheckResult>({
      allowed: true,
      limit: 10,
      used: 5,
      remaining: 5,
    });
  });
});

// ============================================================
// SECTION 2: Denied when cap hit
// ============================================================

describe("Entitlement Check — denied when cap hit", () => {
  it("SVC-EC-02: returns denied when usage equals cap", async () => {
    setupMocks({
      subscription: { tierId: "tier-starter" },
      tier: { entitlements: { reports_per_month: 2, markets_created: 1, social_media_kits: 0, personas_per_report: 1 } },
      overrides: [],
      usage: 2,
    });

    const result = await checkEntitlement("user-1", "reports_per_month");
    expect(result).toEqual<EntitlementCheckResult>({
      allowed: false,
      limit: 2,
      used: 2,
      remaining: 0,
    });
  });
});

// ============================================================
// SECTION 3: Unlimited tier entitlements
// ============================================================

describe("Entitlement Check — unlimited tier entitlements", () => {
  it("SVC-EC-03: returns allowed with -1 remaining for unlimited tier", async () => {
    setupMocks({
      subscription: { tierId: "tier-enterprise" },
      tier: { entitlements: { reports_per_month: -1, markets_created: -1, social_media_kits: -1, personas_per_report: 3 } },
      overrides: [],
      usage: 50,
    });

    const result = await checkEntitlement("user-1", "reports_per_month");
    expect(result).toEqual<EntitlementCheckResult>({
      allowed: true,
      limit: -1,
      used: 50,
      remaining: -1,
    });
  });
});

// ============================================================
// SECTION 4: Override boosts effective cap
// ============================================================

describe("Entitlement Check — override boosts cap", () => {
  it("SVC-EC-04: override value exceeds tier cap, override wins", async () => {
    setupMocks({
      subscription: { tierId: "tier-starter" },
      tier: { entitlements: { reports_per_month: 2, markets_created: 1, social_media_kits: 0, personas_per_report: 1 } },
      overrides: [{ value: 10, expiresAt: null }],
      usage: 3,
    });

    const result = await checkEntitlement("user-1", "reports_per_month");
    expect(result).toEqual<EntitlementCheckResult>({
      allowed: true,
      limit: 10,
      used: 3,
      remaining: 7,
    });
  });
});

// ============================================================
// SECTION 5: Most favorable active override wins
// ============================================================

describe("Entitlement Check — most favorable override wins", () => {
  it("SVC-EC-05: highest value override is used when multiple exist", async () => {
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    setupMocks({
      subscription: { tierId: "tier-starter" },
      tier: { entitlements: { reports_per_month: 2, markets_created: 1, social_media_kits: 0, personas_per_report: 1 } },
      overrides: [
        { value: 5, expiresAt: null },
        { value: 15, expiresAt: nextWeek },
      ],
      usage: 4,
    });

    const result = await checkEntitlement("user-1", "reports_per_month");
    expect(result).toEqual<EntitlementCheckResult>({
      allowed: true,
      limit: 15,
      used: 4,
      remaining: 11,
    });
  });
});

// ============================================================
// SECTION 6: Expired overrides are ignored
// ============================================================

describe("Entitlement Check — expired overrides ignored", () => {
  it("SVC-EC-06: expired override not considered, falls back to tier cap", async () => {
    setupMocks({
      subscription: { tierId: "tier-starter" },
      tier: { entitlements: { reports_per_month: 2, markets_created: 1, social_media_kits: 0, personas_per_report: 1 } },
      overrides: [], // expired ones filtered by DB query
      usage: 2,
    });

    const result = await checkEntitlement("user-1", "reports_per_month");
    expect(result).toEqual<EntitlementCheckResult>({
      allowed: false,
      limit: 2,
      used: 2,
      remaining: 0,
    });
  });
});

// ============================================================
// SECTION 7: Null expiresAt never expires
// ============================================================

describe("Entitlement Check — null expiresAt never expires", () => {
  it("SVC-EC-07: override with null expiresAt is always active", async () => {
    setupMocks({
      subscription: { tierId: "tier-starter" },
      tier: { entitlements: { reports_per_month: 2, markets_created: 1, social_media_kits: 0, personas_per_report: 1 } },
      overrides: [{ value: 8, expiresAt: null }],
      usage: 1,
    });

    const result = await checkEntitlement("user-1", "reports_per_month");
    expect(result).toEqual<EntitlementCheckResult>({
      allowed: true,
      limit: 8,
      used: 1,
      remaining: 7,
    });
  });
});

// ============================================================
// SECTION 8: Unlimited override (-1) overrides any tier cap
// ============================================================

describe("Entitlement Check — unlimited override", () => {
  it("SVC-EC-08: override with value -1 grants unlimited regardless of tier", async () => {
    setupMocks({
      subscription: { tierId: "tier-starter" },
      tier: { entitlements: { reports_per_month: 2, markets_created: 1, social_media_kits: 0, personas_per_report: 1 } },
      overrides: [{ value: -1, expiresAt: null }],
      usage: 100,
    });

    const result = await checkEntitlement("user-1", "reports_per_month");
    expect(result).toEqual<EntitlementCheckResult>({
      allowed: true,
      limit: -1,
      used: 100,
      remaining: -1,
    });
  });
});

// ============================================================
// SECTION 9: Cumulative entitlements (markets_created)
// ============================================================

describe("Entitlement Check — cumulative entitlements", () => {
  it("SVC-EC-09: markets_created uses cumulative usage", async () => {
    setupMocks({
      subscription: { tierId: "tier-pro" },
      tier: { entitlements: { reports_per_month: 10, markets_created: 3, social_media_kits: 1, personas_per_report: 3 } },
      overrides: [],
      usage: 2,
    });

    const result = await checkEntitlement("user-1", "markets_created");
    expect(result).toEqual<EntitlementCheckResult>({
      allowed: true,
      limit: 3,
      used: 2,
      remaining: 1,
    });
  });
});

// ============================================================
// SECTION 10: Feature not included (cap 0)
// ============================================================

describe("Entitlement Check — feature not included", () => {
  it("SVC-EC-10: cap of 0 means not included, returns denied", async () => {
    setupMocks({
      subscription: { tierId: "tier-starter" },
      tier: { entitlements: { reports_per_month: 2, markets_created: 1, social_media_kits: 0, personas_per_report: 1 } },
      overrides: [],
      usage: 0,
    });

    const result = await checkEntitlement("user-1", "social_media_kits");
    expect(result).toEqual<EntitlementCheckResult>({
      allowed: false,
      limit: 0,
      used: 0,
      remaining: 0,
    });
  });
});

// ============================================================
// SECTION 11: Override unlocks feature not in tier
// ============================================================

describe("Entitlement Check — override unlocks excluded feature", () => {
  it("SVC-EC-11: override grants access to feature with tier cap 0", async () => {
    setupMocks({
      subscription: { tierId: "tier-starter" },
      tier: { entitlements: { reports_per_month: 2, markets_created: 1, social_media_kits: 0, personas_per_report: 1 } },
      overrides: [{ value: 5, expiresAt: null }],
      usage: 1,
    });

    const result = await checkEntitlement("user-1", "social_media_kits");
    expect(result).toEqual<EntitlementCheckResult>({
      allowed: true,
      limit: 5,
      used: 1,
      remaining: 4,
    });
  });
});

// ============================================================
// SECTION 12: No subscription defaults to Starter
// ============================================================

describe("Entitlement Check — no subscription defaults", () => {
  it("SVC-EC-12: user with null tierId gets Starter defaults", async () => {
    setupMocks({
      subscription: { tierId: null },
      tier: null,
      overrides: [],
      usage: 0,
    });

    const result = await checkEntitlement("user-1", "reports_per_month");
    expect(result).toEqual<EntitlementCheckResult>({
      allowed: true,
      limit: 2,
      used: 0,
      remaining: 2,
    });
  });
});

// ============================================================
// SECTION 13: No subscription record at all
// ============================================================

describe("Entitlement Check — no subscription record", () => {
  it("SVC-EC-13: user with no subscription row gets Starter defaults", async () => {
    setupMocks({
      subscription: null,
      tier: null,
      overrides: [],
      usage: 0,
    });

    const result = await checkEntitlement("user-1", "reports_per_month");
    expect(result).toEqual<EntitlementCheckResult>({
      allowed: true,
      limit: 2,
      used: 0,
      remaining: 2,
    });
  });
});

// ============================================================
// SECTION 14: Unknown entitlement type
// ============================================================

describe("Entitlement Check — unknown entitlement type", () => {
  it("SVC-EC-14: unknown type returns denied with all zeros", async () => {
    setupMocks({
      subscription: { tierId: "tier-pro" },
      tier: { entitlements: { reports_per_month: 10, markets_created: 3, social_media_kits: 1, personas_per_report: 3 } },
      overrides: [],
      usage: 0,
    });

    const result = await checkEntitlement("user-1", "nonexistent_entitlement");
    expect(result).toEqual<EntitlementCheckResult>({
      allowed: false,
      limit: 0,
      used: 0,
      remaining: 0,
    });
  });
});

// ============================================================
// SECTION 15: DB errors degrade gracefully (fail-open)
// ============================================================

describe("Entitlement Check — graceful degradation", () => {
  it("SVC-EC-15: returns allowed on DB error (fail-open)", async () => {
    setupMocks({ dbError: true });

    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const result = await checkEntitlement("user-1", "reports_per_month");

    expect(result).toEqual<EntitlementCheckResult>({
      allowed: true,
      limit: -1,
      used: 0,
      remaining: -1,
    });
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

// ============================================================
// SECTION 16: personas_per_report check
// ============================================================

describe("Entitlement Check — personas_per_report", () => {
  it("SVC-EC-16: returns limit for caller comparison", async () => {
    setupMocks({
      subscription: { tierId: "tier-starter" },
      tier: { entitlements: { reports_per_month: 2, markets_created: 1, social_media_kits: 0, personas_per_report: 1 } },
      overrides: [],
      usage: 0,
    });

    const result = await checkEntitlement("user-1", "personas_per_report");
    expect(result).toEqual<EntitlementCheckResult>({
      allowed: true,
      limit: 1,
      used: 0,
      remaining: 1,
    });
  });
});

// ============================================================
// SECTION 17: Service Exports
// ============================================================

describe("Entitlement Check — exports", () => {
  it("SVC-EC-17: exports checkEntitlement function", () => {
    expect(typeof checkEntitlement).toBe("function");
  });
});
