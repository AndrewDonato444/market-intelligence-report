"use client";

import { REPORT_EVAL_PASS_THRESHOLD, REPORT_EVAL_CRITERIA } from "@/lib/eval/report-eval/types";
import type { ReportEvalDashboardResult } from "./report-eval-dashboard";

const CRITERION_LABELS: Record<string, string> = {
  "data-accuracy": "Data Accuracy",
  "completeness": "Completeness",
  "narrative-quality": "Narrative Quality",
  "formatting": "Formatting",
  "actionability": "Actionability",
  "persona-alignment": "Persona Alignment",
};

interface ReportEvalCriterionBreakdownProps {
  results: ReportEvalDashboardResult[];
}

export function ReportEvalCriterionBreakdown({ results }: ReportEvalCriterionBreakdownProps) {
  if (results.length === 0) return null;

  const byCriterion: Record<string, { runs: number; totalScore: number; passing: number }> = {};
  for (const r of results) {
    if (!byCriterion[r.criterion]) byCriterion[r.criterion] = { runs: 0, totalScore: 0, passing: 0 };
    byCriterion[r.criterion].runs++;
    byCriterion[r.criterion].totalScore += r.judgeScore;
    if (r.judgeScore >= REPORT_EVAL_PASS_THRESHOLD) byCriterion[r.criterion].passing++;
  }

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--spacing-5)]">
      <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-[var(--spacing-3)]">
        BY CRITERION
      </p>
      <div className="space-y-[var(--spacing-2)]">
        {REPORT_EVAL_CRITERIA.map((criterion) => {
          const stats = byCriterion[criterion];
          if (!stats) return null;
          const avgScore = stats.totalScore / stats.runs;
          const passRate = ((stats.passing / stats.runs) * 100).toFixed(1);
          const barColor = avgScore >= REPORT_EVAL_PASS_THRESHOLD
            ? "bg-[var(--color-success)]"
            : avgScore >= 3
              ? "bg-[var(--color-warning)]"
              : "bg-[var(--color-error)]";

          return (
            <div key={criterion} className="flex items-center gap-[var(--spacing-3)] text-sm">
              <span className="w-36 text-[var(--color-text)] truncate">
                {CRITERION_LABELS[criterion] || criterion}
              </span>
              <span className="w-16 text-xs text-[var(--color-text-secondary)]">
                {stats.runs} {stats.runs === 1 ? "run" : "runs"}
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
