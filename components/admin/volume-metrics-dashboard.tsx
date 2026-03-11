"use client";

import { useEffect, useState, useCallback } from "react";
import { ExportButton } from "@/components/admin/export-button";
import { exportCsv, exportJson } from "@/lib/utils/analytics-export";

type Period = "7d" | "30d" | "90d" | "365d";
type Granularity = "daily" | "weekly" | "monthly";

interface OverviewData {
  reportVolume: {
    last24h: number;
    last7d: number;
    last30d: number;
    allTime: number;
  };
  userCount: {
    total: number;
    active: number;
    newLast30d: number;
  };
  errorRate: {
    last7d: { failed: number; total: number; rate: number };
    last30d: { failed: number; total: number; rate: number };
  };
  avgGenerationTime: {
    last7d: number;
    last30d: number;
  };
}

interface VolumeEntry {
  date: string;
  total: number;
  completed: number;
  failed: number;
}

interface VolumeData {
  timeSeries: VolumeEntry[];
  period: string;
  granularity: string;
}

const PERIODS: Period[] = ["7d", "30d", "90d", "365d"];
const GRANULARITIES: { value: Granularity; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export function VolumeMetricsDashboard() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [volume, setVolume] = useState<VolumeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("30d");
  const [granularity, setGranularity] = useState<Granularity>("daily");

  const fetchData = useCallback(async (p: Period, g: Granularity) => {
    setLoading(true);
    setError(null);
    try {
      const [overviewRes, volumeRes] = await Promise.all([
        fetch("/api/admin/analytics"),
        fetch(`/api/admin/analytics/volume?period=${p}&granularity=${g}`),
      ]);

      if (!overviewRes.ok) throw new Error("Failed to load analytics overview");
      if (!volumeRes.ok) throw new Error("Failed to load analytics volume data");

      const [overviewJson, volumeJson] = await Promise.all([
        overviewRes.json(),
        volumeRes.json(),
      ]);

      setOverview(overviewJson);
      setVolume(volumeJson);
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
    <div className="space-y-[var(--spacing-6)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-sans)] text-2xl font-bold text-[var(--color-text)]">
            Volume Metrics
          </h1>
          <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] mt-1">
            Report generation trends and volume metrics
          </p>
        </div>
        <div className="flex gap-[var(--spacing-2)]">
          <ExportButton
            disabled={loading || !volume}
            onExportCsv={() => {
              if (volume) exportCsv(volume.timeSeries as unknown as Record<string, unknown>[], "volume-metrics", ["date", "total", "completed", "failed"]);
            }}
            onExportJson={() => {
              if (volume) exportJson({ overview, volume }, "volume-metrics");
            }}
          />
          <button
            onClick={() => fetchData(period, granularity)}
            disabled={loading}
            className="px-[var(--spacing-4)] py-[var(--spacing-2)] rounded-[var(--radius-sm)] text-sm font-medium border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-light)] disabled:opacity-50 transition-colors"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-[var(--color-error-light,rgba(239,68,68,0.1))] border border-[var(--color-error)] rounded-[var(--radius-md)] p-[var(--spacing-4)]">
          <p className="text-sm text-[var(--color-error)]">Failed to load analytics data. {error}</p>
          <button
            onClick={() => fetchData(period, granularity)}
            className="mt-2 text-xs font-medium text-[var(--color-error)] underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && !overview && (
        <div className="text-center py-[var(--spacing-8)]">
          <div className="inline-block w-6 h-6 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
          <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] mt-2">
            Loading analytics data...
          </p>
        </div>
      )}

      {/* Dashboard content */}
      {overview && (
        <>
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-4 gap-[var(--spacing-4)]" data-testid="kpi-cards">
            <KpiCard
              label="Total Reports"
              value={overview.reportVolume.allTime.toLocaleString()}
            />
            <KpiCard
              label="Last 30 Days"
              value={overview.reportVolume.last30d.toLocaleString()}
            />
            <KpiCard
              label="Error Rate (30d)"
              value={`${(overview.errorRate.last30d.rate * 100).toFixed(1)}%`}
              warn={overview.errorRate.last30d.rate > 0.05}
            />
            <KpiCard
              label="Avg Gen Time (30d)"
              value={overview.avgGenerationTime.last30d > 0 ? `${overview.avgGenerationTime.last30d}s` : "--"}
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
                      ? "bg-[var(--color-primary)] text-white"
                      : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-primary-light)]"
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
                      ? "bg-[var(--color-primary)] text-white"
                      : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-primary-light)]"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Volume Chart */}
          <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] border border-[var(--color-border)] p-[var(--spacing-4)]">
            <h2 className="font-[family-name:var(--font-sans)] text-sm font-semibold text-[var(--color-text)] mb-[var(--spacing-4)]">
              Report Volume Over Time
            </h2>

            {volume && volume.timeSeries.length > 0 ? (
              <VolumeChart data={volume.timeSeries} />
            ) : (
              <div className="text-center py-[var(--spacing-8)]">
                <p className="text-sm text-[var(--color-text-secondary)]">
                  No report data for this period.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function KpiCard({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] p-[var(--spacing-4)]">
      <p className="text-xs text-[var(--color-text-secondary)] font-[family-name:var(--font-sans)]">{label}</p>
      <p className={`text-xl font-semibold mt-1 font-[family-name:var(--font-sans)] ${
        warn ? "text-[var(--color-error)]" : "text-[var(--color-text)]"
      }`}>
        {value}
      </p>
    </div>
  );
}

function VolumeChart({ data }: { data: VolumeEntry[] }) {
  if (data.length === 0) return null;

  const maxVal = Math.max(...data.map((d) => d.total), 1);
  const chartWidth = 720;
  const chartHeight = 240;
  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const xScale = (i: number) => padding.left + (i / Math.max(data.length - 1, 1)) * innerWidth;
  const yScale = (v: number) => padding.top + innerHeight - (v / maxVal) * innerHeight;

  const makePath = (key: keyof Pick<VolumeEntry, "total" | "completed" | "failed">) =>
    data
      .map((d, i) => `${i === 0 ? "M" : "L"} ${xScale(i).toFixed(1)} ${yScale(d[key]).toFixed(1)}`)
      .join(" ");

  // Y-axis labels
  const yTicks = [0, Math.round(maxVal / 2), maxVal];

  // X-axis labels — show ~5 evenly spaced
  const xLabelCount = Math.min(data.length, 5);
  const xLabelIndices = Array.from({ length: xLabelCount }, (_, i) =>
    Math.round((i / Math.max(xLabelCount - 1, 1)) * (data.length - 1))
  );

  return (
    <div>
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto" role="img" aria-label="Report volume line chart">
        {/* Grid lines */}
        {yTicks.map((tick) => (
          <g key={tick}>
            <line
              x1={padding.left}
              y1={yScale(tick)}
              x2={chartWidth - padding.right}
              y2={yScale(tick)}
              stroke="var(--color-border)"
              strokeDasharray="4 4"
            />
            <text
              x={padding.left - 8}
              y={yScale(tick) + 4}
              textAnchor="end"
              fontSize="10"
              fill="var(--color-text-secondary)"
            >
              {tick}
            </text>
          </g>
        ))}

        {/* X-axis labels */}
        {xLabelIndices.map((idx) => (
          <text
            key={idx}
            x={xScale(idx)}
            y={chartHeight - 8}
            textAnchor="middle"
            fontSize="10"
            fill="var(--color-text-secondary)"
          >
            {formatChartDate(data[idx].date)}
          </text>
        ))}

        {/* Lines */}
        <path d={makePath("total")} fill="none" stroke="var(--color-primary)" strokeWidth="2" />
        <path d={makePath("completed")} fill="none" stroke="var(--color-success)" strokeWidth="2" />
        <path d={makePath("failed")} fill="none" stroke="var(--color-error)" strokeWidth="1.5" strokeDasharray="4 2" />

        {/* Dots for total */}
        {data.map((d, i) => (
          <circle
            key={i}
            cx={xScale(i)}
            cy={yScale(d.total)}
            r="3"
            fill="var(--color-primary)"
          />
        ))}
      </svg>

      {/* Legend */}
      <div className="flex gap-[var(--spacing-4)] mt-[var(--spacing-2)] justify-center">
        <LegendItem color="var(--color-primary)" label="Total" />
        <LegendItem color="var(--color-success)" label="Completed" />
        <LegendItem color="var(--color-error)" label="Failed" />
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-[var(--spacing-1)]">
      <span className="inline-block w-3 h-0.5" style={{ backgroundColor: color }} />
      <span className="text-xs text-[var(--color-text-secondary)]">{label}</span>
    </div>
  );
}

function formatChartDate(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}
