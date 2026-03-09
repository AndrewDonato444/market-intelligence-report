/**
 * Pipeline Executor Service Tests
 *
 * Tests the execution glue that connects report creation to the agent pipeline.
 * ID: SVC-PIPE-001 through SVC-PIPE-012
 */

import type {
  PipelineResult,
  PipelineRunner,
  PipelineProgress,
  SectionOutput,
} from "@/lib/agents/orchestrator";

// --- Mocks (hoisted by jest) ---

const mockRun = jest.fn();
const mockCancel = jest.fn();
const mockGetProgress = jest.fn();

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
        focusAreas: "focus_areas",
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

jest.mock("@/lib/agents/data-analyst", () => ({
  dataAnalystAgent: { name: "data-analyst", dependencies: [], execute: jest.fn() },
}));
jest.mock("@/lib/agents/insight-generator", () => ({
  insightGeneratorAgent: { name: "insight-generator", dependencies: ["data-analyst"], execute: jest.fn() },
}));
jest.mock("@/lib/agents/competitive-analyst", () => ({
  competitiveAnalystAgent: { name: "competitive-analyst", dependencies: ["data-analyst"], execute: jest.fn() },
}));
jest.mock("@/lib/agents/forecast-modeler", () => ({
  forecastModelerAgent: { name: "forecast-modeler", dependencies: ["data-analyst"], execute: jest.fn() },
}));
jest.mock("@/lib/agents/polish-agent", () => ({
  polishAgent: { name: "polish-agent", dependencies: ["data-analyst", "insight-generator"], execute: jest.fn() },
}));

jest.mock("@/lib/agents/schema", () => ({
  SECTION_REGISTRY: [
    { sectionType: "market_overview", sourceAgent: "insight-generator", required: true, reportOrder: 1 },
    { sectionType: "executive_summary", sourceAgent: "insight-generator", required: true, reportOrder: 2 },
    { sectionType: "key_drivers", sourceAgent: "insight-generator", required: true, reportOrder: 3 },
    { sectionType: "competitive_market_analysis", sourceAgent: "competitive-analyst", required: false, reportOrder: 4 },
    { sectionType: "forecasts", sourceAgent: "forecast-modeler", required: false, reportOrder: 5 },
    { sectionType: "strategic_summary", sourceAgent: "forecast-modeler", required: false, reportOrder: 6 },
    { sectionType: "polished_report", sourceAgent: "polish-agent", required: false, reportOrder: 7 },
    { sectionType: "methodology", sourceAgent: "polish-agent", required: false, reportOrder: 8 },
  ],
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
  focusAreas: ["Port Royal", "Aqualane Shores"],
  peerMarkets: [{ name: "Palm Beach", geography: { city: "Palm Beach", state: "FL" } }],
};

const MOCK_REPORT_ROW = {
  id: MOCK_REPORT_ID,
  userId: MOCK_USER_ID,
  marketId: "market-uuid-001",
  status: "queued",
  config: { sections: ["market_overview", "executive_summary"] },
  title: "Naples Q1 2026 Report",
  generationStartedAt: null,
  generationCompletedAt: null,
  errorMessage: null,
};

const MOCK_PIPELINE_SECTIONS: SectionOutput[] = [
  { sectionType: "market_overview", title: "Market Overview", content: { narrative: "Test narrative" } },
  { sectionType: "executive_summary", title: "Executive Summary", content: { narrative: "Test summary" } },
  { sectionType: "key_drivers", title: "Key Drivers", content: { themes: [] } },
];

const MOCK_PIPELINE_RESULT: PipelineResult = {
  reportId: MOCK_REPORT_ID,
  status: "completed",
  sections: MOCK_PIPELINE_SECTIONS,
  totalDurationMs: 15000,
  agentTimings: {
    "data-analyst": 3000,
    "insight-generator": 5000,
    "competitive-analyst": 4000,
    "forecast-modeler": 4500,
    "polish-agent": 3500,
  },
};

// --- Tests ---

describe("Pipeline Executor Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the db chain mocks
    mockDb.select.mockReturnThis();
    mockDb.from.mockReturnThis();
    mockDb.where.mockReturnThis();
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
        focusAreas: ["Port Royal", "Aqualane Shores"],
        peerMarkets: [{ name: "Palm Beach", geography: { city: "Palm Beach", state: "FL" } }],
      });
    });

    it("SVC-PIPE-002: handles null optional fields", () => {
      const minimal = {
        ...MOCK_MARKET_ROW,
        priceCeiling: null,
        segments: null,
        propertyTypes: null,
        focusAreas: null,
        peerMarkets: null,
      };

      const result = convertMarketToMarketData(minimal);

      expect(result.priceCeiling).toBeNull();
      expect(result.segments).toBeUndefined();
      expect(result.propertyTypes).toBeUndefined();
      expect(result.focusAreas).toBeUndefined();
      expect(result.peerMarkets).toBeUndefined();
    });
  });

  describe("executePipeline", () => {
    function setupDbMocks(reportRow: any, marketRow: any) {
      let limitCallCount = 0;
      mockDb.limit.mockImplementation(() => {
        limitCallCount++;
        if (limitCallCount === 1) return Promise.resolve(reportRow ? [reportRow] : []);
        if (limitCallCount === 2) return Promise.resolve(marketRow ? [marketRow] : []);
        return Promise.resolve([]);
      });

      // Mock update chain — each call to update() returns a fresh chain
      mockDb.update.mockImplementation(() => ({
        set: jest.fn().mockImplementation(() => ({
          where: jest.fn().mockResolvedValue([]),
        })),
      }));

      // Mock insert chain — each call to insert() returns a fresh chain
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

      // First update should set status to "generating"
      expect(mockDb.update).toHaveBeenCalled();
      const firstUpdateChain = mockDb.update.mock.results[0]?.value;
      expect(firstUpdateChain.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "generating",
        })
      );
    });

    it("SVC-PIPE-004: calls pipeline runner with correct market data", async () => {
      setupDbMocks(MOCK_REPORT_ROW, MOCK_MARKET_ROW);
      mockRun.mockResolvedValue(MOCK_PIPELINE_RESULT);

      await executePipeline(MOCK_REPORT_ID);

      expect(mockRun).toHaveBeenCalledWith(
        MOCK_REPORT_ID,
        expect.objectContaining({
          userId: MOCK_USER_ID,
          market: expect.objectContaining({
            name: "Naples Ultra-Luxury",
            geography: expect.objectContaining({ city: "Naples", state: "FL" }),
            luxuryTier: "ultra_luxury",
            priceFloor: 5000000,
          }),
          reportConfig: expect.objectContaining({
            sections: ["market_overview", "executive_summary"],
          }),
        })
      );
    });

    it("SVC-PIPE-005: saves pipeline sections to report_sections table", async () => {
      setupDbMocks(MOCK_REPORT_ROW, MOCK_MARKET_ROW);
      mockRun.mockResolvedValue(MOCK_PIPELINE_RESULT);

      await executePipeline(MOCK_REPORT_ID);

      // Should insert 3 sections (one per MOCK_PIPELINE_SECTIONS)
      expect(mockDb.insert).toHaveBeenCalledTimes(3);
    });

    it("SVC-PIPE-006: sets report status to completed on success", async () => {
      setupDbMocks(MOCK_REPORT_ROW, MOCK_MARKET_ROW);
      mockRun.mockResolvedValue(MOCK_PIPELINE_RESULT);

      await executePipeline(MOCK_REPORT_ID);

      // Last update call should set completed
      const updateCalls = mockDb.update.mock.results;
      const lastUpdateChain = updateCalls[updateCalls.length - 1]?.value;
      expect(lastUpdateChain.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "completed",
        })
      );
    });

    it("SVC-PIPE-007: sets report status to failed when pipeline returns failure", async () => {
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

    it("SVC-PIPE-008: fails with error when report not found", async () => {
      setupDbMocks(null, MOCK_MARKET_ROW);

      await expect(executePipeline(MOCK_REPORT_ID)).rejects.toThrow(
        /report not found/i
      );
    });

    it("SVC-PIPE-009: fails with error when market not found", async () => {
      setupDbMocks(MOCK_REPORT_ROW, null);

      await expect(executePipeline(MOCK_REPORT_ID)).rejects.toThrow(
        /market not found/i
      );
    });

    it("SVC-PIPE-010: handles pipeline runner throwing an exception", async () => {
      setupDbMocks(MOCK_REPORT_ROW, MOCK_MARKET_ROW);
      mockRun.mockRejectedValue(new Error("Connection refused"));

      // Should NOT throw — catches the error and updates status
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
  });

  describe("getExecutionProgress", () => {
    it("SVC-PIPE-011: returns idle progress for unknown report", () => {
      mockGetProgress.mockReturnValue({
        reportId: "unknown-id",
        status: "idle",
        totalAgents: 5,
        completedAgents: 0,
        currentAgents: [],
        percentComplete: 0,
        events: [],
      });

      const progress = getExecutionProgress("unknown-id");

      expect(progress.status).toBe("idle");
      expect(progress.percentComplete).toBe(0);
    });

    it("SVC-PIPE-012: returns live progress during execution", () => {
      mockGetProgress.mockReturnValue({
        reportId: MOCK_REPORT_ID,
        status: "running",
        totalAgents: 5,
        completedAgents: 1,
        currentAgents: ["insight-generator", "competitive-analyst"],
        percentComplete: 20,
        events: [],
      });

      const progress = getExecutionProgress(MOCK_REPORT_ID);

      expect(progress.status).toBe("running");
      expect(progress.completedAgents).toBe(1);
      expect(progress.currentAgents).toContain("insight-generator");
      expect(progress.percentComplete).toBe(20);
    });
  });
});
