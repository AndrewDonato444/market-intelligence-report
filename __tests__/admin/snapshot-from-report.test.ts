/**
 * Snapshot from Report — API Tests
 *
 * Tests for POST /api/admin/test-suite/snapshots/from-report
 * Creates a pipeline test snapshot from a completed report by re-running
 * Layer 0 (data fetch) using the report's market parameters.
 *
 * @jest-environment node
 *
 * Spec: .specs/features/pipeline/snapshot-from-report.feature.md
 * IDs: API-SNAP-FR-001 through API-SNAP-FR-008
 */

export {};

// ============================================================
// Mocks
// ============================================================

const mockRequireAdmin = jest.fn<Promise<string | null>, []>();
jest.mock("@/lib/supabase/admin-auth", () => ({
  requireAdmin: () => mockRequireAdmin(),
}));

// --- DB mock with multi-call support ---
// Each db.select() call gets the next result from dbSelectResults.
// Chain methods (.from, .where, .limit) reuse the same result.

let dbSelectResults: unknown[][] = [];
let dbSelectCallCount = 0;
let mockDbInsertResult: unknown = [];

function makeChainFor(result: unknown[]): unknown {
  return new Proxy(
    {},
    {
      get(_, prop) {
        if (String(prop) === "then") {
          return (resolve: (v: unknown) => void) => resolve(result);
        }
        return () => makeChainFor(result);
      },
    }
  );
}

function makeInsertChain(): unknown {
  return new Proxy(
    {},
    {
      get(_, prop) {
        if (String(prop) === "then") {
          return (resolve: (v: unknown) => void) => resolve(mockDbInsertResult);
        }
        return () => makeInsertChain();
      },
    }
  );
}

jest.mock("@/lib/db", () => ({
  get db() {
    return {
      select: () => {
        const result = dbSelectResults[dbSelectCallCount] ?? [];
        dbSelectCallCount++;
        return makeChainFor(result);
      },
      insert: () => makeInsertChain(),
    };
  },
  schema: {
    reports: {
      id: "reports.id",
      status: "reports.status",
      title: "reports.title",
      userId: "reports.user_id",
      marketId: "reports.market_id",
    },
    markets: {
      id: "markets.id",
      name: "markets.name",
      geography: "markets.geography",
      luxuryTier: "markets.luxury_tier",
      priceFloor: "markets.price_floor",
      priceCeiling: "markets.price_ceiling",
      segments: "markets.segments",
      propertyTypes: "markets.property_types",
      peerMarkets: "markets.peer_markets",
    },
    pipelineSnapshots: {
      id: "pipeline_snapshots.id",
      name: "pipeline_snapshots.name",
      marketName: "pipeline_snapshots.market_name",
      sourceReportId: "pipeline_snapshots.source_report_id",
      createdAt: "pipeline_snapshots.created_at",
    },
  },
}));

jest.mock("drizzle-orm", () => ({
  eq: jest.fn((col, val) => ({ col, val })),
  desc: jest.fn((col) => ({ col, dir: "desc" })),
}));

// --- Data fetcher mock ---

const mockFetchAllMarketData = jest.fn();
jest.mock("@/lib/services/data-fetcher", () => ({
  fetchAllMarketData: (...args: unknown[]) => mockFetchAllMarketData(...args),
}));

// ============================================================
// Test Fixtures
// ============================================================

function buildCompiledData(overrides: Record<string, unknown> = {}) {
  return {
    targetMarket: {
      properties: [
        { id: "p1", address: { address: "100 Ocean Dr" }, price: 8_000_000, squareFeet: 5000, propertyType: "single_family", lastSaleDate: "2025-08-01", lastSaleAmount: "7500000" },
        { id: "p2", address: { address: "200 Beach Ave" }, price: 12_000_000, squareFeet: 7200, propertyType: "estate", lastSaleDate: "2025-09-15", lastSaleAmount: "11000000" },
      ],
      stale: false,
      details: [],
      currentPeriodDetails: [],
      priorPeriodDetails: [],
      comps: [],
    },
    peerMarkets: [
      { name: "Miami Beach, FL", properties: [], stale: false, details: [], comps: [] },
    ],
    neighborhood: { amenities: {} },
    news: { targetMarket: [], peerMarkets: {}, stale: false },
    xSentiment: { posts: [{ text: "Naples luxury is booming", sentiment: "positive" }] },
    fetchMetadata: { totalApiCalls: 5, totalDurationMs: 3200, staleDataSources: [], errors: [] },
    ...overrides,
  };
}

function buildReportRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "report-001",
    title: "Naples Ultra-Luxury Market Intelligence Report",
    status: "completed",
    userId: "user-001",
    marketId: "market-001",
    ...overrides,
  };
}

function buildMarketRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "market-001",
    name: "Naples, FL",
    geography: { city: "Naples", state: "Florida" },
    luxuryTier: "ultra_luxury",
    priceFloor: 10_000_000,
    priceCeiling: null,
    segments: ["waterfront", "gated community"],
    propertyTypes: ["single_family", "estate"],
    peerMarkets: [{ name: "Miami Beach", geography: { city: "Miami Beach", state: "Florida" } }],
    ...overrides,
  };
}

function buildCreatedSnapshot(overrides: Record<string, unknown> = {}) {
  return {
    id: "snap-new-001",
    name: "Naples, FL — from Report Naples Ultra-Luxury...",
    marketName: "Naples, FL",
    propertyCount: 2,
    hasXSentiment: true,
    peerMarketCount: 1,
    isGolden: false,
    sourceReportId: "report-001",
    createdAt: new Date("2026-03-14"),
    ...overrides,
  };
}

// ============================================================
// Helpers
// ============================================================

function makeRequest(body: Record<string, unknown> = {}) {
  return new Request("http://localhost/api/admin/test-suite/snapshots/from-report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ============================================================
// Tests
// ============================================================

describe("POST /api/admin/test-suite/snapshots/from-report", () => {
  let POST: (req: Request) => Promise<Response>;

  beforeAll(async () => {
    const mod = await import("@/app/api/admin/test-suite/snapshots/from-report/route");
    POST = mod.POST;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    dbSelectResults = [];
    dbSelectCallCount = 0;
    mockDbInsertResult = [];
    mockRequireAdmin.mockResolvedValue("admin-001");
  });

  // --- API-SNAP-FR-001: Unauthorized ---
  it("API-SNAP-FR-001: returns 401 when not admin", async () => {
    mockRequireAdmin.mockResolvedValue(null);

    const res = await POST(makeRequest({ reportId: "report-001" }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  // --- API-SNAP-FR-002: Missing reportId ---
  it("API-SNAP-FR-002: returns 400 when reportId is missing", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/reportId/i);
  });

  // --- API-SNAP-FR-003: Report not found ---
  it("API-SNAP-FR-003: returns 404 when report does not exist", async () => {
    dbSelectResults = [[]]; // No report found

    const res = await POST(makeRequest({ reportId: "nonexistent" }));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toMatch(/not found/i);
  });

  // --- API-SNAP-FR-004: Report not completed ---
  it("API-SNAP-FR-004: returns 422 when report is not completed", async () => {
    dbSelectResults = [[buildReportRow({ status: "generating" })]];

    const res = await POST(makeRequest({ reportId: "report-001" }));
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toMatch(/completed/i);
  });

  // --- API-SNAP-FR-005: Happy path — snapshot created ---
  it("API-SNAP-FR-005: creates snapshot from completed report", async () => {
    const reportRow = buildReportRow();
    const marketRow = buildMarketRow();
    const compiled = buildCompiledData();
    const createdSnap = buildCreatedSnapshot();

    dbSelectResults = [
      [reportRow],  // report lookup
      [marketRow],  // market lookup
    ];
    mockFetchAllMarketData.mockResolvedValue(compiled);
    mockDbInsertResult = [createdSnap];

    const res = await POST(makeRequest({ reportId: "report-001" }));
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.snapshot).toBeDefined();
    expect(body.snapshot.id).toBe("snap-new-001");
    expect(body.snapshot.sourceReportId).toBe("report-001");
  });

  // --- API-SNAP-FR-006: fetchAllMarketData called with correct params ---
  it("API-SNAP-FR-006: passes market parameters to fetchAllMarketData", async () => {
    const reportRow = buildReportRow();
    const marketRow = buildMarketRow();
    const compiled = buildCompiledData();
    const createdSnap = buildCreatedSnapshot();

    dbSelectResults = [[reportRow], [marketRow]];
    mockFetchAllMarketData.mockResolvedValue(compiled);
    mockDbInsertResult = [createdSnap];

    await POST(makeRequest({ reportId: "report-001" }));

    expect(mockFetchAllMarketData).toHaveBeenCalledTimes(1);
    const callArg = mockFetchAllMarketData.mock.calls[0][0];
    expect(callArg.market.geography).toEqual({ city: "Naples", state: "Florida" });
    expect(callArg.market.luxuryTier).toBe("ultra_luxury");
    expect(callArg.market.priceFloor).toBe(10_000_000);
  });

  // --- API-SNAP-FR-007: Metadata extracted correctly ---
  it("API-SNAP-FR-007: extracts propertyCount, hasXSentiment, peerMarketCount from compiled data", async () => {
    const reportRow = buildReportRow();
    const marketRow = buildMarketRow();
    const compiled = buildCompiledData();
    const createdSnap = buildCreatedSnapshot({ propertyCount: 2, hasXSentiment: true, peerMarketCount: 1 });

    dbSelectResults = [[reportRow], [marketRow]];
    mockFetchAllMarketData.mockResolvedValue(compiled);
    mockDbInsertResult = [createdSnap];

    const res = await POST(makeRequest({ reportId: "report-001" }));
    const body = await res.json();

    expect(body.snapshot.propertyCount).toBe(2);
    expect(body.snapshot.hasXSentiment).toBe(true);
    expect(body.snapshot.peerMarketCount).toBe(1);
  });

  // --- API-SNAP-FR-008: Data fetch failure returns 500 ---
  it("API-SNAP-FR-008: returns 500 when fetchAllMarketData fails", async () => {
    const reportRow = buildReportRow();
    const marketRow = buildMarketRow();

    dbSelectResults = [[reportRow], [marketRow]];
    mockFetchAllMarketData.mockRejectedValue(new Error("API timeout"));

    const res = await POST(makeRequest({ reportId: "report-001" }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/API timeout/i);
  });
});
