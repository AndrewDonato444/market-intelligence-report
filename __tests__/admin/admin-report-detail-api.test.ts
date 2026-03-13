/**
 * Admin Report Detail API Tests
 *
 * Tests for GET /api/admin/reports/[id] route.
 *
 * Spec: .specs/features/admin/admin-report-detail.feature.md
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
let selectCallCount = 0;

jest.mock("@/lib/db", () => ({
  get db() {
    return {
      select: (...args: unknown[]) => {
        if (mockDbError) throw new Error("DB connection failed");
        selectCallCount++;
        const currentCall = selectCallCount;
        const makeChain = (): unknown =>
          new Proxy(
            {},
            {
              get(_, prop) {
                if (String(prop) === "then") {
                  // Call 1: report row, Call 2: sections, Call 3: api usage, Call 4: cost sum
                  if (Array.isArray(mockDbSelectResult)) {
                    return (resolve: (v: unknown) => void) => resolve(mockDbSelectResult);
                  }
                  const multi = mockDbSelectResult as Record<string, unknown>;
                  if (currentCall === 1) return (resolve: (v: unknown) => void) => resolve(multi.report ?? []);
                  if (currentCall === 2) return (resolve: (v: unknown) => void) => resolve(multi.sections ?? []);
                  if (currentCall === 3) return (resolve: (v: unknown) => void) => resolve(multi.apiUsage ?? []);
                  if (currentCall === 4) return (resolve: (v: unknown) => void) => resolve(multi.cost ?? [{ total: "0" }]);
                  return (resolve: (v: unknown) => void) => resolve([]);
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
      config: "reports.config",
      version: "reports.version",
      userId: "reports.user_id",
      marketId: "reports.market_id",
      createdAt: "reports.created_at",
      updatedAt: "reports.updated_at",
      generationStartedAt: "reports.generation_started_at",
      generationCompletedAt: "reports.generation_completed_at",
      errorMessage: "reports.error_message",
      errorDetails: "reports.error_details",
      retriedAt: "reports.retried_at",
      retriedBy: "reports.retried_by",
      pdfUrl: "reports.pdf_url",
      shareToken: "reports.share_token",
    },
    users: {
      id: "users.id",
      name: "users.name",
      company: "users.company",
      email: "users.email",
    },
    markets: {
      id: "markets.id",
      name: "markets.name",
      geography: "markets.geography",
      luxuryTier: "markets.luxury_tier",
      priceFloor: "markets.price_floor",
    },
    reportSections: {
      id: "report_sections.id",
      reportId: "report_sections.report_id",
      sectionType: "report_sections.section_type",
      title: "report_sections.title",
      agentName: "report_sections.agent_name",
      sortOrder: "report_sections.sort_order",
      generatedAt: "report_sections.generated_at",
    },
    apiUsage: {
      id: "api_usage.id",
      reportId: "api_usage.report_id",
      provider: "api_usage.provider",
      endpoint: "api_usage.endpoint",
      cost: "api_usage.cost",
      tokensUsed: "api_usage.tokens_used",
      responseTimeMs: "api_usage.response_time_ms",
      cached: "api_usage.cached",
      createdAt: "api_usage.created_at",
    },
    socialMediaKits: {
      id: "social_media_kits.id",
      reportId: "social_media_kits.report_id",
      status: "social_media_kits.status",
      content: "social_media_kits.content",
      generatedAt: "social_media_kits.generated_at",
      errorMessage: "social_media_kits.error_message",
    },
  },
}));

jest.mock("drizzle-orm", () => ({
  eq: jest.fn(),
  asc: jest.fn((col: unknown) => col),
  sum: jest.fn(),
}));

jest.mock("@/lib/services/report", () => ({
  reapStaleReports: jest.fn().mockResolvedValue(undefined),
}));

const mockReportRow = {
  id: "report-1",
  title: "Naples Q1 2026",
  status: "completed",
  config: null,
  version: 1,
  createdAt: new Date("2026-03-10"),
  updatedAt: new Date("2026-03-10"),
  generationStartedAt: new Date("2026-03-10T10:23:00Z"),
  generationCompletedAt: new Date("2026-03-10T10:25:34Z"),
  errorMessage: null,
  errorDetails: null,
  retriedAt: null,
  retriedBy: null,
  pdfUrl: null,
  shareToken: null,
  userId: "user-1",
  userName: "Jane Smith",
  userCompany: "Acme Realty",
  userEmail: "jane@acme.com",
  marketId: "market-1",
  marketName: "Naples, FL",
  marketGeography: { city: "Naples", state: "FL" },
  marketLuxuryTier: "luxury",
  marketPriceFloor: 3000000,
};

describe("Admin Report Detail API — GET /api/admin/reports/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    mockRequireAdmin.mockResolvedValue("admin-auth-id");
    mockDbSelectResult = [];
    mockDbError = false;
    selectCallCount = 0;
  });

  // Scenario: Non-admin user is rejected
  it("API-reportdetail-01: should return 401 for non-admin users", async () => {
    mockRequireAdmin.mockResolvedValue(null);

    const { GET } = await import("@/app/api/admin/reports/[id]/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost/api/admin/reports/report-1");
    const res = await GET(req, { params: Promise.resolve({ id: "report-1" }) });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  // Scenario: Report not found
  it("API-reportdetail-02: should return 404 when report does not exist", async () => {
    mockDbSelectResult = {
      report: [],
      sections: [],
      apiUsage: [],
      cost: [{ total: "0" }],
    };

    const { GET } = await import("@/app/api/admin/reports/[id]/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost/api/admin/reports/nonexistent");
    const res = await GET(req, { params: Promise.resolve({ id: "nonexistent" }) });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Report not found");
  });

  // Scenario: Admin views a completed report detail
  it("API-reportdetail-03: should return full report detail for admin", async () => {
    mockDbSelectResult = {
      report: [mockReportRow],
      sections: [
        {
          id: "section-1",
          sectionType: "executive_summary",
          title: "Executive Summary",
          agentName: "InsightGenerator",
          sortOrder: 1,
          generatedAt: new Date("2026-03-10T10:24:00Z"),
        },
      ],
      apiUsage: [
        {
          id: "usage-1",
          provider: "anthropic",
          endpoint: "messages",
          cost: "0.052000",
          tokensUsed: 4500,
          responseTimeMs: 4200,
          cached: 0,
          createdAt: new Date("2026-03-10T10:24:00Z"),
        },
      ],
      cost: [{ total: "0.052000" }],
    };

    const { GET } = await import("@/app/api/admin/reports/[id]/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost/api/admin/reports/report-1");
    const res = await GET(req, { params: Promise.resolve({ id: "report-1" }) });

    expect(res.status).toBe(200);
    const body = await res.json();

    // Report fields
    expect(body.report.id).toBe("report-1");
    expect(body.report.title).toBe("Naples Q1 2026");
    expect(body.report.status).toBe("completed");
    expect(body.report.generationTimeMs).toBeGreaterThan(0);

    // User fields
    expect(body.user.name).toBe("Jane Smith");
    expect(body.user.company).toBe("Acme Realty");
    expect(body.user.email).toBe("jane@acme.com");

    // Market fields
    expect(body.market.name).toBe("Naples, FL");
    expect(body.market.city).toBe("Naples");
    expect(body.market.luxuryTier).toBe("luxury");

    // Sections
    expect(body.sections).toHaveLength(1);
    expect(body.sections[0].title).toBe("Executive Summary");
    expect(body.sections[0].agentName).toBe("InsightGenerator");

    // API usage
    expect(body.apiUsage).toHaveLength(1);
    expect(body.apiUsage[0].provider).toBe("anthropic");
    expect(body.totalApiCost).toBe("0.0520");
  });

  // Scenario: Error state
  it("API-reportdetail-04: should return 500 on database error", async () => {
    mockDbError = true;

    const { GET } = await import("@/app/api/admin/reports/[id]/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost/api/admin/reports/report-1");
    const res = await GET(req, { params: Promise.resolve({ id: "report-1" }) });

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  // Scenario: Admin views a failed report with error details
  it("API-reportdetail-05: should return error details for failed reports", async () => {
    const failedReport = {
      ...mockReportRow,
      status: "failed",
      errorDetails: {
        agent: "InsightGenerator",
        message: "API timeout after 30s",
        occurredAt: "2026-03-10T10:25:00Z",
        stageIndex: 2,
        totalStages: 6,
        previousErrors: [
          { agent: "DataAnalyst", message: "Rate limit exceeded", occurredAt: "2026-03-10T10:24:00Z" },
        ],
      },
    };
    mockDbSelectResult = {
      report: [failedReport],
      sections: [],
      apiUsage: [],
      cost: [{ total: "0" }],
    };

    const { GET } = await import("@/app/api/admin/reports/[id]/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost/api/admin/reports/report-1");
    const res = await GET(req, { params: Promise.resolve({ id: "report-1" }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.report.status).toBe("failed");
    expect(body.report.errorDetails).toBeDefined();
    expect(body.report.errorDetails.agent).toBe("InsightGenerator");
    expect(body.report.errorDetails.previousErrors).toHaveLength(1);
  });
});
