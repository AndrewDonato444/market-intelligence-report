"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

type Period = "7d" | "30d" | "90d" | "365d";
type Granularity = "daily" | "weekly" | "monthly";

interface SignupEntry {
  date: string;
  count: number;
}

interface PowerUser {
  id: string;
  name: string;
  email: string;
  reportCount: number;
  lastReportDate: string;
}

interface ChurnRiskUser {
  id: string;
  name: string;
  email: string;
  lastReportDate: string;
  daysSinceLastReport: number;
}

interface UserAnalyticsData {
  signups: SignupEntry[];
  summary: {
    totalUsers: number;
    activeUsers: number;
    newSignups: number;
    inactiveOver60d: number;
  };
  powerUsers: PowerUser[];
  churnRisk: ChurnRiskUser[];
  period: string;
  granularity: string;
}

const PERIODS: Period[] = ["7d", "30d", "90d", "365d"];
const GRANULARITIES: { value: Granularity; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export function UserAnalyticsDashboard() {
  const [data, setData] = useState<UserAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("30d");
  const [granularity, setGranularity] = useState<Granularity>("daily");

  const fetchData = useCallback(async (p: Period, g: Granularity) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/analytics/users?period=${p}&granularity=${g}`);
      if (!res.ok) throw new Error("Failed to load user analytics data");
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
    <div className="space-y-[var(--spacing-6)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-sans)] text-2xl font-bold text-[var(--color-text)]">
            User Analytics
          </h1>
          <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] mt-1">
            Active users, signups, power users, and churn indicators
          </p>
        </div>
        <button
          onClick={() => fetchData(period, granularity)}
          disabled={loading}
          className="px-[var(--spacing-4)] py-[var(--spacing-2)] rounded-[var(--radius-sm)] text-sm font-medium border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-light)] disabled:opacity-50 transition-colors"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-[var(--color-error-light,rgba(239,68,68,0.1))] border border-[var(--color-error)] rounded-[var(--radius-md)] p-[var(--spacing-4)]">
          <p className="text-sm text-[var(--color-error)]">Failed to load user analytics. {error}</p>
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
          <div className="inline-block w-6 h-6 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
          <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] mt-2">
            Loading user analytics...
          </p>
        </div>
      )}

      {/* Dashboard content */}
      {data && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-[var(--spacing-4)]" data-testid="kpi-cards">
            <KpiCard label="Total Users" value={data.summary.totalUsers.toLocaleString()} />
            <KpiCard
              label="Active Users"
              value={data.summary.activeUsers.toLocaleString()}
              subtitle="last 30d"
              color="var(--color-success)"
            />
            <KpiCard
              label="New Signups"
              value={data.summary.newSignups.toLocaleString()}
              subtitle="last 30d"
              color="var(--color-accent,var(--color-primary))"
            />
            <KpiCard
              label="Inactive (60d+)"
              value={data.summary.inactiveOver60d.toLocaleString()}
              color="var(--color-warning,var(--color-error))"
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

          {/* Signup Chart */}
          <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] border border-[var(--color-border)] p-[var(--spacing-4)]">
            <h2 className="font-[family-name:var(--font-sans)] text-sm font-semibold text-[var(--color-text)] mb-[var(--spacing-4)]">
              New Signups Over Time
            </h2>

            {data.signups.length > 0 ? (
              <SignupChart data={data.signups} />
            ) : (
              <div className="text-center py-[var(--spacing-8)]">
                <p className="text-sm text-[var(--color-text-secondary)]">
                  No signup data for this period.
                </p>
              </div>
            )}
          </div>

          {/* Power Users */}
          <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] border border-[var(--color-border)] p-[var(--spacing-6)]">
            <h2 className="font-[family-name:var(--font-sans)] text-lg font-semibold text-[var(--color-text)] mb-[var(--spacing-4)]">
              Top Report Generators
            </h2>

            {data.powerUsers.length > 0 ? (
              <table className="w-full font-[family-name:var(--font-sans)]">
                <thead>
                  <tr className="text-left">
                    <th className="text-xs font-medium text-[var(--color-text-secondary)] pb-[var(--spacing-2)]">NAME</th>
                    <th className="text-xs font-medium text-[var(--color-text-secondary)] pb-[var(--spacing-2)]">EMAIL</th>
                    <th className="text-xs font-medium text-[var(--color-text-secondary)] pb-[var(--spacing-2)] text-right">REPORTS</th>
                    <th className="text-xs font-medium text-[var(--color-text-secondary)] pb-[var(--spacing-2)] text-right">LAST REPORT</th>
                  </tr>
                </thead>
                <tbody>
                  {data.powerUsers.map((user) => (
                    <tr key={user.id} className="border-t border-[var(--color-border)]">
                      <td className="py-[var(--spacing-2)]">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="text-sm font-medium text-[var(--color-accent,var(--color-primary))] hover:underline"
                        >
                          {user.name}
                        </Link>
                      </td>
                      <td className="py-[var(--spacing-2)] text-sm text-[var(--color-text-secondary)]">{user.email}</td>
                      <td className="py-[var(--spacing-2)] text-sm text-[var(--color-text)] text-right font-medium">{user.reportCount}</td>
                      <td className="py-[var(--spacing-2)] text-sm text-[var(--color-text-secondary)] text-right">
                        {formatDateShort(user.lastReportDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-[var(--color-text-secondary)]">No power users found. No reports have been generated yet.</p>
            )}
          </div>

          {/* Churn Indicators */}
          <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] border border-[var(--color-border)] p-[var(--spacing-6)]">
            <h2 className="font-[family-name:var(--font-sans)] text-lg font-semibold text-[var(--color-text)]">
              At-Risk Users
            </h2>
            <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] mb-[var(--spacing-4)]">
              {data.churnRisk.length} users active in prior 60d but no report in last 30d
            </p>

            {data.churnRisk.length > 0 ? (
              <table className="w-full font-[family-name:var(--font-sans)]">
                <thead>
                  <tr className="text-left">
                    <th className="text-xs font-medium text-[var(--color-text-secondary)] pb-[var(--spacing-2)]">NAME</th>
                    <th className="text-xs font-medium text-[var(--color-text-secondary)] pb-[var(--spacing-2)]">EMAIL</th>
                    <th className="text-xs font-medium text-[var(--color-text-secondary)] pb-[var(--spacing-2)] text-right">LAST REPORT</th>
                    <th className="text-xs font-medium text-[var(--color-text-secondary)] pb-[var(--spacing-2)] text-right">DAYS AGO</th>
                  </tr>
                </thead>
                <tbody>
                  {data.churnRisk.map((user) => (
                    <tr key={user.id} className="border-t border-[var(--color-border)]">
                      <td className="py-[var(--spacing-2)]">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="text-sm font-medium text-[var(--color-accent,var(--color-primary))] hover:underline"
                        >
                          {user.name}
                        </Link>
                      </td>
                      <td className="py-[var(--spacing-2)] text-sm text-[var(--color-text-secondary)]">{user.email}</td>
                      <td className="py-[var(--spacing-2)] text-sm text-[var(--color-text-secondary)] text-right">
                        {formatDateShort(user.lastReportDate)}
                      </td>
                      <td className="py-[var(--spacing-2)] text-sm text-[var(--color-text)] text-right font-medium">
                        {user.daysSinceLastReport}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-[var(--color-text-secondary)]">No at-risk users detected.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function KpiCard({ label, value, subtitle, color }: { label: string; value: string; subtitle?: string; color?: string }) {
  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] p-[var(--spacing-4)]">
      <p className="text-xs text-[var(--color-text-secondary)] font-[family-name:var(--font-sans)]">{label}</p>
      <p
        className="text-xl font-semibold mt-1 font-[family-name:var(--font-sans)]"
        style={{ color: color || "var(--color-text)" }}
      >
        {value}
      </p>
      {subtitle && (
        <p className="text-xs text-[var(--color-text-secondary)] font-[family-name:var(--font-sans)]">{subtitle}</p>
      )}
    </div>
  );
}

function SignupChart({ data }: { data: SignupEntry[] }) {
  if (data.length === 0) return null;

  const maxVal = Math.max(...data.map((d) => d.count), 1);
  const chartWidth = 720;
  const chartHeight = 240;
  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const xScale = (i: number) => padding.left + (i / Math.max(data.length - 1, 1)) * innerWidth;
  const yScale = (v: number) => padding.top + innerHeight - (v / maxVal) * innerHeight;

  const linePath = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${xScale(i).toFixed(1)} ${yScale(d.count).toFixed(1)}`)
    .join(" ");

  // Y-axis labels
  const yTicks = [0, Math.round(maxVal / 2), maxVal];

  // X-axis labels
  const xLabelCount = Math.min(data.length, 5);
  const xLabelIndices = Array.from({ length: xLabelCount }, (_, i) =>
    Math.round((i / Math.max(xLabelCount - 1, 1)) * (data.length - 1))
  );

  return (
    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto" role="img" aria-label="Signup trend line chart">
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

      {/* Line */}
      <path d={linePath} fill="none" stroke="var(--color-accent,var(--color-primary))" strokeWidth="2" />

      {/* Dots */}
      {data.map((d, i) => (
        <circle
          key={i}
          cx={xScale(i)}
          cy={yScale(d.count)}
          r="3"
          fill="var(--color-accent,var(--color-primary))"
        />
      ))}
    </svg>
  );
}

function formatChartDate(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function formatDateShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}
