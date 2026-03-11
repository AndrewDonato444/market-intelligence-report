"use client";

import type { ReportEvalTestCase, ReportEvalCriterion } from "@/lib/eval/report-eval/types";
import { REPORT_EVAL_CRITERIA } from "@/lib/eval/report-eval/types";
import { ReportEvalTestCaseRow } from "./report-eval-test-case-row";
import type { ReportEvalDashboardResult } from "./report-eval-dashboard";

export type ReportEvalSortField = "id" | "description" | "criterion" | "fixture" | "score";

interface ReportEvalTestCaseTableProps {
  testCases: ReportEvalTestCase[];
  results: Map<string, ReportEvalDashboardResult>;
  runningIds: Set<string>;
  sortField: ReportEvalSortField;
  sortDirection: "asc" | "desc";
  expandedId: string | null;
  criterionFilter: ReportEvalCriterion | "all";
  fixtureFilter: string;
  fixtureNames: Record<string, string>;
  onSort: (field: ReportEvalSortField) => void;
  onExpand: (id: string | null) => void;
  onRunSingle: (id: string) => void;
  onCriterionFilter: (criterion: ReportEvalCriterion | "all") => void;
  onFixtureFilter: (fixtureId: string) => void;
  onClearResults: () => void;
}

const CRITERION_LABELS: Record<string, string> = {
  "data-accuracy": "Data Accuracy",
  "completeness": "Completeness",
  "narrative-quality": "Narrative Quality",
  "formatting": "Formatting",
  "actionability": "Actionability",
  "persona-alignment": "Persona Alignment",
};

function SortHeader({
  label,
  field,
  currentField,
  currentDirection,
  onSort,
}: {
  label: string;
  field: ReportEvalSortField;
  currentField: ReportEvalSortField;
  currentDirection: "asc" | "desc";
  onSort: (f: ReportEvalSortField) => void;
}) {
  const isActive = currentField === field;
  return (
    <th
      className="px-[var(--spacing-3)] py-[var(--spacing-2)] text-left text-xs font-medium text-[var(--color-text-secondary)] cursor-pointer hover:text-[var(--color-text)] select-none"
      onClick={() => onSort(field)}
    >
      {label}
      {isActive && (
        <span className="ml-1">{currentDirection === "asc" ? "↑" : "↓"}</span>
      )}
    </th>
  );
}

export function ReportEvalTestCaseTable({
  testCases,
  results,
  runningIds,
  sortField,
  sortDirection,
  expandedId,
  criterionFilter,
  fixtureFilter,
  fixtureNames,
  onSort,
  onExpand,
  onRunSingle,
  onCriterionFilter,
  onFixtureFilter,
  onClearResults,
}: ReportEvalTestCaseTableProps) {
  // Filter
  let filtered = testCases;
  if (criterionFilter !== "all") {
    filtered = filtered.filter((tc) => tc.criterion === criterionFilter);
  }
  if (fixtureFilter !== "all") {
    filtered = filtered.filter((tc) => tc.fixtureId === fixtureFilter);
  }

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case "id":
        cmp = a.id.localeCompare(b.id);
        break;
      case "description":
        cmp = a.description.localeCompare(b.description);
        break;
      case "criterion":
        cmp = a.criterion.localeCompare(b.criterion);
        break;
      case "fixture":
        cmp = a.fixtureId.localeCompare(b.fixtureId);
        break;
      case "score": {
        const scoreA = results.get(a.id)?.judgeScore ?? 0;
        const scoreB = results.get(b.id)?.judgeScore ?? 0;
        cmp = scoreA - scoreB;
        break;
      }
    }
    return sortDirection === "asc" ? cmp : -cmp;
  });

  // Unique fixture IDs for filter dropdown
  const uniqueFixtures = [...new Set(testCases.map((tc) => tc.fixtureId))].sort();

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
      {/* Filter bar */}
      <div className="px-[var(--spacing-4)] py-[var(--spacing-3)] border-b border-[var(--color-border)] flex items-center gap-[var(--spacing-3)]">
        <span className="text-xs text-[var(--color-text-secondary)]">Filter:</span>
        <select
          value={criterionFilter}
          onChange={(e) => onCriterionFilter(e.target.value as ReportEvalCriterion | "all")}
          className="text-xs border border-[var(--color-border)] rounded-[var(--radius-sm)] px-[var(--spacing-2)] py-1 text-[var(--color-text)] bg-[var(--color-surface)]"
        >
          <option value="all">All Criteria</option>
          {REPORT_EVAL_CRITERIA.map((c) => (
            <option key={c} value={c}>{CRITERION_LABELS[c]}</option>
          ))}
        </select>
        <select
          value={fixtureFilter}
          onChange={(e) => onFixtureFilter(e.target.value)}
          className="text-xs border border-[var(--color-border)] rounded-[var(--radius-sm)] px-[var(--spacing-2)] py-1 text-[var(--color-text)] bg-[var(--color-surface)]"
        >
          <option value="all">All Fixtures</option>
          {uniqueFixtures.map((fId) => (
            <option key={fId} value={fId}>{fixtureNames[fId] || fId}</option>
          ))}
        </select>
        <div className="flex-1" />
        <button
          onClick={onClearResults}
          className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-error)] transition-colors"
        >
          Clear Results
        </button>
      </div>

      <table className="w-full">
        <thead className="bg-[var(--color-neutral-50)] border-b border-[var(--color-border)]">
          <tr>
            <SortHeader label="ID" field="id" currentField={sortField} currentDirection={sortDirection} onSort={onSort} />
            <SortHeader label="Description" field="description" currentField={sortField} currentDirection={sortDirection} onSort={onSort} />
            <SortHeader label="Criterion" field="criterion" currentField={sortField} currentDirection={sortDirection} onSort={onSort} />
            <SortHeader label="Fixture" field="fixture" currentField={sortField} currentDirection={sortDirection} onSort={onSort} />
            <SortHeader label="Score" field="score" currentField={sortField} currentDirection={sortDirection} onSort={onSort} />
            <th className="px-[var(--spacing-3)] py-[var(--spacing-2)] text-left text-xs font-medium text-[var(--color-text-secondary)]">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((tc) => (
            <ReportEvalTestCaseRow
              key={tc.id}
              testCase={tc}
              result={results.get(tc.id)}
              isRunning={runningIds.has(tc.id)}
              isExpanded={expandedId === tc.id}
              onToggleExpand={() => onExpand(expandedId === tc.id ? null : tc.id)}
              onRun={() => onRunSingle(tc.id)}
              fixtureNames={fixtureNames}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
