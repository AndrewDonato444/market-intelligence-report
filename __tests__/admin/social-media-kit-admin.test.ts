/**
 * Social Media Kit in Admin Tests
 *
 * Tests for:
 *   GET /api/admin/reports/[id]         — socialMediaKit field in report detail
 *   GET /api/admin/analytics            — socialMediaKits section in overview
 *   GET /api/admin/analytics/kits       — Dedicated kit analytics endpoint
 *
 * Spec: .specs/features/admin/social-media-kit-admin.feature.md
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
      select: (..._args: unknown[]) => {
        if (mockDbError) throw new Error("DB connection failed");
        selectCallCount++;
        const currentCall = selectCallCount;
        const makeChain = (): unknown =>
          new Proxy(
            {},
            {
              get(_, prop) {
                if (String(prop) === "then") {
                  if (Array.isArray(mockDbSelectResult)) {
                    return (resolve: (v: unknown) => void) => resolve(mockDbSelectResult);
                  }
                  const multi = mockDbSelectResult as Record<string, unknown>;
                  if (currentCall === 1) return (resolve: (v: unknown) => void) => resolve(multi.report ?? []);
                  if (currentCall === 2) return (resolve: (v: unknown) => void) => resolve(multi.sections ?? []);
                  if (currentCall === 3) return (resolve: (v: unknown) => void) => resolve(multi.apiUsage ?? []);
                  if (currentCall === 4) return (resolve: (v: unknown) => void) => resolve(multi.cost ?? [{ total: "0" }]);
                  if (currentCall === 5) return (resolve: (v: unknown) => void) => resolve(multi.kit ?? []);
                  return (resolve: (v: unknown) => void) => resolve([]);
                }
                return (..._a: unknown[]) => makeChain();
              },
            }
          );
        return makeChain();
      },
    };
  },
  schema: {
    reports: {
      id: "reports.id", title: "reports.title", status: "reports.status",
      config: "reports.config", version: "reports.version",
      userId: "reports.user_id", marketId: "reports.market_id",
      createdAt: "reports.created_at", updatedAt: "reports.updated_at",
      generationStartedAt: "reports.generation_started_at",
      generationCompletedAt: "reports.generation_completed_at",
      errorMessage: "reports.error_message", errorDetails: "reports.error_details",
      retriedAt: "reports.retried_at", retriedBy: "reports.retried_by",
      pdfUrl: "reports.pdf_url", shareToken: "reports.share_token",
    },
    users: { id: "users.id", name: "users.name", company: "users.company", email: "users.email", createdAt: "users.created_at" },
    markets: { id: "markets.id", name: "markets.name", geography: "markets.geography", luxuryTier: "markets.luxury_tier", priceFloor: "markets.price_floor" },
    reportSections: {
      id: "report_sections.id", reportId: "report_sections.report_id",
      sectionType: "report_sections.section_type", title: "report_sections.title",
      agentName: "report_sections.agent_name", sortOrder: "report_sections.sort_order",
      generatedAt: "report_sections.generated_at",
    },
    apiUsage: {
      id: "api_usage.id", reportId: "api_usage.report_id",
      provider: "api_usage.provider", endpoint: "api_usage.endpoint",
      cost: "api_usage.cost", tokensUsed: "api_usage.tokens_used",
      responseTimeMs: "api_usage.response_time_ms", cached: "api_usage.cached",
      createdAt: "api_usage.created_at",
    },
    socialMediaKits: {
      id: "social_media_kits.id", reportId: "social_media_kits.report_id",
      userId: "social_media_kits.user_id", status: "social_media_kits.status",
      content: "social_media_kits.content", errorMessage: "social_media_kits.error_message",
      generatedAt: "social_media_kits.generated_at",
      createdAt: "social_media_kits.created_at", updatedAt: "social_media_kits.updated_at",
    },
  },
}));

jest.mock("drizzle-orm", () => ({
  eq: jest.fn(),
  asc: jest.fn((col: unknown) => col),
  sum: jest.fn(),
  sql: Object.assign(jest.fn((..._a: unknown[]) => ({ as: () => "sql-tag", raw: jest.fn() })), { raw: jest.fn((..._a: unknown[]) => "sql-raw") }),
  and: jest.fn(), gte: jest.fn(), lt: jest.fn(), count: jest.fn(),
  isNotNull: jest.fn(), isNull: jest.fn(), desc: jest.fn(),
}));

const mockReportRow = {
  id: "report-1", title: "Naples Q1 2026", status: "completed", config: null, version: 1,
  createdAt: new Date("2026-03-10"), updatedAt: new Date("2026-03-10"),
  generationStartedAt: new Date("2026-03-10T10:23:00Z"),
  generationCompletedAt: new Date("2026-03-10T10:25:34Z"),
  errorMessage: null, errorDetails: null, retriedAt: null, retriedBy: null,
  pdfUrl: null, shareToken: null,
  userId: "user-1", userName: "Jane Smith", userCompany: "Acme Realty", userEmail: "jane@acme.com",
  marketId: "market-1", marketName: "Naples, FL",
  marketGeography: { city: "Naples", state: "FL" },
  marketLuxuryTier: "luxury", marketPriceFloor: 3000000,
};

const mockKitContent = {
  postIdeas: Array.from({ length: 8 }, (_, i) => ({ title: `Post ${i}`, body: "body", platforms: ["linkedin"], reportSection: "overview", insightRef: "ref" })),
  captions: Array.from({ length: 4 }, (_, i) => ({ platform: "instagram", caption: `Cap ${i}`, hashtags: ["#luxury"], characterCount: 100 })),
  personaPosts: Array.from({ length: 6 }, (_, i) => ({ personaSlug: "snowbird", personaName: "Snowbird", post: `Post ${i}`, platform: "linkedin", vocabularyUsed: ["luxury"] })),
  polls: Array.from({ length: 3 }, (_, i) => ({ question: `Q${i}?`, options: ["A", "B"], dataContext: "ctx", platform: "x" })),
  conversationStarters: Array.from({ length: 5 }, (_, i) => ({ context: `ctx${i}`, template: `tmpl${i}` })),
  calendarSuggestions: Array.from({ length: 4 }, (_, i) => ({ week: i + 1, theme: `theme${i}`, postIdeas: ["idea"], platforms: ["linkedin"] })),
  statCallouts: Array.from({ length: 6 }, (_, i) => ({ stat: `stat${i}`, context: "ctx", source: "src", suggestedCaption: "cap" })),
};

describe("Admin Report Detail API — socialMediaKit field", () => {
  beforeEach(() => {
    jest.clearAllMocks(); jest.resetModules();
    mockRequireAdmin.mockResolvedValue("admin-auth-id");
    mockDbSelectResult = []; mockDbError = false; selectCallCount = 0;
  });

  it("API-kitadmin-01: returns socialMediaKit with content counts for completed kit", async () => {
    mockDbSelectResult = {
      report: [mockReportRow], sections: [], apiUsage: [],
      cost: [{ total: "0" }],
      kit: [{ id: "kit-1", status: "completed", generatedAt: new Date("2026-03-10T10:45:00Z"), errorMessage: null, content: mockKitContent }],
    };
    const { GET } = await import("@/app/api/admin/reports/[id]/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost/api/admin/reports/report-1"), { params: Promise.resolve({ id: "report-1" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.socialMediaKit).toBeDefined();
    expect(body.socialMediaKit.id).toBe("kit-1");
    expect(body.socialMediaKit.status).toBe("completed");
    expect(body.socialMediaKit.contentCounts).toEqual({
      postIdeas: 8, captions: 4, personaPosts: 6, polls: 3,
      conversationStarters: 5, statCallouts: 6, calendarSuggestions: 4,
    });
  });

  it("API-kitadmin-02: returns socialMediaKit as null when no kit exists", async () => {
    mockDbSelectResult = { report: [mockReportRow], sections: [], apiUsage: [], cost: [{ total: "0" }], kit: [] };
    const { GET } = await import("@/app/api/admin/reports/[id]/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost/api/admin/reports/report-1"), { params: Promise.resolve({ id: "report-1" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.socialMediaKit).toBeNull();
  });

  it("API-kitadmin-03: returns kit error details for failed kits", async () => {
    mockDbSelectResult = {
      report: [mockReportRow], sections: [], apiUsage: [], cost: [{ total: "0" }],
      kit: [{ id: "kit-2", status: "failed", generatedAt: new Date("2026-03-10T10:45:00Z"), errorMessage: "Claude API rate limit exceeded (429)", content: null }],
    };
    const { GET } = await import("@/app/api/admin/reports/[id]/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost/api/admin/reports/report-1"), { params: Promise.resolve({ id: "report-1" }) });
    const body = await res.json();
    expect(body.socialMediaKit.status).toBe("failed");
    expect(body.socialMediaKit.errorMessage).toBe("Claude API rate limit exceeded (429)");
    expect(body.socialMediaKit.contentCounts.postIdeas).toBe(0);
  });

  it("API-kitadmin-04: returns generating kit with zero counts", async () => {
    mockDbSelectResult = {
      report: [mockReportRow], sections: [], apiUsage: [], cost: [{ total: "0" }],
      kit: [{ id: "kit-3", status: "generating", generatedAt: null, errorMessage: null, content: null }],
    };
    const { GET } = await import("@/app/api/admin/reports/[id]/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost/api/admin/reports/report-1"), { params: Promise.resolve({ id: "report-1" }) });
    const body = await res.json();
    expect(body.socialMediaKit.status).toBe("generating");
    expect(body.socialMediaKit.generatedAt).toBeNull();
  });
});

describe("Admin Kit Analytics — GET /api/admin/analytics/kits", () => {
  let mockKitDbResults: unknown[][] = [];
  let mockKitDbCallIndex = 0;
  let mockKitDbError = false;

  beforeEach(() => {
    jest.clearAllMocks(); jest.resetModules();
    mockRequireAdmin.mockResolvedValue("admin-auth-id");
    mockKitDbResults = []; mockKitDbCallIndex = 0; mockKitDbError = false;
    jest.mock("@/lib/db", () => ({
      get db() {
        return {
          select: (..._args: unknown[]) => {
            if (mockKitDbError) throw new Error("DB connection failed");
            const result = mockKitDbResults[mockKitDbCallIndex] ?? [];
            mockKitDbCallIndex++;
            const makeChain = (res: unknown): unknown =>
              new Proxy({}, {
                get(_, prop) {
                  if (String(prop) === "then") { return (resolve: (v: unknown) => void) => resolve(res); }
                  return (..._a: unknown[]) => makeChain(res);
                },
              });
            return makeChain(result);
          },
        };
      },
      schema: {
        socialMediaKits: {
          id: "social_media_kits.id", reportId: "social_media_kits.report_id",
          status: "social_media_kits.status", content: "social_media_kits.content",
          generatedAt: "social_media_kits.generated_at", createdAt: "social_media_kits.created_at",
        },
      },
    }));
  });

  it("API-kitadmin-08: returns 401 for non-admin users", async () => {
    mockRequireAdmin.mockResolvedValue(null);
    const { GET } = await import("@/app/api/admin/analytics/kits/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost/api/admin/analytics/kits"));
    expect(res.status).toBe(401);
  });

  it("API-kitadmin-09: returns kit analytics with all required fields", async () => {
    mockKitDbResults = [
      [{ date: "2026-03-10", count: 3 }],
      [{ content: mockKitContent }],
      [{ status: "completed", count: 10 }, { status: "failed", count: 2 }, { status: "generating", count: 1 }, { status: "queued", count: 0 }],
    ];
    const { GET } = await import("@/app/api/admin/analytics/kits/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost/api/admin/analytics/kits"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("volumeOverTime");
    expect(body).toHaveProperty("contentTypeCounts");
    expect(body).toHaveProperty("averageContentPerKit");
    expect(body).toHaveProperty("topContentTypes");
    expect(body).toHaveProperty("kitsByStatus");
  });

  it("API-kitadmin-10: returns zero values when no kits exist", async () => {
    mockKitDbResults = [[], [], []];
    const { GET } = await import("@/app/api/admin/analytics/kits/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost/api/admin/analytics/kits"));
    const body = await res.json();
    expect(body.volumeOverTime).toEqual([]);
    expect(body.kitsByStatus).toEqual({ completed: 0, failed: 0, generating: 0, queued: 0 });
    expect(body.contentTypeCounts.postIdeas).toBe(0);
  });

  it("API-kitadmin-11: respects period query parameter", async () => {
    mockKitDbResults = [[], [], []];
    const { GET } = await import("@/app/api/admin/analytics/kits/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost/api/admin/analytics/kits?period=7d"));
    const body = await res.json();
    expect(body).toHaveProperty("period", "7d");
  });

  it("API-kitadmin-12: returns 500 on database error", async () => {
    mockKitDbError = true;
    const { GET } = await import("@/app/api/admin/analytics/kits/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost/api/admin/analytics/kits"));
    expect(res.status).toBe(500);
  });
});
