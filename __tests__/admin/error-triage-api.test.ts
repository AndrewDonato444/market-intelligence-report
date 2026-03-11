/**
 * Error Triage API Tests
 *
 * Tests for GET /api/admin/reports/errors route.
 *
 * Spec: .specs/features/admin/error-triage-view.feature.md
 *
 * @jest-environment node
 */

export {}; // Ensure this file is treated as a module to avoid TS2451

const mockRequireAdmin = jest.fn<Promise<string | null>, []>();

jest.mock("@/lib/supabase/admin-auth", () => ({
  requireAdmin: () => mockRequireAdmin(),
}));

let mockDbSelectResult: unknown = [];
let mockDbError = false;

jest.mock("@/lib/db", () => ({
  get db() {
    return {
      select: (...args: unknown[]) => {
        if (mockDbError) throw new Error("DB connection failed");
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
      errorMessage: "reports.error_message",
      retriedAt: "reports.retried_at",
      retriedBy: "reports.retried_by",
    },
    users: {
      id: "users.id",
      name: "users.name",
      company: "users.company",
    },
    markets: {
      id: "markets.id",
      name: "markets.name",
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
  isNotNull: jest.fn(),
}));

describe("Error Triage API — GET /api/admin/reports/errors", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    mockRequireAdmin.mockResolvedValue("admin-auth-id");
    mockDbSelectResult = [];
    mockDbError = false;
  });

  // Scenario: Non-admin user is rejected
  it("API-errortriage-01: should return 401 for non-admin users", async () => {
    mockRequireAdmin.mockResolvedValue(null);

    const { GET } = await import("@/app/api/admin/reports/errors/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost/api/admin/reports/errors");
    const res = await GET(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  // Scenario: Admin views error triage (basic fetch)
  it("API-errortriage-02: should return 200 with error triage shape for admin", async () => {
    mockDbSelectResult = [];

    const { GET } = await import("@/app/api/admin/reports/errors/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost/api/admin/reports/errors");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("errors");
    expect(body).toHaveProperty("total");
    expect(body).toHaveProperty("summary");
    expect(body).toHaveProperty("failingAgents");
    expect(body).toHaveProperty("page");
    expect(body).toHaveProperty("pageSize");
    expect(body.summary).toHaveProperty("totalErrors");
    expect(body.summary).toHaveProperty("errorsToday");
    expect(body.summary).toHaveProperty("mostFailingAgent");
    expect(body.summary).toHaveProperty("retryRate");
  });

  // Scenario: Admin filters by failing agent
  it("API-errortriage-03: should accept failingAgent query parameter", async () => {
    const { GET } = await import("@/app/api/admin/reports/errors/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost/api/admin/reports/errors?failingAgent=Insight+Generator");
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  // Scenario: Admin filters by date range
  it("API-errortriage-04: should accept dateRange query parameter", async () => {
    const { GET } = await import("@/app/api/admin/reports/errors/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost/api/admin/reports/errors?dateRange=7d");
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  // Scenario: Admin searches errors
  it("API-errortriage-05: should accept search query parameter", async () => {
    const { GET } = await import("@/app/api/admin/reports/errors/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost/api/admin/reports/errors?search=timeout");
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  // Scenario: Sorting
  it("API-errortriage-06: should accept sortBy and sortOrder parameters", async () => {
    const { GET } = await import("@/app/api/admin/reports/errors/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost/api/admin/reports/errors?sortBy=failingAgent&sortOrder=asc");
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  // Scenario: Pagination
  it("API-errortriage-07: should accept page and pageSize parameters", async () => {
    const { GET } = await import("@/app/api/admin/reports/errors/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost/api/admin/reports/errors?page=2&pageSize=10");
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  // Scenario: Error state
  it("API-errortriage-08: should return 500 on database error", async () => {
    mockDbError = true;

    const { GET } = await import("@/app/api/admin/reports/errors/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost/api/admin/reports/errors");
    const res = await GET(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });
});
