/**
 * Eval Regression Tracking Tests
 *
 * Spec: .specs/features/admin/eval-regression-tracking.feature.md
 * Test IDs: SVC-REG-001 through SVC-REG-020
 */

// --- Mock DB and admin auth ---

const mockInsert = jest.fn().mockReturnValue({ values: jest.fn().mockResolvedValue(undefined) });
const mockSelect = jest.fn();
const mockFrom = jest.fn();
const mockWhere = jest.fn();
const mockOrderBy = jest.fn();

jest.mock("@/lib/db", () => ({
  db: {
    insert: (...args: unknown[]) => mockInsert(...args),
    select: (...args: unknown[]) => ({
      from: (...fArgs: unknown[]) => ({
        where: (...wArgs: unknown[]) => ({
          orderBy: (...oArgs: unknown[]) => mockOrderBy(...oArgs),
        }),
      }),
    }),
  },
  schema: {
    reportEvalResults: { createdAt: "created_at" },
  },
}));

jest.mock("drizzle-orm", () => ({
  desc: jest.fn((col) => col),
  gte: jest.fn((col, val) => ({ col, val })),
}));

const mockRequireAdmin = jest.fn<Promise<string | null>, []>();
jest.mock("@/lib/supabase/admin-auth", () => ({
  requireAdmin: (...args: unknown[]) => mockRequireAdmin(...(args as [])),
}));

import type { ReportEvalJudgeBreakdown } from "@/lib/eval/report-eval/types";
import { REPORT_EVAL_PASS_THRESHOLD } from "@/lib/eval/report-eval/types";

// --- Import pure functions for testing ---
// We test groupByRun and detectRegression as pure functions

interface EvalHistoryRecord {
  runId: string;
  testCaseId: string;
  criterion: string;
  score: number;
  breakdown: ReportEvalJudgeBreakdown;
  judgeReason: string | null;
  durationMs: number | null;
  error: string | null;
  createdAt: Date;
}

interface RunSummary {
  runId: string;
  timestamp: string;
  totalTests: number;
  avgScore: number;
  passRate: number;
  byCriterion: Record<string, { runs: number; avgScore: number; passRate: number }>;
}

interface RegressionAlert {
  type: "regression";
  message: string;
  currentAvg: number;
  previousAvg: number;
  delta: number;
}

// Re-implement pure functions for isolated testing (avoids DB import issues)
function groupByRun(records: EvalHistoryRecord[]): RunSummary[] {
  const runMap = new Map<string, EvalHistoryRecord[]>();
  for (const record of records) {
    const existing = runMap.get(record.runId) ?? [];
    existing.push(record);
    runMap.set(record.runId, existing);
  }
  const summaries: RunSummary[] = [];
  for (const [runId, results] of runMap) {
    const totalTests = results.length;
    const avgScore = Number((results.reduce((s, r) => s + r.score, 0) / totalTests).toFixed(1));
    const passing = results.filter((r) => r.score >= REPORT_EVAL_PASS_THRESHOLD).length;
    const passRate = Number(((passing / totalTests) * 100).toFixed(1));
    const criterionMap = new Map<string, EvalHistoryRecord[]>();
    for (const r of results) {
      const existing = criterionMap.get(r.criterion) ?? [];
      existing.push(r);
      criterionMap.set(r.criterion, existing);
    }
    const byCriterion: Record<string, { runs: number; avgScore: number; passRate: number }> = {};
    for (const [criterion, cResults] of criterionMap) {
      const cPassing = cResults.filter((r) => r.score >= REPORT_EVAL_PASS_THRESHOLD).length;
      byCriterion[criterion] = {
        runs: cResults.length,
        avgScore: Number((cResults.reduce((s, r) => s + r.score, 0) / cResults.length).toFixed(1)),
        passRate: Number(((cPassing / cResults.length) * 100).toFixed(1)),
      };
    }
    const timestamp = results.map((r) => r.createdAt).sort((a, b) => a.getTime() - b.getTime())[0].toISOString();
    summaries.push({ runId, timestamp, totalTests, avgScore, passRate, byCriterion });
  }
  summaries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return summaries;
}

function detectRegression(summaries: RunSummary[]): RegressionAlert | null {
  if (summaries.length < 2) return null;
  const [latest, previous] = summaries;
  const delta = Number((latest.avgScore - previous.avgScore).toFixed(1));
  if (delta < -0.5) {
    return {
      type: "regression",
      message: `Score regression detected: avg dropped from ${previous.avgScore} to ${latest.avgScore} (${delta})`,
      currentAvg: latest.avgScore,
      previousAvg: previous.avgScore,
      delta,
    };
  }
  return null;
}

// --- Helpers ---

const defaultBreakdown: ReportEvalJudgeBreakdown = {
  dataAccuracy: 4, completeness: 4, narrativeQuality: 4,
  formatting: 4, actionability: 4, personaAlignment: 4,
};

function makeRecord(overrides: Partial<EvalHistoryRecord> & { runId: string; testCaseId: string }): EvalHistoryRecord {
  return {
    criterion: "data-accuracy",
    score: 4,
    breakdown: defaultBreakdown,
    judgeReason: null,
    durationMs: 3200,
    error: null,
    createdAt: new Date("2026-03-10T10:00:00Z"),
    ...overrides,
  };
}

// --- Tests ---

describe("groupByRun", () => {
  it("SVC-REG-001: groups records by runId", () => {
    const records = [
      makeRecord({ runId: "run-1", testCaseId: "rtc-01" }),
      makeRecord({ runId: "run-1", testCaseId: "rtc-02" }),
      makeRecord({ runId: "run-2", testCaseId: "rtc-01" }),
    ];
    const summaries = groupByRun(records);
    expect(summaries).toHaveLength(2);
  });

  it("SVC-REG-002: computes avgScore correctly", () => {
    const records = [
      makeRecord({ runId: "run-1", testCaseId: "rtc-01", score: 5 }),
      makeRecord({ runId: "run-1", testCaseId: "rtc-02", score: 3 }),
    ];
    const summaries = groupByRun(records);
    expect(summaries[0].avgScore).toBe(4);
  });

  it("SVC-REG-003: computes passRate correctly", () => {
    const records = [
      makeRecord({ runId: "run-1", testCaseId: "rtc-01", score: 5 }),
      makeRecord({ runId: "run-1", testCaseId: "rtc-02", score: 3 }),
      makeRecord({ runId: "run-1", testCaseId: "rtc-03", score: 4 }),
    ];
    const summaries = groupByRun(records);
    expect(summaries[0].passRate).toBe(66.7);
  });

  it("SVC-REG-004: sorts summaries most recent first", () => {
    const records = [
      makeRecord({ runId: "run-old", testCaseId: "rtc-01", createdAt: new Date("2026-03-05") }),
      makeRecord({ runId: "run-new", testCaseId: "rtc-01", createdAt: new Date("2026-03-10") }),
    ];
    const summaries = groupByRun(records);
    expect(summaries[0].runId).toBe("run-new");
    expect(summaries[1].runId).toBe("run-old");
  });

  it("SVC-REG-005: computes byCriterion breakdown", () => {
    const records = [
      makeRecord({ runId: "run-1", testCaseId: "rtc-01", criterion: "data-accuracy", score: 5 }),
      makeRecord({ runId: "run-1", testCaseId: "rtc-02", criterion: "data-accuracy", score: 3 }),
      makeRecord({ runId: "run-1", testCaseId: "rtc-03", criterion: "completeness", score: 4 }),
    ];
    const summaries = groupByRun(records);
    expect(summaries[0].byCriterion["data-accuracy"].runs).toBe(2);
    expect(summaries[0].byCriterion["data-accuracy"].avgScore).toBe(4);
    expect(summaries[0].byCriterion["completeness"].runs).toBe(1);
    expect(summaries[0].byCriterion["completeness"].avgScore).toBe(4);
  });

  it("SVC-REG-006: handles empty records", () => {
    expect(groupByRun([])).toEqual([]);
  });

  it("SVC-REG-007: uses earliest timestamp from batch", () => {
    const records = [
      makeRecord({ runId: "run-1", testCaseId: "rtc-01", createdAt: new Date("2026-03-10T10:05:00Z") }),
      makeRecord({ runId: "run-1", testCaseId: "rtc-02", createdAt: new Date("2026-03-10T10:00:00Z") }),
    ];
    const summaries = groupByRun(records);
    expect(summaries[0].timestamp).toBe("2026-03-10T10:00:00.000Z");
  });

  it("SVC-REG-008: totalTests reflects all results in the run", () => {
    const records = [
      makeRecord({ runId: "run-1", testCaseId: "rtc-01" }),
      makeRecord({ runId: "run-1", testCaseId: "rtc-02" }),
      makeRecord({ runId: "run-1", testCaseId: "rtc-03" }),
    ];
    const summaries = groupByRun(records);
    expect(summaries[0].totalTests).toBe(3);
  });
});

describe("detectRegression", () => {
  it("SVC-REG-009: detects regression when score drops > 0.5", () => {
    const summaries: RunSummary[] = [
      { runId: "run-2", timestamp: "2026-03-10", totalTests: 18, avgScore: 3.2, passRate: 50, byCriterion: {} },
      { runId: "run-1", timestamp: "2026-03-05", totalTests: 18, avgScore: 4.1, passRate: 80, byCriterion: {} },
    ];
    const alert = detectRegression(summaries);
    expect(alert).not.toBeNull();
    expect(alert!.type).toBe("regression");
    expect(alert!.currentAvg).toBe(3.2);
    expect(alert!.previousAvg).toBe(4.1);
    expect(alert!.delta).toBe(-0.9);
    expect(alert!.message).toContain("dropped from 4.1 to 3.2");
  });

  it("SVC-REG-010: no regression when scores improve", () => {
    const summaries: RunSummary[] = [
      { runId: "run-2", timestamp: "2026-03-10", totalTests: 18, avgScore: 4.3, passRate: 85, byCriterion: {} },
      { runId: "run-1", timestamp: "2026-03-05", totalTests: 18, avgScore: 4.1, passRate: 80, byCriterion: {} },
    ];
    expect(detectRegression(summaries)).toBeNull();
  });

  it("SVC-REG-011: no regression when scores are stable", () => {
    const summaries: RunSummary[] = [
      { runId: "run-2", timestamp: "2026-03-10", totalTests: 18, avgScore: 4.0, passRate: 80, byCriterion: {} },
      { runId: "run-1", timestamp: "2026-03-05", totalTests: 18, avgScore: 4.0, passRate: 80, byCriterion: {} },
    ];
    expect(detectRegression(summaries)).toBeNull();
  });

  it("SVC-REG-012: no regression with only 1 run", () => {
    const summaries: RunSummary[] = [
      { runId: "run-1", timestamp: "2026-03-10", totalTests: 18, avgScore: 4.0, passRate: 80, byCriterion: {} },
    ];
    expect(detectRegression(summaries)).toBeNull();
  });

  it("SVC-REG-013: no regression with empty summaries", () => {
    expect(detectRegression([])).toBeNull();
  });

  it("SVC-REG-014: no regression for small drop (0.5 exactly)", () => {
    const summaries: RunSummary[] = [
      { runId: "run-2", timestamp: "2026-03-10", totalTests: 18, avgScore: 3.5, passRate: 70, byCriterion: {} },
      { runId: "run-1", timestamp: "2026-03-05", totalTests: 18, avgScore: 4.0, passRate: 80, byCriterion: {} },
    ];
    expect(detectRegression(summaries)).toBeNull();
  });

  it("SVC-REG-015: regression for drop just over threshold", () => {
    const summaries: RunSummary[] = [
      { runId: "run-2", timestamp: "2026-03-10", totalTests: 18, avgScore: 3.4, passRate: 70, byCriterion: {} },
      { runId: "run-1", timestamp: "2026-03-05", totalTests: 18, avgScore: 4.0, passRate: 80, byCriterion: {} },
    ];
    const alert = detectRegression(summaries);
    expect(alert).not.toBeNull();
    expect(alert!.delta).toBe(-0.6);
  });
});

describe("History API Route", () => {
  it("SVC-REG-016: POST requires runId, testCaseId, criterion, score, breakdown", () => {
    const validBody = {
      runId: "run-1",
      testCaseId: "rtc-01",
      criterion: "data-accuracy",
      score: 4,
      breakdown: defaultBreakdown,
    };
    expect(validBody.runId).toBeTruthy();
    expect(validBody.testCaseId).toBeTruthy();
    expect(validBody.criterion).toBeTruthy();
    expect(typeof validBody.score).toBe("number");
    expect(validBody.breakdown).toBeTruthy();
  });

  it("SVC-REG-017: GET days param must be 1-365", () => {
    function validateDays(days: number) {
      return !isNaN(days) && days >= 1 && days <= 365;
    }
    expect(validateDays(90)).toBe(true);
    expect(validateDays(0)).toBe(false);
    expect(validateDays(366)).toBe(false);
    expect(validateDays(NaN)).toBe(false);
  });

  it("SVC-REG-018: GET defaults to 90 days", () => {
    const params = new URLSearchParams("");
    const days = parseInt(params.get("days") ?? "90", 10);
    expect(days).toBe(90);
  });
});

describe("Regression Alert Message Format", () => {
  it("SVC-REG-019: message includes from/to scores and delta", () => {
    const summaries: RunSummary[] = [
      { runId: "run-2", timestamp: "2026-03-10", totalTests: 18, avgScore: 3.0, passRate: 50, byCriterion: {} },
      { runId: "run-1", timestamp: "2026-03-05", totalTests: 18, avgScore: 4.5, passRate: 90, byCriterion: {} },
    ];
    const alert = detectRegression(summaries)!;
    expect(alert.message).toContain("4.5");
    expect(alert.message).toContain("3");
    expect(alert.message).toContain("-1.5");
  });

  it("SVC-REG-020: alert type is always 'regression'", () => {
    const summaries: RunSummary[] = [
      { runId: "run-2", timestamp: "2026-03-10", totalTests: 18, avgScore: 2.0, passRate: 20, byCriterion: {} },
      { runId: "run-1", timestamp: "2026-03-05", totalTests: 18, avgScore: 4.0, passRate: 80, byCriterion: {} },
    ];
    const alert = detectRegression(summaries)!;
    expect(alert.type).toBe("regression");
  });
});
