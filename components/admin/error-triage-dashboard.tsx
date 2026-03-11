"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import type { ErrorTriageResponse } from "@/app/api/admin/reports/errors/route";

type DateRange = "all" | "today" | "7d" | "30d" | "90d";
type SortField = "failedAt" | "title" | "failingAgent";
type SortDir = "asc" | "desc";

const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

function formatDateTime(iso: string | null): string {
  if (!iso) return "\u2014";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const PAGE_SIZE = 20;

export function ErrorTriageDashboard() {
  const [data, setData] = useState<ErrorTriageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [agentFilter, setAgentFilter] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [sortBy, setSortBy] = useState<SortField>("failedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showStacks, setShowStacks] = useState<Set<string>>(new Set());

  const fetchErrors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (agentFilter) params.set("failingAgent", agentFilter);
      if (dateRange !== "all") params.set("dateRange", dateRange);
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortDir);
      params.set("page", String(page));
      params.set("pageSize", String(PAGE_SIZE));

      const res = await fetch(`/api/admin/reports/errors?${params.toString()}`);
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [search, agentFilter, dateRange, sortBy, sortDir, page]);

  useEffect(() => {
    fetchErrors();
  }, [fetchErrors]);

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

  const toggleExpand = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleStack = (id: string) => {
    setShowStacks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;
  const showFrom = data && data.total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const showTo = data ? Math.min(page * PAGE_SIZE, data.total) : 0;

  const sortArrow = (field: SortField) => {
    if (sortBy !== field) return "";
    return sortDir === "desc" ? " \u2193" : " \u2191";
  };

  const retryPercent = data?.summary
    ? data.summary.retryRate.total > 0
      ? Math.round((data.summary.retryRate.retried / data.summary.retryRate.total) * 100)
      : 0
    : 0;

  return (
    <div
      style={{
        padding: "var(--spacing-6)",
        fontFamily: "var(--font-sans)",
        maxWidth: 1400,
      }}
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
              fontWeight: "var(--font-semibold)",
              color: "var(--color-text)",
              margin: 0,
            }}
          >
            Error Triage
          </h1>
          <p
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--color-text-secondary)",
              margin: "var(--spacing-1) 0 0",
            }}
          >
            Failed reports requiring attention
          </p>
        </div>
        <input
          type="text"
          placeholder="Search errors..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{
            padding: "var(--spacing-2) var(--spacing-3)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            fontSize: "var(--text-sm)",
            width: 280,
            outline: "none",
            background: "var(--color-surface)",
            color: "var(--color-text)",
          }}
        />
      </div>

      {/* Summary cards */}
      {data?.summary && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr",
            gap: "var(--spacing-4)",
            marginBottom: "var(--spacing-5)",
          }}
        >
          <div
            style={{
              padding: "var(--spacing-4)",
              background: "var(--color-surface)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
            }}
          >
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", margin: 0, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Total Errors
            </p>
            <p style={{ fontSize: "var(--text-2xl)", fontWeight: "var(--font-semibold)", color: "var(--color-error)", margin: "var(--spacing-1) 0 0" }}>
              {data.summary.totalErrors}
            </p>
          </div>
          <div
            style={{
              padding: "var(--spacing-4)",
              background: "var(--color-surface)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
            }}
          >
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", margin: 0, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Errors Today
            </p>
            <p style={{ fontSize: "var(--text-2xl)", fontWeight: "var(--font-semibold)", color: "var(--color-text)", margin: "var(--spacing-1) 0 0" }}>
              {data.summary.errorsToday}
            </p>
          </div>
          <div
            style={{
              padding: "var(--spacing-4)",
              background: "var(--color-surface)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
            }}
          >
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", margin: 0, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Most Failing Agent
            </p>
            <p style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-semibold)", color: "var(--color-text)", margin: "var(--spacing-1) 0 0" }}>
              {data.summary.mostFailingAgent?.agent ?? "\u2014"}
            </p>
            {data.summary.mostFailingAgent && (
              <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", margin: 0 }}>
                {data.summary.mostFailingAgent.count} failure{data.summary.mostFailingAgent.count !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <div
            style={{
              padding: "var(--spacing-4)",
              background: "var(--color-surface)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
            }}
          >
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", margin: 0, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Retry Rate
            </p>
            <p style={{ fontSize: "var(--text-2xl)", fontWeight: "var(--font-semibold)", color: "var(--color-text)", margin: "var(--spacing-1) 0 0" }}>
              {retryPercent}%
            </p>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", margin: 0 }}>
              {data.summary.retryRate.retried} of {data.summary.retryRate.total}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: "var(--spacing-3)",
          marginBottom: "var(--spacing-4)",
          alignItems: "center",
        }}
      >
        <label style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
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
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
            fontSize: "var(--text-sm)",
            background: "var(--color-surface)",
            color: "var(--color-text)",
          }}
        >
          <option value="">Failing Agent</option>
          {(data?.failingAgents ?? []).map((a) => (
            <option key={a} value={a}>
              {a}
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
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
            fontSize: "var(--text-sm)",
            background: "var(--color-surface)",
            color: "var(--color-text)",
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
            color: "var(--color-text-secondary)",
          }}
        >
          <p>Loading error triage data...</p>
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
          <p style={{ margin: 0 }}>Failed to load error data: {error}</p>
          <button
            onClick={fetchErrors}
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

      {/* Empty state */}
      {!loading && data && data.errors.length === 0 && data.summary.totalErrors === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "var(--spacing-10)",
            color: "var(--color-text-secondary)",
          }}
        >
          <p
            style={{
              fontSize: "var(--text-lg)",
              fontWeight: "var(--font-medium)",
              color: "var(--color-success)",
            }}
          >
            No failed reports
          </p>
          <p style={{ fontSize: "var(--text-sm)" }}>
            All pipeline runs have completed successfully. Keep it up!
          </p>
        </div>
      )}

      {/* Empty filtered state */}
      {!loading && data && data.errors.length === 0 && data.summary.totalErrors > 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "var(--spacing-10)",
            color: "var(--color-text-secondary)",
          }}
        >
          <p style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-medium)" }}>
            No errors match your filters
          </p>
          <button
            onClick={() => {
              setSearch("");
              setSearchInput("");
              setAgentFilter("");
              setDateRange("all");
              setPage(1);
            }}
            style={{
              marginTop: "var(--spacing-2)",
              padding: "var(--spacing-1) var(--spacing-3)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              background: "var(--color-surface)",
              color: "var(--color-primary)",
              cursor: "pointer",
              fontSize: "var(--text-sm)",
            }}
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Table */}
      {data && data.errors.length > 0 && (
        <>
          <div
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
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
                    borderBottom: "1px solid var(--color-border)",
                    background: "var(--color-background)",
                  }}
                >
                  <th style={{ padding: "var(--spacing-3) var(--spacing-4)", width: 32 }} />
                  <th
                    onClick={() => handleSort("title")}
                    style={{
                      padding: "var(--spacing-3) var(--spacing-4)",
                      textAlign: "left",
                      fontWeight: "var(--font-medium)",
                      color: "var(--color-text-secondary)",
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
                      color: "var(--color-text-secondary)",
                      fontSize: "var(--text-xs)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Agent
                  </th>
                  <th
                    onClick={() => handleSort("failingAgent")}
                    style={{
                      padding: "var(--spacing-3) var(--spacing-4)",
                      textAlign: "left",
                      fontWeight: "var(--font-medium)",
                      color: "var(--color-text-secondary)",
                      fontSize: "var(--text-xs)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    Failing Agent{sortArrow("failingAgent")}
                  </th>
                  <th
                    style={{
                      padding: "var(--spacing-3) var(--spacing-4)",
                      textAlign: "left",
                      fontWeight: "var(--font-medium)",
                      color: "var(--color-text-secondary)",
                      fontSize: "var(--text-xs)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Error
                  </th>
                  <th
                    onClick={() => handleSort("failedAt")}
                    style={{
                      padding: "var(--spacing-3) var(--spacing-4)",
                      textAlign: "left",
                      fontWeight: "var(--font-medium)",
                      color: "var(--color-text-secondary)",
                      fontSize: "var(--text-xs)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    Failed At{sortArrow("failedAt")}
                  </th>
                  <th
                    style={{
                      padding: "var(--spacing-3) var(--spacing-4)",
                      textAlign: "center",
                      fontWeight: "var(--font-medium)",
                      color: "var(--color-text-secondary)",
                      fontSize: "var(--text-xs)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Retried
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.errors.map((err) => {
                  const isExpanded = expandedRows.has(err.id);
                  const isStackShown = showStacks.has(err.id);
                  const errorMsg = err.errorMessage.length > 50
                    ? err.errorMessage.slice(0, 47) + "..."
                    : err.errorMessage;

                  return (
                    <React.Fragment key={err.id}>
                      <tr
                        style={{
                          borderBottom: isExpanded ? "none" : "1px solid var(--color-border)",
                          transition: "background var(--duration-default, 150ms)",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.background = "var(--color-primary-light)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.background = "";
                        }}
                      >
                        <td
                          style={{ padding: "var(--spacing-3) var(--spacing-2)", textAlign: "center", cursor: "pointer" }}
                          onClick={() => toggleExpand(err.id)}
                        >
                          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                            {isExpanded ? "\u25BC" : "\u25B6"}
                          </span>
                        </td>
                        <td style={{ padding: "var(--spacing-3) var(--spacing-4)", fontWeight: "var(--font-medium)", color: "var(--color-text)" }}>
                          {err.title}
                        </td>
                        <td style={{ padding: "var(--spacing-3) var(--spacing-4)", color: "var(--color-text)" }}>
                          <div>{err.userName}</div>
                          {err.userCompany && (
                            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                              {err.userCompany}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "var(--spacing-3) var(--spacing-4)" }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "2px var(--spacing-2)",
                              borderRadius: "var(--radius-sm)",
                              fontSize: "var(--text-xs)",
                              fontWeight: "var(--font-medium)",
                              color: "var(--color-error)",
                              background: "var(--color-error-light, rgba(239,68,68,0.1))",
                            }}
                          >
                            {err.failingAgent}
                          </span>
                        </td>
                        <td style={{ padding: "var(--spacing-3) var(--spacing-4)", color: "var(--color-text-secondary)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {errorMsg}
                        </td>
                        <td style={{ padding: "var(--spacing-3) var(--spacing-4)", color: "var(--color-text-secondary)" }}>
                          {formatDateTime(err.failedAt)}
                        </td>
                        <td style={{ padding: "var(--spacing-3) var(--spacing-4)", textAlign: "center" }}>
                          {err.retriedAt ? (
                            <span title={`Retried ${formatDateTime(err.retriedAt)}${err.retriedBy ? ` by ${err.retriedBy}` : ""}`} style={{ color: "var(--color-success)" }}>
                              \u2713
                            </span>
                          ) : (
                            <span style={{ color: "var(--color-text-tertiary)" }}>\u2014</span>
                          )}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${err.id}-detail`} style={{ borderBottom: "1px solid var(--color-border)" }}>
                          <td colSpan={7} style={{ padding: 0 }}>
                            <div
                              style={{
                                padding: "var(--spacing-4) var(--spacing-6)",
                                background: "var(--color-error-light, rgba(239,68,68,0.03))",
                                borderTop: "1px solid var(--color-border)",
                                fontSize: "var(--text-sm)",
                              }}
                            >
                              <p style={{ margin: "0 0 var(--spacing-1) 0", color: "var(--color-text)" }}>
                                <strong>Error:</strong> {err.errorMessage}
                              </p>
                              {err.stageIndex !== null && err.totalStages !== null && (
                                <p style={{ margin: "0 0 var(--spacing-1) 0", color: "var(--color-text-secondary)" }}>
                                  <strong>Stage:</strong> {err.stageIndex + 1} of {err.totalStages}
                                </p>
                              )}
                              {err.stack && (
                                <>
                                  <button
                                    onClick={() => toggleStack(err.id)}
                                    style={{
                                      background: "none",
                                      border: "none",
                                      color: "var(--color-primary)",
                                      cursor: "pointer",
                                      fontSize: "var(--text-xs)",
                                      padding: 0,
                                      marginTop: "var(--spacing-1)",
                                    }}
                                  >
                                    {isStackShown ? "\u25BC Hide Stack Trace" : "\u25B6 Show Stack Trace"}
                                  </button>
                                  {isStackShown && (
                                    <pre
                                      style={{
                                        marginTop: "var(--spacing-2)",
                                        padding: "var(--spacing-3)",
                                        background: "var(--color-background, #f8f9fa)",
                                        borderRadius: "var(--radius-sm)",
                                        fontSize: "var(--text-xs)",
                                        fontFamily: "monospace",
                                        overflow: "auto",
                                        maxHeight: 200,
                                        whiteSpace: "pre-wrap",
                                        wordBreak: "break-all",
                                      }}
                                    >
                                      {err.stack}
                                    </pre>
                                  )}
                                </>
                              )}
                              {err.previousErrors.length > 0 && (
                                <div style={{ marginTop: "var(--spacing-2)" }}>
                                  <p style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "var(--spacing-1)" }}>
                                    Previous Errors:
                                  </p>
                                  {err.previousErrors.map((pe, i) => (
                                    <p key={i} style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", margin: "0 0 2px 0" }}>
                                      \u00b7 {pe.agent}: {pe.message} ({formatDateTime(pe.occurredAt)})
                                    </p>
                                  ))}
                                </div>
                              )}
                              {err.retriedAt && (
                                <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", marginTop: "var(--spacing-2)" }}>
                                  Retried at {formatDateTime(err.retriedAt)}{err.retriedBy ? ` by ${err.retriedBy}` : ""}
                                </p>
                              )}
                              <div style={{ marginTop: "var(--spacing-3)" }}>
                                <Link
                                  href={`/admin/reports/${err.id}`}
                                  style={{
                                    padding: "var(--spacing-1) var(--spacing-3)",
                                    border: "1px solid var(--color-primary)",
                                    borderRadius: "var(--radius-sm)",
                                    fontSize: "var(--text-xs)",
                                    color: "var(--color-primary)",
                                    textDecoration: "none",
                                    fontWeight: "var(--font-medium)",
                                  }}
                                >
                                  View Report
                                </Link>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
              color: "var(--color-text-secondary)",
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
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--color-surface)",
                  color: page <= 1 ? "var(--color-text-tertiary)" : "var(--color-text)",
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
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--color-surface)",
                  color: page >= totalPages ? "var(--color-text-tertiary)" : "var(--color-text)",
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
