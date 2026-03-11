/**
 * Admin Analytics API Tests
 *
 * Tests for:
 *   GET /api/admin/analytics          — Overview
 *   GET /api/admin/analytics/volume   — Report volume time series
 *   GET /api/admin/analytics/users    — User signup trends
 *   GET /api/admin/analytics/errors   — Error rate trends
 *
 * Spec: .specs/features/admin/analytics-api-endpoints.feature.md
 *
 * @jest-environment node
 */

export {}; // Ensure this file is treated as a module to avoid TS2451

const mockRequireAdmin = jest.fn<Promise<string | null>, []>();
jest.mock("@/lib/supabase/admin-auth", () => ({
  requireAdmin: () => mockRequireAdmin(),
}));

let mockDbResults: unknown[][] = [];
let mockDbCallIndex = 0;
let mockDbError = false;

jest.mock("@/lib/db", () => ({
  get db() {
    return {
      select: (..._args: unknown[]) => {
        if (mockDbError) throw new Error("DB connection failed");
        const result = mockDbResults[mockDbCallIndex] ?? [];
        mockDbCallIndex++;
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
    reports: { id: "reports.id", userId: "reports.user_id", status: "reports.status", createdAt: "reports.created_at", generationStartedAt: "reports.generation_started_at", generationCompletedAt: "reports.generation_completed_at", errorDetails: "reports.error_details", retriedAt: "reports.retried_at" },
    users: { id: "users.id", createdAt: "users.created_at", status: "users.status" },
    userActivity: { id: "user_activity.id", userId: "user_activity.user_id", createdAt: "user_activity.created_at" },
    apiUsage: { id: "api_usage.id", createdAt: "api_usage.created_at" },
  },
}));

jest.mock("drizzle-orm", () => ({
  sql: Object.assign(jest.fn((..._a: unknown[]) => ({ as: () => "sql-tag", raw: jest.fn() })), { raw: jest.fn((..._a: unknown[]) => "sql-raw") }),
  eq: jest.fn(), and: jest.fn(), gte: jest.fn(), lt: jest.fn(), count: jest.fn(),
  countDistinct: jest.fn(), isNotNull: jest.fn(), isNull: jest.fn(),
  desc: jest.fn(), asc: jest.fn(), avg: jest.fn(), sum: jest.fn(), not: jest.fn(),
}));

function resetMocks() {
  jest.clearAllMocks(); jest.resetModules();
  mockRequireAdmin.mockResolvedValue("admin-auth-id");
  mockDbResults = []; mockDbCallIndex = 0; mockDbError = false;
}

describe("Admin Analytics Overview — GET /api/admin/analytics", () => {
  beforeEach(resetMocks);

  it("API-analytics-01: returns 401 for non-admin users", async () => {
    mockRequireAdmin.mockResolvedValue(null);
    const { GET } = await import("@/app/api/admin/analytics/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost/api/admin/analytics"));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe("Unauthorized");
  });

  it("API-analytics-02: returns overview with all required fields", async () => {
    mockDbResults = [
      [{ count: 12 }], [{ count: 67 }], [{ count: 234 }], [{ count: 1089 }],
      [{ count: 45 }], [{ count: 28 }], [{ count: 6 }],
      [{ count: 3 }], [{ count: 67 }], [{ count: 9 }], [{ count: 234 }],
      [{ avg: 142.5 }], [{ avg: 138.2 }],
    ];
    const { GET } = await import("@/app/api/admin/analytics/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost/api/admin/analytics"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("reportVolume");
    expect(body).toHaveProperty("userCount");
    expect(body).toHaveProperty("errorRate");
    expect(body).toHaveProperty("avgGenerationTime");
    expect(body.reportVolume).toHaveProperty("last24h");
    expect(body.reportVolume).toHaveProperty("last7d");
    expect(body.reportVolume).toHaveProperty("last30d");
    expect(body.reportVolume).toHaveProperty("allTime");
    expect(body.userCount).toHaveProperty("total");
    expect(body.userCount).toHaveProperty("active");
    expect(body.userCount).toHaveProperty("newLast30d");
    expect(body.errorRate.last7d).toHaveProperty("failed");
    expect(body.errorRate.last7d).toHaveProperty("total");
    expect(body.errorRate.last7d).toHaveProperty("rate");
    expect(body.avgGenerationTime).toHaveProperty("last7d");
    expect(body.avgGenerationTime).toHaveProperty("last30d");
  });

  it("API-analytics-03: returns zero values when platform has no data", async () => {
    mockDbResults = [
      [{ count: 0 }], [{ count: 0 }], [{ count: 0 }], [{ count: 0 }],
      [{ count: 0 }], [{ count: 0 }], [{ count: 0 }],
      [{ count: 0 }], [{ count: 0 }], [{ count: 0 }], [{ count: 0 }],
      [{ avg: null }], [{ avg: null }],
    ];
    const { GET } = await import("@/app/api/admin/analytics/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost/api/admin/analytics"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.reportVolume.last24h).toBe(0);
    expect(body.reportVolume.allTime).toBe(0);
    expect(body.userCount.total).toBe(0);
    expect(body.errorRate.last7d.rate).toBe(0);
    expect(body.avgGenerationTime.last7d).toBe(0);
  });

  it("API-analytics-04: returns 500 on database error", async () => {
    mockDbError = true;
    const { GET } = await import("@/app/api/admin/analytics/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost/api/admin/analytics"));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBeDefined();
  });
});

describe("Admin Analytics Volume — GET /api/admin/analytics/volume", () => {
  beforeEach(resetMocks);

  it("API-volume-01: returns 401 for non-admin users", async () => {
    mockRequireAdmin.mockResolvedValue(null);
    const { GET } = await import("@/app/api/admin/analytics/volume/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost/api/admin/analytics/volume"));
    expect(res.status).toBe(401);
  });

  it("API-volume-02: returns daily time series with default 30d period", async () => {
    mockDbResults = [[{ date: "2026-03-10", total: 8, completed: 7, failed: 1 }]];
    const { GET } = await import("@/app/api/admin/analytics/volume/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost/api/admin/analytics/volume"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("timeSeries");
    expect(body).toHaveProperty("period", "30d");
    expect(body).toHaveProperty("granularity", "daily");
    if (body.timeSeries.length > 0) {
      expect(body.timeSeries[0]).toHaveProperty("date");
      expect(body.timeSeries[0]).toHaveProperty("total");
      expect(body.timeSeries[0]).toHaveProperty("completed");
      expect(body.timeSeries[0]).toHaveProperty("failed");
    }
  });

  it("API-volume-03: respects period=90d and granularity=weekly", async () => {
    mockDbResults = [[]];
    const { GET } = await import("@/app/api/admin/analytics/volume/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost/api/admin/analytics/volume?period=90d&granularity=weekly"));
    const body = await res.json();
    expect(body.period).toBe("90d");
    expect(body.granularity).toBe("weekly");
  });

  it("API-volume-04: respects period=365d and granularity=monthly", async () => {
    mockDbResults = [[]];
    const { GET } = await import("@/app/api/admin/analytics/volume/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost/api/admin/analytics/volume?period=365d&granularity=monthly"));
    const body = await res.json();
    expect(body.period).toBe("365d");
    expect(body.granularity).toBe("monthly");
  });

  it("API-volume-05: returns 400 for invalid period", async () => {
    const { GET } = await import("@/app/api/admin/analytics/volume/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost/api/admin/analytics/volume?period=invalid"));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/period/i);
  });

  it("API-volume-06: returns 400 for invalid granularity", async () => {
    const { GET } = await import("@/app/api/admin/analytics/volume/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost/api/admin/analytics/volume?granularity=invalid"));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/granularity/i);
  });

  it("API-volume-07: zero-fills days with no reports (no gaps)", async () => {
    mockDbResults = [[{ date: "2026-03-10", total: 3, completed: 2, failed: 1 }]];
    const { GET } = await import("@/app/api/admin/analytics/volume/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost/api/admin/analytics/volume?period=7d&granularity=daily"));
    const body = await res.json();
    expect(body.timeSeries.length).toBeGreaterThanOrEqual(7);
    for (const entry of body.timeSeries) {
      expect(typeof entry.total).toBe("number");
      expect(typeof entry.completed).toBe("number");
      expect(typeof entry.failed).toBe("number");
    }
  });

  it("API-volume-08: returns 500 on database error", async () => {
    mockDbError = true;
    const { GET } = await import("@/app/api/admin/analytics/volume/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost/api/admin/analytics/volume"));
    expect(res.status).toBe(500);
  });
});

describe("Admin Analytics Users — GET /api/admin/analytics/users", () => {
  beforeEach(resetMocks);

  it("API-ausers-01: returns 401 for non-admin users", async () => {
    mockRequireAdmin.mockResolvedValue(null);
    const { GET } = await import("@/app/api/admin/analytics/users/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost/api/admin/analytics/users"));
    expect(res.status).toBe(401);
  });

  it("API-ausers-02: returns signups time series and summary", async () => {
    mockDbResults = [
      [{ date: "2026-03-10", count: 2 }, { date: "2026-03-09", count: 1 }],
      [{ count: 45 }], [{ count: 28 }], [{ count: 6 }], [{ count: 8 }],
    ];
    const { GET } = await import("@/app/api/admin/analytics/users/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost/api/admin/analytics/users"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("signups");
    expect(body).toHaveProperty("summary");
    expect(body).toHaveProperty("period", "30d");
    expect(body).toHaveProperty("granularity", "daily");
    expect(body.summary).toHaveProperty("totalUsers");
    expect(body.summary).toHaveProperty("activeUsers");
    expect(body.summary).toHaveProperty("newSignups");
    expect(body.summary).toHaveProperty("inactiveOver60d");
  });

  it("API-ausers-03: returns 400 for invalid period", async () => {
    const { GET } = await import("@/app/api/admin/analytics/users/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost/api/admin/analytics/users?period=invalid"));
    expect(res.status).toBe(400);
  });

  it("API-ausers-04: returns 400 for invalid granularity", async () => {
    const { GET } = await import("@/app/api/admin/analytics/users/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost/api/admin/analytics/users?granularity=invalid"));
    expect(res.status).toBe(400);
  });

  it("API-ausers-05: returns 500 on database error", async () => {
    mockDbError = true;
    const { GET } = await import("@/app/api/admin/analytics/users/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost/api/admin/analytics/users"));
    expect(res.status).toBe(500);
  });
});

describe("Admin Analytics Errors — GET /api/admin/analytics/errors", () => {
  beforeEach(resetMocks);

  it("API-aerrors-01: returns 401 for non-admin users", async () => {
    mockRequireAdmin.mockResolvedValue(null);
    const { GET } = await import("@/app/api/admin/analytics/errors/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost/api/admin/analytics/errors"));
    expect(res.status).toBe(401);
  });

  it("API-aerrors-02: returns error time series, errorsByAgent, and summary", async () => {
    mockDbResults = [
      [{ date: "2026-03-10", count: 1 }, { date: "2026-03-09", count: 0 }],
      [{ agent: "data-analyst", count: 4 }, { agent: "insight-generator", count: 2 }],
      [{ count: 9 }], [{ count: 234 }], [{ count: 5 }],
    ];
    const { GET } = await import("@/app/api/admin/analytics/errors/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost/api/admin/analytics/errors"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("errorTimeSeries");
    expect(body).toHaveProperty("errorsByAgent");
    expect(body).toHaveProperty("summary");
    expect(body).toHaveProperty("period", "30d");
    expect(body).toHaveProperty("granularity", "daily");
    expect(body.summary).toHaveProperty("totalErrors");
    expect(body.summary).toHaveProperty("errorRate");
    expect(body.summary).toHaveProperty("mostFailingAgent");
    expect(body.summary).toHaveProperty("retriedCount");
  });

  it("API-aerrors-03: errorRate is calculated as failed/total", async () => {
    mockDbResults = [[], [{ agent: "data-analyst", count: 3 }], [{ count: 3 }], [{ count: 100 }], [{ count: 1 }]];
    const { GET } = await import("@/app/api/admin/analytics/errors/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost/api/admin/analytics/errors"));
    const body = await res.json();
    expect(body.summary.errorRate).toBeCloseTo(0.03, 2);
  });

  it("API-aerrors-04: returns 400 for invalid period", async () => {
    const { GET } = await import("@/app/api/admin/analytics/errors/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost/api/admin/analytics/errors?period=invalid"));
    expect(res.status).toBe(400);
  });

  it("API-aerrors-05: returns 400 for invalid granularity", async () => {
    const { GET } = await import("@/app/api/admin/analytics/errors/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost/api/admin/analytics/errors?granularity=invalid"));
    expect(res.status).toBe(400);
  });

  it("API-aerrors-06: handles zero errors gracefully", async () => {
    mockDbResults = [[], [], [{ count: 0 }], [{ count: 50 }], [{ count: 0 }]];
    const { GET } = await import("@/app/api/admin/analytics/errors/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost/api/admin/analytics/errors"));
    const body = await res.json();
    expect(body.summary.totalErrors).toBe(0);
    expect(body.summary.errorRate).toBe(0);
    expect(body.summary.mostFailingAgent).toBeNull();
    expect(body.summary.retriedCount).toBe(0);
  });

  it("API-aerrors-07: returns 500 on database error", async () => {
    mockDbError = true;
    const { GET } = await import("@/app/api/admin/analytics/errors/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost/api/admin/analytics/errors"));
    expect(res.status).toBe(500);
  });
});
