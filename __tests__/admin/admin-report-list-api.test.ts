/**
 * Admin Report List API Tests
 *
 * Tests for GET /api/admin/reports route.
 *
 * Spec: .specs/features/admin/admin-report-list.feature.md
 *
 * @jest-environment node
 */

export {}; // Ensure this file is treated as a module to avoid TS2451

const mockRequireAdmin = jest.fn<Promise<string | null>, []>();

jest.mock("@/lib/supabase/admin-auth", () => ({
  requireAdmin: () => mockRequireAdmin(),
}));

// Create a chainable mock that returns itself for any method call
function createChainMock(finalResult: unknown = []) {
  const chain: Record<string, jest.Mock> = {};
  const handler = (method: string) => {
    if (!chain[method]) {
      chain[method] = jest.fn(() => new Proxy({}, { get: (_, p) => handler(String(p)) }));
    }
    return chain[method];
  };

  // The final methods that return data
  const proxy = new Proxy({}, {
    get: (_, prop) => {
      const p = String(prop);
      if (p === "then") {
        // Make it thenable — resolve with finalResult
        return (resolve: (v: unknown) => void) => resolve(finalResult);
      }
      return (...args: unknown[]) => proxy;
    },
  });

  return proxy;
}

let mockDbSelectResult: unknown = [];
let mockDbError = false;

jest.mock("@/lib/db", () => ({
  get db() {
    return {
      select: (...args: unknown[]) => {
        if (mockDbError) throw new Error("DB connection failed");
        // Return a chainable proxy that resolves to mockDbSelectResult
        const makeChain = (): unknown => new Proxy(
          {},
          {
            get(_, prop) {
              if (String(prop) === "then") {
                return (resolve: (v: unknown) => void) => resolve(mockDbSelectResult);
              }
              return (..._args: unknown[]) => makeChain();
            },
          }
        );
        return makeChain();
      },
    };
  },
  schema: {
    reports: {
      id: "reports.id",
      title: "reports.title",
      status: "reports.status",
      userId: "reports.user_id",
      marketId: "reports.market_id",
      createdAt: "reports.created_at",
      generationStartedAt: "reports.generation_started_at",
      generationCompletedAt: "reports.generation_completed_at",
      errorDetails: "reports.error_details",
    },
    users: {
      id: "users.id",
      name: "users.name",
      company: "users.company",
    },
    markets: {
      id: "markets.id",
      name: "markets.name",
      geography: "markets.geography",
    },
  },
}));

jest.mock("drizzle-orm", () => ({
  sql: jest.fn(),
  eq: jest.fn(),
  or: jest.fn(),
  ilike: jest.fn(),
  desc: jest.fn((col: unknown) => col),
  asc: jest.fn((col: unknown) => col),
  and: jest.fn(),
  count: jest.fn(),
  gte: jest.fn(),
  isNull: jest.fn(),
}));

describe("Admin Report List API — GET /api/admin/reports", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    mockRequireAdmin.mockResolvedValue("admin-auth-id");
    mockDbSelectResult = [];
    mockDbError = false;
  });

  // Scenario: Non-admin user is rejected
  it("API-reportlist-01: should return 401 for non-admin users", async () => {
    mockRequireAdmin.mockResolvedValue(null);

    const { GET } = await import("@/app/api/admin/reports/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost/api/admin/reports");
    const res = await GET(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  // Scenario: Admin views the report registry (basic fetch)
  it("API-reportlist-02: should return 200 for admin", async () => {
    mockDbSelectResult = [];

    const { GET } = await import("@/app/api/admin/reports/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost/api/admin/reports");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("reports");
    expect(body).toHaveProperty("total");
    expect(body).toHaveProperty("statusCounts");
    expect(body).toHaveProperty("page");
    expect(body).toHaveProperty("pageSize");
  });

  // Scenario: Admin filters by status
  it("API-reportlist-03: should accept status query parameter", async () => {
    const { GET } = await import("@/app/api/admin/reports/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost/api/admin/reports?status=failed");
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  // Scenario: Admin searches reports
  it("API-reportlist-04: should accept search query parameter", async () => {
    const { GET } = await import("@/app/api/admin/reports/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost/api/admin/reports?search=Naples");
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  // Scenario: Admin filters by date range
  it("API-reportlist-05: should accept dateRange query parameter", async () => {
    const { GET } = await import("@/app/api/admin/reports/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost/api/admin/reports?dateRange=7d");
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  // Scenario: Pagination
  it("API-reportlist-06: should accept page and pageSize parameters", async () => {
    const { GET } = await import("@/app/api/admin/reports/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost/api/admin/reports?page=2&pageSize=10");
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  // Scenario: Sorting
  it("API-reportlist-07: should accept sortBy and sortOrder parameters", async () => {
    const { GET } = await import("@/app/api/admin/reports/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost/api/admin/reports?sortBy=title&sortOrder=asc");
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  // Scenario: Error state
  it("API-reportlist-08: should return 500 on database error", async () => {
    mockDbError = true;

    const { GET } = await import("@/app/api/admin/reports/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost/api/admin/reports");
    const res = await GET(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });
});
