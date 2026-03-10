"use client";

import type { EvalTestCase, EvalRunResult } from "@/lib/eval/types";
import { PASS_THRESHOLD } from "@/lib/eval/types";

interface EvalTestCaseRowProps {
  testCase: EvalTestCase;
  result?: EvalRunResult;
  isRunning: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onRun: () => void;
}

const AGENT_COLORS: Record<string, string> = {
  "insight-generator": "bg-blue-100 text-blue-800",
  "forecast-modeler": "bg-emerald-100 text-emerald-800",
  "polish-agent": "bg-purple-100 text-purple-800",
};

function scoreColor(score: number): string {
  if (score >= PASS_THRESHOLD) return "text-[var(--color-success)]";
  if (score >= 3) return "text-[var(--color-warning)]";
  return "text-[var(--color-error)]";
}

function scoreBg(score: number): string {
  if (score >= PASS_THRESHOLD) return "bg-emerald-50";
  if (score >= 3) return "bg-amber-50";
  return "bg-red-50";
}

export function EvalTestCaseRow({
  testCase,
  result,
  isRunning,
  isExpanded,
  onToggleExpand,
  onRun,
}: EvalTestCaseRowProps) {
  const agentColor = AGENT_COLORS[testCase.agent] || "bg-gray-100 text-gray-800";

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
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${agentColor}`}>
            {testCase.agent.replace("-", " ")}
          </span>
        </td>
        <td className="px-[var(--spacing-3)] py-[var(--spacing-3)]">
          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--color-neutral-100)] text-[var(--color-text-secondary)]">
            {testCase.category}
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
                    <div className="grid grid-cols-2 gap-[var(--spacing-1)] text-xs">
                      {Object.entries(result.judgeBreakdown).map(([dim, val]) => (
                        <div key={dim} className="flex items-center gap-[var(--spacing-1)]">
                          <div className="w-16 h-1.5 rounded-full bg-[var(--color-neutral-200)]">
                            <div
                              className={`h-1.5 rounded-full ${(val as number) >= PASS_THRESHOLD ? "bg-[var(--color-success)]" : "bg-[var(--color-warning)]"}`}
                              style={{ width: `${((val as number) / 5) * 100}%` }}
                            />
                          </div>
                          <span className="text-[var(--color-text-secondary)]">
                            {dim}: {val as number}
                          </span>
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
                    <p className="text-xs text-[var(--color-text-tertiary)]">
                      Duration: {(result.durationMs / 1000).toFixed(1)}s
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-[var(--color-text-tertiary)] italic">
                    No results yet — click Run to execute
                  </p>
                )}
              </div>

              {/* Agent Response (full width when result exists) */}
              {result && result.response && (
                <div className="col-span-2">
                  <h4 className="text-xs font-semibold text-[var(--color-text-secondary)] mb-[var(--spacing-2)]">
                    Agent Response
                  </h4>
                  <pre className="text-xs font-[family-name:var(--font-mono)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-sm)] p-[var(--spacing-3)] max-h-64 overflow-auto whitespace-pre-wrap">
                    {JSON.stringify(result.response, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
