"use client";

import { useEffect, useState, useCallback } from "react";
import type { PipelineRunRow } from "@/app/api/admin/pipeline/route";

type StatusFilter = "all" | "queued" | "generating" | "completed" | "failed";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  queued: {
    label: "Queued",
    color: "var(--color-text-secondary)",
    bg: "var(--color-surface)",
  },
  generating: {
    label: "Generating",
    color: "var(--color-accent)",
    bg: "var(--color-accent-light, rgba(59,130,246,0.1))",
  },
  completed: {
    label: "Completed",
    color: "var(--color-success)",
    bg: "var(--color-success-light, rgba(34,197,94,0.1))",
  },
  failed: {
    label: "Failed",
    color: "var(--color-error)",
    bg: "var(--color-error-light, rgba(239,68,68,0.1))",
  },
};

function formatDuration(ms: number | null): string {
  if (ms == null) return "--";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const mins = Math.floor(ms / 60000);
  const secs = ((ms % 60000) / 1000).toFixed(0);
  return `${mins}m ${secs}s`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "--";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCost(cost: string): string {
  const n = parseFloat(cost);
  if (n === 0) return "$0.00";
  return `$${n.toFixed(4)}`;
}

export function PipelineVisualizer() {
  const [runs, setRuns] = useState<PipelineRunRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchRuns = useCallback(async (statusFilter: StatusFilter) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/admin/pipeline?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch pipeline runs: ${res.status}`);
      }
      const data = await res.json();
      setRuns(data.runs ?? []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRuns(filter);
  }, [fetchRuns, filter]);

  const handleFilterChange = (newFilter: StatusFilter) => {
    setFilter(newFilter);
    setExpandedId(null);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Unique agents across all sections for a run
  const getAgentBreakdown = (run: PipelineRunRow) => {
    const agents = new Map<string, { count: number; sectionTypes: string[] }>();
    for (const s of run.sections) {
      const name = s.agentName ?? "unknown";
      const existing = agents.get(name) ?? { count: 0, sectionTypes: [] };
      existing.count++;
      existing.sectionTypes.push(s.sectionType);
      agents.set(name, existing);
    }
    return agents;
  };

  return (
    <div className="space-y-[var(--spacing-6)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-sans)] text-2xl font-bold text-[var(--color-text)]">
            Pipeline Runs
          </h1>
          <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] mt-1">
            Agent execution history, timing, and errors
          </p>
        </div>
        <button
          onClick={() => fetchRuns(filter)}
          disabled={loading}
          className="px-[var(--spacing-4)] py-[var(--spacing-2)] rounded-[var(--radius-sm)] text-sm font-medium border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-light)] disabled:opacity-50 transition-colors"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-[var(--spacing-2)]" role="tablist" aria-label="Filter by status">
        {(["all", "completed", "generating", "failed", "queued"] as StatusFilter[]).map(
          (f) => (
            <button
              key={f}
              role="tab"
              aria-selected={filter === f}
              onClick={() => handleFilterChange(f)}
              className={`px-[var(--spacing-3)] py-[var(--spacing-1)] rounded-full text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-primary-light)]"
              }`}
            >
              {f === "all" ? "All" : STATUS_CONFIG[f]?.label ?? f}
            </button>
          )
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-[var(--color-error-light,rgba(239,68,68,0.1))] border border-[var(--color-error)] rounded-[var(--radius-md)] p-[var(--spacing-4)]">
          <p className="text-sm text-[var(--color-error)]">{error}</p>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="text-center py-[var(--spacing-8)]">
          <div className="inline-block w-6 h-6 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
          <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] mt-2">
            Loading pipeline runs...
          </p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && runs.length === 0 && (
        <div className="text-center py-[var(--spacing-12)] bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)]">
          <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)]">
            No pipeline runs found.
          </p>
          <p className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-tertiary)] mt-1">
            Pipeline runs will appear here once reports are generated.
          </p>
        </div>
      )}

      {/* Runs table */}
      {!loading && runs.length > 0 && (
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] border border-[var(--color-border)] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-neutral-50,#f9fafb)]">
                <th className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-left text-xs font-semibold text-[var(--color-text-secondary)]">
                  Report
                </th>
                <th className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-left text-xs font-semibold text-[var(--color-text-secondary)]">
                  Market
                </th>
                <th className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-left text-xs font-semibold text-[var(--color-text-secondary)]">
                  Status
                </th>
                <th className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-left text-xs font-semibold text-[var(--color-text-secondary)]">
                  Started
                </th>
                <th className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-right text-xs font-semibold text-[var(--color-text-secondary)]">
                  Duration
                </th>
                <th className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-right text-xs font-semibold text-[var(--color-text-secondary)]">
                  Sections
                </th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => {
                const isExpanded = expandedId === run.id;
                const sc = STATUS_CONFIG[run.status] ?? STATUS_CONFIG.queued;
                const agents = getAgentBreakdown(run);

                return (
                  <PipelineRunRowComponent
                    key={run.id}
                    run={run}
                    isExpanded={isExpanded}
                    statusConfig={sc}
                    agents={agents}
                    onToggle={() => toggleExpand(run.id)}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary stats */}
      {!loading && runs.length > 0 && (
        <div className="grid grid-cols-4 gap-[var(--spacing-4)]">
          <StatCard
            label="Total Runs"
            value={String(runs.length)}
          />
          <StatCard
            label="Completed"
            value={String(runs.filter((r) => r.status === "completed").length)}
          />
          <StatCard
            label="Failed"
            value={String(runs.filter((r) => r.status === "failed").length)}
          />
          <StatCard
            label="Avg Duration"
            value={formatDuration(
              runs
                .filter((r) => r.durationMs != null)
                .reduce((sum, r, _, arr) => sum + (r.durationMs ?? 0) / arr.length, 0) || null
            )}
          />
        </div>
      )}
    </div>
  );
}

function PipelineRunRowComponent({
  run,
  isExpanded,
  statusConfig,
  agents,
  onToggle,
}: {
  run: PipelineRunRow;
  isExpanded: boolean;
  statusConfig: { label: string; color: string; bg: string };
  agents: Map<string, { count: number; sectionTypes: string[] }>;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        className="border-b border-[var(--color-border)] hover:bg-[var(--color-neutral-50,#f9fafb)] cursor-pointer transition-colors"
        onClick={onToggle}
        data-testid={`pipeline-run-${run.id}`}
      >
        <td className="px-[var(--spacing-4)] py-[var(--spacing-3)]">
          <div className="flex items-center gap-[var(--spacing-2)]">
            <span className="text-xs text-[var(--color-text-tertiary)]">
              {isExpanded ? "\u25BC" : "\u25B6"}
            </span>
            <span className="text-sm font-medium text-[var(--color-text)]">
              {run.title}
            </span>
          </div>
        </td>
        <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-sm text-[var(--color-text-secondary)]">
          {run.marketName}
        </td>
        <td className="px-[var(--spacing-4)] py-[var(--spacing-3)]">
          <span
            className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ color: statusConfig.color, backgroundColor: statusConfig.bg }}
            data-testid="pipeline-run-status"
          >
            {statusConfig.label}
          </span>
        </td>
        <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-sm text-[var(--color-text-secondary)]">
          {formatDate(run.generationStartedAt)}
        </td>
        <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-sm text-right font-mono text-[var(--color-text)]">
          {formatDuration(run.durationMs)}
        </td>
        <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-sm text-right text-[var(--color-text-secondary)]">
          {run.sectionCount}
        </td>
      </tr>

      {isExpanded && (
        <tr className="border-b border-[var(--color-border)]">
          <td colSpan={6} className="px-[var(--spacing-6)] py-[var(--spacing-4)] bg-[var(--color-neutral-50,#f9fafb)]">
            <div className="space-y-[var(--spacing-4)]">
              {/* Agent breakdown */}
              {agents.size > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-[var(--color-text-secondary)] mb-[var(--spacing-2)]">
                    Agent Breakdown
                  </h4>
                  <div className="grid grid-cols-3 gap-[var(--spacing-3)]">
                    {[...agents.entries()].map(([agentName, info]) => (
                      <div
                        key={agentName}
                        className="flex items-center justify-between p-[var(--spacing-2)] rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)]"
                      >
                        <span className="text-xs font-medium text-[var(--color-text)]">
                          {agentName}
                        </span>
                        <span className="text-xs text-[var(--color-text-secondary)]">
                          {info.count} section{info.count !== 1 ? "s" : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats row */}
              <div className="flex gap-[var(--spacing-6)] text-xs text-[var(--color-text-secondary)]">
                <span>API calls: <strong className="text-[var(--color-text)]">{run.apiCallCount}</strong></span>
                <span>Cost: <strong className="text-[var(--color-text)]">{formatCost(run.totalCost)}</strong></span>
                <span>Sections: <strong className="text-[var(--color-text)]">{run.sectionCount}</strong></span>
              </div>

              {/* Error message */}
              {run.errorMessage && (
                <div className="bg-[var(--color-error-light,rgba(239,68,68,0.1))] border border-[var(--color-error)] rounded-[var(--radius-sm)] p-[var(--spacing-3)]">
                  <p className="text-xs font-semibold text-[var(--color-error)] mb-1">Error</p>
                  <p className="text-xs text-[var(--color-error)]" data-testid="pipeline-error-message">
                    {run.errorMessage}
                  </p>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] p-[var(--spacing-4)]">
      <p className="text-xs text-[var(--color-text-secondary)]">{label}</p>
      <p className="text-xl font-semibold text-[var(--color-text)] mt-1">{value}</p>
    </div>
  );
}
