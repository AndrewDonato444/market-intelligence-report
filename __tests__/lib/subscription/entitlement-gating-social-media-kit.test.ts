/**
 * Entitlement Gating in Social Media Kit Tests
 *
 * Tests for #176: Entitlement gating in social media kit generation.
 * Covers:
 * - POST /api/reports/[id]/kit/generate server-side enforcement
 * - POST /api/reports/[id]/kit/regenerate server-side enforcement
 * - Usage increment after successful kit generation
 * - Usage NOT incremented on blocked generation
 * - Fail-open on entitlement check errors
 * - Error message differentiation (not included vs limit reached)
 *
 * Spec: .specs/features/subscription/entitlement-gating-social-media-kit.feature.md
 */

export {};

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
} = { allowed: true, limit: 5, used: 2, remaining: 3 };

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

jest.mock("@/lib/services/report", () => ({
  getReport: jest.fn(async () => ({
    id: "report-1",
    userId: "user-123",
    status: "completed",
  })),
}));

jest.mock("@/lib/services/social-media-kit", () => ({
  generateSocialMediaKit: jest.fn(async () => ({ kitId: "kit-1", content: {} })),
  getSocialMediaKit: jest.fn(async () => null),
  deleteSocialMediaKit: jest.fn(async () => {}),
  regenerateKitSection: jest.fn(async () => ({})),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthUserId = "user-123";
  mockCheckEntitlementResult = {
    allowed: true,
    limit: 5,
    used: 2,
    remaining: 3,
  };
});

// ============================================================
// SECTION 1: POST /api/reports/[id]/kit/generate — entitlement enforcement
// ============================================================

describe("POST /api/reports/[id]/kit/generate — entitlement enforcement", () => {
  let POST: (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<{ status: number; json: () => Promise<any> }>;

  beforeAll(async () => {
    const mod = await import("@/app/api/reports/[id]/kit/generate/route");
    POST = mod.POST as any;
  });

  const makeRequest = () =>
    new Request("http://localhost/api/reports/report-1/kit/generate", {
      method: "POST",
    });

  const makeParams = () => ({ params: Promise.resolve({ id: "report-1" }) });

  it("API-KG-01: allows kit generation when entitlement check passes", async () => {
    mockCheckEntitlementResult = {
      allowed: true,
      limit: 5,
      used: 2,
      remaining: 3,
    };

    const res = await POST(makeRequest(), makeParams());
    expect(res.status).toBe(202);
  });

  it("API-KG-02: returns 403 with 'not included' when cap is 0 (Starter plan)", async () => {
    mockCheckEntitlementResult = {
      allowed: false,
      limit: 0,
      used: 0,
      remaining: 0,
    };

    const res = await POST(makeRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Social media kit not included in your plan");
    expect(body.entitlement).toEqual({
      allowed: false,
      limit: 0,
      used: 0,
      remaining: 0,
    });
  });

  it("API-KG-03: returns 403 with 'limit reached' when monthly cap is hit", async () => {
    mockCheckEntitlementResult = {
      allowed: false,
      limit: 5,
      used: 5,
      remaining: 0,
    };

    const res = await POST(makeRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Social media kit limit reached");
    expect(body.entitlement).toEqual({
      allowed: false,
      limit: 5,
      used: 5,
      remaining: 0,
    });
  });

  it("API-KG-04: no kit is generated when entitlement is denied", async () => {
    mockCheckEntitlementResult = {
      allowed: false,
      limit: 0,
      used: 0,
      remaining: 0,
    };

    const { generateSocialMediaKit } = jest.requireMock(
      "@/lib/services/social-media-kit"
    ) as { generateSocialMediaKit: jest.Mock };

    await POST(makeRequest(), makeParams());
    expect(generateSocialMediaKit).not.toHaveBeenCalled();
  });

  it("API-KG-05: usage incremented after successful kit generation start", async () => {
    mockCheckEntitlementResult = {
      allowed: true,
      limit: 5,
      used: 2,
      remaining: 3,
    };

    const { incrementUsage } = jest.requireMock(
      "@/lib/services/usage-tracking"
    ) as { incrementUsage: jest.Mock };

    const res = await POST(makeRequest(), makeParams());
    expect(res.status).toBe(202);

    await new Promise((r) => setTimeout(r, 10));
    expect(incrementUsage).toHaveBeenCalledWith(
      "user-123",
      "social_media_kits"
    );
  });

  it("API-KG-06: usage NOT incremented when generation is blocked", async () => {
    mockCheckEntitlementResult = {
      allowed: false,
      limit: 0,
      used: 0,
      remaining: 0,
    };

    const { incrementUsage } = jest.requireMock(
      "@/lib/services/usage-tracking"
    ) as { incrementUsage: jest.Mock };

    await POST(makeRequest(), makeParams());
    expect(incrementUsage).not.toHaveBeenCalled();
  });

  it("API-KG-07: entitlement check fail-open allows kit generation", async () => {
    mockCheckEntitlementResult = {
      allowed: true,
      limit: -1,
      used: 0,
      remaining: -1,
    };

    const res = await POST(makeRequest(), makeParams());
    expect(res.status).toBe(202);
  });

  it("API-KG-08: checkEntitlement is called with 'social_media_kits' type", async () => {
    const { checkEntitlement } = jest.requireMock(
      "@/lib/services/entitlement-check"
    ) as { checkEntitlement: jest.Mock };

    await POST(makeRequest(), makeParams());
    expect(checkEntitlement).toHaveBeenCalledWith("user-123", "social_media_kits");
  });

  it("API-KG-09: returns 401 for unauthenticated user", async () => {
    mockAuthUserId = null;

    const res = await POST(makeRequest(), makeParams());
    expect(res.status).toBe(401);
  });

  it("API-KG-10: unlimited Enterprise user can generate freely", async () => {
    mockCheckEntitlementResult = {
      allowed: true,
      limit: -1,
      used: 50,
      remaining: -1,
    };

    const res = await POST(makeRequest(), makeParams());
    expect(res.status).toBe(202);
  });
});

// ============================================================
// SECTION 2: POST /api/reports/[id]/kit/regenerate — entitlement enforcement
// ============================================================

describe("POST /api/reports/[id]/kit/regenerate — entitlement enforcement", () => {
  let POST: (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<{ status: number; json: () => Promise<any> }>;

  beforeAll(async () => {
    const mod = await import("@/app/api/reports/[id]/kit/regenerate/route");
    POST = mod.POST as any;
  });

  beforeEach(() => {
    // Regenerate requires an existing kit
    const { getSocialMediaKit } = jest.requireMock(
      "@/lib/services/social-media-kit"
    ) as { getSocialMediaKit: jest.Mock };
    getSocialMediaKit.mockResolvedValue({
      id: "kit-1",
      reportId: "report-1",
      status: "completed",
      content: {
        postIdeas: [],
        captions: [],
        personaPosts: [],
        polls: [],
        conversationStarters: [],
        calendarSuggestions: [],
        statCallouts: [],
      },
    });
  });

  const makeRegenRequest = (contentType = "postIdeas") =>
    new Request("http://localhost/api/reports/report-1/kit/regenerate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentType }),
    });

  const makeParams = () => ({ params: Promise.resolve({ id: "report-1" }) });

  it("API-KG-11: allows regeneration when entitlement check passes", async () => {
    mockCheckEntitlementResult = {
      allowed: true,
      limit: 5,
      used: 2,
      remaining: 3,
    };

    const res = await POST(makeRegenRequest(), makeParams());
    expect(res.status).toBe(202);
  });

  it("API-KG-12: returns 403 when regeneration is denied by entitlement", async () => {
    mockCheckEntitlementResult = {
      allowed: false,
      limit: 0,
      used: 0,
      remaining: 0,
    };

    const res = await POST(makeRegenRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Social media kit not included in your plan");
  });

  it("API-KG-13: regeneration does NOT increment usage", async () => {
    mockCheckEntitlementResult = {
      allowed: true,
      limit: 5,
      used: 2,
      remaining: 3,
    };

    const { incrementUsage } = jest.requireMock(
      "@/lib/services/usage-tracking"
    ) as { incrementUsage: jest.Mock };

    await POST(makeRegenRequest(), makeParams());
    await new Promise((r) => setTimeout(r, 10));
    expect(incrementUsage).not.toHaveBeenCalled();
  });
});

// ============================================================
// SECTION 3: File structure verification
// ============================================================

describe("Entitlement Gating in Social Media Kit — file structure", () => {
  it("API-KG-14: kit generate route file exists", () => {
    const fs = require("fs");
    const path = require("path");
    expect(
      fs.existsSync(
        path.join(process.cwd(), "app/api/reports/[id]/kit/generate/route.ts")
      )
    ).toBe(true);
  });

  it("API-KG-15: kit regenerate route file exists", () => {
    const fs = require("fs");
    const path = require("path");
    expect(
      fs.existsSync(
        path.join(process.cwd(), "app/api/reports/[id]/kit/regenerate/route.ts")
      )
    ).toBe(true);
  });
});
