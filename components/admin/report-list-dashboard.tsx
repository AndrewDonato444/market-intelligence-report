"use client";

import { useEffect, useState, useCallback } from "react";
import type { ReportListResponse } from "@/app/api/admin/reports/route";

type StatusFilter = "all" | "completed" | "generating" | "queued" | "failed";
type SortField = "title" | "status" | "createdAt" | "generationTime";
type SortDir = "asc" | "desc";
type DateRange = "all" | "today" | "7d" | "30d" | "90d";

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  completed: {
    color: "var(--color-success)",
    bg: "var(--color-success-light, rgba(34,197,94,0.1))",
  },
  generating: {
    color: "var(--color-warning)",
    bg: "var(--color-warning-light, rgba(234,179,8,0.1))",
  },
  queued: {
    color: "var(--color-app-text-secondary)",
    bg: "var(--color-app-active-bg, rgba(59,130,246,0.1))",
  },
  failed: {
    color: "var(--color-error)",
    bg: "var(--color-error-light, rgba(239,68,68,0.1))",
  },
};

const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

function formatDate(iso: string | null): string {
  if (!iso) return "\u2014";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatGenerationTime(ms: number | null): string {
  if (ms === null) return "\u2014";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function formatElapsedTime(startedAt: string | null): string {
  if (!startedAt) return "\u2014";
  const elapsed = Date.now() - new Date(startedAt).getTime();
  return formatGenerationTime(elapsed) + " elapsed";
}

const PAGE_SIZE = 20;

export function ReportListDashboard() {
  const [data, setData] = useState<ReportListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [agentFilter, setAgentFilter] = useState("");
  const [marketFilter, setMarketFilter] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (dateRange !== "all") params.set("dateRange", dateRange);
      if (agentFilter) params.set("userId", agentFilter);
      if (marketFilter) params.set("marketId", marketFilter);
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortDir);
      params.set("page", String(page));
      params.set("pageSize", String(PAGE_SIZE));

      const res = await fetch(`/api/admin/reports?${params.toString()}`);
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, dateRange, agentFilter, marketFilter, sortBy, sortDir, page]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Debounce search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortBy(field);
      setSortDir("desc");
    }
    setPage(1);
  };

  const handleStatusFilter = (status: StatusFilter) => {
    setStatusFilter(status);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setSearchInput("");
    setStatusFilter("all");
    setDateRange("all");
    setAgentFilter("");
    setMarketFilter("");
    setPage(1);
  };

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;
  const showFrom = data && data.total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const showTo = data ? Math.min(page * PAGE_SIZE, data.total) : 0;

  const sortArrow = (field: SortField) => {
    if (sortBy !== field) return "";
    return sortDir === "desc" ? " \u2193" : " \u2191";
  };

  // Determine empty state type
  const hasActiveFilters =
    statusFilter !== "all" ||
    dateRange !== "all" ||
    search !== "" ||
    agentFilter !== "" ||
    marketFilter !== "";

  const isEmptyPlatform =
    data &&
    data.reports.length === 0 &&
    data.statusCounts.all === 0;

  const isEmptyFiltered =
    data &&
    data.reports.length === 0 &&
    data.statusCounts.all > 0;

  // Extract unique agents and markets from response for filter dropdowns
  const uniqueAgents = data
    ? Array.from(
        new Map(
          data.reports.map((r) => [r.userId, { id: r.userId, name: r.userName }])
        ).values()
      )
    : [];

  const uniqueMarkets = data
    ? Array.from(
        new Map(
          data.reports.map((r) => [r.marketId, { id: r.marketId, name: r.marketName }])
        ).values()
      )
    : [];

  return (
    <div
      style={{
        padding: "var(--spacing-6)",
        fontFamily: "var(--font-body)",
        maxWidth: 1400,
      }}
      className="app-fade-in"
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "var(--spacing-5)",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "var(--text-2xl)",
              fontFamily: "var(--font-display)",
              fontWeight: "var(--font-semibold)",
              color: "var(--color-app-text)",
              margin: 0,
            }}
          >
            Report Registry
          </h1>
          <p
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--color-app-text-secondary)",
              margin: "var(--spacing-1) 0 0",
            }}
          >
            All reports across the platform
          </p>
        </div>
        <input
          type="text"
          placeholder="Search reports..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{
            padding: "var(--spacing-2) var(--spacing-3)",
            border: "1px solid var(--color-app-border)",
            borderRadius: "var(--radius-md)",
            fontSize: "var(--text-sm)",
            width: 280,
            outline: "none",
            background: "var(--color-app-surface)",
            color: "var(--color-app-text)",
          }}
        />
      </div>

      {/* Status filter tabs */}
      <div
        style={{
          display: "flex",
          gap: "var(--spacing-2)",
          marginBottom: "var(--spacing-4)",
        }}
      >
        {(
          ["all", "completed", "generating", "queued", "failed"] as StatusFilter[]
        ).map((s) => {
          const label = s.charAt(0).toUpperCase() + s.slice(1);
          const cnt = data?.statusCounts[s] ?? 0;
          const isActive = statusFilter === s;
          return (
            <button
              key={s}
              onClick={() => handleStatusFilter(s)}
              style={{
                padding: "var(--spacing-1) var(--spacing-3)",
                border: `1px solid ${isActive ? "var(--color-app-accent)" : "var(--color-app-border)"}`,
                borderRadius: "var(--radius-md)",
                fontSize: "var(--text-sm)",
                fontWeight: isActive
                  ? "var(--font-semibold)"
                  : "var(--font-normal)",
                background: isActive
                  ? "var(--color-app-active-bg)"
                  : "var(--color-app-surface)",
                color: isActive
                  ? "var(--color-app-accent)"
                  : "var(--color-app-text-secondary)",
                cursor: "pointer",
              }}
            >
              {label} ({cnt})
            </button>
          );
        })}
      </div>

      {/* Dropdown filters */}
      <div
        style={{
          display: "flex",
          gap: "var(--spacing-3)",
          marginBottom: "var(--spacing-4)",
          alignItems: "center",
        }}
      >
        <label style={{ fontSize: "var(--text-sm)", color: "var(--color-app-text-secondary)" }}>
          Filters:
        </label>
        <select
          value={agentFilter}
          onChange={(e) => {
            setAgentFilter(e.target.value);
            setPage(1);
          }}
          style={{
            padding: "var(--spacing-1) var(--spacing-2)",
            border: "1px solid var(--color-app-border)",
            borderRadius: "var(--radius-sm)",
            fontSize: "var(--text-sm)",
            background: "var(--color-app-surface)",
            color: "var(--color-app-text)",
          }}
        >
          <option value="">Agent</option>
          {uniqueAgents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <select
          value={marketFilter}
          onChange={(e) => {
            setMarketFilter(e.target.value);
            setPage(1);
          }}
          style={{
            padding: "var(--spacing-1) var(--spacing-2)",
            border: "1px solid var(--color-app-border)",
            borderRadius: "var(--radius-sm)",
            fontSize: "var(--text-sm)",
            background: "var(--color-app-surface)",
            color: "var(--color-app-text)",
          }}
        >
          <option value="">Market</option>
          {uniqueMarkets.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <select
          value={dateRange}
          onChange={(e) => {
            setDateRange(e.target.value as DateRange);
            setPage(1);
          }}
          style={{
            padding: "var(--spacing-1) var(--spacing-2)",
            border: "1px solid var(--color-app-border)",
            borderRadius: "var(--radius-sm)",
            fontSize: "var(--text-sm)",
            background: "var(--color-app-surface)",
            color: "var(--color-app-text)",
          }}
        >
          {DATE_RANGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Loading state */}
      {loading && !data && (
        <div
          style={{
            textAlign: "center",
            padding: "var(--spacing-10)",
            color: "var(--color-app-text-secondary)",
          }}
        >
          <p>Loading reports...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div
          style={{
            padding: "var(--spacing-4)",
            background: "var(--color-error-light, rgba(239,68,68,0.1))",
            border: "1px solid var(--color-error)",
            borderRadius: "var(--radius-md)",
            color: "var(--color-error)",
            marginBottom: "var(--spacing-4)",
          }}
        >
          <p style={{ margin: 0 }}>Failed to fetch reports: {error}</p>
          <button
            onClick={fetchReports}
            style={{
              marginTop: "var(--spacing-2)",
              padding: "var(--spacing-1) var(--spacing-3)",
              border: "1px solid var(--color-error)",
              borderRadius: "var(--radius-sm)",
              background: "transparent",
              color: "var(--color-error)",
              cursor: "pointer",
              fontSize: "var(--text-sm)",
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty state: no reports on platform */}
      {!loading && isEmptyPlatform && (
        <div
          style={{
            textAlign: "center",
            padding: "var(--spacing-10)",
            color: "var(--color-app-text-secondary)",
          }}
        >
          <p
            style={{
              fontSize: "var(--text-lg)",
              fontWeight: "var(--font-medium)",
            }}
          >
            No reports generated yet
          </p>
          <p style={{ fontSize: "var(--text-sm)" }}>
            Reports will appear here once users start generating market
            intelligence reports.
          </p>
        </div>
      )}

      {/* Empty state: filters match nothing */}
      {!loading && isEmptyFiltered && (
        <div
          style={{
            textAlign: "center",
            padding: "var(--spacing-10)",
            color: "var(--color-app-text-secondary)",
          }}
        >
          <p
            style={{
              fontSize: "var(--text-lg)",
              fontWeight: "var(--font-medium)",
            }}
          >
            No reports match your filters
          </p>
          <button
            onClick={clearFilters}
            style={{
              marginTop: "var(--spacing-2)",
              padding: "var(--spacing-1) var(--spacing-3)",
              border: "1px solid var(--color-app-border)",
              borderRadius: "var(--radius-sm)",
              background: "var(--color-app-surface)",
              color: "var(--color-app-accent)",
              cursor: "pointer",
              fontSize: "var(--text-sm)",
            }}
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Table */}
      {data && data.reports.length > 0 && (
        <>
          <div
            style={{
              background: "var(--color-app-surface)",
              border: "1px solid var(--color-app-border)",
              borderRadius: "var(--radius-md)",
              boxShadow: "var(--shadow-sm)",
              overflow: "hidden",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "var(--text-sm)",
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid var(--color-app-border)",
                    background: "var(--color-app-bg)",
                  }}
                >
                  <th
                    onClick={() => handleSort("title")}
                    style={{
                      padding: "var(--spacing-3) var(--spacing-4)",
                      textAlign: "left",
                      fontWeight: "var(--font-medium)",
                      color: "var(--color-app-text-secondary)",
                      fontSize: "var(--text-xs)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    Title{sortArrow("title")}
                  </th>
                  <th
                    style={{
                      padding: "var(--spacing-3) var(--spacing-4)",
                      textAlign: "left",
                      fontWeight: "var(--font-medium)",
                      color: "var(--color-app-text-secondary)",
                      fontSize: "var(--text-xs)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Agent
                  </th>
                  <th
                    style={{
                      padding: "var(--spacing-3) var(--spacing-4)",
                      textAlign: "left",
                      fontWeight: "var(--font-medium)",
                      color: "var(--color-app-text-secondary)",
                      fontSize: "var(--text-xs)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Market
                  </th>
                  <th
                    onClick={() => handleSort("status")}
                    style={{
                      padding: "var(--spacing-3) var(--spacing-4)",
                      textAlign: "left",
                      fontWeight: "var(--font-medium)",
                      color: "var(--color-app-text-secondary)",
                      fontSize: "var(--text-xs)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    Status{sortArrow("status")}
                  </th>
                  <th
                    onClick={() => handleSort("createdAt")}
                    style={{
                      padding: "var(--spacing-3) var(--spacing-4)",
                      textAlign: "left",
                      fontWeight: "var(--font-medium)",
                      color: "var(--color-app-text-secondary)",
                      fontSize: "var(--text-xs)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    Created{sortArrow("createdAt")}
                  </th>
                  <th
                    onClick={() => handleSort("generationTime")}
                    style={{
                      padding: "var(--spacing-3) var(--spacing-4)",
                      textAlign: "left",
                      fontWeight: "var(--font-medium)",
                      color: "var(--color-app-text-secondary)",
                      fontSize: "var(--text-xs)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    Gen Time{sortArrow("generationTime")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.reports.map((report) => {
                  const statusStyle =
                    STATUS_COLORS[report.status] || STATUS_COLORS.queued;
                  return (
                    <tr
                      key={report.id}
                      onClick={() => {
                        window.location.href = `/admin/reports/${report.id}`;
                      }}
                      style={{
                        borderBottom: "1px solid var(--color-app-border)",
                        transition:
                          "background var(--duration-default, 150ms)",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background =
                          "var(--color-app-active-bg)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "";
                      }}
                    >
                      <td
                        style={{
                          padding: "var(--spacing-3) var(--spacing-4)",
                          fontWeight: "var(--font-medium)",
                          color: "var(--color-app-text)",
                        }}
                      >
                        <div>{report.title}</div>
                        {report.status === "failed" && report.errorSummary && (
                          <div
                            style={{
                              fontSize: "var(--text-xs)",
                              color: "var(--color-app-text-secondary)",
                              marginTop: "2px",
                            }}
                          >
                            {report.errorSummary}
                          </div>
                        )}
                      </td>
                      <td
                        style={{
                          padding: "var(--spacing-3) var(--spacing-4)",
                          color: "var(--color-app-text)",
                        }}
                      >
                        <div>{report.userName}</div>
                        {report.userCompany && (
                          <div
                            style={{
                              fontSize: "var(--text-xs)",
                              color: "var(--color-app-text-secondary)",
                            }}
                          >
                            {report.userCompany}
                          </div>
                        )}
                      </td>
                      <td
                        style={{
                          padding: "var(--spacing-3) var(--spacing-4)",
                          color: "var(--color-app-text-secondary)",
                        }}
                      >
                        {report.marketName}
                      </td>
                      <td
                        style={{
                          padding: "var(--spacing-3) var(--spacing-4)",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            padding: "2px var(--spacing-2)",
                            borderRadius: "var(--radius-sm)",
                            fontSize: "var(--text-xs)",
                            fontWeight: "var(--font-medium)",
                            color: statusStyle.color,
                            background: statusStyle.bg,
                            boxShadow: "var(--shadow-sm)",
                          }}
                        >
                          {report.status.charAt(0).toUpperCase() +
                            report.status.slice(1)}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "var(--spacing-3) var(--spacing-4)",
                          color: "var(--color-app-text-secondary)",
                        }}
                      >
                        {formatDate(report.createdAt)}
                      </td>
                      <td
                        style={{
                          padding: "var(--spacing-3) var(--spacing-4)",
                          color: "var(--color-app-text-secondary)",
                        }}
                      >
                        {report.status === "generating"
                          ? formatElapsedTime(report.generationStartedAt)
                          : formatGenerationTime(report.generationTimeMs)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "var(--spacing-4)",
              fontSize: "var(--text-sm)",
              color: "var(--color-app-text-secondary)",
            }}
          >
            <span>
              Showing {showFrom}&ndash;{showTo} of {data.total}
            </span>
            <div style={{ display: "flex", gap: "var(--spacing-2)" }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                style={{
                  padding: "var(--spacing-1) var(--spacing-3)",
                  border: "1px solid var(--color-app-border)",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--color-app-surface)",
                  color:
                    page <= 1
                      ? "var(--color-app-text-tertiary)"
                      : "var(--color-app-text)",
                  cursor: page <= 1 ? "default" : "pointer",
                  fontSize: "var(--text-sm)",
                }}
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                style={{
                  padding: "var(--spacing-1) var(--spacing-3)",
                  border: "1px solid var(--color-app-border)",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--color-app-surface)",
                  color:
                    page >= totalPages
                      ? "var(--color-app-text-tertiary)"
                      : "var(--color-app-text)",
                  cursor: page >= totalPages ? "default" : "pointer",
                  fontSize: "var(--text-sm)",
                }}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
