/**
 * Report Eval — Runner
 *
 * Executes report-level evaluations against fixtures using LLM-as-judge scoring.
 * Unlike the per-agent runner, this evaluates complete AssembledReport objects
 * (the output of assembleReport()) rather than individual agent outputs.
 */

import type {
  ReportEvalRunResult,
  ReportEvalJudgeBreakdown,
  ReportEvalCriterion,
  REPORT_EVAL_CRITERIA,
} from "./types";
import { REPORT_EVAL_PASS_THRESHOLD } from "./types";
import { getReportTestCase, REPORT_EVAL_TEST_CASES } from "./test-cases";
import { getReportFixture, summarizeReportFixture } from "./fixtures";
import { scoreReportWithJudge } from "./judge";

// --- Constants ---

const MAX_REPORT_EVAL_CONCURRENCY = 3;

// --- Summary types ---

export interface ReportEvalCriterionSummary {
  runs: number;
  passRate: number;
  avgScore: number;
}

export interface ReportEvalFixtureSummary {
  runs: number;
  passRate: number;
  avgScore: number;
}

export interface ReportEvalSummary {
  totalRuns: number;
  passRate: number;
  avgScore: number;
  avgBreakdown: ReportEvalJudgeBreakdown;
  byCriterion: Record<string, ReportEvalCriterionSummary>;
  byFixture: Record<string, ReportEvalFixtureSummary>;
  byTestCase: {
    testCaseId: string;
    score: number;
    passed: boolean;
    criterion: string;
  }[];
}

// --- Single test case execution ---

export async function runSingleReportTestCase(
  testCaseId: string
): Promise<ReportEvalRunResult> {
  const start = Date.now();
  const testCase = getReportTestCase(testCaseId);
  const fixture = getReportFixture(testCase.fixtureId);
  const fixtureSummary = summarizeReportFixture(fixture);

  try {
    const judgeResult = await scoreReportWithJudge(
      testCase,
      fixture.report,
      fixtureSummary
    );

    return {
      testCaseId,
      description: testCase.description,
      criterion: testCase.criterion,
      report: fixture.report,
      judgeScore: judgeResult.score,
      judgeReason: judgeResult.reason,
      judgeBreakdown: judgeResult.breakdown,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - start,
    };
  } catch (err: unknown) {
    const errorMsg = (err as Error).message || "Unknown error";
    return {
      testCaseId,
      description: testCase.description,
      criterion: testCase.criterion,
      report: fixture.report,
      judgeScore: 1,
      judgeReason: `Runner error: ${errorMsg}`,
      judgeBreakdown: {
        dataAccuracy: 1,
        completeness: 1,
        narrativeQuality: 1,
        formatting: 1,
        actionability: 1,
        personaAlignment: 1,
      },
      timestamp: new Date().toISOString(),
      error: errorMsg,
      durationMs: Date.now() - start,
    };
  }
}

// --- Batch execution ---

export async function runAllReportTestCases(
  opts?: {
    concurrency?: number;
    onProgress?: (completed: number, total: number) => void;
  }
): Promise<ReportEvalRunResult[]> {
  const concurrency = opts?.concurrency ?? MAX_REPORT_EVAL_CONCURRENCY;
  const total = REPORT_EVAL_TEST_CASES.length;
  const results: ReportEvalRunResult[] = [];
  let completed = 0;

  const queue = [...REPORT_EVAL_TEST_CASES.map((tc) => tc.id)];
  const executing = new Set<Promise<void>>();

  async function runNext(): Promise<void> {
    const id = queue.shift();
    if (!id) return;

    const result = await runSingleReportTestCase(id);
    results.push(result);
    completed++;
    opts?.onProgress?.(completed, total);
  }

  // Fill initial pool
  while (queue.length > 0 && executing.size < concurrency) {
    const p = runNext().then(() => {
      executing.delete(p);
    });
    executing.add(p);
  }

  // Process remaining
  while (executing.size > 0) {
    await Promise.race(executing);
    while (queue.length > 0 && executing.size < concurrency) {
      const p = runNext().then(() => {
        executing.delete(p);
      });
      executing.add(p);
    }
  }

  return results;
}

// --- Report summary ---

export function buildReportEvalSummary(
  results: ReportEvalRunResult[]
): ReportEvalSummary {
  const total = results.length;
  if (total === 0) {
    return {
      totalRuns: 0,
      passRate: 0,
      avgScore: 0,
      avgBreakdown: {
        dataAccuracy: 0,
        completeness: 0,
        narrativeQuality: 0,
        formatting: 0,
        actionability: 0,
        personaAlignment: 0,
      },
      byCriterion: {},
      byFixture: {},
      byTestCase: [],
    };
  }

  const passing = results.filter(
    (r) => r.judgeScore >= REPORT_EVAL_PASS_THRESHOLD
  ).length;
  const passRate = Number(((passing / total) * 100).toFixed(1));
  const avgScore = Number(
    (results.reduce((s, r) => s + r.judgeScore, 0) / total).toFixed(1)
  );

  // Average breakdown
  const avgBreakdown: ReportEvalJudgeBreakdown = {
    dataAccuracy: avg(results.map((r) => r.judgeBreakdown.dataAccuracy)),
    completeness: avg(results.map((r) => r.judgeBreakdown.completeness)),
    narrativeQuality: avg(results.map((r) => r.judgeBreakdown.narrativeQuality)),
    formatting: avg(results.map((r) => r.judgeBreakdown.formatting)),
    actionability: avg(results.map((r) => r.judgeBreakdown.actionability)),
    personaAlignment: avg(results.map((r) => r.judgeBreakdown.personaAlignment)),
  };

  // By criterion
  const byCriterion: Record<string, ReportEvalCriterionSummary> = {};
  const criterionGroups = groupBy(results, (r) => r.criterion);
  for (const [criterion, cResults] of Object.entries(criterionGroups)) {
    const cPassing = cResults.filter(
      (r) => r.judgeScore >= REPORT_EVAL_PASS_THRESHOLD
    ).length;
    byCriterion[criterion] = {
      runs: cResults.length,
      passRate: Number(((cPassing / cResults.length) * 100).toFixed(1)),
      avgScore: Number(
        (cResults.reduce((s, r) => s + r.judgeScore, 0) / cResults.length).toFixed(1)
      ),
    };
  }

  // By fixture
  const byFixture: Record<string, ReportEvalFixtureSummary> = {};
  const fixtureGroups = groupBy(results, (r) => {
    const tc = getReportTestCase(r.testCaseId);
    return tc.fixtureId;
  });
  for (const [fixtureId, fResults] of Object.entries(fixtureGroups)) {
    const fPassing = fResults.filter(
      (r) => r.judgeScore >= REPORT_EVAL_PASS_THRESHOLD
    ).length;
    byFixture[fixtureId] = {
      runs: fResults.length,
      passRate: Number(((fPassing / fResults.length) * 100).toFixed(1)),
      avgScore: Number(
        (fResults.reduce((s, r) => s + r.judgeScore, 0) / fResults.length).toFixed(1)
      ),
    };
  }

  // By test case
  const byTestCase = results.map((r) => ({
    testCaseId: r.testCaseId,
    score: r.judgeScore,
    passed: r.judgeScore >= REPORT_EVAL_PASS_THRESHOLD,
    criterion: r.criterion,
  }));

  return {
    totalRuns: total,
    passRate,
    avgScore,
    avgBreakdown,
    byCriterion,
    byFixture,
    byTestCase,
  };
}

// --- Helpers ---

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Number((nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2));
}

function groupBy<T>(
  items: T[],
  keyFn: (item: T) => string
): Record<string, T[]> {
  const groups: Record<string, T[]> = {};
  for (const item of items) {
    const key = keyFn(item);
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  return groups;
}
