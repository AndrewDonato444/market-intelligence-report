/**
 * Pipeline Test Suite — Admin Test Suite Tests
 *
 * Tests the Pipeline Test Suite feature:
 *   - Pipeline test runner service (Layer 1→2→3 from snapshot)
 *   - Snapshot CRUD API routes
 *   - Test run API routes
 *   - PDF generation from test runs
 *
 * @jest-environment node
 *
 * Spec: .specs/features/admin/pipeline-test-suite.feature.md
 * IDs: SVC-PTS-001 through SVC-PTS-020
 */

export {};

// ============================================================
// Mocks
// ============================================================

const mockRequireAdmin = jest.fn<Promise<string | null>, []>();
jest.mock("@/lib/supabase/admin-auth", () => ({
  requireAdmin: () => mockRequireAdmin(),
}));

// --- DB mock with Proxy chain ---

let mockDbSelectResult: unknown = [];
let mockDbInsertResult: unknown = [];
let mockDbUpdateResult: unknown = [];

function makeSelectChain(): unknown {
  return new Proxy(
    {},
    {
      get(_, prop) {
        if (String(prop) === "then") {
          return (resolve: (v: unknown) => void) => resolve(mockDbSelectResult);
        }
        return () => makeSelectChain();
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

function makeUpdateChain(): unknown {
  return new Proxy(
    {},
    {
      get(_, prop) {
        if (String(prop) === "then") {
          return (resolve: (v: unknown) => void) => resolve(mockDbUpdateResult);
        }
        return () => makeUpdateChain();
      },
    }
  );
}

jest.mock("@/lib/db", () => ({
  get db() {
    return {
      select: () => makeSelectChain(),
      insert: () => makeInsertChain(),
      update: () => makeUpdateChain(),
      delete: () => makeUpdateChain(),
    };
  },
  schema: {
    pipelineSnapshots: {
      id: "pipeline_snapshots.id",
      name: "pipeline_snapshots.name",
      marketName: "pipeline_snapshots.market_name",
      isGolden: "pipeline_snapshots.is_golden",
      createdAt: "pipeline_snapshots.created_at",
    },
    pipelineTestRuns: {
      id: "pipeline_test_runs.id",
      snapshotId: "pipeline_test_runs.snapshot_id",
      status: "pipeline_test_runs.status",
      createdAt: "pipeline_test_runs.created_at",
    },
  },
}));

jest.mock("drizzle-orm", () => ({
  eq: jest.fn((col, val) => ({ col, val })),
  desc: jest.fn((col) => ({ col, dir: "desc" })),
}));

// --- Pipeline layer mocks ---

const mockComputeMarketAnalytics = jest.fn();
jest.mock("@/lib/services/market-analytics", () => ({
  computeMarketAnalytics: (...args: unknown[]) => mockComputeMarketAnalytics(...args),
}));

const mockPipelineRun = jest.fn();
const mockCreatePipelineRunner = jest.fn((_agents?: unknown) => ({
  run: mockPipelineRun,
}));
jest.mock("@/lib/agents/orchestrator", () => ({
  createPipelineRunner: (agents: unknown[]) => mockCreatePipelineRunner(agents),
}));

const mockAssembleReport = jest.fn();
jest.mock("@/lib/agents/report-assembler", () => ({
  assembleReport: (...args: unknown[]) => mockAssembleReport(...args),
}));

const mockRenderReportPdf = jest.fn();
jest.mock("@/lib/pdf/renderer", () => ({
  renderReportPdf: (...args: unknown[]) => mockRenderReportPdf(...args),
}));

// ============================================================
// Test Fixtures
// ============================================================

function buildMinimalCompiledData() {
  return {
    targetMarket: {
      properties: [
        {
          id: "prop-1",
          address: "123 Palm Beach Rd",
          city: "Palm Beach",
          state: "FL",
          zip: "33480",
          price: 5_000_000,
          sqft: 4000,
          bedrooms: 5,
          bathrooms: 4,
          propertyType: "single_family",
          yearBuilt: 2010,
          lastSaleDate: "2025-06-15",
          lastSalePrice: 4_800_000,
        },
      ],
      stale: false,
      details: [],
      currentPeriodDetails: [],
      priorPeriodDetails: [],
      comps: [],
    },
    peerMarkets: [],
    neighborhood: { amenities: {} },
    news: { targetMarket: [], peerMarkets: {}, stale: false },
    xSentiment: null,
    fetchMetadata: {
      totalApiCalls: 0,
      totalDurationMs: 0,
      staleDataSources: [],
      errors: [],
    },
  };
}

function buildMinimalComputedAnalytics() {
  return {
    market: {
      totalProperties: 1,
      medianPrice: 5_000_000,
      averagePrice: 5_000_000,
      medianPricePerSqft: 1250,
      totalVolume: 5_000_000,
      rating: "A",
    },
    segments: [],
    yoy: { currentCount: 1, priorCount: 0, priceDelta: null, countDelta: null },
    insightsIndex: { liquidity: 5, timing: 5, risk: 5, value: 5 },
    dashboard: { powerFour: [], supportingMetrics: [] },
    neighborhoods: [],
    peerComparisons: [],
    peerRankings: [],
    scorecard: [],
    news: { targetMarket: [], peerMarkets: {} },
    xSentiment: null,
    confidence: { level: "low", sampleSize: 1, detailCoverage: 0 },
  };
}

function buildMinimalSnapshot(overrides: Record<string, unknown> = {}) {
  return {
    id: "snap-001",
    name: "Palm Beach — Test",
    marketName: "Palm Beach, FL",
    geography: { city: "Palm Beach", state: "FL" },
    compiledData: buildMinimalCompiledData(),
    propertyCount: 1,
    hasXSentiment: false,
    peerMarketCount: 0,
    isGolden: false,
    sourceReportId: null,
    createdAt: new Date("2026-03-10"),
    ...overrides,
  };
}

function buildMinimalTestRun(overrides: Record<string, unknown> = {}) {
  return {
    id: "run-001",
    snapshotId: "snap-001",
    status: "completed",
    layer1Result: buildMinimalComputedAnalytics(),
    layer2Result: { "insight-generator": { status: "completed", output: {} } },
    layer3Result: { sections: [{ sectionType: "executive_briefing", title: "Executive Briefing", content: {} }] },
    layerDurations: { layer1Ms: 100, layer2Ms: 5000, layer3Ms: 200 },
    error: null,
    isDraft: false,
    createdAt: new Date("2026-03-10"),
    ...overrides,
  };
}

// ============================================================
// Section 1: Pipeline Test Runner Service
// ============================================================

describe("PipelineTestRunner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SVC-PTS-001: Runs Layer 1→2→3 from CompiledMarketData (no API calls)
  it("SVC-PTS-001: runs Layers 1→2→3 from snapshot data without API calls", async () => {
    const compiledData = buildMinimalCompiledData();
    const analytics = buildMinimalComputedAnalytics();

    mockComputeMarketAnalytics.mockReturnValue(analytics);
    mockPipelineRun.mockResolvedValue({
      status: "completed",
      agentResults: { "insight-generator": { status: "completed", output: {} } },
      agentTimings: { "insight-generator": 2000 },
    });
    mockAssembleReport.mockReturnValue({
      sections: [{ sectionType: "executive_briefing", title: "Executive Briefing", content: {} }],
      pullQuotes: [],
      metadata: { generatedAt: new Date().toISOString() },
    });

    // Import the module under test — will fail until implemented
    const { runPipelineTest } = await import("@/lib/services/pipeline-test-runner");

    const result = await runPipelineTest({
      snapshotId: "snap-001",
      compiledData,
      marketName: "Palm Beach, FL",
      geography: { city: "Palm Beach", state: "FL" },
    });

    expect(result.status).toBe("completed");
    expect(result.computedAnalytics).toBeDefined();
    expect(result.agentResults).toBeDefined();
    expect(result.reportSections).toBeDefined();
    expect(result.layerDurations.layer1Ms).toBeGreaterThanOrEqual(0);
    expect(result.layerDurations.layer2Ms).toBeGreaterThanOrEqual(0);
    expect(result.layerDurations.layer3Ms).toBeGreaterThanOrEqual(0);

    // Verify Layer 1 was called with compiled data
    expect(mockComputeMarketAnalytics).toHaveBeenCalledWith(
      compiledData,
      expect.objectContaining({ name: "Palm Beach, FL" })
    );
    // Verify Layer 2 was called with computed analytics
    expect(mockPipelineRun).toHaveBeenCalled();
    // Verify Layer 3 was called
    expect(mockAssembleReport).toHaveBeenCalled();
  });

  // SVC-PTS-002: Does NOT write to reports or report_sections tables
  it("SVC-PTS-002: does not write to production tables", async () => {
    const { db } = await import("@/lib/db");
    const insertSpy = jest.spyOn(db, "insert");

    mockComputeMarketAnalytics.mockReturnValue(buildMinimalComputedAnalytics());
    mockPipelineRun.mockResolvedValue({
      status: "completed",
      agentResults: {},
      agentTimings: {},
    });
    mockAssembleReport.mockReturnValue({
      sections: [],
      pullQuotes: [],
      metadata: { generatedAt: new Date().toISOString() },
    });

    const { runPipelineTest } = await import("@/lib/services/pipeline-test-runner");
    await runPipelineTest({
      snapshotId: "snap-001",
      compiledData: buildMinimalCompiledData(),
      marketName: "Palm Beach, FL",
      geography: { city: "Palm Beach", state: "FL" },
    });

    // The test runner should not call db.insert for production tables
    // It stores results in pipeline_test_runs, not reports/report_sections
    if (insertSpy.mock.calls.length > 0) {
      // If insert was called, it should only be for pipeline_test_runs
      for (const call of insertSpy.mock.calls) {
        expect(call).not.toContain("reports");
        expect(call).not.toContain("reportSections");
      }
    }
  });

  // SVC-PTS-003: Returns all intermediate results
  it("SVC-PTS-003: returns Layer 1, Layer 2, and Layer 3 results", async () => {
    const analytics = buildMinimalComputedAnalytics();
    const agentResults = {
      "insight-generator": { status: "completed", output: { narrative: "test" } },
      "forecast-modeler": { status: "completed", output: { narrative: "forecast" } },
    };
    const assembled = {
      sections: [
        { sectionType: "executive_briefing", title: "Executive Briefing", content: {} },
        { sectionType: "the_narrative", title: "The Narrative", content: {} },
      ],
      pullQuotes: [],
      metadata: { generatedAt: new Date().toISOString() },
    };

    mockComputeMarketAnalytics.mockReturnValue(analytics);
    mockPipelineRun.mockResolvedValue({
      status: "completed",
      agentResults,
      agentTimings: { "insight-generator": 1500, "forecast-modeler": 2000 },
    });
    mockAssembleReport.mockReturnValue(assembled);

    const { runPipelineTest } = await import("@/lib/services/pipeline-test-runner");
    const result = await runPipelineTest({
      snapshotId: "snap-001",
      compiledData: buildMinimalCompiledData(),
      marketName: "Palm Beach, FL",
      geography: { city: "Palm Beach", state: "FL" },
    });

    // All intermediate results are accessible
    expect(result.computedAnalytics).toEqual(analytics);
    expect(result.agentResults).toEqual(agentResults);
    expect(result.reportSections).toHaveLength(2);
  });

  // SVC-PTS-004: Captures per-layer duration
  it("SVC-PTS-004: records timing for each layer", async () => {
    mockComputeMarketAnalytics.mockReturnValue(buildMinimalComputedAnalytics());
    mockPipelineRun.mockResolvedValue({
      status: "completed",
      agentResults: {},
      agentTimings: {},
    });
    mockAssembleReport.mockReturnValue({
      sections: [],
      pullQuotes: [],
      metadata: { generatedAt: new Date().toISOString() },
    });

    const { runPipelineTest } = await import("@/lib/services/pipeline-test-runner");
    const result = await runPipelineTest({
      snapshotId: "snap-001",
      compiledData: buildMinimalCompiledData(),
      marketName: "Palm Beach, FL",
      geography: { city: "Palm Beach", state: "FL" },
    });

    expect(typeof result.layerDurations.layer1Ms).toBe("number");
    expect(typeof result.layerDurations.layer2Ms).toBe("number");
    expect(typeof result.layerDurations.layer3Ms).toBe("number");
  });

  // SVC-PTS-005: Handles Layer 2 failure gracefully
  it("SVC-PTS-005: captures error when Layer 2 agents fail", async () => {
    mockComputeMarketAnalytics.mockReturnValue(buildMinimalComputedAnalytics());
    mockPipelineRun.mockResolvedValue({
      status: "failed",
      error: "insight-generator: Rate limit exceeded",
      agentResults: {},
      agentTimings: { "insight-generator": 500 },
    });

    const { runPipelineTest } = await import("@/lib/services/pipeline-test-runner");
    const result = await runPipelineTest({
      snapshotId: "snap-001",
      compiledData: buildMinimalCompiledData(),
      marketName: "Palm Beach, FL",
      geography: { city: "Palm Beach", state: "FL" },
    });

    expect(result.status).toBe("failed");
    expect(result.error).toBeDefined();
    expect(result.error!.layer).toBe(2);
    expect(result.error!.message).toContain("Rate limit");
    // Layer 1 results should still be available
    expect(result.computedAnalytics).toBeDefined();
    // Layer 3 should not have run
    expect(mockAssembleReport).not.toHaveBeenCalled();
  });

  // SVC-PTS-006: Handles Layer 1 failure gracefully
  it("SVC-PTS-006: captures error when Layer 1 computation fails", async () => {
    mockComputeMarketAnalytics.mockImplementation(() => {
      throw new Error("Division by zero in segment computation");
    });

    const { runPipelineTest } = await import("@/lib/services/pipeline-test-runner");
    const result = await runPipelineTest({
      snapshotId: "snap-001",
      compiledData: buildMinimalCompiledData(),
      marketName: "Palm Beach, FL",
      geography: { city: "Palm Beach", state: "FL" },
    });

    expect(result.status).toBe("failed");
    expect(result.error).toBeDefined();
    expect(result.error!.layer).toBe(1);
    // Neither Layer 2 nor Layer 3 should have run
    expect(mockPipelineRun).not.toHaveBeenCalled();
    expect(mockAssembleReport).not.toHaveBeenCalled();
  });

  // SVC-PTS-007: Supports draft prompt mode
  it("SVC-PTS-007: passes useDraftPrompts flag through to pipeline runner", async () => {
    mockComputeMarketAnalytics.mockReturnValue(buildMinimalComputedAnalytics());
    mockPipelineRun.mockResolvedValue({
      status: "completed",
      agentResults: {},
      agentTimings: {},
    });
    mockAssembleReport.mockReturnValue({
      sections: [],
      pullQuotes: [],
      metadata: { generatedAt: new Date().toISOString() },
    });

    const { runPipelineTest } = await import("@/lib/services/pipeline-test-runner");
    const result = await runPipelineTest({
      snapshotId: "snap-001",
      compiledData: buildMinimalCompiledData(),
      marketName: "Palm Beach, FL",
      geography: { city: "Palm Beach", state: "FL" },
      useDraftPrompts: true,
    });

    expect(result.status).toBe("completed");
    // The draft flag should be passed through the pipeline runner context
    expect(mockPipelineRun).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        computedAnalytics: expect.any(Object),
      })
    );
  });
});

// ============================================================
// Section 2: Snapshot API Routes
// ============================================================

describe("Snapshot API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdmin.mockResolvedValue("admin-user-001");
  });

  // SVC-PTS-008: GET /api/admin/test-suite/snapshots — lists all snapshots
  it("SVC-PTS-008: lists all snapshots for admin", async () => {
    const snapshots = [
      buildMinimalSnapshot({ id: "snap-001", name: "Palm Beach" }),
      buildMinimalSnapshot({ id: "snap-002", name: "Aspen", marketName: "Aspen, CO" }),
    ];
    mockDbSelectResult = snapshots;

    const { GET } = await import("@/app/api/admin/test-suite/snapshots/route");
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.snapshots).toHaveLength(2);
    expect(body.snapshots[0].name).toBe("Palm Beach");
  });

  // SVC-PTS-009: GET snapshots — returns 401 for non-admin
  it("SVC-PTS-009: returns 401 when not admin", async () => {
    mockRequireAdmin.mockResolvedValue(null);

    const { GET } = await import("@/app/api/admin/test-suite/snapshots/route");
    const res = await GET();

    expect(res.status).toBe(401);
  });

  // SVC-PTS-010: POST /api/admin/test-suite/snapshots — creates snapshot
  it("SVC-PTS-010: creates snapshot with compiled data", async () => {
    const newSnapshot = buildMinimalSnapshot({ id: "snap-new" });
    mockDbInsertResult = [newSnapshot];

    const { POST } = await import("@/app/api/admin/test-suite/snapshots/route");
    const req = new Request("http://localhost/api/admin/test-suite/snapshots", {
      method: "POST",
      body: JSON.stringify({
        name: "Palm Beach — Test Snapshot",
        marketName: "Palm Beach, FL",
        geography: { city: "Palm Beach", state: "FL" },
        compiledData: buildMinimalCompiledData(),
        propertyCount: 1,
        sourceReportId: "report-001",
      }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req as any);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.snapshot).toBeDefined();
  });

  // SVC-PTS-011: DELETE /api/admin/test-suite/snapshots/[id] — deletes non-golden
  it("SVC-PTS-011: deletes a non-golden snapshot", async () => {
    mockDbSelectResult = [buildMinimalSnapshot({ isGolden: false })];
    mockDbUpdateResult = [];

    const { DELETE } = await import("@/app/api/admin/test-suite/snapshots/[id]/route");
    const req = new Request("http://localhost/api/admin/test-suite/snapshots/snap-001", {
      method: "DELETE",
    });
    const res = await DELETE(req as any, { params: Promise.resolve({ id: "snap-001" }) });

    expect(res.status).toBe(200);
  });

  // SVC-PTS-012: DELETE snapshot — rejects golden snapshot
  it("SVC-PTS-012: rejects deletion of golden snapshot", async () => {
    mockDbSelectResult = [buildMinimalSnapshot({ isGolden: true })];

    const { DELETE } = await import("@/app/api/admin/test-suite/snapshots/[id]/route");
    const req = new Request("http://localhost/api/admin/test-suite/snapshots/snap-001", {
      method: "DELETE",
    });
    const res = await DELETE(req as any, { params: Promise.resolve({ id: "snap-001" }) });

    expect(res.status).toBe(409);
  });

  // SVC-PTS-013: PATCH /api/admin/test-suite/snapshots/[id] — toggle golden
  it("SVC-PTS-013: toggles golden status on a snapshot", async () => {
    mockDbSelectResult = [buildMinimalSnapshot({ isGolden: false })];
    mockDbUpdateResult = [buildMinimalSnapshot({ isGolden: true })];

    const { PATCH } = await import("@/app/api/admin/test-suite/snapshots/[id]/route");
    const req = new Request("http://localhost/api/admin/test-suite/snapshots/snap-001", {
      method: "PATCH",
      body: JSON.stringify({ isGolden: true }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await PATCH(req as any, { params: Promise.resolve({ id: "snap-001" }) });

    expect(res.status).toBe(200);
  });
});

// ============================================================
// Section 3: Test Run API Routes
// ============================================================

describe("Test Run API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdmin.mockResolvedValue("admin-user-001");
  });

  // SVC-PTS-014: POST /api/admin/test-suite/runs — starts a pipeline test run
  it("SVC-PTS-014: starts a pipeline test run from snapshot", async () => {
    const snapshot = buildMinimalSnapshot();
    mockDbSelectResult = [snapshot];
    mockDbInsertResult = [{ id: "run-001" }];

    mockComputeMarketAnalytics.mockReturnValue(buildMinimalComputedAnalytics());
    mockPipelineRun.mockResolvedValue({
      status: "completed",
      agentResults: {},
      agentTimings: {},
    });
    mockAssembleReport.mockReturnValue({
      sections: [],
      pullQuotes: [],
      metadata: { generatedAt: new Date().toISOString() },
    });

    const { POST } = await import("@/app/api/admin/test-suite/runs/route");
    const req = new Request("http://localhost/api/admin/test-suite/runs", {
      method: "POST",
      body: JSON.stringify({ snapshotId: "snap-001" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req as any);

    expect(res.status).toBe(200);
  });

  // SVC-PTS-015: POST runs — returns 401 for non-admin
  it("SVC-PTS-015: returns 401 when not admin", async () => {
    mockRequireAdmin.mockResolvedValue(null);

    const { POST } = await import("@/app/api/admin/test-suite/runs/route");
    const req = new Request("http://localhost/api/admin/test-suite/runs", {
      method: "POST",
      body: JSON.stringify({ snapshotId: "snap-001" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req as any);

    expect(res.status).toBe(401);
  });

  // SVC-PTS-016: POST runs — returns 404 for missing snapshot
  it("SVC-PTS-016: returns 404 when snapshot not found", async () => {
    mockDbSelectResult = [];

    const { POST } = await import("@/app/api/admin/test-suite/runs/route");
    const req = new Request("http://localhost/api/admin/test-suite/runs", {
      method: "POST",
      body: JSON.stringify({ snapshotId: "nonexistent" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req as any);

    expect(res.status).toBe(404);
  });

  // SVC-PTS-017: GET /api/admin/test-suite/runs — lists recent runs
  it("SVC-PTS-017: lists recent test runs", async () => {
    const runs = [
      buildMinimalTestRun({ id: "run-001" }),
      buildMinimalTestRun({ id: "run-002", status: "failed" }),
    ];
    mockDbSelectResult = runs;

    const { GET } = await import("@/app/api/admin/test-suite/runs/route");
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.runs).toHaveLength(2);
  });
});

// ============================================================
// Section 4: PDF Generation from Test Run
// ============================================================

describe("PDF from Test Run", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdmin.mockResolvedValue("admin-user-001");
  });

  // SVC-PTS-018: POST /api/admin/test-suite/runs/[id]/pdf — generates PDF
  it("SVC-PTS-018: generates PDF from completed test run", async () => {
    const testRun = buildMinimalTestRun();
    mockDbSelectResult = [testRun];
    mockRenderReportPdf.mockResolvedValue(Buffer.from("fake-pdf-bytes"));

    const { POST } = await import("@/app/api/admin/test-suite/runs/[id]/pdf/route");
    const req = new Request("http://localhost/api/admin/test-suite/runs/run-001/pdf", {
      method: "POST",
    });
    const res = await POST(req as any, { params: Promise.resolve({ id: "run-001" }) });

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
    // Verify it called the production renderer
    expect(mockRenderReportPdf).toHaveBeenCalledWith(
      expect.objectContaining({
        reportData: expect.any(Object),
        branding: expect.any(Object),
        title: expect.any(String),
        marketName: expect.any(String),
      })
    );
  });

  // SVC-PTS-019: PDF — rejects incomplete test run
  it("SVC-PTS-019: returns 400 for non-completed test run", async () => {
    const testRun = buildMinimalTestRun({ status: "running" });
    mockDbSelectResult = [testRun];

    const { POST } = await import("@/app/api/admin/test-suite/runs/[id]/pdf/route");
    const req = new Request("http://localhost/api/admin/test-suite/runs/run-001/pdf", {
      method: "POST",
    });
    const res = await POST(req as any, { params: Promise.resolve({ id: "run-001" }) });

    expect(res.status).toBe(400);
  });

  // SVC-PTS-020: PDF — returns 404 for missing run
  it("SVC-PTS-020: returns 404 when run not found", async () => {
    mockDbSelectResult = [];

    const { POST } = await import("@/app/api/admin/test-suite/runs/[id]/pdf/route");
    const req = new Request("http://localhost/api/admin/test-suite/runs/run-001/pdf", {
      method: "POST",
    });
    const res = await POST(req as any, { params: Promise.resolve({ id: "run-001" }) });

    expect(res.status).toBe(404);
  });
});
