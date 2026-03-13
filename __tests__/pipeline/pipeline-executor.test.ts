/**
 * Pipeline Executor Service Tests — v2 (4-Layer Architecture)
 *
 * Tests the execution glue that connects report creation to the 4-layer pipeline:
 *   Layer 0: Data Fetch → Layer 1: Compute → Layer 2: Agents → Layer 3: Assembly
 *
 * ID: SVC-PIPE-001 through SVC-PIPE-016
 */

import type {
  PipelineResult,
  PipelineProgress,
  SectionOutput,
} from "@/lib/agents/orchestrator";

// --- Mocks (hoisted by jest) ---

const mockRun = jest.fn();
const mockCancel = jest.fn();
const mockGetProgress = jest.fn();
const mockFetchAllMarketData = jest.fn();
const mockComputeMarketAnalytics = jest.fn();
const mockAssembleReport = jest.fn();

jest.mock("@/lib/db", () => {
  const dbObj = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue([]),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
  };
  return {
    db: dbObj,
    schema: {
      users: { id: "id", authId: "auth_id" },
      reports: {
        id: "id",
        userId: "user_id",
        marketId: "market_id",
        status: "status",
        generationStartedAt: "generation_started_at",
        generationCompletedAt: "generation_completed_at",
        errorMessage: "error_message",
        config: "config",
        title: "title",
      },
      markets: {
        id: "id",
        userId: "user_id",
        name: "name",
        geography: "geography",
        luxuryTier: "luxury_tier",
        priceFloor: "price_floor",
        priceCeiling: "price_ceiling",
        segments: "segments",
        propertyTypes: "property_types",
        peerMarkets: "peer_markets",
      },
      reportSections: {
        id: "id",
        reportId: "report_id",
        sectionType: "section_type",
        title: "title",
        content: "content",
        agentName: "agent_name",
        sortOrder: "sort_order",
        generatedAt: "generated_at",
      },
    },
  };
});

jest.mock("@/lib/agents/orchestrator", () => ({
  createPipelineRunner: jest.fn(() => ({
    run: mockRun,
    cancel: mockCancel,
    getProgress: mockGetProgress,
  })),
}));

// v2 agents (3 instead of 5)
jest.mock("@/lib/agents/insight-generator", () => ({
  insightGeneratorAgent: { name: "insight-generator", dependencies: [], execute: jest.fn() },
}));
jest.mock("@/lib/agents/forecast-modeler", () => ({
  forecastModelerAgent: { name: "forecast-modeler", dependencies: [], execute: jest.fn() },
}));
jest.mock("@/lib/agents/polish-agent", () => ({
  polishAgent: { name: "polish-agent", dependencies: ["insight-generator"], execute: jest.fn() },
}));

jest.mock("@/lib/agents/schema", () => ({
  SECTION_REGISTRY_V2: [
    { sectionType: "executive_briefing", sourceAgent: "assembler", required: true, reportOrder: 1 },
    { sectionType: "market_insights_index", sourceAgent: "assembler", required: true, reportOrder: 2 },
    { sectionType: "luxury_market_dashboard", sourceAgent: "assembler", required: true, reportOrder: 3 },
    { sectionType: "neighborhood_intelligence", sourceAgent: "assembler", required: true, reportOrder: 4 },
    { sectionType: "the_narrative", sourceAgent: "insight-generator", required: true, reportOrder: 5 },
    { sectionType: "forward_look", sourceAgent: "forecast-modeler", required: false, reportOrder: 6 },
    { sectionType: "comparative_positioning", sourceAgent: "assembler", required: true, reportOrder: 7 },
  ],
}));

jest.mock("@/lib/services/data-fetcher", () => ({
  fetchAllMarketData: (...args: unknown[]) => mockFetchAllMarketData(...args),
}));

jest.mock("@/lib/services/market-analytics", () => ({
  computeMarketAnalytics: (...args: unknown[]) => mockComputeMarketAnalytics(...args),
}));

jest.mock("@/lib/agents/report-assembler", () => ({
  assembleReport: (...args: unknown[]) => mockAssembleReport(...args),
}));

jest.mock("drizzle-orm", () => ({
  eq: jest.fn((...args: unknown[]) => ({ eq: args })),
  and: jest.fn((...args: unknown[]) => ({ and: args })),
  desc: jest.fn((col: unknown) => ({ desc: col })),
  asc: jest.fn((col: unknown) => ({ asc: col })),
  sql: jest.fn(),
}));

// --- Imports (after mocks) ---

import { db } from "@/lib/db";
import {
  executePipeline,
  getExecutionProgress,
  convertMarketToMarketData,
} from "@/lib/services/pipeline-executor";

// Cast db for mock access
const mockDb = db as any;

// --- Test data ---

const MOCK_REPORT_ID = "report-uuid-001";
const MOCK_USER_ID = "user-uuid-001";

const MOCK_MARKET_ROW = {
  id: "market-uuid-001",
  userId: MOCK_USER_ID,
  name: "Naples Ultra-Luxury",
  geography: { city: "Naples", state: "FL", zipCodes: ["34102", "34103"] },
  luxuryTier: "ultra_luxury" as const,
  priceFloor: 5000000,
  priceCeiling: null,
  segments: ["Single Family", "Condo"],
  propertyTypes: ["SFR", "CONDO"],
  peerMarkets: [{ name: "Palm Beach", geography: { city: "Palm Beach", state: "FL" } }],
};

const MOCK_REPORT_ROW = {
  id: MOCK_REPORT_ID,
  userId: MOCK_USER_ID,
  marketId: "market-uuid-001",
  status: "queued",
  config: { sections: ["executive_briefing", "the_narrative"] },
  title: "Naples Q1 2026 Report",
  generationStartedAt: null,
  generationCompletedAt: null,
  errorMessage: null,
};

const MOCK_COMPILED_DATA = {
  targetMarket: { properties: [], stale: false, details: [], comps: [] },
  peerMarkets: [],
  neighborhood: { amenities: {} },
  fetchMetadata: { totalApiCalls: 5, totalDurationMs: 1500, staleDataSources: [], errors: [] },
};

const MOCK_COMPUTED_ANALYTICS = {
  market: { totalProperties: 45, medianPrice: 8750000, averagePrice: 12400000, medianPricePerSqft: 2150, totalVolume: 558000000, rating: "A" },
  segments: [],
  yoy: { medianPriceChange: 0.08, volumeChange: 0.12, pricePerSqftChange: 0.06 },
  insightsIndex: { liquidity: 7, timing: 8, risk: 3, value: 6, composite: 7.0 },
  dashboard: { powerFour: [], supportingMetrics: [] },
  neighborhoods: [],
  peerComparisons: [],
  peerRankings: [],
  scorecard: { strengths: [], risks: [], outlook: "positive" },
  confidence: { level: "high", staleDataSources: [], sampleSize: 45 },
  detailMetrics: null,
};

const MOCK_PIPELINE_SECTIONS: SectionOutput[] = [
  { sectionType: "the_narrative", title: "The Narrative", content: { narrative: "Test narrative" } },
  { sectionType: "forward_look", title: "Forward Look", content: { forecast: "Growth ahead" } },
];

const MOCK_PIPELINE_RESULT: PipelineResult = {
  reportId: MOCK_REPORT_ID,
  status: "completed",
  sections: MOCK_PIPELINE_SECTIONS,
  totalDurationMs: 12000,
  agentTimings: {
    "insight-generator": 5000,
    "forecast-modeler": 4000,
    "polish-agent": 3000,
  },
};

const MOCK_ASSEMBLED_REPORT = {
  sections: [
    { sectionNumber: 1, sectionType: "executive_briefing", title: "Executive Briefing", content: { headline: {} } },
    { sectionNumber: 2, sectionType: "market_insights_index", title: "Market Insights Index", content: {} },
    { sectionNumber: 3, sectionType: "luxury_market_dashboard", title: "Luxury Market Dashboard", content: {} },
    { sectionNumber: 4, sectionType: "neighborhood_intelligence", title: "Neighborhood Intelligence", content: {} },
    { sectionNumber: 5, sectionType: "the_narrative", title: "The Narrative", content: {} },
    { sectionNumber: 6, sectionType: "forward_look", title: "Forward Look", content: {} },
    { sectionNumber: 7, sectionType: "comparative_positioning", title: "Comparative Positioning", content: {} },
  ],
  metadata: {
    generatedAt: "2026-03-09T12:00:00.000Z",
    totalDurationMs: 15000,
    agentDurations: { "insight-generator": 5000, "forecast-modeler": 4000, "polish-agent": 3000 },
    confidence: { level: "high", staleDataSources: [], sampleSize: 45 },
    sectionCount: 7,
  },
};

// --- Tests ---

describe("Pipeline Executor Service (v2)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the db chain mocks
    mockDb.select.mockReturnThis();
    mockDb.from.mockReturnThis();
    mockDb.where.mockReturnThis();

    // Default Layer 0/1/3 mocks
    mockFetchAllMarketData.mockResolvedValue(MOCK_COMPILED_DATA);
    mockComputeMarketAnalytics.mockReturnValue(MOCK_COMPUTED_ANALYTICS);
    mockAssembleReport.mockReturnValue(MOCK_ASSEMBLED_REPORT);
  });

  describe("convertMarketToMarketData", () => {
    it("SVC-PIPE-001: converts a DB market row to MarketData interface", () => {
      const result = convertMarketToMarketData(MOCK_MARKET_ROW);

      expect(result).toEqual({
        name: "Naples Ultra-Luxury",
        geography: { city: "Naples", state: "FL", zipCodes: ["34102", "34103"] },
        luxuryTier: "ultra_luxury",
        priceFloor: 5000000,
        priceCeiling: null,
        segments: ["Single Family", "Condo"],
        propertyTypes: ["SFR", "CONDO"],
        peerMarkets: [{ name: "Palm Beach", geography: { city: "Palm Beach", state: "FL" } }],
      });
    });

    it("SVC-PIPE-002: handles null optional fields", () => {
      const minimal = {
        ...MOCK_MARKET_ROW,
        priceCeiling: null,
        segments: null,
        propertyTypes: null,
        peerMarkets: null,
      };

      const result = convertMarketToMarketData(minimal);

      expect(result.priceCeiling).toBeNull();
      expect(result.segments).toBeUndefined();
      expect(result.propertyTypes).toBeUndefined();
      expect(result.peerMarkets).toBeUndefined();
    });
  });

  describe("executePipeline — 4-layer orchestration", () => {
    function setupDbMocks(reportRow: any, marketRow: any) {
      let limitCallCount = 0;
      mockDb.limit.mockImplementation(() => {
        limitCallCount++;
        if (limitCallCount === 1) return Promise.resolve(reportRow ? [reportRow] : []);
        if (limitCallCount === 2) return Promise.resolve(marketRow ? [marketRow] : []);
        if (limitCallCount === 3) return Promise.resolve([{ id: MOCK_USER_ID }]); // resolveUserId: by authId
        return Promise.resolve([]);
      });

      // Mock update chain
      mockDb.update.mockImplementation(() => ({
        set: jest.fn().mockImplementation(() => ({
          where: jest.fn().mockResolvedValue([]),
        })),
      }));

      // Mock insert chain
      mockDb.insert.mockImplementation(() => ({
        values: jest.fn().mockImplementation(() => ({
          returning: jest.fn().mockResolvedValue([{ id: "section-uuid" }]),
        })),
      }));
    }

    it("SVC-PIPE-003: updates report status to generating at start", async () => {
      setupDbMocks(MOCK_REPORT_ROW, MOCK_MARKET_ROW);
      mockRun.mockResolvedValue(MOCK_PIPELINE_RESULT);

      await executePipeline(MOCK_REPORT_ID);

      expect(mockDb.update).toHaveBeenCalled();
      const firstUpdateChain = mockDb.update.mock.results[0]?.value;
      expect(firstUpdateChain.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "generating",
        })
      );
    });

    it("SVC-PIPE-004: calls Layer 0 (fetchAllMarketData) with correct options", async () => {
      setupDbMocks(MOCK_REPORT_ROW, MOCK_MARKET_ROW);
      mockRun.mockResolvedValue(MOCK_PIPELINE_RESULT);

      await executePipeline(MOCK_REPORT_ID);

      expect(mockFetchAllMarketData).toHaveBeenCalledTimes(1);
      expect(mockFetchAllMarketData).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: MOCK_USER_ID,
          reportId: MOCK_REPORT_ID,
          market: expect.objectContaining({
            name: "Naples Ultra-Luxury",
            geography: expect.objectContaining({ city: "Naples" }),
          }),
        })
      );
    });

    it("SVC-PIPE-005: calls Layer 1 (computeMarketAnalytics) with compiled data", async () => {
      setupDbMocks(MOCK_REPORT_ROW, MOCK_MARKET_ROW);
      mockRun.mockResolvedValue(MOCK_PIPELINE_RESULT);

      await executePipeline(MOCK_REPORT_ID);

      expect(mockComputeMarketAnalytics).toHaveBeenCalledTimes(1);
      expect(mockComputeMarketAnalytics).toHaveBeenCalledWith(
        MOCK_COMPILED_DATA,
        expect.objectContaining({ name: "Naples Ultra-Luxury" })
      );
    });

    it("SVC-PIPE-006: passes computedAnalytics to pipeline runner (Layer 2)", async () => {
      setupDbMocks(MOCK_REPORT_ROW, MOCK_MARKET_ROW);
      mockRun.mockResolvedValue(MOCK_PIPELINE_RESULT);

      await executePipeline(MOCK_REPORT_ID);

      expect(mockRun).toHaveBeenCalledWith(
        MOCK_REPORT_ID,
        expect.objectContaining({
          userId: MOCK_USER_ID,
          computedAnalytics: MOCK_COMPUTED_ANALYTICS,
        })
      );
    });

    it("SVC-PIPE-007: calls Layer 3 (assembleReport) with analytics and agent results", async () => {
      setupDbMocks(MOCK_REPORT_ROW, MOCK_MARKET_ROW);
      mockRun.mockResolvedValue(MOCK_PIPELINE_RESULT);

      await executePipeline(MOCK_REPORT_ID);

      expect(mockAssembleReport).toHaveBeenCalledTimes(1);
      // First arg: computedAnalytics
      expect(mockAssembleReport.mock.calls[0][0]).toBe(MOCK_COMPUTED_ANALYTICS);
      // Third arg: durations
      const durations = mockAssembleReport.mock.calls[0][2];
      expect(durations).toHaveProperty("fetchMs");
      expect(durations).toHaveProperty("computeMs");
      expect(durations.agentDurations).toEqual(MOCK_PIPELINE_RESULT.agentTimings);
    });

    it("SVC-PIPE-008: saves 8 assembled sections to report_sections table", async () => {
      setupDbMocks(MOCK_REPORT_ROW, MOCK_MARKET_ROW);
      mockRun.mockResolvedValue(MOCK_PIPELINE_RESULT);

      await executePipeline(MOCK_REPORT_ID);

      // Flush microtasks so fire-and-forget logActivity completes
      await new Promise((r) => setTimeout(r, 0));

      // Should insert 7 sections + 1 activity log entry
      expect(mockDb.insert).toHaveBeenCalledTimes(8);
    });

    it("SVC-PIPE-009: sets report status to completed on success", async () => {
      setupDbMocks(MOCK_REPORT_ROW, MOCK_MARKET_ROW);
      mockRun.mockResolvedValue(MOCK_PIPELINE_RESULT);

      await executePipeline(MOCK_REPORT_ID);

      const updateCalls = mockDb.update.mock.results;
      const lastUpdateChain = updateCalls[updateCalls.length - 1]?.value;
      expect(lastUpdateChain.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "completed",
        })
      );
    });

    it("SVC-PIPE-010: sets report status to failed when pipeline returns failure", async () => {
      setupDbMocks(MOCK_REPORT_ROW, MOCK_MARKET_ROW);
      mockRun.mockResolvedValue({
        ...MOCK_PIPELINE_RESULT,
        status: "failed",
        error: "Agent timeout",
      });

      await executePipeline(MOCK_REPORT_ID);

      const updateCalls = mockDb.update.mock.results;
      const lastUpdateChain = updateCalls[updateCalls.length - 1]?.value;
      expect(lastUpdateChain.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "failed",
          errorMessage: "Agent timeout",
        })
      );
    });

    it("SVC-PIPE-011: fails with error when report not found", async () => {
      setupDbMocks(null, MOCK_MARKET_ROW);

      await expect(executePipeline(MOCK_REPORT_ID)).rejects.toThrow(
        /report not found/i
      );
    });

    it("SVC-PIPE-012: fails with error when market not found", async () => {
      setupDbMocks(MOCK_REPORT_ROW, null);

      await expect(executePipeline(MOCK_REPORT_ID)).rejects.toThrow(
        /market not found/i
      );
    });

    it("SVC-PIPE-013: handles Layer 0 (data fetch) failure gracefully", async () => {
      setupDbMocks(MOCK_REPORT_ROW, MOCK_MARKET_ROW);
      mockFetchAllMarketData.mockRejectedValue(new Error("API rate limit"));

      await executePipeline(MOCK_REPORT_ID);

      const updateCalls = mockDb.update.mock.results;
      const lastUpdateChain = updateCalls[updateCalls.length - 1]?.value;
      expect(lastUpdateChain.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "failed",
          errorMessage: expect.stringContaining("API rate limit"),
        })
      );
    });

    it("SVC-PIPE-014: handles pipeline runner throwing an exception", async () => {
      setupDbMocks(MOCK_REPORT_ROW, MOCK_MARKET_ROW);
      mockRun.mockRejectedValue(new Error("Connection refused"));

      await executePipeline(MOCK_REPORT_ID);

      const updateCalls = mockDb.update.mock.results;
      const lastUpdateChain = updateCalls[updateCalls.length - 1]?.value;
      expect(lastUpdateChain.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "failed",
          errorMessage: expect.stringContaining("Connection refused"),
        })
      );
    });

    it("SVC-PIPE-015: does not call agents when Layer 2 is skipped due to failed pipeline", async () => {
      setupDbMocks(MOCK_REPORT_ROW, MOCK_MARKET_ROW);
      mockRun.mockResolvedValue({
        ...MOCK_PIPELINE_RESULT,
        status: "failed",
        error: "Agent crashed",
      });

      await executePipeline(MOCK_REPORT_ID);

      // Assembly should NOT be called when pipeline fails
      expect(mockAssembleReport).not.toHaveBeenCalled();
    });
  });

  describe("getExecutionProgress", () => {
    it("SVC-PIPE-016: returns idle progress for unknown report", () => {
      mockGetProgress.mockReturnValue({
        reportId: "unknown-id",
        status: "idle",
        totalAgents: 3,
        completedAgents: 0,
        currentAgents: [],
        percentComplete: 0,
        events: [],
      });

      const progress = getExecutionProgress("unknown-id");

      expect(progress.status).toBe("idle");
      expect(progress.percentComplete).toBe(0);
    });

    it("SVC-PIPE-017: returns live progress during execution", () => {
      mockGetProgress.mockReturnValue({
        reportId: MOCK_REPORT_ID,
        status: "running",
        totalAgents: 3,
        completedAgents: 1,
        currentAgents: ["insight-generator"],
        percentComplete: 33,
        events: [],
      });

      const progress = getExecutionProgress(MOCK_REPORT_ID);

      expect(progress.status).toBe("running");
      expect(progress.completedAgents).toBe(1);
      expect(progress.currentAgents).toContain("insight-generator");
      expect(progress.percentComplete).toBe(33);
    });
  });
});
