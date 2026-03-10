"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { EvalTestCase, EvalRunResult } from "@/lib/eval/types";
import { MAX_CONCURRENCY } from "@/lib/eval/types";
import { EvalReportSummary } from "./eval-report-summary";
import { EvalTestCaseTable } from "./eval-test-case-table";

type SortField = "id" | "description" | "agent" | "category" | "score";

const STORAGE_KEY = "eval-suite-results";

function loadStoredResults(): Map<string, EvalRunResult> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Map();
    const entries: [string, EvalRunResult][] = JSON.parse(raw);
    return new Map(entries);
  } catch {
    return new Map();
  }
}

function saveResults(results: Map<string, EvalRunResult>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...results.entries()]));
  } catch {
    // localStorage full or unavailable
  }
}

export function EvalDashboard() {
  const [testCases, setTestCases] = useState<EvalTestCase[]>([]);
  const [results, setResults] = useState<Map<string, EvalRunResult>>(new Map());
  const [runningIds, setRunningIds] = useState<Set<string>>(new Set());
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ completed: 0, total: 0 });
  const [sortField, setSortField] = useState<SortField>("id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cancelledRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load test cases on mount
  useEffect(() => {
    async function fetchTestCases() {
      try {
        const res = await fetch("/api/eval/test-cases");
        if (!res.ok) throw new Error("Failed to load test cases");
        const data = await res.json();
        setTestCases(data.testCases);
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

  const runSingleTestCase = useCallback(async (testCaseId: string, signal?: AbortSignal) => {
    setRunningIds((prev) => new Set(prev).add(testCaseId));
    try {
      const res = await fetch("/api/eval/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testCaseId }),
        signal,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || "Request failed");
      }
      const result: EvalRunResult = await res.json();
      setResults((prev) => {
        const next = new Map(prev);
        next.set(testCaseId, result);
        return next;
      });
      return result;
    } finally {
      setRunningIds((prev) => {
        const next = new Set(prev);
        next.delete(testCaseId);
        return next;
      });
    }
  }, []);

  const handleRunAll = useCallback(async () => {
    if (!confirm("This will make ~48 API calls to Claude (24 agent + 24 judge). Proceed?")) {
      return;
    }

    cancelledRef.current = false;
    const controller = new AbortController();
    abortControllerRef.current = controller;

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
        await runSingleTestCase(id, controller.signal);
      } catch {
        // Individual failures are captured in the result
      }

      completed++;
      setBatchProgress({ completed, total: testCases.length });
    }

    // Fill initial concurrency pool
    while (queue.length > 0 && executing.size < MAX_CONCURRENCY && !cancelledRef.current) {
      const p = runNext().then(() => executing.delete(p));
      executing.add(p);
    }

    // Process remaining
    while (executing.size > 0 && !cancelledRef.current) {
      await Promise.race(executing);
      while (queue.length > 0 && executing.size < MAX_CONCURRENCY && !cancelledRef.current) {
        const p = runNext().then(() => executing.delete(p));
        executing.add(p);
      }
    }

    setBatchRunning(false);
    abortControllerRef.current = null;
  }, [testCases, runSingleTestCase]);

  const handleCancel = useCallback(() => {
    cancelledRef.current = true;
    abortControllerRef.current?.abort();
    setBatchRunning(false);
  }, []);

  const handleExport = useCallback(() => {
    const data = {
      exportedAt: new Date().toISOString(),
      results: [...results.values()],
      summary: {
        total: results.size,
        passing: [...results.values()].filter((r) => r.judgeScore >= 4).length,
      },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eval-results-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [results]);

  const handleSort = useCallback((field: SortField) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
        return field;
      }
      setSortDirection("asc");
      return field;
    });
  }, []);

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
        <p className="font-medium">Failed to load eval suite</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-[var(--spacing-4)]">
      <EvalReportSummary
        testCaseCount={testCases.length}
        results={[...results.values()]}
        batchRunning={batchRunning}
        batchProgress={batchProgress}
        onRunAll={handleRunAll}
        onCancel={handleCancel}
        onExport={handleExport}
      />

      <EvalTestCaseTable
        testCases={testCases}
        results={results}
        runningIds={runningIds}
        sortField={sortField}
        sortDirection={sortDirection}
        expandedId={expandedId}
        onSort={handleSort}
        onExpand={setExpandedId}
        onRunSingle={(id) => runSingleTestCase(id)}
      />
    </div>
  );
}
