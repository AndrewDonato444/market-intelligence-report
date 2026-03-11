/**
 * Report Eval Test Cases — Tests
 *
 * Validates the report-level eval test case definitions,
 * types, and helper functions.
 */

import {
  REPORT_EVAL_TEST_CASES,
  getReportTestCase,
  getReportTestCasesByCriterion,
} from "@/lib/eval/report-eval/test-cases";
import {
  REPORT_EVAL_CRITERIA,
  REPORT_EVAL_PASS_THRESHOLD,
} from "@/lib/eval/report-eval/types";
import type {
  ReportEvalCriterion,
  ReportEvalTestCase,
  ReportEvalJudgeBreakdown,
} from "@/lib/eval/report-eval/types";
import { listReportFixtureIds } from "@/lib/eval/report-eval/fixtures";

// --- Test case registry ---

describe("Report Eval Test Cases — Registry", () => {
  it("should have at least 18 test cases", () => {
    expect(REPORT_EVAL_TEST_CASES.length).toBeGreaterThanOrEqual(18);
  });

  it("should have unique IDs for all test cases", () => {
    const ids = REPORT_EVAL_TEST_CASES.map((tc) => tc.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("should use rtc- prefix for all IDs", () => {
    for (const tc of REPORT_EVAL_TEST_CASES) {
      expect(tc.id).toMatch(/^rtc-\d+$/);
    }
  });

  it("every criterion should have at least 2 test cases", () => {
    for (const criterion of REPORT_EVAL_CRITERIA) {
      const cases = REPORT_EVAL_TEST_CASES.filter(
        (tc) => tc.criterion === criterion
      );
      expect(cases.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("every test case should have a non-empty description", () => {
    for (const tc of REPORT_EVAL_TEST_CASES) {
      expect(tc.description.length).toBeGreaterThan(10);
    }
  });

  it("every test case should have a non-empty expectedRubric", () => {
    for (const tc of REPORT_EVAL_TEST_CASES) {
      expect(tc.expectedRubric.length).toBeGreaterThan(20);
    }
  });

  it("every test case should reference a valid fixture ID", () => {
    const validFixtures = listReportFixtureIds();
    for (const tc of REPORT_EVAL_TEST_CASES) {
      expect(validFixtures).toContain(tc.fixtureId);
    }
  });

  it("every test case criterion should be a valid ReportEvalCriterion", () => {
    for (const tc of REPORT_EVAL_TEST_CASES) {
      expect(REPORT_EVAL_CRITERIA).toContain(tc.criterion);
    }
  });
});

// --- Helper functions ---

describe("Report Eval Test Cases — getReportTestCase", () => {
  it("should return test case by ID", () => {
    const tc = getReportTestCase("rtc-01");
    expect(tc.id).toBe("rtc-01");
    expect(tc.criterion).toBe("data-accuracy");
  });

  it("should throw for unknown ID", () => {
    expect(() => getReportTestCase("rtc-99")).toThrow(
      "Unknown report eval test case"
    );
  });
});

describe("Report Eval Test Cases — getReportTestCasesByCriterion", () => {
  it("should return cases for data-accuracy", () => {
    const cases = getReportTestCasesByCriterion("data-accuracy");
    expect(cases.length).toBeGreaterThanOrEqual(2);
    expect(cases.every((tc) => tc.criterion === "data-accuracy")).toBe(true);
  });

  it("should return empty array for unknown criterion", () => {
    const cases = getReportTestCasesByCriterion("nonexistent");
    expect(cases).toHaveLength(0);
  });
});

// --- Types ---

describe("Report Eval Types", () => {
  it("should define 6 criteria", () => {
    expect(REPORT_EVAL_CRITERIA).toHaveLength(6);
    expect(REPORT_EVAL_CRITERIA).toContain("data-accuracy");
    expect(REPORT_EVAL_CRITERIA).toContain("completeness");
    expect(REPORT_EVAL_CRITERIA).toContain("narrative-quality");
    expect(REPORT_EVAL_CRITERIA).toContain("formatting");
    expect(REPORT_EVAL_CRITERIA).toContain("actionability");
    expect(REPORT_EVAL_CRITERIA).toContain("persona-alignment");
  });

  it("should set PASS_THRESHOLD to 4", () => {
    expect(REPORT_EVAL_PASS_THRESHOLD).toBe(4);
  });

  it("ReportEvalJudgeBreakdown should have 6 dimensions", () => {
    const breakdown: ReportEvalJudgeBreakdown = {
      dataAccuracy: 4,
      completeness: 5,
      narrativeQuality: 3,
      formatting: 5,
      actionability: 4,
      personaAlignment: 4,
    };
    expect(Object.keys(breakdown)).toHaveLength(6);
    for (const val of Object.values(breakdown)) {
      expect(val).toBeGreaterThanOrEqual(1);
      expect(val).toBeLessThanOrEqual(5);
    }
  });
});
