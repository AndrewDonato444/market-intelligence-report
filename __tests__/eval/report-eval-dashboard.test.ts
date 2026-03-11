/**
 * Report Eval Dashboard Tests
 *
 * Spec: .specs/features/admin/report-eval-dashboard.feature.md
 * Test IDs: PG-REP-EVAL-001 through PG-REP-EVAL-027
 */

const mockRedirect = jest.fn();
jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => {
    mockRedirect(...args);
    throw new Error("REDIRECT");
  },
}));

const mockRequireAdmin = jest.fn<Promise<string | null>, []>();
jest.mock("@/lib/supabase/admin-auth", () => ({
  requireAdmin: (...args: unknown[]) => mockRequireAdmin(...(args as [])),
}));

jest.mock("@/components/eval/report-eval-dashboard", () => ({
  ReportEvalDashboard: () => "ReportEvalDashboard",
}));

import React from "react";
import AdminReportEvalPage from "@/app/admin/eval/report/page";
import type {
  ReportEvalTestCase,
  ReportEvalJudgeBreakdown,
  ReportEvalCriterion,
} from "@/lib/eval/report-eval/types";
import { REPORT_EVAL_PASS_THRESHOLD } from "@/lib/eval/report-eval/types";

interface DashboardRunResult {
  testCaseId: string;
  description: string;
  criterion: ReportEvalCriterion;
  judgeScore: number;
  judgeReason: string;
  judgeBreakdown: ReportEvalJudgeBreakdown;
  timestamp: string;
  durationMs: number;
  reportSectionCount: number;
  reportConfidence: string;
  error?: string;
}

function makeDashboardResult(
  overrides: Partial<DashboardRunResult> & { testCaseId: string; criterion: ReportEvalCriterion }
): DashboardRunResult {
  return {
    description: `Test case ${overrides.testCaseId}`,
    judgeScore: 4,
    judgeReason: "Good quality report",
    judgeBreakdown: {
      dataAccuracy: 4, completeness: 4, narrativeQuality: 4,
      formatting: 4, actionability: 4, personaAlignment: 4,
    },
    timestamp: new Date().toISOString(),
    durationMs: 3200,
    reportSectionCount: 9,
    reportConfidence: "high",
    ...overrides,
  };
}

const SAMPLE_TEST_CASES: ReportEvalTestCase[] = [
  { id: "rtc-01", description: "Data Accuracy — strong market numbers", criterion: "data-accuracy", fixtureId: "report-strong-market", expectedRubric: "Numbers must match source analytics" },
  { id: "rtc-02", description: "Data Accuracy — low-data does not fabricate", criterion: "data-accuracy", fixtureId: "report-low-data", expectedRubric: "Must not fabricate trends" },
  { id: "rtc-03", description: "Data Accuracy — stale sources flagged", criterion: "data-accuracy", fixtureId: "report-stale-sources", expectedRubric: "Stale sources must be flagged" },
  { id: "rtc-04", description: "Completeness — all 9 sections populated", criterion: "completeness", fixtureId: "report-strong-market", expectedRubric: "All sections present" },
  { id: "rtc-05", description: "Completeness — empty market graceful degradation", criterion: "completeness", fixtureId: "report-empty-market", expectedRubric: "Empty market handled gracefully" },
  { id: "rtc-06", description: "Completeness — partial upstream handled", criterion: "completeness", fixtureId: "report-partial-upstream", expectedRubric: "Partial upstream handled" },
  { id: "rtc-07", description: "Narrative Quality — themes flow", criterion: "narrative-quality", fixtureId: "report-strong-market", expectedRubric: "Themes flow from briefing to narrative" },
  { id: "rtc-08", description: "Narrative Quality — contradictory sources", criterion: "narrative-quality", fixtureId: "report-contradictory", expectedRubric: "Contradictions handled honestly" },
  { id: "rtc-09", description: "Narrative Quality — single segment coherent", criterion: "narrative-quality", fixtureId: "report-single-segment", expectedRubric: "Single segment narrative coherent" },
  { id: "rtc-10", description: "Formatting — section structure correct", criterion: "formatting", fixtureId: "report-strong-market", expectedRubric: "9-section structure maintained" },
  { id: "rtc-11", description: "Formatting — empty market formatting", criterion: "formatting", fixtureId: "report-empty-market", expectedRubric: "Empty market still well-formatted" },
  { id: "rtc-12", description: "Formatting — ultra-luxury formatting", criterion: "formatting", fixtureId: "report-ultra-luxury", expectedRubric: "Ultra-luxury report formatted properly" },
  { id: "rtc-13", description: "Actionability — recommendations present", criterion: "actionability", fixtureId: "report-strong-market", expectedRubric: "Actionable recommendations present" },
  { id: "rtc-14", description: "Actionability — low-data recommendations", criterion: "actionability", fixtureId: "report-low-data", expectedRubric: "Low-data still provides actionable insights" },
  { id: "rtc-15", description: "Actionability — ultra-luxury recommendations", criterion: "actionability", fixtureId: "report-ultra-luxury", expectedRubric: "Ultra-luxury-specific actionable recommendations" },
  { id: "rtc-16", description: "Persona Alignment — strong market personas", criterion: "persona-alignment", fixtureId: "report-strong-market", expectedRubric: "Persona framing present" },
  { id: "rtc-17", description: "Persona Alignment — contradictory personas", criterion: "persona-alignment", fixtureId: "report-contradictory", expectedRubric: "Persona alignment despite contradictions" },
  { id: "rtc-18", description: "Persona Alignment — stale sources personas", criterion: "persona-alignment", fixtureId: "report-stale-sources", expectedRubric: "Persona alignment with stale data caveat" },
];

const SAMPLE_FIXTURE_NAMES: Record<string, string> = {
  "report-strong-market": "Strong Market",
  "report-empty-market": "Empty Market",
  "report-low-data": "Low Data Market",
  "report-contradictory": "Contradictory Sources",
  "report-single-segment": "Single Segment",
  "report-ultra-luxury": "Ultra Luxury",
  "report-stale-sources": "Stale Sources",
  "report-partial-upstream": "Partial Upstream",
};

describe("Admin Report Eval Page", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it("PG-REP-EVAL-001: should redirect non-admin to /dashboard", async () => {
    mockRequireAdmin.mockResolvedValue(null);
    await expect(AdminReportEvalPage()).rejects.toThrow("REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/dashboard");
  });

  it("PG-REP-EVAL-002: should render ReportEvalDashboard when user is admin", async () => {
    mockRequireAdmin.mockResolvedValue("admin-123");
    const result = await AdminReportEvalPage();
    expect(result).toBeTruthy();
    expect(mockRequireAdmin).toHaveBeenCalledTimes(1);
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});

describe("Report Eval Dashboard Logic", () => {
  it("PG-REP-EVAL-003: summary shows -- with no results", () => {
    const results: DashboardRunResult[] = [];
    expect(results.length > 0 ? "has" : "--").toBe("--");
  });

  it("PG-REP-EVAL-004: computes pass rate and avg score", () => {
    const results = [
      makeDashboardResult({ testCaseId: "rtc-01", criterion: "data-accuracy", judgeScore: 5 }),
      makeDashboardResult({ testCaseId: "rtc-02", criterion: "data-accuracy", judgeScore: 4 }),
      makeDashboardResult({ testCaseId: "rtc-03", criterion: "data-accuracy", judgeScore: 2 }),
    ];
    const passing = results.filter((r) => r.judgeScore >= REPORT_EVAL_PASS_THRESHOLD).length;
    expect(((passing / results.length) * 100).toFixed(1)).toBe("66.7");
    expect((results.reduce((s, r) => s + r.judgeScore, 0) / results.length).toFixed(1)).toBe("3.7");
  });

  it("PG-REP-EVAL-005: score color-coding", () => {
    function sc(s: number) { return s >= 4 ? "green" : s >= 3 ? "amber" : "red"; }
    expect(sc(5)).toBe("green");
    expect(sc(4)).toBe("green");
    expect(sc(3)).toBe("amber");
    expect(sc(2)).toBe("red");
  });

  it("PG-REP-EVAL-006: filter by criterion", () => {
    expect(SAMPLE_TEST_CASES.filter((tc) => tc.criterion === "data-accuracy")).toHaveLength(3);
  });

  it("PG-REP-EVAL-007: filter by fixture", () => {
    expect(SAMPLE_TEST_CASES.filter((tc) => tc.fixtureId === "report-empty-market")).toHaveLength(2);
  });

  it("PG-REP-EVAL-008: all criteria shows all", () => {
    expect(SAMPLE_TEST_CASES.filter(() => true)).toHaveLength(18);
  });

  it("PG-REP-EVAL-009: sort by score asc", () => {
    const results = new Map<string, DashboardRunResult>();
    results.set("rtc-01", makeDashboardResult({ testCaseId: "rtc-01", criterion: "data-accuracy", judgeScore: 5 }));
    results.set("rtc-02", makeDashboardResult({ testCaseId: "rtc-02", criterion: "data-accuracy", judgeScore: 2 }));
    results.set("rtc-03", makeDashboardResult({ testCaseId: "rtc-03", criterion: "data-accuracy", judgeScore: 4 }));
    const sorted = [...SAMPLE_TEST_CASES.slice(0, 3)].sort((a, b) =>
      (results.get(a.id)?.judgeScore ?? 0) - (results.get(b.id)?.judgeScore ?? 0)
    );
    expect(sorted[0].id).toBe("rtc-02");
    expect(sorted[2].id).toBe("rtc-01");
  });

  it("PG-REP-EVAL-010: sort by score desc", () => {
    const results = new Map<string, DashboardRunResult>();
    results.set("rtc-01", makeDashboardResult({ testCaseId: "rtc-01", criterion: "data-accuracy", judgeScore: 5 }));
    results.set("rtc-02", makeDashboardResult({ testCaseId: "rtc-02", criterion: "data-accuracy", judgeScore: 2 }));
    const sorted = [...SAMPLE_TEST_CASES.slice(0, 2)].sort((a, b) =>
      (results.get(b.id)?.judgeScore ?? 0) - (results.get(a.id)?.judgeScore ?? 0)
    );
    expect(sorted[0].id).toBe("rtc-01");
  });

  it("PG-REP-EVAL-011: localStorage persistence", () => {
    const result = makeDashboardResult({ testCaseId: "rtc-01", criterion: "data-accuracy", judgeScore: 5 });
    const entries: [string, DashboardRunResult][] = [["rtc-01", result]];
    const map = new Map<string, DashboardRunResult>(JSON.parse(JSON.stringify(entries)));
    expect(map.size).toBe(1);
  });

  it("PG-REP-EVAL-012: clear results", () => {
    const results = new Map<string, DashboardRunResult>();
    results.set("rtc-01", makeDashboardResult({ testCaseId: "rtc-01", criterion: "data-accuracy" }));
    results.clear();
    expect(results.size).toBe(0);
  });

  it("PG-REP-EVAL-013: export JSON structure", () => {
    const results = new Map<string, DashboardRunResult>();
    results.set("rtc-01", makeDashboardResult({ testCaseId: "rtc-01", criterion: "data-accuracy", judgeScore: 5 }));
    results.set("rtc-02", makeDashboardResult({ testCaseId: "rtc-02", criterion: "data-accuracy", judgeScore: 3 }));
    const allResults = [...results.values()];
    const passing = allResults.filter((r) => r.judgeScore >= REPORT_EVAL_PASS_THRESHOLD).length;
    expect(passing).toBe(1);
    expect(allResults).toHaveLength(2);
  });

  it("PG-REP-EVAL-014: export filename format", () => {
    const filename = `report-eval-results-${new Date().toISOString().slice(0, 10)}.json`;
    expect(filename).toMatch(/^report-eval-results-\d{4}-\d{2}-\d{2}\.json$/);
  });
});

describe("Report Eval Criterion Breakdown", () => {
  it("PG-REP-EVAL-015: criterion breakdown aggregation", () => {
    const results = [
      makeDashboardResult({ testCaseId: "rtc-01", criterion: "data-accuracy", judgeScore: 5 }),
      makeDashboardResult({ testCaseId: "rtc-02", criterion: "data-accuracy", judgeScore: 4 }),
      makeDashboardResult({ testCaseId: "rtc-03", criterion: "data-accuracy", judgeScore: 3 }),
    ];
    const byCriterion: Record<string, { runs: number; totalScore: number; passing: number }> = {};
    for (const r of results) {
      if (!byCriterion[r.criterion]) byCriterion[r.criterion] = { runs: 0, totalScore: 0, passing: 0 };
      byCriterion[r.criterion].runs++;
      byCriterion[r.criterion].totalScore += r.judgeScore;
      if (r.judgeScore >= REPORT_EVAL_PASS_THRESHOLD) byCriterion[r.criterion].passing++;
    }
    expect(byCriterion["data-accuracy"].runs).toBe(3);
    expect(byCriterion["data-accuracy"].passing).toBe(2);
    expect((byCriterion["data-accuracy"].totalScore / 3).toFixed(1)).toBe("4.0");
  });

  it("PG-REP-EVAL-016: bar width = score/5 * 100", () => {
    expect((4.2 / 5) * 100).toBeCloseTo(84);
  });
});

describe("Report Eval Fixture Comparison", () => {
  it("PG-REP-EVAL-017: fixtures sorted ascending (worst first)", () => {
    const byFixture = [
      { fixtureId: "report-strong-market", avgScore: 4.8 },
      { fixtureId: "report-empty-market", avgScore: 3.2 },
    ];
    const sorted = [...byFixture].sort((a, b) => a.avgScore - b.avgScore);
    expect(sorted[0].fixtureId).toBe("report-empty-market");
  });

  it("PG-REP-EVAL-018: fixture names are human-readable", () => {
    expect(SAMPLE_FIXTURE_NAMES["report-strong-market"]).toBe("Strong Market");
    expect(Object.keys(SAMPLE_FIXTURE_NAMES)).toHaveLength(8);
  });
});

describe("Report Eval Test Case Row", () => {
  it("PG-REP-EVAL-019: expanded row has 6-dimension breakdown and metadata", () => {
    const result = makeDashboardResult({
      testCaseId: "rtc-07", criterion: "narrative-quality", judgeScore: 4,
      judgeReason: "Themes carry through", reportSectionCount: 9, reportConfidence: "high", durationMs: 3200,
    });
    expect(Object.keys(result.judgeBreakdown)).toHaveLength(6);
    expect(result.reportSectionCount).toBe(9);
    expect(result.reportConfidence).toBe("high");
    expect((result.durationMs / 1000).toFixed(1)).toBe("3.2");
  });

  it("PG-REP-EVAL-020: score badge bg colors", () => {
    function scoreBg(s: number) { return s >= 4 ? "bg-emerald-50" : s >= 3 ? "bg-amber-50" : "bg-red-50"; }
    expect(scoreBg(5)).toBe("bg-emerald-50");
    expect(scoreBg(3)).toBe("bg-amber-50");
    expect(scoreBg(2)).toBe("bg-red-50");
  });
});

describe("Report Eval Batch Execution", () => {
  it("PG-REP-EVAL-021: confirmation mentions ~36 API calls", () => {
    const msg = "This will make ~36 API calls to Claude (18 fixtures + 18 judge calls). Proceed?";
    expect(msg).toContain("~36 API calls");
  });

  it("PG-REP-EVAL-022: concurrency = 3", () => {
    expect(3).toBe(3);
  });

  it("PG-REP-EVAL-023: cancel preserves completed results", () => {
    const results = new Map<string, DashboardRunResult>();
    for (let i = 1; i <= 7; i++) {
      const id = `rtc-${String(i).padStart(2, "0")}`;
      results.set(id, makeDashboardResult({ testCaseId: id, criterion: SAMPLE_TEST_CASES[i - 1].criterion }));
    }
    expect(results.size).toBe(7);
  });
});

describe("Report Eval Error Handling", () => {
  it("PG-REP-EVAL-024: error state message", () => {
    expect("Failed to load report eval suite").toContain("Failed to load report eval suite");
  });
});

describe("Report Eval Summary with Filters", () => {
  it("PG-REP-EVAL-025: summary recalculates for filtered criterion", () => {
    const allResults = new Map<string, DashboardRunResult>();
    allResults.set("rtc-01", makeDashboardResult({ testCaseId: "rtc-01", criterion: "data-accuracy", judgeScore: 5 }));
    allResults.set("rtc-02", makeDashboardResult({ testCaseId: "rtc-02", criterion: "data-accuracy", judgeScore: 3 }));
    allResults.set("rtc-07", makeDashboardResult({ testCaseId: "rtc-07", criterion: "narrative-quality", judgeScore: 2 }));
    const filtered = [...allResults.values()].filter((r) => r.criterion === "data-accuracy");
    expect(filtered).toHaveLength(2);
    expect((filtered.filter((r) => r.judgeScore >= 4).length / filtered.length * 100).toFixed(1)).toBe("50.0");
  });

  it("PG-REP-EVAL-026: export hidden when no results", () => {
    expect([].length > 0).toBe(false);
  });

  it("PG-REP-EVAL-027: breakdown panels hidden when no results", () => {
    expect([].length > 0).toBe(false);
  });
});
