"use client";

import { useEffect, useState, useCallback } from "react";
import { ExportButton } from "@/components/admin/export-button";
import { exportMultiSectionCsv, exportJson } from "@/lib/utils/analytics-export";

type Period = "7d" | "30d" | "90d" | "365d" | "all";

interface StateEntry {
  state: string;
  count: number;
  percentage: number;
}

interface CityEntry {
  city: string;
  state: string;
  count: number;
  percentage: number;
}

interface GeoData {
  byState: StateEntry[];
  byCity: CityEntry[];
  summary: {
    totalReports: number;
    uniqueStates: number;
    uniqueCities: number;
    topState: { name: string; count: number } | null;
  };
  period: string;
}

const PERIODS: { value: Period; label: string }[] = [
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
  { value: "365d", label: "365d" },
  { value: "all", label: "All Time" },
];

export function GeographicAnalyticsDashboard() {
  const [data, setData] = useState<GeoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("all");

  const fetchData = useCallback(async (p: Period) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/analytics/geographic?period=${p}`);
      if (!res.ok) throw new Error("Failed to load geographic analytics");
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

  return (
    <div className="space-y-[var(--spacing-6)] app-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--color-app-text)]">
            Geographic Analytics
          </h1>
          <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-app-text-secondary)] mt-1">
            Report distribution by geography
          </p>
        </div>
        <div className="flex gap-[var(--spacing-2)]">
          <ExportButton
            disabled={loading || !data}
            onExportCsv={() => {
              if (data) exportMultiSectionCsv([
                { title: "By State", rows: data.byState as unknown as Record<string, unknown>[], headers: ["state", "count", "percentage"] },
                { title: "By City", rows: data.byCity as unknown as Record<string, unknown>[], headers: ["city", "state", "count", "percentage"] },
              ], "geographic-analytics");
            }}
            onExportJson={() => {
              if (data) exportJson(data, "geographic-analytics");
            }}
          />
          <button
            onClick={() => fetchData(period)}
            disabled={loading}
            className="px-[var(--spacing-4)] py-[var(--spacing-2)] rounded-[var(--radius-sm)] text-sm font-medium border border-[var(--color-app-border)] text-[var(--color-app-text-secondary)] hover:bg-[var(--color-app-active-bg)] disabled:opacity-50 transition-colors"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-[var(--color-error-light,rgba(239,68,68,0.1))] border border-[var(--color-error)] rounded-[var(--radius-md)] p-[var(--spacing-4)]" data-testid="error-state">
          <p className="text-sm text-[var(--color-error)]">Failed to load geographic data. {error}</p>
          <button
            onClick={() => fetchData(period)}
            className="mt-2 text-xs font-medium text-[var(--color-error)] underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && !data && (
        <div className="text-center py-[var(--spacing-8)]" data-testid="loading-state">
          <div className="inline-block w-6 h-6 border-2 border-[var(--color-app-accent)] border-t-transparent rounded-full animate-spin" />
          <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-app-text-secondary)] mt-2">
            Loading geographic data...
          </p>
        </div>
      )}

      {/* Dashboard content */}
      {data && (
        <>
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-4 gap-[var(--spacing-4)]" data-testid="kpi-cards">
            <KpiCard label="Total Reports" value={data.summary.totalReports.toLocaleString()} />
            <KpiCard label="States" value={data.summary.uniqueStates.toLocaleString()} />
            <KpiCard label="Cities" value={data.summary.uniqueCities.toLocaleString()} />
            <KpiCard
              label="Top Market"
              value={data.summary.topState ? `${data.summary.topState.name} (${data.summary.topState.count})` : "--"}
            />
          </div>

          {/* Period controls */}
          <div className="flex gap-[var(--spacing-2)]" role="tablist" aria-label="Filter by period">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                role="tab"
                aria-selected={period === p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-[var(--spacing-3)] py-[var(--spacing-1)] rounded-full text-xs font-medium transition-colors ${
                  period === p.value
                    ? "bg-[var(--color-app-accent)] text-white"
                    : "bg-[var(--color-app-surface)] text-[var(--color-app-text-secondary)] border border-[var(--color-app-border)] hover:bg-[var(--color-app-active-bg)]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {data.byState.length === 0 && data.byCity.length === 0 ? (
            <div className="text-center py-[var(--spacing-8)]" data-testid="empty-state">
              <p className="text-sm text-[var(--color-app-text-secondary)]">
                No report data available for this period.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-[var(--spacing-4)]">
              {/* Reports by State */}
              <div className="bg-[var(--color-app-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] border border-[var(--color-app-border)] p-[var(--spacing-4)]">
                <h2 className="font-[family-name:var(--font-body)] text-sm font-semibold text-[var(--color-app-text)] mb-[var(--spacing-4)]">
                  Reports by State
                </h2>
                <div className="space-y-[var(--spacing-3)]" data-testid="state-list">
                  {data.byState.map((entry, i) => (
                    <StateRow key={entry.state} rank={i + 1} entry={entry} maxCount={data.byState[0]?.count ?? 1} />
                  ))}
                </div>
              </div>

              {/* Reports by City */}
              <div className="bg-[var(--color-app-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] border border-[var(--color-app-border)] p-[var(--spacing-4)]">
                <h2 className="font-[family-name:var(--font-body)] text-sm font-semibold text-[var(--color-app-text)] mb-[var(--spacing-4)]">
                  Reports by City
                </h2>
                <div className="space-y-[var(--spacing-3)]" data-testid="city-list">
                  {data.byCity.map((entry, i) => (
                    <CityRow key={`${entry.city}-${entry.state}`} rank={i + 1} entry={entry} maxCount={data.byCity[0]?.count ?? 1} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--color-app-surface)] rounded-[var(--radius-md)] border border-[var(--color-app-border)] p-[var(--spacing-4)]">
      <p className="text-xs text-[var(--color-app-text-secondary)] font-[family-name:var(--font-body)]">{label}</p>
      <p className="text-xl font-semibold mt-1 font-[family-name:var(--font-body)] text-[var(--color-app-text)]">
        {value}
      </p>
    </div>
  );
}

function StateRow({ rank, entry, maxCount }: { rank: number; entry: StateEntry; maxCount: number }) {
  const barWidth = maxCount > 0 ? (entry.count / maxCount) * 100 : 0;
  return (
    <div className="flex items-center gap-[var(--spacing-2)]">
      <span className="text-xs text-[var(--color-app-text-secondary)] w-5 text-right font-[family-name:var(--font-body)]">{rank}.</span>
      <span className="text-sm font-medium text-[var(--color-app-text)] w-10 font-[family-name:var(--font-body)]">{entry.state}</span>
      <div className="flex-1 h-5 bg-[var(--color-app-bg)] rounded-[var(--radius-sm)] overflow-hidden">
        <div
          className="h-full bg-[var(--color-app-accent)] rounded-[var(--radius-sm)] transition-all"
          style={{ width: `${barWidth}%` }}
        />
      </div>
      <span className="text-xs text-[var(--color-app-text-secondary)] w-8 text-right font-[family-name:var(--font-body)]">{entry.count}</span>
      <span className="text-xs text-[var(--color-app-text-secondary)] w-10 text-right font-[family-name:var(--font-body)]">{entry.percentage}%</span>
    </div>
  );
}

function CityRow({ rank, entry, maxCount }: { rank: number; entry: CityEntry; maxCount: number }) {
  const barWidth = maxCount > 0 ? (entry.count / maxCount) * 100 : 0;
  return (
    <div className="flex items-center gap-[var(--spacing-2)]">
      <span className="text-xs text-[var(--color-app-text-secondary)] w-5 text-right font-[family-name:var(--font-body)]">{rank}.</span>
      <span className="text-sm font-medium text-[var(--color-app-text)] w-36 truncate font-[family-name:var(--font-body)]">
        {entry.city}, {entry.state}
      </span>
      <div className="flex-1 h-5 bg-[var(--color-app-bg)] rounded-[var(--radius-sm)] overflow-hidden">
        <div
          className="h-full bg-[var(--color-app-accent)] rounded-[var(--radius-sm)] transition-all"
          style={{ width: `${barWidth}%` }}
        />
      </div>
      <span className="text-xs text-[var(--color-app-text-secondary)] w-8 text-right font-[family-name:var(--font-body)]">{entry.count}</span>
      <span className="text-xs text-[var(--color-app-text-secondary)] w-10 text-right font-[family-name:var(--font-body)]">{entry.percentage}%</span>
    </div>
  );
}
