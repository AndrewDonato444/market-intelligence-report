"use client";

import { REPORT_EVAL_PASS_THRESHOLD } from "@/lib/eval/report-eval/types";
import type { ReportEvalTestCase } from "@/lib/eval/report-eval/types";
import type { ReportEvalDashboardResult } from "./report-eval-dashboard";

interface ReportEvalFixtureComparisonProps {
  results: ReportEvalDashboardResult[];
  testCases: ReportEvalTestCase[];
  fixtureNames: Record<string, string>;
}

export function ReportEvalFixtureComparison({
  results,
  testCases,
  fixtureNames,
}: ReportEvalFixtureComparisonProps) {
  if (results.length === 0) return null;

  const testCaseFixture: Record<string, string> = {};
  for (const tc of testCases) {
    testCaseFixture[tc.id] = tc.fixtureId;
  }

  const byFixture: Record<string, { runs: number; totalScore: number; passing: number }> = {};
  for (const r of results) {
    const fixtureId = testCaseFixture[r.testCaseId];
    if (!fixtureId) continue;
    if (!byFixture[fixtureId]) byFixture[fixtureId] = { runs: 0, totalScore: 0, passing: 0 };
    byFixture[fixtureId].runs++;
    byFixture[fixtureId].totalScore += r.judgeScore;
    if (r.judgeScore >= REPORT_EVAL_PASS_THRESHOLD) byFixture[fixtureId].passing++;
  }

  const sorted = Object.entries(byFixture)
    .map(([fixtureId, stats]) => ({
      fixtureId,
      name: fixtureNames[fixtureId] || fixtureId,
      runs: stats.runs,
      passRate: ((stats.passing / stats.runs) * 100).toFixed(1),
      avgScore: stats.totalScore / stats.runs,
    }))
    .sort((a, b) => a.avgScore - b.avgScore);

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--spacing-5)]">
      <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-[var(--spacing-3)]">
        BY FIXTURE
      </p>
      <div className="space-y-[var(--spacing-2)]">
        {sorted.map(({ fixtureId, name, runs, passRate, avgScore }) => {
          const barColor = avgScore >= REPORT_EVAL_PASS_THRESHOLD
            ? "bg-[var(--color-success)]"
            : avgScore >= 3
              ? "bg-[var(--color-warning)]"
              : "bg-[var(--color-error)]";

          return (
            <div key={fixtureId} className="flex items-center gap-[var(--spacing-3)] text-sm">
              <span className="w-40 text-[var(--color-text)] truncate">{name}</span>
              <span className="w-16 text-xs text-[var(--color-text-secondary)]">
                {runs} {runs === 1 ? "run" : "runs"}
              </span>
              <span className="w-16 text-xs text-[var(--color-text-secondary)]">
                {passRate}%
              </span>
              <div className="flex-1 h-2 rounded-full bg-[var(--color-neutral-200)]">
                <div
                  className={`h-2 rounded-full ${barColor} transition-all duration-300`}
                  style={{ width: `${(avgScore / 5) * 100}%` }}
                />
              </div>
              <span className="w-8 text-right text-sm font-medium text-[var(--color-text)]">
                {avgScore.toFixed(1)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
