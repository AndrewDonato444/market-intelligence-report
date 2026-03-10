"use client";

import { useEffect, useState, useCallback } from "react";
import type { DataSourceSnapshot } from "@/lib/services/data-source-registry";

type ConnectorStatus = "healthy" | "degraded" | "unhealthy" | "unknown";

const statusConfig: Record<ConnectorStatus, { label: string; color: string; bg: string }> = {
  healthy: { label: "Healthy", color: "var(--color-success)", bg: "var(--color-success-light, rgba(34,197,94,0.1))" },
  degraded: { label: "Degraded", color: "var(--color-warning)", bg: "var(--color-warning-light, rgba(234,179,8,0.1))" },
  unhealthy: { label: "Unhealthy", color: "var(--color-error)", bg: "var(--color-error-light, rgba(239,68,68,0.1))" },
  unknown: { label: "Not Checked", color: "var(--color-text-tertiary)", bg: "var(--color-surface)" },
};

function formatTtl(seconds: number): string {
  if (seconds >= 86400) return `${Math.round(seconds / 86400)}d`;
  if (seconds >= 3600) return `${Math.round(seconds / 3600)}h`;
  if (seconds >= 60) return `${Math.round(seconds / 60)}m`;
  return `${seconds}s`;
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ago`;
}

export function DataSourcesDashboard() {
  const [sources, setSources] = useState<DataSourceSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  const fetchSources = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/data-sources");
      const data = await res.json();
      setSources(data.sources ?? []);
    } catch {
      // Silently fail — dashboard shows empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  const runHealthCheck = async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/admin/data-sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "health-check" }),
      });
      const data = await res.json();
      setSources(data.sources ?? []);
    } catch {
      // Error silently handled
    } finally {
      setChecking(false);
    }
  };

  if (loading) {
    return (
      <div className="p-[var(--spacing-6)]">
        <p className="font-[family-name:var(--font-sans)] text-[var(--color-text-secondary)]">
          Loading data sources...
        </p>
      </div>
    );
  }

  return (
    <div className="p-[var(--spacing-6)] max-w-4xl">
      <div className="flex items-center justify-between mb-[var(--spacing-6)]">
        <h1 className="font-[family-name:var(--font-sans)] text-2xl font-semibold text-[var(--color-text)]">
          Data Sources
        </h1>
        <button
          onClick={runHealthCheck}
          disabled={checking}
          className="px-[var(--spacing-4)] py-[var(--spacing-2)] rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white font-[family-name:var(--font-sans)] text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {checking ? "Checking..." : "Check All"}
        </button>
      </div>

      <div className="space-y-[var(--spacing-4)]">
        {sources.map((source) => {
          const status = (source.health?.status ?? "unknown") as ConnectorStatus;
          const cfg = statusConfig[status];

          return (
            <div
              key={source.name}
              className="border border-[var(--color-border)] rounded-[var(--radius-lg)] p-[var(--spacing-5)] bg-[var(--color-surface)]"
            >
              <div className="flex items-center justify-between mb-[var(--spacing-3)]">
                <h2 className="font-[family-name:var(--font-sans)] text-lg font-semibold text-[var(--color-text)] capitalize">
                  {source.name === "realestateapi" ? "RealEstateAPI" : source.name === "scrapingdog" ? "ScrapingDog" : source.name}
                </h2>
                <span
                  className="flex items-center gap-[var(--spacing-2)] px-[var(--spacing-3)] py-[var(--spacing-1)] rounded-[var(--radius-full)] text-xs font-medium font-[family-name:var(--font-sans)]"
                  style={{ color: cfg.color, backgroundColor: cfg.bg }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: cfg.color }}
                  />
                  {cfg.label}
                </span>
              </div>

              <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] mb-[var(--spacing-4)]">
                {source.description}
              </p>

              <div className="grid grid-cols-2 gap-[var(--spacing-3)] text-sm font-[family-name:var(--font-sans)]">
                <div>
                  <span className="text-[var(--color-text-tertiary)]">Endpoints: </span>
                  <span className="text-[var(--color-text-secondary)]">
                    {source.endpoints.join(", ")}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--color-text-tertiary)]">Cache TTL: </span>
                  <span className="text-[var(--color-text-secondary)]">
                    {formatTtl(source.cacheTtlSeconds)}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--color-text-tertiary)]">Last check: </span>
                  <span className="text-[var(--color-text-secondary)]">
                    {timeAgo(source.health?.lastChecked ? String(source.health.lastChecked) : null)}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--color-text-tertiary)]">Env: </span>
                  <span className="text-[var(--color-text-secondary)]">
                    {source.requiredEnvVars.map((v) => v).join(", ")}{" "}
                    {source.envVarsPresent ? (
                      <span style={{ color: "var(--color-success)" }}>&#10003;</span>
                    ) : (
                      <span style={{ color: "var(--color-error)" }}>&#10007;</span>
                    )}
                  </span>
                </div>
              </div>

              {source.health?.error && (
                <div
                  className="mt-[var(--spacing-3)] p-[var(--spacing-3)] rounded-[var(--radius-sm)] text-sm font-[family-name:var(--font-sans)]"
                  style={{
                    backgroundColor: "var(--color-warning-light, rgba(234,179,8,0.1))",
                    color: "var(--color-warning)",
                  }}
                >
                  &#9888; {source.health.error}
                </div>
              )}
            </div>
          );
        })}

        {sources.length === 0 && (
          <p className="font-[family-name:var(--font-sans)] text-[var(--color-text-secondary)] text-center py-[var(--spacing-8)]">
            No data sources registered.
          </p>
        )}
      </div>
    </div>
  );
}
