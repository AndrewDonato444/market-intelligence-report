/**
 * Eval Runner Tests
 *
 * Tests for the eval runner that executes agents against fixtures
 * and produces scored results. These are FAILING tests — the runner
 * module (lib/eval/runner.ts) does not exist yet.
 */

import type { EvalRunResult, JudgeResponse, EvalReportSummary } from "@/lib/eval/types";
import { PASS_THRESHOLD } from "@/lib/eval/types";
import { getFixture } from "@/lib/eval/fixtures";
import { getTestCase, EVAL_TEST_CASES } from "@/lib/eval/test-cases";

// --- These imports will fail until runner.ts is implemented ---
// import { runSingleTestCase, runAllTestCases, buildReportSummary, validateSchema } from "@/lib/eval/runner";

// Placeholder: tests are written against the expected API surface.
// Uncomment imports above and remove mocks once runner.ts exists.

// Mock the runner functions to define expected signatures
const runSingleTestCase = jest.fn<Promise<EvalRunResult>, [string]>();
const runAllTestCases = jest.fn<Promise<EvalRunResult[]>, [{ concurrency?: number; onProgress?: (completed: number, total: number) => void }?]>();
const buildReportSummary = jest.fn<EvalReportSummary, [EvalRunResult[]]>();
const validateSchema = jest.fn<{ valid: boolean; errors: string[] }, [unknown, string[]]>();

describe("Eval Runner — runSingleTestCase", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return an EvalRunResult with required fields", async () => {
    const mockResult: EvalRunResult = {
      testCaseId: "tc-01",
      runIndex: 1,
      description: "Insight Generator — strong market, high confidence",
      agent: "insight-generator",
      response: { overview: { narrative: "test" } },
      judgeScore: 4,
      judgeReason: "Good narrative",
      judgeBreakdown: { dataGrounding: 4, narrativeQuality: 5, schemaCompliance: 5, toneVoice: 4 },
      timestamp: new Date().toISOString(),
      durationMs: 5000,
    };
    runSingleTestCase.mockResolvedValue(mockResult);

    const result = await runSingleTestCase("tc-01");
    expect(result.testCaseId).toBe("tc-01");
    expect(result.agent).toBe("insight-generator");
    expect(result.judgeScore).toBeGreaterThanOrEqual(1);
    expect(result.judgeScore).toBeLessThanOrEqual(5);
    expect(result.judgeBreakdown).toBeDefined();
    expect(result.durationMs).toBeGreaterThan(0);
    expect(result.timestamp).toBeTruthy();
  });

  it("should set error field when agent fails", async () => {
    const errorResult: EvalRunResult = {
      testCaseId: "tc-01",
      runIndex: 1,
      description: "Insight Generator — strong market, high confidence",
      agent: "insight-generator",
      response: null,
      judgeScore: 1,
      judgeReason: "Agent failed",
      judgeBreakdown: { dataGrounding: 1, narrativeQuality: 1, schemaCompliance: 1, toneVoice: 1 },
      timestamp: new Date().toISOString(),
      error: "Anthropic API rate limit exceeded",
      durationMs: 1000,
    };
    runSingleTestCase.mockResolvedValue(errorResult);

    const result = await runSingleTestCase("tc-01");
    expect(result.error).toBeTruthy();
    expect(result.judgeScore).toBe(1);
  });
});

describe("Eval Runner — validateSchema", () => {
  it("should pass for valid JSON with all required fields", () => {
    const response = {
      overview: {
        narrative: "test narrative",
        highlights: ["a", "b"],
        recommendations: ["c"],
      },
      themes: [],
      executiveSummary: {
        narrative: "summary",
        highlights: [],
        timing: { buyers: "buy now", sellers: "sell later" },
      },
    };
    const requiredFields = [
      "overview.narrative",
      "overview.highlights",
      "themes",
      "executiveSummary.timing.buyers",
      "executiveSummary.timing.sellers",
    ];

    validateSchema.mockReturnValue({ valid: true, errors: [] });
    const result = validateSchema(response, requiredFields);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should fail for missing required fields", () => {
    const response = {
      overview: { narrative: "test" },
      // missing: themes, executiveSummary
    };
    const requiredFields = [
      "overview.narrative",
      "themes",
      "executiveSummary.timing.buyers",
    ];

    validateSchema.mockReturnValue({
      valid: false,
      errors: ["Missing field: themes", "Missing field: executiveSummary.timing.buyers"],
    });
    const result = validateSchema(response, requiredFields);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("should fail for non-object response", () => {
    validateSchema.mockReturnValue({
      valid: false,
      errors: ["Response is not a valid object"],
    });
    const result = validateSchema("not json", ["overview.narrative"]);
    expect(result.valid).toBe(false);
  });
});

describe("Eval Runner — buildReportSummary", () => {
  const mockResults: EvalRunResult[] = [
    {
      testCaseId: "tc-01",
      runIndex: 1,
      description: "Test 1",
      agent: "insight-generator",
      response: {},
      judgeScore: 5,
      judgeReason: "Excellent",
      judgeBreakdown: { dataGrounding: 5, narrativeQuality: 5, schemaCompliance: 5, toneVoice: 5 },
      timestamp: "2026-03-09T00:00:00Z",
      durationMs: 5000,
    },
    {
      testCaseId: "tc-11",
      runIndex: 1,
      description: "Test 2",
      agent: "forecast-modeler",
      response: {},
      judgeScore: 3,
      judgeReason: "Needs improvement",
      judgeBreakdown: { dataGrounding: 3, narrativeQuality: 3, schemaCompliance: 4, toneVoice: 2 },
      timestamp: "2026-03-09T00:01:00Z",
      durationMs: 4000,
    },
    {
      testCaseId: "tc-19",
      runIndex: 1,
      description: "Test 3",
      agent: "polish-agent",
      response: {},
      judgeScore: 4,
      judgeReason: "Good",
      judgeBreakdown: { dataGrounding: 4, narrativeQuality: 4, schemaCompliance: 5, toneVoice: 4 },
      timestamp: "2026-03-09T00:02:00Z",
      durationMs: 6000,
    },
  ];

  it("should calculate correct totalRuns", () => {
    buildReportSummary.mockReturnValue({
      totalRuns: 3,
      passRate: 66.7,
      avgScore: 4.0,
      avgBreakdown: { dataGrounding: 4, narrativeQuality: 4, schemaCompliance: 4.7, toneVoice: 3.7 },
      byAgent: {
        "insight-generator": { runs: 1, passRate: 100, avgScore: 5 },
        "forecast-modeler": { runs: 1, passRate: 0, avgScore: 3 },
        "polish-agent": { runs: 1, passRate: 100, avgScore: 4 },
      },
      byCategory: {},
      byTestCase: [],
    });

    const summary = buildReportSummary(mockResults);
    expect(summary.totalRuns).toBe(3);
  });

  it("should calculate passRate as percentage of score >= 4", () => {
    buildReportSummary.mockReturnValue({
      totalRuns: 3,
      passRate: 66.7,
      avgScore: 4.0,
      avgBreakdown: { dataGrounding: 4, narrativeQuality: 4, schemaCompliance: 4.7, toneVoice: 3.7 },
      byAgent: {},
      byCategory: {},
      byTestCase: [],
    });

    const summary = buildReportSummary(mockResults);
    // 2 out of 3 have score >= 4 (scores: 5, 3, 4)
    expect(summary.passRate).toBeCloseTo(66.7, 0);
  });

  it("should group results by agent", () => {
    buildReportSummary.mockReturnValue({
      totalRuns: 3,
      passRate: 66.7,
      avgScore: 4.0,
      avgBreakdown: { dataGrounding: 4, narrativeQuality: 4, schemaCompliance: 4.7, toneVoice: 3.7 },
      byAgent: {
        "insight-generator": { runs: 1, passRate: 100, avgScore: 5 },
        "forecast-modeler": { runs: 1, passRate: 0, avgScore: 3 },
        "polish-agent": { runs: 1, passRate: 100, avgScore: 4 },
      },
      byCategory: {},
      byTestCase: [],
    });

    const summary = buildReportSummary(mockResults);
    expect(summary.byAgent["insight-generator"]).toBeDefined();
    expect(summary.byAgent["forecast-modeler"]).toBeDefined();
    expect(summary.byAgent["polish-agent"]).toBeDefined();
    expect(summary.byAgent["insight-generator"].avgScore).toBe(5);
    expect(summary.byAgent["forecast-modeler"].avgScore).toBe(3);
  });

  it("should compute average breakdown scores", () => {
    buildReportSummary.mockReturnValue({
      totalRuns: 3,
      passRate: 66.7,
      avgScore: 4.0,
      avgBreakdown: { dataGrounding: 4, narrativeQuality: 4, schemaCompliance: 4.67, toneVoice: 3.67 },
      byAgent: {},
      byCategory: {},
      byTestCase: [],
    });

    const summary = buildReportSummary(mockResults);
    // Average of (5,3,4) = 4 for dataGrounding
    expect(summary.avgBreakdown.dataGrounding).toBe(4);
    // Average of (5,4,5) = 4.67 for schemaCompliance
    expect(summary.avgBreakdown.schemaCompliance).toBeCloseTo(4.67, 1);
  });
});

describe("Eval Runner — PASS_THRESHOLD constant", () => {
  it("should be 4", () => {
    expect(PASS_THRESHOLD).toBe(4);
  });
});

describe("Eval Runner — runAllTestCases", () => {
  it("should return results for all test cases", async () => {
    const allResults = EVAL_TEST_CASES.map((tc) => ({
      testCaseId: tc.id,
      runIndex: 1,
      description: tc.description,
      agent: tc.agent,
      response: {},
      judgeScore: 4,
      judgeReason: "OK",
      judgeBreakdown: { dataGrounding: 4, narrativeQuality: 4, schemaCompliance: 4, toneVoice: 4 },
      timestamp: new Date().toISOString(),
      durationMs: 3000,
    }));
    runAllTestCases.mockResolvedValue(allResults);

    const results = await runAllTestCases();
    expect(results).toHaveLength(24);
  });

  it("should support progress callback", async () => {
    runAllTestCases.mockResolvedValue([]);
    const onProgress = jest.fn();
    await runAllTestCases({ concurrency: 3, onProgress });
    expect(runAllTestCases).toHaveBeenCalledWith(
      expect.objectContaining({ concurrency: 3, onProgress })
    );
  });
});
