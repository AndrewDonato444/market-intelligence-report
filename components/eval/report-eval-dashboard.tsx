"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ReportEvalTestCase, ReportEvalCriterion, ReportEvalJudgeBreakdown } from "@/lib/eval/report-eval/types";
import { REPORT_EVAL_PASS_THRESHOLD } from "@/lib/eval/report-eval/types";
import type { RunSummary, RegressionAlert } from "@/lib/eval/report-eval/history";
import { ReportEvalSummaryPanel } from "./report-eval-summary-panel";
import { ReportEvalTestCaseTable, type ReportEvalSortField } from "./report-eval-test-case-table";
import { ReportEvalCriterionBreakdown } from "./report-eval-criterion-breakdown";
import { ReportEvalFixtureComparison } from "./report-eval-fixture-comparison";
import { ReportEvalTrendPanel } from "./report-eval-trend-panel";

export interface ReportEvalDashboardResult {
  testCaseId: string;
  description: string;
  criterion: ReportEvalCriterion;
  judgeScore: number;
  judgeReason: string;
  judgeBreakdown: ReportEvalJudgeBreakdown;
  timestamp: string;
  durationMs: number;
  reportSectionCount: number;
  reportConfidence: string;
  error?: string;
}

const STORAGE_KEY = "report-eval-suite-results";
const MAX_CONCURRENCY = 3;

function loadStoredResults(): Map<string, ReportEvalDashboardResult> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Map();
    const entries: [string, ReportEvalDashboardResult][] = JSON.parse(raw);
    return new Map(entries);
  } catch {
    return new Map();
  }
}

function saveResults(results: Map<string, ReportEvalDashboardResult>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...results.entries()]));
  } catch {
    // localStorage full or unavailable
  }
}

export function ReportEvalDashboard() {
  const [testCases, setTestCases] = useState<ReportEvalTestCase[]>([]);
  const [fixtureNames, setFixtureNames] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Map<string, ReportEvalDashboardResult>>(new Map());
  const [runningIds, setRunningIds] = useState<Set<string>>(new Set());
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ completed: 0, total: 0 });
  const [sortField, setSortField] = useState<ReportEvalSortField>("id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [criterionFilter, setCriterionFilter] = useState<ReportEvalCriterion | "all">("all");
  const [fixtureFilter, setFixtureFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trendRuns, setTrendRuns] = useState<RunSummary[]>([]);
  const [trendRegression, setTrendRegression] = useState<RegressionAlert | null>(null);
  const [trendLoading, setTrendLoading] = useState(true);

  const cancelledRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentRunIdRef = useRef<string | null>(null);

  // Load test cases on mount
  useEffect(() => {
    async function fetchTestCases() {
      try {
        const res = await fetch("/api/eval/report/test-cases");
        if (!res.ok) throw new Error("Failed to load report eval suite");
        const data = await res.json();
        setTestCases(data.testCases);
        setFixtureNames(data.fixtureNames || {});
        setResults(loadStoredResults());
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    fetchTestCases();
  }, []);

  // Save results to localStorage whenever they change
  useEffect(() => {
    if (results.size > 0) saveResults(results);
  }, [results]);

  // Load trend history on mount
  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch("/api/eval/report/history");
        if (!res.ok) {
          setTrendLoading(false);
          return;
        }
        const data = await res.json();
        setTrendRuns(data.runs ?? []);
        setTrendRegression(data.regression ?? null);
      } catch {
        // Silently fail — trend panel shows empty state
      } finally {
        setTrendLoading(false);
      }
    }
    fetchHistory();
  }, []);

  // Persist a single result to the history DB
  const persistToHistory = useCallback(
    async (result: ReportEvalDashboardResult, runId: string) => {
      try {
        await fetch("/api/eval/report/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            runId,
            testCaseId: result.testCaseId,
            criterion: result.criterion,
            score: result.judgeScore,
            breakdown: result.judgeBreakdown,
            judgeReason: result.judgeReason,
            durationMs: result.durationMs,
            error: result.error,
          }),
        });
      } catch {
        // Non-blocking — history persistence is best-effort
      }
    },
    []
  );

  // Refresh trend data after runs complete
  const refreshTrends = useCallback(async () => {
    try {
      const res = await fetch("/api/eval/report/history");
      if (!res.ok) return;
      const data = await res.json();
      setTrendRuns(data.runs ?? []);
      setTrendRegression(data.regression ?? null);
    } catch {
      // Silent
    }
  }, []);

  const runSingleTestCase = useCallback(async (testCaseId: string, signal?: AbortSignal, runId?: string) => {
    setRunningIds((prev) => new Set(prev).add(testCaseId));
    try {
      const res = await fetch("/api/eval/report/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testCaseId }),
        signal,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || "Request failed");
      }
      const result: ReportEvalDashboardResult = await res.json();
      setResults((prev) => {
        const next = new Map(prev);
        next.set(testCaseId, result);
        return next;
      });

      // Persist to history DB (best-effort, non-blocking)
      const effectiveRunId = runId ?? crypto.randomUUID();
      persistToHistory(result, effectiveRunId);

      return result;
    } finally {
      setRunningIds((prev) => {
        const next = new Set(prev);
        next.delete(testCaseId);
        return next;
      });
    }
  }, [persistToHistory]);

  const handleRunAll = useCallback(async () => {
    if (!confirm("This will make ~36 API calls to Claude (18 fixtures + 18 judge calls). Proceed?")) {
      return;
    }

    cancelledRef.current = false;
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Generate a shared runId for this batch so all results are grouped together
    const batchRunId = crypto.randomUUID();
    currentRunIdRef.current = batchRunId;

    setBatchRunning(true);
    setBatchProgress({ completed: 0, total: testCases.length });

    const queue = [...testCases.map((tc) => tc.id)];
    let completed = 0;
    const executing = new Set<Promise<void>>();

    async function runNext() {
      if (cancelledRef.current) return;
      const id = queue.shift();
      if (!id) return;

      try {
        await runSingleTestCase(id, controller.signal, batchRunId);
      } catch {
        // Individual failures are captured in the result
      }

      completed++;
      setBatchProgress({ completed, total: testCases.length });
    }

    // Fill initial concurrency pool
    while (queue.length > 0 && executing.size < MAX_CONCURRENCY && !cancelledRef.current) {
      let p: Promise<void>;
      p = runNext().then(() => { executing.delete(p); });
      executing.add(p);
    }

    // Process remaining
    while (executing.size > 0 && !cancelledRef.current) {
      await Promise.race(executing);
      while (queue.length > 0 && executing.size < MAX_CONCURRENCY && !cancelledRef.current) {
        let p: Promise<void>;
        p = runNext().then(() => { executing.delete(p); });
        executing.add(p);
      }
    }

    setBatchRunning(false);
    abortControllerRef.current = null;
    currentRunIdRef.current = null;

    // Refresh trend data after batch completes
    refreshTrends();
  }, [testCases, runSingleTestCase, refreshTrends]);

  const handleCancel = useCallback(() => {
    cancelledRef.current = true;
    abortControllerRef.current?.abort();
    setBatchRunning(false);
  }, []);

  const handleExport = useCallback(() => {
    const allResults = [...results.values()];
    const passing = allResults.filter((r) => r.judgeScore >= REPORT_EVAL_PASS_THRESHOLD).length;
    const data = {
      exportedAt: new Date().toISOString(),
      results: allResults,
      summary: {
        total: allResults.length,
        passing,
        passRate: Number(((passing / allResults.length) * 100).toFixed(1)),
        avgScore: Number((allResults.reduce((s, r) => s + r.judgeScore, 0) / allResults.length).toFixed(1)),
      },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-eval-results-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [results]);

  const handleClearResults = useCallback(() => {
    setResults(new Map());
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // localStorage unavailable
    }
  }, []);

  const handleSort = useCallback((field: ReportEvalSortField) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
        return field;
      }
      setSortDirection("asc");
      return field;
    });
  }, []);

  // Compute filtered results for summary panels
  const filteredResults = [...results.values()].filter((r) => {
    if (criterionFilter !== "all" && r.criterion !== criterionFilter) return false;
    if (fixtureFilter !== "all") {
      const tc = testCases.find((t) => t.id === r.testCaseId);
      if (tc && tc.fixtureId !== fixtureFilter) return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="inline-block w-6 h-6 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[var(--radius-md)] border border-[var(--color-error)] bg-red-50 p-[var(--spacing-4)] text-[var(--color-error)]">
        <p className="font-medium">Failed to load report eval suite</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-[var(--spacing-4)]">
      <ReportEvalSummaryPanel
        testCaseCount={testCases.length}
        results={filteredResults}
        batchRunning={batchRunning}
        batchProgress={batchProgress}
        onRunAll={handleRunAll}
        onCancel={handleCancel}
        onExport={handleExport}
      />

      <ReportEvalCriterionBreakdown results={[...results.values()]} />

      <ReportEvalFixtureComparison
        results={[...results.values()]}
        testCases={testCases}
        fixtureNames={fixtureNames}
      />

      <ReportEvalTrendPanel
        runs={trendRuns}
        regression={trendRegression}
        loading={trendLoading}
      />

      <ReportEvalTestCaseTable
        testCases={testCases}
        results={results}
        runningIds={runningIds}
        sortField={sortField}
        sortDirection={sortDirection}
        expandedId={expandedId}
        criterionFilter={criterionFilter}
        fixtureFilter={fixtureFilter}
        fixtureNames={fixtureNames}
        onSort={handleSort}
        onExpand={setExpandedId}
        onRunSingle={(id) => runSingleTestCase(id).then(() => refreshTrends())}
        onCriterionFilter={setCriterionFilter}
        onFixtureFilter={setFixtureFilter}
        onClearResults={handleClearResults}
      />
    </div>
  );
}
