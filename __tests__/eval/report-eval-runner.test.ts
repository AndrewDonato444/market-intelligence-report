/**
 * Report Eval Runner — Tests
 *
 * Tests for the report-level eval runner, judge prompt building,
 * judge response parsing/validation, and summary aggregation.
 */

import {
  buildReportJudgePrompt,
  parseReportJudgeResponse,
  validateReportBreakdown,
} from "@/lib/eval/report-eval/judge";
import {
  buildReportEvalSummary,
} from "@/lib/eval/report-eval/runner";
import type {
  ReportEvalJudgeBreakdown,
  ReportEvalRunResult,
  ReportEvalTestCase,
} from "@/lib/eval/report-eval/types";
import {
  REPORT_EVAL_PASS_THRESHOLD,
  REPORT_EVAL_CRITERIA,
} from "@/lib/eval/report-eval/types";
import { getReportTestCase, REPORT_EVAL_TEST_CASES } from "@/lib/eval/report-eval/test-cases";
import { getReportFixture, summarizeReportFixture } from "@/lib/eval/report-eval/fixtures";
import type { AssembledReport } from "@/lib/agents/report-assembler";

// --- Judge prompt building ---

describe("Report Eval Judge — buildReportJudgePrompt", () => {
  it("should include test case description and criterion", () => {
    const testCase = getReportTestCase("rtc-01");
    const fixture = getReportFixture(testCase.fixtureId);
    const summary = summarizeReportFixture(fixture);

    const prompt = buildReportJudgePrompt(testCase, fixture.report, summary);
    expect(prompt).toContain("Data Accuracy");
    expect(prompt).toContain("data-accuracy");
  });

  it("should include the rubric text", () => {
    const testCase = getReportTestCase("rtc-01");
    const fixture = getReportFixture(testCase.fixtureId);
    const summary = summarizeReportFixture(fixture);

    const prompt = buildReportJudgePrompt(testCase, fixture.report, summary);
    expect(prompt).toContain(testCase.expectedRubric);
  });

  it("should include the fixture summary", () => {
    const testCase = getReportTestCase("rtc-01");
    const fixture = getReportFixture(testCase.fixtureId);
    const summary = summarizeReportFixture(fixture);

    const prompt = buildReportJudgePrompt(testCase, fixture.report, summary);
    expect(prompt).toContain(fixture.name);
  });

  it("should include full report JSON", () => {
    const testCase = getReportTestCase("rtc-01");
    const fixture = getReportFixture(testCase.fixtureId);
    const summary = summarizeReportFixture(fixture);

    const prompt = buildReportJudgePrompt(testCase, fixture.report, summary);
    expect(prompt).toContain("executive_briefing");
    expect(prompt).toContain("sections");
  });
});

// --- Judge response parsing ---

describe("Report Eval Judge — parseReportJudgeResponse", () => {
  it("should parse valid JSON with all 6 breakdown dimensions", () => {
    const raw = JSON.stringify({
      score: 4,
      reason: "Good overall quality with minor issues",
      breakdown: {
        dataAccuracy: 4,
        completeness: 5,
        narrativeQuality: 3,
        formatting: 5,
        actionability: 4,
        personaAlignment: 4,
      },
    });

    const result = parseReportJudgeResponse(raw);
    expect(result.score).toBe(4);
    expect(result.reason).toBe("Good overall quality with minor issues");
    expect(result.breakdown.dataAccuracy).toBe(4);
    expect(result.breakdown.completeness).toBe(5);
    expect(result.breakdown.narrativeQuality).toBe(3);
    expect(result.breakdown.formatting).toBe(5);
    expect(result.breakdown.actionability).toBe(4);
    expect(result.breakdown.personaAlignment).toBe(4);
  });

  it("should handle JSON wrapped in markdown code fences", () => {
    const raw = '```json\n{"score":3,"reason":"Average","breakdown":{"dataAccuracy":3,"completeness":3,"narrativeQuality":3,"formatting":4,"actionability":2,"personaAlignment":3}}\n```';

    const result = parseReportJudgeResponse(raw);
    expect(result.score).toBe(3);
    expect(result.breakdown.dataAccuracy).toBe(3);
  });

  it("should throw on invalid JSON", () => {
    expect(() => parseReportJudgeResponse("not valid json")).toThrow(
      "Failed to parse report judge response"
    );
  });

  it("should throw when score is missing", () => {
    const raw = JSON.stringify({
      reason: "ok",
      breakdown: {
        dataAccuracy: 3, completeness: 3, narrativeQuality: 3,
        formatting: 3, actionability: 3, personaAlignment: 3,
      },
    });
    expect(() => parseReportJudgeResponse(raw)).toThrow("missing required field: score");
  });

  it("should throw when reason is missing", () => {
    const raw = JSON.stringify({
      score: 3,
      breakdown: {
        dataAccuracy: 3, completeness: 3, narrativeQuality: 3,
        formatting: 3, actionability: 3, personaAlignment: 3,
      },
    });
    expect(() => parseReportJudgeResponse(raw)).toThrow("missing required field: reason");
  });

  it("should throw when breakdown is missing", () => {
    const raw = JSON.stringify({ score: 3, reason: "ok" });
    expect(() => parseReportJudgeResponse(raw)).toThrow("missing required field: breakdown");
  });
});

// --- Breakdown validation ---

describe("Report Eval Judge — validateReportBreakdown", () => {
  it("should pass for valid scores (1-5)", () => {
    const breakdown: ReportEvalJudgeBreakdown = {
      dataAccuracy: 4,
      completeness: 5,
      narrativeQuality: 3,
      formatting: 5,
      actionability: 4,
      personaAlignment: 4,
    };
    const result = validateReportBreakdown(breakdown);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should fail for scores below 1", () => {
    const breakdown: ReportEvalJudgeBreakdown = {
      dataAccuracy: 0,
      completeness: 5,
      narrativeQuality: 3,
      formatting: 5,
      actionability: 4,
      personaAlignment: 4,
    };
    const result = validateReportBreakdown(breakdown);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("dataAccuracy");
  });

  it("should fail for scores above 5", () => {
    const breakdown: ReportEvalJudgeBreakdown = {
      dataAccuracy: 4,
      completeness: 6,
      narrativeQuality: 3,
      formatting: 5,
      actionability: 4,
      personaAlignment: 4,
    };
    const result = validateReportBreakdown(breakdown);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("completeness");
  });

  it("should fail for non-integer scores", () => {
    const breakdown: ReportEvalJudgeBreakdown = {
      dataAccuracy: 3.5,
      completeness: 4,
      narrativeQuality: 3,
      formatting: 5,
      actionability: 4,
      personaAlignment: 4,
    };
    const result = validateReportBreakdown(breakdown);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("integer");
  });

  it("should report multiple errors at once", () => {
    const breakdown: ReportEvalJudgeBreakdown = {
      dataAccuracy: 0,
      completeness: 7,
      narrativeQuality: 3.5,
      formatting: -1,
      actionability: 4,
      personaAlignment: 4,
    };
    const result = validateReportBreakdown(breakdown);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });
});

// --- Summary building ---

describe("Report Eval Runner — buildReportEvalSummary", () => {
  const makeResult = (
    testCaseId: string,
    criterion: string,
    score: number,
    breakdown?: Partial<ReportEvalJudgeBreakdown>
  ): ReportEvalRunResult => ({
    testCaseId,
    description: `Test ${testCaseId}`,
    criterion: criterion as ReportEvalRunResult["criterion"],
    report: { sections: [], metadata: {} } as unknown as AssembledReport,
    judgeScore: score,
    judgeReason: "test",
    judgeBreakdown: {
      dataAccuracy: score,
      completeness: score,
      narrativeQuality: score,
      formatting: score,
      actionability: score,
      personaAlignment: score,
      ...breakdown,
    },
    timestamp: new Date().toISOString(),
    durationMs: 100,
  });

  it("should return zero values for empty results", () => {
    const summary = buildReportEvalSummary([]);
    expect(summary.totalRuns).toBe(0);
    expect(summary.passRate).toBe(0);
    expect(summary.avgScore).toBe(0);
  });

  it("should calculate correct pass rate", () => {
    const results = [
      makeResult("rtc-01", "data-accuracy", 5),
      makeResult("rtc-02", "data-accuracy", 4),
      makeResult("rtc-03", "data-accuracy", 2),
      makeResult("rtc-04", "completeness", 3),
    ];
    const summary = buildReportEvalSummary(results);
    expect(summary.totalRuns).toBe(4);
    expect(summary.passRate).toBe(50); // 2 of 4 >= 4
  });

  it("should calculate correct average score", () => {
    const results = [
      makeResult("rtc-01", "data-accuracy", 5),
      makeResult("rtc-02", "data-accuracy", 3),
    ];
    const summary = buildReportEvalSummary(results);
    expect(summary.avgScore).toBe(4);
  });

  it("should aggregate by criterion", () => {
    const results = [
      makeResult("rtc-01", "data-accuracy", 5),
      makeResult("rtc-02", "data-accuracy", 3),
      makeResult("rtc-04", "completeness", 4),
    ];
    const summary = buildReportEvalSummary(results);
    expect(summary.byCriterion["data-accuracy"].runs).toBe(2);
    expect(summary.byCriterion["data-accuracy"].avgScore).toBe(4);
    expect(summary.byCriterion["completeness"].runs).toBe(1);
    expect(summary.byCriterion["completeness"].passRate).toBe(100);
  });

  it("should produce byTestCase entries", () => {
    const results = [
      makeResult("rtc-01", "data-accuracy", 5),
      makeResult("rtc-04", "completeness", 3),
    ];
    const summary = buildReportEvalSummary(results);
    expect(summary.byTestCase).toHaveLength(2);
    expect(summary.byTestCase[0].testCaseId).toBe("rtc-01");
    expect(summary.byTestCase[0].passed).toBe(true);
    expect(summary.byTestCase[1].passed).toBe(false);
  });

  it("should calculate average breakdown across all results", () => {
    const results = [
      makeResult("rtc-01", "data-accuracy", 5, { dataAccuracy: 5, formatting: 3 }),
      makeResult("rtc-04", "completeness", 3, { dataAccuracy: 3, formatting: 5 }),
    ];
    const summary = buildReportEvalSummary(results);
    expect(summary.avgBreakdown.dataAccuracy).toBe(4);
    expect(summary.avgBreakdown.formatting).toBe(4);
  });
});

// --- Test case + fixture integration ---

describe("Report Eval Runner — fixture integration", () => {
  it("every test case fixture can be loaded", () => {
    for (const tc of REPORT_EVAL_TEST_CASES) {
      const fixture = getReportFixture(tc.fixtureId);
      expect(fixture).toBeDefined();
      expect(fixture.report).toBeDefined();
      expect(fixture.report.sections.length).toBe(7);
    }
  });

  it("every fixture can be summarized", () => {
    for (const tc of REPORT_EVAL_TEST_CASES) {
      const fixture = getReportFixture(tc.fixtureId);
      const summary = summarizeReportFixture(fixture);
      expect(summary.length).toBeGreaterThan(50);
      expect(summary).toContain(fixture.name);
    }
  });

  it("judge prompt can be built for every test case", () => {
    for (const tc of REPORT_EVAL_TEST_CASES) {
      const fixture = getReportFixture(tc.fixtureId);
      const summary = summarizeReportFixture(fixture);
      const prompt = buildReportJudgePrompt(tc, fixture.report, summary);
      expect(prompt).toContain(tc.criterion);
      expect(prompt).toContain(tc.expectedRubric);
    }
  });
});

// --- Constants ---

describe("Report Eval Runner — constants", () => {
  it("PASS_THRESHOLD should be 4", () => {
    expect(REPORT_EVAL_PASS_THRESHOLD).toBe(4);
  });

  it("should have 6 criteria", () => {
    expect(REPORT_EVAL_CRITERIA).toHaveLength(6);
  });
});
