/**
 * Geographic Analytics Tests
 *
 * Tests for:
 *   GET /api/admin/analytics/geographic — Geographic breakdown of reports
 *
 * Spec: .specs/features/admin/geographic-analytics.feature.md
 *
 * @jest-environment node
 */

export {}; // Ensure this file is treated as a module to avoid TS2451

const mockRequireAdmin = jest.fn<Promise<string | null>, []>();
jest.mock("@/lib/supabase/admin-auth", () => ({
  requireAdmin: () => mockRequireAdmin(),
}));

let mockSelectResults: unknown[][] = [];
let mockSelectCallIndex = 0;
let mockDbError = false;

jest.mock("@/lib/db", () => ({
  get db() {
    return {
      select: (..._args: unknown[]) => {
        if (mockDbError) throw new Error("DB connection failed");
        const result = mockSelectResults[mockSelectCallIndex] ?? [];
        mockSelectCallIndex++;
        const makeChain = (res: unknown): unknown =>
          new Proxy({}, {
            get(_, prop) {
              if (String(prop) === "then") {
                return (resolve: (v: unknown) => void) => resolve(res);
              }
              return (..._a: unknown[]) => makeChain(res);
            },
          });
        return makeChain(result);
      },
    };
  },
  schema: {
    reports: { id: "reports.id", userId: "reports.user_id", marketId: "reports.market_id", status: "reports.status", createdAt: "reports.created_at" },
    markets: { id: "markets.id", geography: "markets.geography" },
  },
}));

jest.mock("drizzle-orm", () => ({
  sql: Object.assign(jest.fn((..._a: unknown[]) => ({ as: () => "sql-tag", raw: jest.fn() })), { raw: jest.fn((..._a: unknown[]) => "sql-raw") }),
  eq: jest.fn(), and: jest.fn(), gte: jest.fn(), lt: jest.fn(), count: jest.fn(),
  desc: jest.fn(), asc: jest.fn(),
}));

function resetMocks() {
  jest.clearAllMocks(); jest.resetModules();
  mockRequireAdmin.mockResolvedValue("admin-auth-id");
  mockSelectResults = []; mockSelectCallIndex = 0; mockDbError = false;
}

describe("Geographic Analytics API — GET /api/admin/analytics/geographic", () => {
  beforeEach(resetMocks);

  it("API-geo-01: returns 401 for non-admin users", async () => {
    mockRequireAdmin.mockResolvedValue(null);
    const { GET } = await import("@/app/api/admin/analytics/geographic/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost/api/admin/analytics/geographic"));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe("Unauthorized");
  });

  it("API-geo-02: returns byState and byCity with correct structure", async () => {
    mockSelectResults = [
      // byState
      [
        { state: "FL", count: 45 },
        { state: "CA", count: 30 },
        { state: "NY", count: 15 },
      ],
      // byCity
      [
        { city: "Naples", state: "FL", count: 25 },
        { city: "Miami", state: "FL", count: 20 },
        { city: "Beverly Hills", state: "CA", count: 18 },
        { city: "Los Angeles", state: "CA", count: 12 },
        { city: "Manhattan", state: "NY", count: 15 },
      ],
    ];
    const { GET } = await import("@/app/api/admin/analytics/geographic/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost/api/admin/analytics/geographic"));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body).toHaveProperty("byState");
    expect(body).toHaveProperty("byCity");
    expect(body).toHaveProperty("summary");
    expect(body).toHaveProperty("period", "all");

    // byState structure
    expect(body.byState.length).toBe(3);
    expect(body.byState[0]).toHaveProperty("state");
    expect(body.byState[0]).toHaveProperty("count");
    expect(body.byState[0]).toHaveProperty("percentage");

    // byCity structure
    expect(body.byCity.length).toBe(5);
    expect(body.byCity[0]).toHaveProperty("city");
    expect(body.byCity[0]).toHaveProperty("state");
    expect(body.byCity[0]).toHaveProperty("count");
    expect(body.byCity[0]).toHaveProperty("percentage");
  });

  it("API-geo-03: returns summary with totalReports, uniqueStates, uniqueCities, topState", async () => {
    mockSelectResults = [
      [{ state: "FL", count: 50 }, { state: "CA", count: 30 }],
      [{ city: "Naples", state: "FL", count: 30 }, { city: "Miami", state: "FL", count: 20 }, { city: "LA", state: "CA", count: 30 }],
    ];
    const { GET } = await import("@/app/api/admin/analytics/geographic/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost/api/admin/analytics/geographic"));
    const body = await res.json();

    expect(body.summary.totalReports).toBe(80);
    expect(body.summary.uniqueStates).toBe(2);
    expect(body.summary.uniqueCities).toBe(3);
    expect(body.summary.topState).toEqual({ name: "FL", count: 50 });
  });

  it("API-geo-04: byState is sorted by count descending", async () => {
    mockSelectResults = [
      [{ state: "FL", count: 50 }, { state: "CA", count: 30 }, { state: "NY", count: 10 }],
      [],
    ];
    const { GET } = await import("@/app/api/admin/analytics/geographic/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost/api/admin/analytics/geographic"));
    const body = await res.json();

    for (let i = 1; i < body.byState.length; i++) {
      expect(body.byState[i - 1].count).toBeGreaterThanOrEqual(body.byState[i].count);
    }
  });

  it("API-geo-05: calculates percentages correctly", async () => {
    mockSelectResults = [
      [{ state: "FL", count: 75 }, { state: "CA", count: 25 }],
      [],
    ];
    const { GET } = await import("@/app/api/admin/analytics/geographic/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost/api/admin/analytics/geographic"));
    const body = await res.json();

    expect(body.byState[0].percentage).toBe(75);
    expect(body.byState[1].percentage).toBe(25);
  });

  it("API-geo-06: returns empty arrays when no reports exist", async () => {
    mockSelectResults = [[], []];
    const { GET } = await import("@/app/api/admin/analytics/geographic/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost/api/admin/analytics/geographic"));
    const body = await res.json();

    expect(body.byState).toEqual([]);
    expect(body.byCity).toEqual([]);
    expect(body.summary.totalReports).toBe(0);
    expect(body.summary.uniqueStates).toBe(0);
    expect(body.summary.uniqueCities).toBe(0);
    expect(body.summary.topState).toBeNull();
  });

  it("API-geo-07: respects period=90d filter", async () => {
    mockSelectResults = [
      [{ state: "FL", count: 10 }],
      [{ city: "Naples", state: "FL", count: 10 }],
    ];
    const { GET } = await import("@/app/api/admin/analytics/geographic/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost/api/admin/analytics/geographic?period=90d"));
    const body = await res.json();

    expect(body.period).toBe("90d");
    expect(body.byState.length).toBe(1);
  });

  it("API-geo-08: returns 400 for invalid period", async () => {
    const { GET } = await import("@/app/api/admin/analytics/geographic/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost/api/admin/analytics/geographic?period=invalid"));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/period/i);
  });

  it("API-geo-09: returns 500 on database error", async () => {
    mockDbError = true;
    const { GET } = await import("@/app/api/admin/analytics/geographic/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost/api/admin/analytics/geographic"));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBeDefined();
  });

  it("API-geo-10: defaults to period=all when no period provided", async () => {
    mockSelectResults = [[], []];
    const { GET } = await import("@/app/api/admin/analytics/geographic/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost/api/admin/analytics/geographic"));
    const body = await res.json();
    expect(body.period).toBe("all");
  });
});
