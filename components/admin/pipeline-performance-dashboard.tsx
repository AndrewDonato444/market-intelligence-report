"use client";

import { useEffect, useState, useCallback } from "react";
import { ExportButton } from "@/components/admin/export-button";
import { exportMultiSectionCsv, exportJson } from "@/lib/utils/analytics-export";

type Period = "7d" | "30d" | "90d" | "365d";
type Granularity = "daily" | "weekly" | "monthly";

interface GenTimeEntry {
  date: string;
  avgSeconds: number;
  count: number;
}

interface AgentError {
  agent: string;
  count: number;
}

interface ProviderCost {
  provider: string;
  requests: number;
  totalCost: number;
  avgCostPerRequest: number;
}

interface PerformanceData {
  generationTimeSeries: GenTimeEntry[];
  summary: {
    avgGenerationTime: number;
    cacheHitRate: number;
    avgCostPerReport: number;
    errorRate: number;
    totalReports: number;
    totalErrors: number;
  };
  errorsByAgent: AgentError[];
  costByProvider: ProviderCost[];
  period: string;
  granularity: string;
}

const PERIODS: Period[] = ["7d", "30d", "90d", "365d"];
const GRANULARITIES: { value: Granularity; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export function PipelinePerformanceDashboard() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("30d");
  const [granularity, setGranularity] = useState<Granularity>("daily");

  const fetchData = useCallback(async (p: Period, g: Granularity) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/analytics/performance?period=${p}&granularity=${g}`);
      if (!res.ok) throw new Error("Failed to load performance metrics");
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(period, granularity);
  }, [fetchData, period, granularity]);

  return (
    <div className="space-y-[var(--spacing-6)] app-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--color-app-text)]">
            Pipeline Performance
          </h1>
          <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-app-text-secondary)] mt-1">
            Generation time, cache efficiency, API costs, and error rates
          </p>
        </div>
        <div className="flex gap-[var(--spacing-2)]">
          <ExportButton
            disabled={loading || !data}
            onExportCsv={() => {
              if (data) exportMultiSectionCsv([
                { title: "Generation Time Series", rows: data.generationTimeSeries as unknown as Record<string, unknown>[], headers: ["date", "avgSeconds", "count"] },
                { title: "Cost By Provider", rows: data.costByProvider as unknown as Record<string, unknown>[], headers: ["provider", "requests", "totalCost", "avgCostPerRequest"] },
                { title: "Errors By Agent", rows: data.errorsByAgent as unknown as Record<string, unknown>[], headers: ["agent", "count"] },
              ], "pipeline-performance");
            }}
            onExportJson={() => {
              if (data) exportJson(data, "pipeline-performance");
            }}
          />
          <button
            onClick={() => fetchData(period, granularity)}
            disabled={loading}
            className="px-[var(--spacing-4)] py-[var(--spacing-2)] rounded-[var(--radius-sm)] text-sm font-medium border border-[var(--color-app-border)] text-[var(--color-app-text-secondary)] hover:bg-[var(--color-app-active-bg)] disabled:opacity-50 transition-colors"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-[var(--color-error-light,rgba(239,68,68,0.1))] border border-[var(--color-error)] rounded-[var(--radius-md)] p-[var(--spacing-4)]">
          <p className="text-sm text-[var(--color-error)]">Failed to load performance metrics. {error}</p>
          <button
            onClick={() => fetchData(period, granularity)}
            className="mt-2 text-xs font-medium text-[var(--color-error)] underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && !data && (
        <div className="text-center py-[var(--spacing-8)]">
          <div className="inline-block w-6 h-6 border-2 border-[var(--color-app-accent)] border-t-transparent rounded-full animate-spin" />
          <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-app-text-secondary)] mt-2">
            Loading performance metrics...
          </p>
        </div>
      )}

      {/* Dashboard content */}
      {data && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-[var(--spacing-4)]" data-testid="kpi-cards">
            <KpiCard
              label="Avg Generation Time"
              value={data.summary.avgGenerationTime > 0 ? `${data.summary.avgGenerationTime}s` : "N/A"}
            />
            <KpiCard
              label="Cache Hit Rate"
              value={formatPercent(data.summary.cacheHitRate)}
              color="var(--color-success)"
            />
            <KpiCard
              label="Avg Cost / Report"
              value={data.summary.avgCostPerReport > 0 ? `$${data.summary.avgCostPerReport.toFixed(2)}` : "$0.00"}
              color="var(--color-app-accent)"
            />
            <KpiCard
              label="Error Rate"
              value={formatPercent(data.summary.errorRate)}
              color="var(--color-error)"
            />
          </div>

          {/* Period + Granularity controls */}
          <div className="flex items-center justify-between">
            <div className="flex gap-[var(--spacing-2)]" role="tablist" aria-label="Filter by period">
              {PERIODS.map((p) => (
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

            <div className="flex gap-[var(--spacing-2)]" role="tablist" aria-label="Granularity">
              {GRANULARITIES.map((g) => (
                <button
                  key={g.value}
                  role="tab"
                  aria-selected={granularity === g.value}
                  onClick={() => setGranularity(g.value)}
                  className={`px-[var(--spacing-3)] py-[var(--spacing-1)] rounded-full text-xs font-medium transition-colors ${
                    granularity === g.value
                      ? "bg-[var(--color-app-accent)] text-white"
                      : "bg-[var(--color-app-surface)] text-[var(--color-app-text-secondary)] border border-[var(--color-app-border)] hover:bg-[var(--color-app-active-bg)]"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Generation Time Chart */}
          <div className="bg-[var(--color-app-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] border border-[var(--color-app-border)] p-[var(--spacing-4)]">
            <h2 className="font-[family-name:var(--font-body)] text-sm font-semibold text-[var(--color-app-text)] mb-[var(--spacing-4)]">
              Average Generation Time
            </h2>

            {data.generationTimeSeries.some((d) => d.count > 0) ? (
              <GenTimeChart data={data.generationTimeSeries} />
            ) : (
              <div className="text-center py-[var(--spacing-8)]">
                <p className="text-sm text-[var(--color-app-text-secondary)]">
                  No generation data for this period.
                </p>
              </div>
            )}
          </div>

          {/* Errors by Agent */}
          <div className="bg-[var(--color-app-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] border border-[var(--color-app-border)] p-[var(--spacing-6)]">
            <h2 className="font-[family-name:var(--font-body)] text-lg font-semibold text-[var(--color-app-text)] mb-[var(--spacing-4)]">
              Errors by Agent
            </h2>

            {data.errorsByAgent.length > 0 ? (
              <table className="w-full font-[family-name:var(--font-body)]">
                <thead>
                  <tr className="text-left">
                    <th className="text-xs font-medium text-[var(--color-app-text-secondary)] pb-[var(--spacing-2)]">AGENT</th>
                    <th className="text-xs font-medium text-[var(--color-app-text-secondary)] pb-[var(--spacing-2)] text-right">ERRORS</th>
                  </tr>
                </thead>
                <tbody>
                  {data.errorsByAgent.map((entry) => (
                    <tr key={entry.agent} className="border-t border-[var(--color-app-border)]" data-testid="agent-error-row">
                      <td className="py-[var(--spacing-2)] text-sm text-[var(--color-app-text)]">{entry.agent}</td>
                      <td className="py-[var(--spacing-2)] text-sm text-[var(--color-error)] text-right font-medium">{entry.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-[var(--color-app-text-secondary)]">No errors recorded in this period.</p>
            )}
          </div>

          {/* Cost Breakdown by Provider */}
          <div className="bg-[var(--color-app-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] border border-[var(--color-app-border)] p-[var(--spacing-6)]">
            <h2 className="font-[family-name:var(--font-body)] text-lg font-semibold text-[var(--color-app-text)] mb-[var(--spacing-4)]">
              Cost Breakdown by Provider
            </h2>

            {data.costByProvider.length > 0 ? (
              <table className="w-full font-[family-name:var(--font-body)]">
                <thead>
                  <tr className="text-left">
                    <th className="text-xs font-medium text-[var(--color-app-text-secondary)] pb-[var(--spacing-2)]">PROVIDER</th>
                    <th className="text-xs font-medium text-[var(--color-app-text-secondary)] pb-[var(--spacing-2)] text-right">REQUESTS</th>
                    <th className="text-xs font-medium text-[var(--color-app-text-secondary)] pb-[var(--spacing-2)] text-right">TOTAL COST</th>
                    <th className="text-xs font-medium text-[var(--color-app-text-secondary)] pb-[var(--spacing-2)] text-right">AVG / REQUEST</th>
                  </tr>
                </thead>
                <tbody>
                  {data.costByProvider.map((entry) => (
                    <tr key={entry.provider} className="border-t border-[var(--color-app-border)]">
                      <td className="py-[var(--spacing-2)] text-sm text-[var(--color-app-text)] font-medium">{entry.provider}</td>
                      <td className="py-[var(--spacing-2)] text-sm text-[var(--color-app-text-secondary)] text-right">{entry.requests}</td>
                      <td className="py-[var(--spacing-2)] text-sm text-[var(--color-app-text)] text-right font-medium">${entry.totalCost.toFixed(2)}</td>
                      <td className="py-[var(--spacing-2)] text-sm text-[var(--color-app-text-secondary)] text-right">${entry.avgCostPerRequest.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-[var(--color-app-text-secondary)]">No cost data recorded in this period.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function KpiCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-[var(--color-app-surface)] rounded-[var(--radius-md)] border border-[var(--color-app-border)] p-[var(--spacing-4)]">
      <p className="text-xs text-[var(--color-app-text-secondary)] font-[family-name:var(--font-body)]">{label}</p>
      <p
        className="text-xl font-semibold mt-1 font-[family-name:var(--font-body)]"
        style={{ color: color || "var(--color-app-text)" }}
      >
        {value}
      </p>
    </div>
  );
}

function GenTimeChart({ data }: { data: GenTimeEntry[] }) {
  const activeData = data.filter((d) => d.count > 0);
  if (activeData.length === 0) return null;

  const maxVal = Math.max(...activeData.map((d) => d.avgSeconds), 1);
  const chartWidth = 720;
  const chartHeight = 240;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const xScale = (i: number) => padding.left + (i / Math.max(activeData.length - 1, 1)) * innerWidth;
  const yScale = (v: number) => padding.top + innerHeight - (v / maxVal) * innerHeight;

  const linePath = activeData
    .map((d, i) => `${i === 0 ? "M" : "L"} ${xScale(i).toFixed(1)} ${yScale(d.avgSeconds).toFixed(1)}`)
    .join(" ");

  const yTicks = [0, Math.round(maxVal / 2), Math.round(maxVal)];

  const xLabelCount = Math.min(activeData.length, 5);
  const xLabelIndices = Array.from({ length: xLabelCount }, (_, i) =>
    Math.round((i / Math.max(xLabelCount - 1, 1)) * (activeData.length - 1))
  );

  return (
    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto" role="img" aria-label="Generation time trend line chart">
      {yTicks.map((tick) => (
        <g key={tick}>
          <line
            x1={padding.left}
            y1={yScale(tick)}
            x2={chartWidth - padding.right}
            y2={yScale(tick)}
            stroke="var(--color-app-border)"
            strokeDasharray="4 4"
          />
          <text
            x={padding.left - 8}
            y={yScale(tick) + 4}
            textAnchor="end"
            fontSize="10"
            fill="var(--color-app-text-secondary)"
          >
            {tick}s
          </text>
        </g>
      ))}

      {xLabelIndices.map((idx) => (
        <text
          key={idx}
          x={xScale(idx)}
          y={chartHeight - 8}
          textAnchor="middle"
          fontSize="10"
          fill="var(--color-app-text-secondary)"
        >
          {formatChartDate(activeData[idx].date)}
        </text>
      ))}

      <path d={linePath} fill="none" stroke="var(--color-app-text)" strokeWidth="2" />

      {activeData.map((d, i) => (
        <circle
          key={i}
          cx={xScale(i)}
          cy={yScale(d.avgSeconds)}
          r="3"
          fill="var(--color-app-text)"
        />
      ))}
    </svg>
  );
}

function formatChartDate(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}
