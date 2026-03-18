"use client";

import { useEffect, useState, useCallback } from "react";
import type { WaitlistResponse } from "@/app/api/admin/waitlist/route";

type StatusFilter = "all" | "pending" | "invited" | "joined";
type SortField = "createdAt" | "name" | "email" | "market" | "status";
type SortDir = "asc" | "desc";

const STATUS_COLORS: Record<string, { color: string; bg: string; label: string }> = {
  pending: {
    color: "var(--color-warning, #b8975a)",
    bg: "var(--color-warning-light, rgba(184,151,90,0.1))",
    label: "Pending",
  },
  invited: {
    color: "var(--color-info, #3b82f6)",
    bg: "var(--color-info-light, rgba(59,130,246,0.1))",
    label: "Invited",
  },
  joined: {
    color: "var(--color-success, #22c55e)",
    bg: "var(--color-success-light, rgba(34,197,94,0.1))",
    label: "Joined",
  },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const PAGE_SIZE = 20;

export function WaitlistDashboard() {
  const [data, setData] = useState<WaitlistResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      params.set("sortBy", sortBy);
      params.set("sortDir", sortDir);
      params.set("page", String(page));
      params.set("limit", String(PAGE_SIZE));

      const res = await fetch(`/api/admin/waitlist?${params.toString()}`);
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, sortBy, sortDir, page]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Debounce search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir("desc");
    }
  };

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  return (
    <div style={{ padding: "var(--spacing-6, 24px)" }}>
      {/* Header */}
      <div style={{ marginBottom: "var(--spacing-6, 24px)" }}>
        <h1
          style={{
            fontFamily: "var(--font-heading, Georgia, serif)",
            fontSize: "var(--text-2xl, 24px)",
            fontWeight: 600,
            color: "var(--color-text, #1a1a1a)",
            margin: 0,
          }}
        >
          Waitlist
        </h1>
        <p
          style={{
            fontSize: "var(--text-sm, 14px)",
            color: "var(--color-text-secondary, #6b7280)",
            marginTop: "var(--spacing-1, 4px)",
          }}
        >
          {data ? `${data.total} total signups` : "Loading..."}
        </p>
      </div>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: "var(--spacing-3, 12px)",
          marginBottom: "var(--spacing-4, 16px)",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <input
          type="text"
          placeholder="Search by name, email, or market..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{
            flex: "1 1 240px",
            padding: "var(--spacing-2, 8px) var(--spacing-3, 12px)",
            border: "1px solid var(--color-border, #e5e7eb)",
            borderRadius: "var(--radius-sm, 6px)",
            fontSize: "var(--text-sm, 14px)",
            fontFamily: "var(--font-sans, sans-serif)",
            background: "var(--color-surface, #fff)",
            color: "var(--color-text, #1a1a1a)",
            outline: "none",
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as StatusFilter);
            setPage(1);
          }}
          style={{
            padding: "var(--spacing-2, 8px) var(--spacing-3, 12px)",
            border: "1px solid var(--color-border, #e5e7eb)",
            borderRadius: "var(--radius-sm, 6px)",
            fontSize: "var(--text-sm, 14px)",
            fontFamily: "var(--font-sans, sans-serif)",
            background: "var(--color-surface, #fff)",
            color: "var(--color-text, #1a1a1a)",
          }}
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="invited">Invited</option>
          <option value="joined">Joined</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            padding: "var(--spacing-3, 12px)",
            background: "var(--color-error-light, rgba(239,68,68,0.1))",
            color: "var(--color-error, #ef4444)",
            borderRadius: "var(--radius-sm, 6px)",
            fontSize: "var(--text-sm, 14px)",
            marginBottom: "var(--spacing-4, 16px)",
          }}
        >
          {error}
        </div>
      )}

      {/* Table */}
      <div
        style={{
          border: "1px solid var(--color-border, #e5e7eb)",
          borderRadius: "var(--radius-md, 8px)",
          overflow: "auto",
          background: "var(--color-surface, #fff)",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "var(--text-sm, 14px)",
            fontFamily: "var(--font-sans, sans-serif)",
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: "1px solid var(--color-border, #e5e7eb)",
                background: "var(--color-background, #f9fafb)",
              }}
            >
              {[
                { field: "name" as SortField, label: "Name" },
                { field: "email" as SortField, label: "Email" },
                { field: "market" as SortField, label: "Market" },
                { field: "status" as SortField, label: "Status" },
                { field: "createdAt" as SortField, label: "Signed Up" },
              ].map(({ field, label }) => (
                <th
                  key={field}
                  onClick={() => toggleSort(field)}
                  style={{
                    padding: "var(--spacing-3, 12px)",
                    textAlign: "left",
                    fontWeight: 500,
                    color: "var(--color-text-secondary, #6b7280)",
                    cursor: "pointer",
                    userSelect: "none",
                    whiteSpace: "nowrap",
                    fontSize: "var(--text-xs, 12px)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {label}{" "}
                  {sortBy === field && (sortDir === "asc" ? "↑" : "↓")}
                </th>
              ))}
              <th
                style={{
                  padding: "var(--spacing-3, 12px)",
                  textAlign: "left",
                  fontWeight: 500,
                  color: "var(--color-text-secondary, #6b7280)",
                  fontSize: "var(--text-xs, 12px)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Phone
              </th>
              <th
                style={{
                  padding: "var(--spacing-3, 12px)",
                  textAlign: "left",
                  fontWeight: 500,
                  color: "var(--color-text-secondary, #6b7280)",
                  fontSize: "var(--text-xs, 12px)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Website
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && !data ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    padding: "var(--spacing-8, 32px)",
                    textAlign: "center",
                    color: "var(--color-text-secondary, #6b7280)",
                  }}
                >
                  Loading...
                </td>
              </tr>
            ) : data?.entries.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    padding: "var(--spacing-8, 32px)",
                    textAlign: "center",
                    color: "var(--color-text-secondary, #6b7280)",
                  }}
                >
                  No waitlist entries found
                </td>
              </tr>
            ) : (
              data?.entries.map((entry) => {
                const statusStyle = STATUS_COLORS[entry.status] || STATUS_COLORS.pending;
                return (
                  <tr
                    key={entry.id}
                    style={{
                      borderBottom: "1px solid var(--color-border, #e5e7eb)",
                    }}
                  >
                    <td
                      style={{
                        padding: "var(--spacing-3, 12px)",
                        fontWeight: 500,
                        color: "var(--color-text, #1a1a1a)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {entry.firstName} {entry.lastName}
                    </td>
                    <td
                      style={{
                        padding: "var(--spacing-3, 12px)",
                        color: "var(--color-text-secondary, #6b7280)",
                      }}
                    >
                      {entry.email}
                    </td>
                    <td
                      style={{
                        padding: "var(--spacing-3, 12px)",
                        color: "var(--color-text-secondary, #6b7280)",
                      }}
                    >
                      {entry.market}
                    </td>
                    <td style={{ padding: "var(--spacing-3, 12px)" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 10px",
                          borderRadius: "var(--radius-full, 9999px)",
                          fontSize: "var(--text-xs, 12px)",
                          fontWeight: 500,
                          color: statusStyle.color,
                          background: statusStyle.bg,
                        }}
                      >
                        {statusStyle.label}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "var(--spacing-3, 12px)",
                        color: "var(--color-text-secondary, #6b7280)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatDate(entry.createdAt)}
                    </td>
                    <td
                      style={{
                        padding: "var(--spacing-3, 12px)",
                        color: "var(--color-text-secondary, #6b7280)",
                      }}
                    >
                      {entry.phone || "—"}
                    </td>
                    <td
                      style={{
                        padding: "var(--spacing-3, 12px)",
                        color: "var(--color-text-secondary, #6b7280)",
                      }}
                    >
                      {entry.website ? (
                        <a
                          href={entry.website.startsWith("http") ? entry.website : `https://${entry.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "var(--color-primary, #3b82f6)" }}
                        >
                          {entry.website}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "var(--spacing-4, 16px)",
            fontSize: "var(--text-sm, 14px)",
            color: "var(--color-text-secondary, #6b7280)",
          }}
        >
          <span>
            Page {page} of {totalPages}
          </span>
          <div style={{ display: "flex", gap: "var(--spacing-2, 8px)" }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding: "var(--spacing-2, 8px) var(--spacing-3, 12px)",
                border: "1px solid var(--color-border, #e5e7eb)",
                borderRadius: "var(--radius-sm, 6px)",
                background: "var(--color-surface, #fff)",
                cursor: page === 1 ? "not-allowed" : "pointer",
                opacity: page === 1 ? 0.5 : 1,
                fontFamily: "var(--font-sans, sans-serif)",
                fontSize: "var(--text-sm, 14px)",
              }}
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                padding: "var(--spacing-2, 8px) var(--spacing-3, 12px)",
                border: "1px solid var(--color-border, #e5e7eb)",
                borderRadius: "var(--radius-sm, 6px)",
                background: "var(--color-surface, #fff)",
                cursor: page === totalPages ? "not-allowed" : "pointer",
                opacity: page === totalPages ? 0.5 : 1,
                fontFamily: "var(--font-sans, sans-serif)",
                fontSize: "var(--text-sm, 14px)",
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
