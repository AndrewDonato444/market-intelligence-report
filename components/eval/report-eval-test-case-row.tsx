"use client";

import type { ReportEvalTestCase } from "@/lib/eval/report-eval/types";
import { REPORT_EVAL_PASS_THRESHOLD } from "@/lib/eval/report-eval/types";
import type { ReportEvalDashboardResult } from "./report-eval-dashboard";

interface ReportEvalTestCaseRowProps {
  testCase: ReportEvalTestCase;
  result?: ReportEvalDashboardResult;
  isRunning: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onRun: () => void;
  fixtureNames: Record<string, string>;
}

const CRITERION_LABELS: Record<string, string> = {
  "data-accuracy": "Data Acc.",
  "completeness": "Complete.",
  "narrative-quality": "Narr. Quality",
  "formatting": "Formatting",
  "actionability": "Actionability",
  "persona-alignment": "Persona Align.",
};

const BREAKDOWN_LABELS: Record<string, string> = {
  dataAccuracy: "Data Accuracy",
  completeness: "Completeness",
  narrativeQuality: "Narr. Quality",
  formatting: "Formatting",
  actionability: "Actionability",
  personaAlignment: "Persona Align.",
};

function scoreColor(score: number): string {
  if (score >= REPORT_EVAL_PASS_THRESHOLD) return "text-[var(--color-success)]";
  if (score >= 3) return "text-[var(--color-warning)]";
  return "text-[var(--color-error)]";
}

function scoreBg(score: number): string {
  if (score >= REPORT_EVAL_PASS_THRESHOLD) return "bg-emerald-50";
  if (score >= 3) return "bg-amber-50";
  return "bg-red-50";
}

export function ReportEvalTestCaseRow({
  testCase,
  result,
  isRunning,
  isExpanded,
  onToggleExpand,
  onRun,
  fixtureNames,
}: ReportEvalTestCaseRowProps) {
  return (
    <>
      <tr
        className="border-b border-[var(--color-border)] hover:bg-[var(--color-neutral-50)] cursor-pointer transition-colors"
        onClick={onToggleExpand}
      >
        <td className="px-[var(--spacing-3)] py-[var(--spacing-3)] text-xs font-mono text-[var(--color-text-tertiary)]">
          {testCase.id}
        </td>
        <td className="px-[var(--spacing-3)] py-[var(--spacing-3)] text-sm text-[var(--color-text)]">
          {testCase.description}
        </td>
        <td className="px-[var(--spacing-3)] py-[var(--spacing-3)]">
          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {CRITERION_LABELS[testCase.criterion] || testCase.criterion}
          </span>
        </td>
        <td className="px-[var(--spacing-3)] py-[var(--spacing-3)]">
          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--color-neutral-100)] text-[var(--color-text-secondary)]">
            {fixtureNames[testCase.fixtureId] || testCase.fixtureId}
          </span>
        </td>
        <td className="px-[var(--spacing-3)] py-[var(--spacing-3)] text-center">
          {isRunning ? (
            <span className="inline-block w-4 h-4 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
          ) : result ? (
            <span className={`text-lg font-semibold ${scoreColor(result.judgeScore)}`}>
              {result.judgeScore}
            </span>
          ) : (
            <span className="text-sm text-[var(--color-text-tertiary)]">--</span>
          )}
        </td>
        <td className="px-[var(--spacing-3)] py-[var(--spacing-3)]">
          <div className="flex items-center gap-[var(--spacing-2)]">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRun();
              }}
              disabled={isRunning}
              className="px-[var(--spacing-3)] py-1 rounded-[var(--radius-sm)] text-xs font-medium border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-neutral-100)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isRunning ? "Running..." : result ? "Re-run" : "Run"}
            </button>
            <span className="text-[var(--color-text-tertiary)] text-xs">
              {isExpanded ? "▲" : "▼"}
            </span>
          </div>
        </td>
      </tr>

      {isExpanded && (
        <tr className="border-b border-[var(--color-border)]">
          <td colSpan={6} className="px-[var(--spacing-4)] py-[var(--spacing-4)] bg-[var(--color-neutral-50)]">
            <div className="grid grid-cols-2 gap-[var(--spacing-4)]">
              {/* Expected Rubric */}
              <div>
                <h4 className="text-xs font-semibold text-[var(--color-text-secondary)] mb-[var(--spacing-2)]">
                  Expected Rubric
                </h4>
                <p className="text-sm text-[var(--color-text)] leading-relaxed">
                  {testCase.expectedRubric}
                </p>
              </div>

              {/* Judge Evaluation */}
              <div>
                <h4 className="text-xs font-semibold text-[var(--color-text-secondary)] mb-[var(--spacing-2)]">
                  Judge Evaluation
                </h4>
                {result ? (
                  <div className="space-y-[var(--spacing-2)]">
                    <div className={`inline-block px-3 py-1 rounded-[var(--radius-sm)] text-sm font-semibold ${scoreBg(result.judgeScore)} ${scoreColor(result.judgeScore)}`}>
                      Score: {result.judgeScore}/5
                    </div>
                    <div className="space-y-[var(--spacing-1)]">
                      {(Object.entries(result.judgeBreakdown) as [string, number][]).map(([dim, val]) => (
                        <div key={dim} className="flex items-center gap-[var(--spacing-2)] text-xs">
                          <span className="w-24 text-[var(--color-text-secondary)]">
                            {BREAKDOWN_LABELS[dim] || dim}
                          </span>
                          <div className="w-20 h-1.5 rounded-full bg-[var(--color-neutral-200)]">
                            <div
                              className={`h-1.5 rounded-full ${val >= REPORT_EVAL_PASS_THRESHOLD ? "bg-[var(--color-success)]" : val >= 3 ? "bg-[var(--color-warning)]" : "bg-[var(--color-error)]"}`}
                              style={{ width: `${(val / 5) * 100}%` }}
                            />
                          </div>
                          <span className="text-[var(--color-text)]">{val}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-[var(--spacing-1)]">
                      {result.judgeReason}
                    </p>
                    {result.error && (
                      <p className="text-xs text-[var(--color-error)] mt-[var(--spacing-1)]">
                        Error: {result.error}
                      </p>
                    )}
                    <div className="flex gap-[var(--spacing-3)] text-xs text-[var(--color-text-tertiary)] mt-[var(--spacing-1)]">
                      <span>Sections: {result.reportSectionCount}</span>
                      <span>&middot;</span>
                      <span>Confidence: {result.reportConfidence}</span>
                      <span>&middot;</span>
                      <span>Duration: {(result.durationMs / 1000).toFixed(1)}s</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-[var(--color-text-tertiary)] italic">
                    No results yet &mdash; click Run to execute
                  </p>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
