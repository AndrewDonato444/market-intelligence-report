"use client";

import { useEffect, useState, useCallback } from "react";
import { ExportButton } from "@/components/admin/export-button";
import { exportCsv, exportJson } from "@/lib/utils/analytics-export";

type Period = "7d" | "30d" | "90d" | "365d";

interface KitAnalyticsData {
  volumeOverTime: Array<{ date: string; count: number }>;
  contentTypeCounts: Record<string, number>;
  averageContentPerKit: Record<string, number>;
  topContentTypes: string[];
  kitsByStatus: { completed: number; failed: number; generating: number; queued: number };
  period: string;
}

const PERIODS: Period[] = ["7d", "30d", "90d", "365d"];

const CONTENT_TYPE_LABELS: Record<string, string> = {
  postIdeas: "Post Ideas",
  captions: "Captions",
  personaPosts: "Persona Posts",
  polls: "Polls",
  conversationStarters: "Conversation Starters",
  statCallouts: "Stat Callouts",
  calendarSuggestions: "Calendar Suggestions",
};

export function KitAnalyticsDashboard() {
  const [data, setData] = useState<KitAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("30d");

  const fetchData = useCallback(async (p: Period) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/analytics/kits?period=${p}`);
      if (!res.ok) throw new Error("Failed to load kit analytics");
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

  const totalKits = data
    ? data.kitsByStatus.completed + data.kitsByStatus.failed + data.kitsByStatus.generating + data.kitsByStatus.queued
    : 0;

  return (
    <div className="space-y-[var(--spacing-6)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-sans)] text-2xl font-bold text-[var(--color-text)]">
            Social Media Kit Analytics
          </h1>
          <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] mt-1">
            Kit generation trends and content type breakdowns
          </p>
        </div>
        <div className="flex gap-[var(--spacing-2)]">
          <ExportButton
            disabled={loading || !data}
            onExportCsv={() => {
              if (data) exportCsv(data.volumeOverTime as unknown as Record<string, unknown>[], "kit-analytics", ["date", "count"]);
            }}
            onExportJson={() => {
              if (data) exportJson(data, "kit-analytics");
            }}
          />
          <button
            onClick={() => fetchData(period)}
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
          <p className="text-sm text-[var(--color-error)]">Failed to load kit analytics data. {error}</p>
          <button onClick={() => fetchData(period)} className="mt-2 text-xs font-medium text-[var(--color-error)] underline">
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && !data && (
        <div className="text-center py-[var(--spacing-8)]">
          <div className="inline-block w-6 h-6 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
          <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] mt-2">
            Loading kit analytics...
          </p>
        </div>
      )}

      {data && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-[var(--spacing-4)]">
            <KpiCard label="Total Kits" value={totalKits.toLocaleString()} />
            <KpiCard label="Completed" value={data.kitsByStatus.completed.toLocaleString()} />
            <KpiCard
              label="Failed"
              value={data.kitsByStatus.failed.toLocaleString()}
              warn={data.kitsByStatus.failed > 0}
            />
            <KpiCard
              label="Failure Rate"
              value={totalKits > 0 ? `${((data.kitsByStatus.failed / totalKits) * 100).toFixed(1)}%` : "0%"}
              warn={totalKits > 0 && data.kitsByStatus.failed / totalKits > 0.1}
            />
          </div>

          {/* Period controls */}
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

          {/* Content Type Breakdown */}
          <div className="grid grid-cols-2 gap-[var(--spacing-4)]">
            {/* Total counts */}
            <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] border border-[var(--color-border)] p-[var(--spacing-4)]">
              <h2 className="font-[family-name:var(--font-sans)] text-sm font-semibold text-[var(--color-text)] mb-[var(--spacing-3)]">
                Content Generated ({period})
              </h2>
              <div className="space-y-[var(--spacing-2)]">
                {data.topContentTypes.map((type) => (
                  <div key={type} className="flex justify-between items-center">
                    <span className="text-sm text-[var(--color-text-secondary)]">
                      {CONTENT_TYPE_LABELS[type] || type}
                    </span>
                    <span className="text-sm font-semibold text-[var(--color-text)] font-mono">
                      {data.contentTypeCounts[type] ?? 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Average per kit */}
            <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] border border-[var(--color-border)] p-[var(--spacing-4)]">
              <h2 className="font-[family-name:var(--font-sans)] text-sm font-semibold text-[var(--color-text)] mb-[var(--spacing-3)]">
                Average Per Kit ({period})
              </h2>
              <div className="space-y-[var(--spacing-2)]">
                {data.topContentTypes.map((type) => (
                  <div key={type} className="flex justify-between items-center">
                    <span className="text-sm text-[var(--color-text-secondary)]">
                      {CONTENT_TYPE_LABELS[type] || type}
                    </span>
                    <span className="text-sm font-semibold text-[var(--color-text)] font-mono">
                      {data.averageContentPerKit[type] ?? 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Volume Over Time */}
          <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] border border-[var(--color-border)] p-[var(--spacing-4)]">
            <h2 className="font-[family-name:var(--font-sans)] text-sm font-semibold text-[var(--color-text)] mb-[var(--spacing-4)]">
              Kit Generation Over Time
            </h2>
            {data.volumeOverTime.length > 0 ? (
              <div className="space-y-[var(--spacing-1)]">
                {data.volumeOverTime.map((entry) => (
                  <div key={entry.date} className="flex items-center gap-[var(--spacing-3)]">
                    <span className="text-xs text-[var(--color-text-secondary)] w-24 shrink-0 font-mono">
                      {new Date(entry.date + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}
                    </span>
                    <div className="flex-1 h-5 bg-[var(--color-primary-light,rgba(15,23,42,0.05))] rounded-[var(--radius-sm)] overflow-hidden">
                      <div
                        className="h-full bg-[var(--color-primary)] rounded-[var(--radius-sm)]"
                        style={{
                          width: `${Math.max(4, (entry.count / Math.max(...data.volumeOverTime.map((e) => e.count), 1)) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-[var(--color-text)] w-8 text-right font-mono">
                      {entry.count}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--color-text-secondary)] text-center py-[var(--spacing-8)]">
                No kit generation data for this period.
              </p>
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
