"use client";

import { REPORT_EVAL_PASS_THRESHOLD } from "@/lib/eval/report-eval/types";
import type { ReportEvalDashboardResult } from "./report-eval-dashboard";

interface ReportEvalSummaryPanelProps {
  testCaseCount: number;
  results: ReportEvalDashboardResult[];
  batchRunning: boolean;
  batchProgress: { completed: number; total: number };
  onRunAll: () => void;
  onCancel: () => void;
  onExport: () => void;
}

export function ReportEvalSummaryPanel({
  testCaseCount,
  results,
  batchRunning,
  batchProgress,
  onRunAll,
  onCancel,
  onExport,
}: ReportEvalSummaryPanelProps) {
  const hasResults = results.length > 0;
  const passing = results.filter((r) => r.judgeScore >= REPORT_EVAL_PASS_THRESHOLD).length;
  const passRate = hasResults ? ((passing / results.length) * 100).toFixed(1) : "--";
  const avgScore = hasResults
    ? (results.reduce((s, r) => s + r.judgeScore, 0) / results.length).toFixed(1)
    : "--";

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--spacing-5)]">
      <div className="flex items-center justify-between mb-[var(--spacing-4)]">
        <div>
          <h1 className="font-[family-name:var(--font-serif)] text-xl font-semibold text-[var(--color-text)]">
            Report Eval Suite
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-[var(--spacing-1)]">
            End-to-end quality scoring &mdash; {testCaseCount} test cases across 6 criteria
          </p>
        </div>
        <div className="flex gap-[var(--spacing-2)]">
          {!batchRunning ? (
            <>
              <button
                onClick={onRunAll}
                className="px-[var(--spacing-4)] py-[var(--spacing-2)] rounded-[var(--radius-sm)] bg-[var(--color-accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Run All
              </button>
              {hasResults && (
                <button
                  onClick={onExport}
                  className="px-[var(--spacing-4)] py-[var(--spacing-2)] rounded-[var(--radius-sm)] border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-neutral-100)] transition-colors"
                >
                  Export JSON
                </button>
              )}
            </>
          ) : (
            <button
              onClick={onCancel}
              className="px-[var(--spacing-4)] py-[var(--spacing-2)] rounded-[var(--radius-sm)] border border-[var(--color-error)] text-[var(--color-error)] text-sm font-medium hover:bg-red-50 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {batchRunning && (
        <div className="mb-[var(--spacing-4)]">
          <div className="flex items-center justify-between text-sm text-[var(--color-text-secondary)] mb-[var(--spacing-1)]">
            <span>Running report evaluations...</span>
            <span>
              {batchProgress.completed} / {batchProgress.total}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-[var(--color-neutral-200)]">
            <div
              className="h-2 rounded-full bg-[var(--color-accent)] transition-all duration-300"
              style={{
                width: `${batchProgress.total > 0 ? (batchProgress.completed / batchProgress.total) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-[var(--spacing-4)]">
        <div className="text-center">
          <p className="text-2xl font-semibold text-[var(--color-text)]">{testCaseCount}</p>
          <p className="text-xs text-[var(--color-text-secondary)]">Test Cases</p>
        </div>
        <div className="text-center">
          <p className={`text-2xl font-semibold ${hasResults && Number(passRate) >= 80 ? "text-[var(--color-success)]" : hasResults && Number(passRate) >= 50 ? "text-[var(--color-warning)]" : hasResults ? "text-[var(--color-error)]" : "text-[var(--color-text)]"}`}>
            {passRate}{hasResults ? "%" : ""}
          </p>
          <p className="text-xs text-[var(--color-text-secondary)]">Pass Rate</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-semibold text-[var(--color-text)]">{avgScore}</p>
          <p className="text-xs text-[var(--color-text-secondary)]">Avg Score</p>
        </div>
      </div>
    </div>
  );
}
