/**
 * Entitlement Gating in Market Creation Tests
 *
 * Tests for #175: Entitlement gating in the market creation flow.
 * Covers:
 * - POST /api/markets server-side enforcement
 * - Usage increment after successful market creation
 * - Usage NOT incremented on market creation failure
 * - Fail-open on entitlement check errors
 *
 * Spec: .specs/features/subscription/entitlement-gating-market-creation.feature.md
 */

// --- Minimal Request polyfill for jsdom test environment ---
class MinimalRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  private _body: string | null;

  constructor(url: string, init?: { method?: string; headers?: Record<string, string>; body?: string }) {
    this.url = url;
    this.method = init?.method ?? "GET";
    this.headers = init?.headers ?? {};
    this._body = init?.body ?? null;
  }

  async json() {
    return JSON.parse(this._body ?? "{}");
  }
}

if (typeof globalThis.Request === "undefined") {
  (globalThis as any).Request = MinimalRequest;
}

// --- Mock next/server to avoid Request polyfill issues ---
class MockNextResponse {
  private _body: unknown;
  private _status: number;

  constructor(body: unknown, init?: { status?: number }) {
    this._body = body;
    this._status = init?.status ?? 200;
  }

  get status() {
    return this._status;
  }

  async json() {
    return this._body;
  }

  static json(body: unknown, init?: { status?: number }) {
    return new MockNextResponse(body, init);
  }
}

jest.mock("next/server", () => ({
  NextResponse: MockNextResponse,
}));

// --- Mock dependencies ---

let mockAuthUserId: string | null = "user-123";
let mockCheckEntitlementResult: {
  allowed: boolean;
  limit: number;
  used: number;
  remaining: number;
} = { allowed: true, limit: 3, used: 1, remaining: 2 };

jest.mock("@/lib/supabase/auth", () => ({
  getAuthUserId: jest.fn(async () => mockAuthUserId),
}));

jest.mock("@/lib/services/entitlement-check", () => ({
  checkEntitlement: jest.fn(async () => mockCheckEntitlementResult),
}));

jest.mock("@/lib/services/usage-tracking", () => ({
  incrementUsage: jest.fn(async () => {}),
  getCurrentUsage: jest.fn(async () => 0),
}));

let mockCreateMarketShouldThrow = false;
jest.mock("@/lib/services/market", () => ({
  getMarkets: jest.fn(async () => []),
  createMarket: jest.fn(async () => {
    if (mockCreateMarketShouldThrow) {
      throw new Error("DB error creating market");
    }
    return { id: "market-1", name: "Naples FL" };
  }),
  validateMarketData: jest.fn((body: Record<string, unknown>) => ({
    success: true,
    data: body,
  })),
}));

jest.mock("@/lib/services/activity-log", () => ({
  logActivity: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthUserId = "user-123";
  mockCheckEntitlementResult = {
    allowed: true,
    limit: 3,
    used: 1,
    remaining: 2,
  };
  mockCreateMarketShouldThrow = false;
});

// ============================================================
// SECTION 1: POST /api/markets — server-side enforcement
// ============================================================

describe("POST /api/markets — entitlement enforcement", () => {
  let POST: (req: Request) => Promise<{ status: number; json: () => Promise<any> }>;

  beforeAll(async () => {
    const mod = await import("@/app/api/markets/route");
    POST = mod.POST as any;
  });

  const makeMarketRequest = () =>
    new Request("http://localhost/api/markets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Naples FL",
        geography: { city: "Naples", state: "FL" },
        luxuryTier: "luxury",
        priceFloor: 1000000,
        segments: ["waterfront"],
        propertyTypes: ["single_family"],
      }),
    });

  it("API-MG-01: allows market creation when entitlement check passes", async () => {
    mockCheckEntitlementResult = {
      allowed: true,
      limit: 3,
      used: 1,
      remaining: 2,
    };

    const res = await POST(makeMarketRequest());
    expect(res.status).toBe(201);
  });

  it("API-MG-02: returns 403 with entitlement details when market limit reached", async () => {
    mockCheckEntitlementResult = {
      allowed: false,
      limit: 1,
      used: 1,
      remaining: 0,
    };

    const res = await POST(makeMarketRequest());
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Market limit reached");
    expect(body.entitlement).toEqual({
      allowed: false,
      limit: 1,
      used: 1,
      remaining: 0,
    });
  });

  it("API-MG-03: no market is created when limit reached", async () => {
    mockCheckEntitlementResult = {
      allowed: false,
      limit: 1,
      used: 1,
      remaining: 0,
    };

    const { createMarket } = jest.requireMock("@/lib/services/market") as {
      createMarket: jest.Mock;
    };

    await POST(makeMarketRequest());
    expect(createMarket).not.toHaveBeenCalled();
  });

  it("API-MG-04: usage incremented after successful market creation", async () => {
    mockCheckEntitlementResult = {
      allowed: true,
      limit: 3,
      used: 1,
      remaining: 2,
    };

    const { incrementUsage } = jest.requireMock(
      "@/lib/services/usage-tracking"
    ) as { incrementUsage: jest.Mock };

    const res = await POST(makeMarketRequest());
    expect(res.status).toBe(201);

    await new Promise((r) => setTimeout(r, 10));
    expect(incrementUsage).toHaveBeenCalledWith(
      "user-123",
      "markets_created"
    );
  });

  it("API-MG-05: usage NOT incremented when market creation fails", async () => {
    mockCheckEntitlementResult = {
      allowed: true,
      limit: 3,
      used: 1,
      remaining: 2,
    };
    mockCreateMarketShouldThrow = true;

    const { incrementUsage } = jest.requireMock(
      "@/lib/services/usage-tracking"
    ) as { incrementUsage: jest.Mock };

    const res = await POST(makeMarketRequest());
    expect(res.status).not.toBe(201);
    expect(incrementUsage).not.toHaveBeenCalled();
  });

  it("API-MG-06: entitlement check fail-open allows market creation", async () => {
    mockCheckEntitlementResult = {
      allowed: true,
      limit: -1,
      used: 0,
      remaining: -1,
    };

    const res = await POST(makeMarketRequest());
    expect(res.status).toBe(201);
  });

  it("API-MG-07: checkEntitlement is called with 'markets_created' type", async () => {
    const { checkEntitlement } = jest.requireMock(
      "@/lib/services/entitlement-check"
    ) as { checkEntitlement: jest.Mock };

    await POST(makeMarketRequest());
    expect(checkEntitlement).toHaveBeenCalledWith("user-123", "markets_created");
  });

  it("API-MG-08: returns 401 for unauthenticated user", async () => {
    mockAuthUserId = null;

    const res = await POST(makeMarketRequest());
    expect(res.status).toBe(401);
  });
});

// ============================================================
// SECTION 2: File structure verification
// ============================================================

describe("Entitlement Gating in Market Creation — file structure", () => {
  it("API-MG-09: markets route file exists", () => {
    const fs = require("fs");
    const path = require("path");
    expect(
      fs.existsSync(
        path.join(process.cwd(), "app/api/markets/route.ts")
      )
    ).toBe(true);
  });
});
