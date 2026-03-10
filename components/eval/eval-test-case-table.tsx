"use client";

import type { EvalTestCase, EvalRunResult } from "@/lib/eval/types";
import { EvalTestCaseRow } from "./eval-test-case-row";

type SortField = "id" | "description" | "agent" | "category" | "score";

interface EvalTestCaseTableProps {
  testCases: EvalTestCase[];
  results: Map<string, EvalRunResult>;
  runningIds: Set<string>;
  sortField: SortField;
  sortDirection: "asc" | "desc";
  expandedId: string | null;
  onSort: (field: SortField) => void;
  onExpand: (id: string | null) => void;
  onRunSingle: (id: string) => void;
}

function SortHeader({
  label,
  field,
  currentField,
  currentDirection,
  onSort,
}: {
  label: string;
  field: SortField;
  currentField: SortField;
  currentDirection: "asc" | "desc";
  onSort: (f: SortField) => void;
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

export function EvalTestCaseTable({
  testCases,
  results,
  runningIds,
  sortField,
  sortDirection,
  expandedId,
  onSort,
  onExpand,
  onRunSingle,
}: EvalTestCaseTableProps) {
  // Sort test cases
  const sorted = [...testCases].sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case "id":
        cmp = a.id.localeCompare(b.id);
        break;
      case "description":
        cmp = a.description.localeCompare(b.description);
        break;
      case "agent":
        cmp = a.agent.localeCompare(b.agent);
        break;
      case "category":
        cmp = a.category.localeCompare(b.category);
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

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
      <table className="w-full">
        <thead className="bg-[var(--color-neutral-50)] border-b border-[var(--color-border)]">
          <tr>
            <SortHeader label="ID" field="id" currentField={sortField} currentDirection={sortDirection} onSort={onSort} />
            <SortHeader label="Description" field="description" currentField={sortField} currentDirection={sortDirection} onSort={onSort} />
            <SortHeader label="Agent" field="agent" currentField={sortField} currentDirection={sortDirection} onSort={onSort} />
            <SortHeader label="Category" field="category" currentField={sortField} currentDirection={sortDirection} onSort={onSort} />
            <SortHeader label="Score" field="score" currentField={sortField} currentDirection={sortDirection} onSort={onSort} />
            <th className="px-[var(--spacing-3)] py-[var(--spacing-2)] text-left text-xs font-medium text-[var(--color-text-secondary)]">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((tc) => (
            <EvalTestCaseRow
              key={tc.id}
              testCase={tc}
              result={results.get(tc.id)}
              isRunning={runningIds.has(tc.id)}
              isExpanded={expandedId === tc.id}
              onToggleExpand={() => onExpand(expandedId === tc.id ? null : tc.id)}
              onRun={() => onRunSingle(tc.id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
