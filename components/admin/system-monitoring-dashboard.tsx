"use client";

import { useEffect, useState, useCallback } from "react";
import type { MonitoringData } from "@/app/api/admin/monitoring/route";

type Period = "24h" | "7d" | "30d";

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  healthy: {
    color: "var(--color-success)",
    bg: "var(--color-success-light, rgba(34,197,94,0.1))",
  },
  degraded: {
    color: "var(--color-warning)",
    bg: "var(--color-warning-light, rgba(234,179,8,0.1))",
  },
  unhealthy: {
    color: "var(--color-error)",
    bg: "var(--color-error-light, rgba(239,68,68,0.1))",
  },
  unknown: {
    color: "var(--color-app-text-secondary)",
    bg: "var(--color-app-surface)",
  },
};

function formatCost(n: number): string {
  if (n === 0) return "$0.00";
  return `$${n.toFixed(4)}`;
}

function formatDuration(ms: number): string {
  if (ms === 0) return "--";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const mins = Math.floor(ms / 60000);
  const secs = ((ms % 60000) / 1000).toFixed(0);
  return `${mins}m ${secs}s`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SystemMonitoringDashboard() {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("7d");
  const [checkingHealth, setCheckingHealth] = useState(false);

  const fetchData = useCallback(async (p: Period) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/monitoring?period=${p}`);
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(period);
  }, [fetchData, period]);

  const handleHealthCheck = async () => {
    setCheckingHealth(true);
    try {
      const res = await fetch("/api/admin/monitoring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "health-check" }),
      });
      if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
      const json = await res.json();
      if (data) {
        setData({ ...data, dataSources: json.dataSources });
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCheckingHealth(false);
    }
  };

  return (
    <div className="space-y-[var(--spacing-6)] app-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--color-app-text)]">
            System Monitoring
          </h1>
          <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-app-text-secondary)] mt-1">
            Cache stats, API costs, pipeline health
          </p>
        </div>
        <button
          onClick={() => fetchData(period)}
          disabled={loading}
          className="px-[var(--spacing-4)] py-[var(--spacing-2)] rounded-[var(--radius-sm)] text-sm font-medium border border-[var(--color-app-border)] text-[var(--color-app-text-secondary)] hover:bg-[var(--color-app-active-bg)] disabled:opacity-50 transition-colors"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {/* Period filter tabs */}
      <div className="flex gap-[var(--spacing-2)]" role="tablist" aria-label="Filter by period">
        {(["24h", "7d", "30d"] as Period[]).map((p) => (
          <button
            key={p}
            role="tab"
            aria-selected={period === p}
            onClick={() => setPeriod(p)}
            className={`px-[var(--spacing-3)] py-[var(--spacing-1)] rounded-full text-xs font-medium transition-colors ${
              period === p
                ? "bg-[var(--color-app-accent)] text-white"
                : "bg-[var(--color-app-surface)] text-[var(--color-app-text-secondary)] border border-[var(--color-app-border)] hover:bg-[var(--color-app-active-bg)]"
            }`}
          >
            {p}
          </button>
        ))}
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
          <div className="inline-block w-6 h-6 border-2 border-[var(--color-app-accent)] border-t-transparent rounded-full animate-spin" />
          <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-app-text-secondary)] mt-2">
            Loading monitoring data...
          </p>
        </div>
      )}

      {/* Dashboard content */}
      {!loading && data && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-4 gap-[var(--spacing-4)]" data-testid="summary-cards">
            <SummaryCard
              label="API Calls"
              value={data.summary.totalApiCalls.toLocaleString()}
            />
            <SummaryCard
              label="Total Cost"
              value={formatCost(data.summary.totalCost)}
            />
            <SummaryCard
              label="Cache Hit Rate"
              value={`${data.summary.cacheHitRate.toFixed(1)}%`}
            />
            <SummaryCard
              label="Pipeline Success"
              value={`${data.summary.pipelineSuccessRate.toFixed(1)}%`}
            />
          </div>

          {/* API Costs by Provider */}
          <Section title="API Costs by Provider">
            {data.byProvider.length === 0 ? (
              <p className="text-sm text-[var(--color-app-text-secondary)]">No API calls in this period.</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--color-app-border)]">
                    <Th align="left">Provider</Th>
                    <Th align="right">Calls</Th>
                    <Th align="right">Cost</Th>
                    <Th align="right">Cache Hits</Th>
                    <Th align="right">Avg Response</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.byProvider.map((p) => (
                    <tr key={p.provider} className="border-b border-[var(--color-app-border)] last:border-0">
                      <td className="py-[var(--spacing-2)] text-sm font-medium text-[var(--color-app-text)]">
                        {p.provider}
                      </td>
                      <td className="py-[var(--spacing-2)] text-sm text-right text-[var(--color-app-text)]">
                        {p.callCount.toLocaleString()}
                      </td>
                      <td className="py-[var(--spacing-2)] text-sm text-right font-mono text-[var(--color-app-text)]">
                        {formatCost(p.totalCost)}
                      </td>
                      <td className="py-[var(--spacing-2)] text-sm text-right text-[var(--color-app-text-secondary)]">
                        {p.cacheHits.toLocaleString()}
                      </td>
                      <td className="py-[var(--spacing-2)] text-sm text-right font-mono text-[var(--color-app-text-secondary)]">
                        {p.avgResponseTimeMs}ms
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>

          {/* Cache Health */}
          <Section title="Cache Health">
            <div className="grid grid-cols-3 gap-[var(--spacing-4)] mb-[var(--spacing-4)]">
              <MiniStat label="Total Entries" value={String(data.cacheHealth.totalEntries)} />
              <MiniStat label="Expiring Soon (24h)" value={String(data.cacheHealth.expiringSoon)} />
              <MiniStat label="Expired" value={String(data.cacheHealth.expired)} warn={data.cacheHealth.expired > 0} />
            </div>
            {data.cacheHealth.bySource.length > 0 && (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--color-app-border)]">
                    <Th align="left">Source</Th>
                    <Th align="right">Entries</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.cacheHealth.bySource.map((s) => (
                    <tr key={s.source} className="border-b border-[var(--color-app-border)] last:border-0">
                      <td className="py-[var(--spacing-2)] text-sm text-[var(--color-app-text)]">
                        {s.source}
                      </td>
                      <td className="py-[var(--spacing-2)] text-sm text-right text-[var(--color-app-text)]">
                        {s.entryCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>

          {/* Pipeline Health */}
          <Section title="Pipeline Health">
            <div className="grid grid-cols-5 gap-[var(--spacing-3)] mb-[var(--spacing-4)]">
              <MiniStat label="Total" value={String(data.pipelineHealth.total)} />
              <MiniStat label="Completed" value={String(data.pipelineHealth.completed)} />
              <MiniStat label="Failed" value={String(data.pipelineHealth.failed)} warn={data.pipelineHealth.failed > 0} />
              <MiniStat label="Generating" value={String(data.pipelineHealth.generating)} />
              <MiniStat label="Queued" value={String(data.pipelineHealth.queued)} />
            </div>
            <p className="text-sm text-[var(--color-app-text-secondary)] mb-[var(--spacing-3)]">
              Avg Duration: <span className="font-mono font-medium text-[var(--color-app-text)]">{formatDuration(data.pipelineHealth.avgDurationMs)}</span>
            </p>
            {data.pipelineHealth.recentFailures.length > 0 && (
              <div className="space-y-[var(--spacing-2)]">
                <p className="text-xs font-semibold text-[var(--color-app-text-secondary)]">Recent Failures</p>
                {data.pipelineHealth.recentFailures.map((f, i) => (
                  <div
                    key={i}
                    className="bg-[var(--color-error-light,rgba(239,68,68,0.1))] border border-[var(--color-error)] rounded-[var(--radius-sm)] p-[var(--spacing-2)]"
                  >
                    <p className="text-xs font-medium text-[var(--color-error)]">
                      {f.title} — {formatDate(f.createdAt)}
                    </p>
                    <p className="text-xs text-[var(--color-error)]">{f.errorMessage}</p>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Data Sources */}
          <Section
            title="Data Sources"
            action={
              <button
                onClick={handleHealthCheck}
                disabled={checkingHealth}
                className="px-[var(--spacing-3)] py-[var(--spacing-1)] rounded-[var(--radius-sm)] text-xs font-medium border border-[var(--color-app-border)] text-[var(--color-app-text-secondary)] hover:bg-[var(--color-app-active-bg)] disabled:opacity-50 transition-colors"
              >
                {checkingHealth ? "Checking..." : "Check All"}
              </button>
            }
          >
            <div className="space-y-[var(--spacing-2)]">
              {data.dataSources.map((ds) => {
                const sc = STATUS_COLORS[ds.status] ?? STATUS_COLORS.unknown;
                return (
                  <div
                    key={ds.name}
                    className="flex items-center justify-between p-[var(--spacing-3)] rounded-[var(--radius-sm)] border border-[var(--color-app-border)]"
                  >
                    <div className="flex items-center gap-[var(--spacing-3)]">
                      <span
                        className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ color: sc.color, backgroundColor: sc.bg }}
                      >
                        {ds.status}
                      </span>
                      <span className="text-sm font-medium text-[var(--color-app-text)]">{ds.name}</span>
                    </div>
                    <div className="flex items-center gap-[var(--spacing-4)] text-xs text-[var(--color-app-text-secondary)]">
                      {ds.latencyMs > 0 && <span className="font-mono">{ds.latencyMs}ms</span>}
                      {ds.lastChecked && <span>{formatDate(ds.lastChecked)}</span>}
                      {ds.error && (
                        <span className="text-[var(--color-error)]" title={ds.error}>
                          {ds.error.length > 40 ? ds.error.slice(0, 40) + "..." : ds.error}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--color-app-surface)] rounded-[var(--radius-md)] border border-[var(--color-app-border)] p-[var(--spacing-4)]">
      <p className="text-xs text-[var(--color-app-text-secondary)] font-[family-name:var(--font-body)]">{label}</p>
      <p className="text-xl font-semibold text-[var(--color-app-text)] mt-1 font-[family-name:var(--font-body)]">{value}</p>
    </div>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[var(--color-app-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] border border-[var(--color-app-border)] p-[var(--spacing-4)]">
      <div className="flex items-center justify-between mb-[var(--spacing-4)]">
        <h2 className="font-[family-name:var(--font-body)] text-sm font-semibold text-[var(--color-app-text)]">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </div>
  );
}

function MiniStat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="text-center">
      <p className="text-xs text-[var(--color-app-text-secondary)]">{label}</p>
      <p className={`text-lg font-semibold mt-0.5 ${warn ? "text-[var(--color-error)]" : "text-[var(--color-app-text)]"}`}>
        {value}
      </p>
    </div>
  );
}

function Th({ children, align }: { children: React.ReactNode; align: "left" | "right" }) {
  return (
    <th className={`py-[var(--spacing-2)] text-xs font-semibold text-[var(--color-app-text-secondary)] text-${align}`}>
      {children}
    </th>
  );
}
