/**
 * Report Eval — History Service
 *
 * Persists eval results to the database and queries historical data
 * for regression tracking and trend analysis.
 */

import { db, schema } from "@/lib/db";
import { desc, gte } from "drizzle-orm";
import type { ReportEvalJudgeBreakdown } from "./types";
import { REPORT_EVAL_PASS_THRESHOLD } from "./types";

// --- Types ---

export interface EvalHistoryRecord {
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

export interface RunSummary {
  runId: string;
  timestamp: string;
  totalTests: number;
  avgScore: number;
  passRate: number;
  byCriterion: Record<
    string,
    { runs: number; avgScore: number; passRate: number }
  >;
}

export interface RegressionAlert {
  type: "regression";
  message: string;
  currentAvg: number;
  previousAvg: number;
  delta: number;
}

// --- Persistence ---

export async function saveEvalResult(params: {
  runId: string;
  testCaseId: string;
  criterion: string;
  score: number;
  breakdown: ReportEvalJudgeBreakdown;
  judgeReason?: string;
  durationMs?: number;
  error?: string;
}): Promise<void> {
  await db.insert(schema.reportEvalResults).values({
    runId: params.runId,
    testCaseId: params.testCaseId,
    criterion: params.criterion,
    score: params.score,
    breakdown: params.breakdown,
    judgeReason: params.judgeReason ?? null,
    durationMs: params.durationMs ?? null,
    error: params.error ?? null,
  });
}

export async function saveBatchResults(
  results: Array<{
    runId: string;
    testCaseId: string;
    criterion: string;
    score: number;
    breakdown: ReportEvalJudgeBreakdown;
    judgeReason?: string;
    durationMs?: number;
    error?: string;
  }>
): Promise<void> {
  if (results.length === 0) return;
  await db.insert(schema.reportEvalResults).values(
    results.map((r) => ({
      runId: r.runId,
      testCaseId: r.testCaseId,
      criterion: r.criterion,
      score: r.score,
      breakdown: r.breakdown,
      judgeReason: r.judgeReason ?? null,
      durationMs: r.durationMs ?? null,
      error: r.error ?? null,
    }))
  );
}

// --- Queries ---

export async function getEvalHistory(
  days: number = 90
): Promise<EvalHistoryRecord[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const rows = await db
    .select()
    .from(schema.reportEvalResults)
    .where(gte(schema.reportEvalResults.createdAt, cutoff))
    .orderBy(desc(schema.reportEvalResults.createdAt));

  return rows.map((r) => ({
    runId: r.runId,
    testCaseId: r.testCaseId,
    criterion: r.criterion,
    score: r.score,
    breakdown: r.breakdown,
    judgeReason: r.judgeReason,
    durationMs: r.durationMs,
    error: r.error,
    createdAt: r.createdAt,
  }));
}

export function groupByRun(records: EvalHistoryRecord[]): RunSummary[] {
  const runMap = new Map<string, EvalHistoryRecord[]>();

  for (const record of records) {
    const existing = runMap.get(record.runId) ?? [];
    existing.push(record);
    runMap.set(record.runId, existing);
  }

  const summaries: RunSummary[] = [];

  for (const [runId, results] of runMap) {
    const totalTests = results.length;
    const avgScore = Number(
      (results.reduce((s, r) => s + r.score, 0) / totalTests).toFixed(1)
    );
    const passing = results.filter(
      (r) => r.score >= REPORT_EVAL_PASS_THRESHOLD
    ).length;
    const passRate = Number(((passing / totalTests) * 100).toFixed(1));

    // Group by criterion
    const criterionMap = new Map<string, EvalHistoryRecord[]>();
    for (const r of results) {
      const existing = criterionMap.get(r.criterion) ?? [];
      existing.push(r);
      criterionMap.set(r.criterion, existing);
    }

    const byCriterion: Record<
      string,
      { runs: number; avgScore: number; passRate: number }
    > = {};
    for (const [criterion, cResults] of criterionMap) {
      const cPassing = cResults.filter(
        (r) => r.score >= REPORT_EVAL_PASS_THRESHOLD
      ).length;
      byCriterion[criterion] = {
        runs: cResults.length,
        avgScore: Number(
          (cResults.reduce((s, r) => s + r.score, 0) / cResults.length).toFixed(1)
        ),
        passRate: Number(
          ((cPassing / cResults.length) * 100).toFixed(1)
        ),
      };
    }

    // Use the earliest timestamp from the batch
    const timestamp = results
      .map((r) => r.createdAt)
      .sort((a, b) => a.getTime() - b.getTime())[0]
      .toISOString();

    summaries.push({
      runId,
      timestamp,
      totalTests,
      avgScore,
      passRate,
      byCriterion,
    });
  }

  // Sort by timestamp descending (most recent first)
  summaries.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return summaries;
}

// --- Regression Detection ---

const REGRESSION_THRESHOLD = 0.5;

export function detectRegression(
  summaries: RunSummary[]
): RegressionAlert | null {
  if (summaries.length < 2) return null;

  const [latest, previous] = summaries;
  const delta = Number((latest.avgScore - previous.avgScore).toFixed(1));

  if (delta < -REGRESSION_THRESHOLD) {
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
