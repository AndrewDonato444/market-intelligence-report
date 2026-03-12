/**
 * Entitlement Gating in Report Creation Tests
 *
 * Tests for #174: Entitlement gating in the report creation flow.
 * Covers:
 * - GET /api/entitlements/check endpoint
 * - POST /api/reports server-side enforcement
 * - Usage increment after successful report creation
 * - Usage NOT incremented on report creation failure
 * - Fail-open on entitlement check errors
 * - Admin override support
 *
 * Spec: .specs/features/subscription/entitlement-gating-report-creation.feature.md
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
} = { allowed: true, limit: 10, used: 6, remaining: 4 };

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

let mockCreateReportShouldThrow = false;
jest.mock("@/lib/services/report", () => ({
  getReports: jest.fn(async () => []),
  createReport: jest.fn(async () => {
    if (mockCreateReportShouldThrow) {
      throw new Error("DB error creating report");
    }
    return { id: "report-1", title: "Test Report" };
  }),
  validateReportConfig: jest.fn((body: Record<string, unknown>) => ({
    success: true,
    data: body,
  })),
}));

jest.mock("@/lib/services/pipeline-executor", () => ({
  executePipeline: jest.fn(async () => {}),
}));

jest.mock("@/lib/services/activity-log", () => ({
  logActivity: jest.fn(),
}));

jest.mock("@/lib/services/buyer-personas", () => ({
  setReportPersonas: jest.fn(async () => {}),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthUserId = "user-123";
  mockCheckEntitlementResult = {
    allowed: true,
    limit: 10,
    used: 6,
    remaining: 4,
  };
  mockCreateReportShouldThrow = false;
});

// ============================================================
// SECTION 1: GET /api/entitlements/check
// ============================================================

describe("GET /api/entitlements/check", () => {
  let GET: (req: Request) => Promise<{ status: number; json: () => Promise<unknown> }>;

  beforeAll(async () => {
    const mod = await import("@/app/api/entitlements/check/route");
    GET = mod.GET as any;
  });

  it("API-EG-01: returns entitlement result for authenticated user with remaining quota", async () => {
    mockCheckEntitlementResult = {
      allowed: true,
      limit: 10,
      used: 6,
      remaining: 4,
    };

    const req = new Request(
      "http://localhost/api/entitlements/check?type=reports_per_month"
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      allowed: true,
      limit: 10,
      used: 6,
      remaining: 4,
    });
  });

  it("API-EG-02: returns 401 for unauthenticated user", async () => {
    mockAuthUserId = null;

    const req = new Request(
      "http://localhost/api/entitlements/check?type=reports_per_month"
    );
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it("API-EG-03: returns 400 when type query param is missing", async () => {
    const req = new Request("http://localhost/api/entitlements/check");
    const res = await GET(req);

    expect(res.status).toBe(400);
  });

  it("API-EG-04: returns unlimited result for Enterprise user", async () => {
    mockCheckEntitlementResult = {
      allowed: true,
      limit: -1,
      used: 50,
      remaining: -1,
    };

    const req = new Request(
      "http://localhost/api/entitlements/check?type=reports_per_month"
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual(expect.objectContaining({ limit: -1, allowed: true }));
  });

  it("API-EG-05: returns denied when monthly cap is hit", async () => {
    mockCheckEntitlementResult = {
      allowed: false,
      limit: 2,
      used: 2,
      remaining: 0,
    };

    const req = new Request(
      "http://localhost/api/entitlements/check?type=reports_per_month"
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual(expect.objectContaining({ allowed: false, remaining: 0 }));
  });

  it("API-EG-06: returns admin override boosted result", async () => {
    mockCheckEntitlementResult = {
      allowed: true,
      limit: 10,
      used: 3,
      remaining: 7,
    };

    const req = new Request(
      "http://localhost/api/entitlements/check?type=reports_per_month"
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual(expect.objectContaining({ limit: 10, used: 3, remaining: 7 }));
  });
});

// ============================================================
// SECTION 2: POST /api/reports — server-side enforcement
// ============================================================

describe("POST /api/reports — entitlement enforcement", () => {
  let POST: (req: Request) => Promise<{ status: number; json: () => Promise<any> }>;

  beforeAll(async () => {
    const mod = await import("@/app/api/reports/route");
    POST = mod.POST as any;
  });

  const makeReportRequest = () =>
    new Request("http://localhost/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        marketId: "market-1",
        title: "Test Report",
        sections: ["executive_briefing"],
      }),
    });

  it("API-EG-07: allows report creation when entitlement check passes", async () => {
    mockCheckEntitlementResult = {
      allowed: true,
      limit: 10,
      used: 6,
      remaining: 4,
    };

    const res = await POST(makeReportRequest());
    expect(res.status).toBe(201);
  });

  it("API-EG-08: returns 403 with entitlement details when report limit reached", async () => {
    mockCheckEntitlementResult = {
      allowed: false,
      limit: 2,
      used: 2,
      remaining: 0,
    };

    const res = await POST(makeReportRequest());
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Report limit reached");
    expect(body.entitlement).toEqual({
      allowed: false,
      limit: 2,
      used: 2,
      remaining: 0,
    });
  });

  it("API-EG-09: no report is created when limit reached", async () => {
    mockCheckEntitlementResult = {
      allowed: false,
      limit: 2,
      used: 2,
      remaining: 0,
    };

    const { createReport } = jest.requireMock("@/lib/services/report") as {
      createReport: jest.Mock;
    };

    await POST(makeReportRequest());
    expect(createReport).not.toHaveBeenCalled();
  });

  it("API-EG-10: no pipeline triggered when limit reached", async () => {
    mockCheckEntitlementResult = {
      allowed: false,
      limit: 2,
      used: 2,
      remaining: 0,
    };

    const { executePipeline } = jest.requireMock(
      "@/lib/services/pipeline-executor"
    ) as { executePipeline: jest.Mock };

    await POST(makeReportRequest());
    expect(executePipeline).not.toHaveBeenCalled();
  });

  it("API-EG-11: usage incremented after successful report creation", async () => {
    mockCheckEntitlementResult = {
      allowed: true,
      limit: 10,
      used: 3,
      remaining: 7,
    };

    const { incrementUsage } = jest.requireMock(
      "@/lib/services/usage-tracking"
    ) as { incrementUsage: jest.Mock };

    const res = await POST(makeReportRequest());
    expect(res.status).toBe(201);

    // incrementUsage is fire-and-forget, give it a tick
    await new Promise((r) => setTimeout(r, 10));
    expect(incrementUsage).toHaveBeenCalledWith(
      "user-123",
      "reports_per_month"
    );
  });

  it("API-EG-12: usage NOT incremented when report creation fails", async () => {
    mockCheckEntitlementResult = {
      allowed: true,
      limit: 10,
      used: 3,
      remaining: 7,
    };
    mockCreateReportShouldThrow = true;

    const { incrementUsage } = jest.requireMock(
      "@/lib/services/usage-tracking"
    ) as { incrementUsage: jest.Mock };

    const res = await POST(makeReportRequest());
    expect(res.status).not.toBe(201);
    expect(incrementUsage).not.toHaveBeenCalled();
  });

  it("API-EG-13: entitlement check fail-open allows report creation", async () => {
    // When checkEntitlement has a DB error, it fails-open internally
    // returning allowed: true, limit: -1. The route trusts this result.
    mockCheckEntitlementResult = {
      allowed: true,
      limit: -1,
      used: 0,
      remaining: -1,
    };

    const res = await POST(makeReportRequest());
    expect(res.status).toBe(201);
  });
});

// ============================================================
// SECTION 3: File structure verification
// ============================================================

describe("Entitlement Gating — file structure", () => {
  it("API-EG-14: entitlements check route file exists", () => {
    const fs = require("fs");
    const path = require("path");
    expect(
      fs.existsSync(
        path.join(process.cwd(), "app/api/entitlements/check/route.ts")
      )
    ).toBe(true);
  });
});
