"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { UserListResponse } from "@/app/api/admin/users/route";

type StatusFilter = "all" | "active" | "suspended" | "deleted";
type SortField = "lastLoginAt" | "createdAt" | "name" | "email";
type SortDir = "asc" | "desc";

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  active: {
    color: "var(--color-success)",
    bg: "var(--color-success-light, rgba(34,197,94,0.1))",
  },
  suspended: {
    color: "var(--color-warning)",
    bg: "var(--color-warning-light, rgba(234,179,8,0.1))",
  },
  deleted: {
    color: "var(--color-error)",
    bg: "var(--color-error-light, rgba(239,68,68,0.1))",
  },
};

function formatDate(iso: string | null): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const PAGE_SIZE = 20;

export function UserListDashboard() {
  const router = useRouter();
  const [data, setData] = useState<UserListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortField>("lastLoginAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  const fetchUsers = useCallback(async () => {
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

      const res = await fetch(`/api/admin/users?${params.toString()}`);
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
    fetchUsers();
  }, [fetchUsers]);

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

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;
  const showFrom = data && data.total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const showTo = data ? Math.min(page * PAGE_SIZE, data.total) : 0;

  const sortArrow = (field: SortField) => {
    if (sortBy !== field) return "";
    return sortDir === "desc" ? " \u2193" : " \u2191";
  };

  return (
    <div
      style={{
        padding: "var(--spacing-6)",
        fontFamily: "var(--font-sans)",
        maxWidth: 1200,
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
            Users
          </h1>
          <p
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--color-text-secondary)",
              margin: "var(--spacing-1) 0 0",
            }}
          >
            Manage platform accounts
          </p>
        </div>
        <div style={{ display: "flex", gap: "var(--spacing-3)", alignItems: "center" }}>
        <button
          onClick={() => router.push("/admin/users/create")}
          style={{
            padding: "var(--spacing-2) var(--spacing-4)",
            background: "var(--color-primary)",
            color: "#fff",
            border: "none",
            borderRadius: "var(--radius-md)",
            fontSize: "var(--text-sm)",
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "var(--font-sans)",
            whiteSpace: "nowrap",
          }}
        >
          + Add User
        </button>
        <input
          type="text"
          placeholder="Search by name or email..."
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
      </div>

      {/* Status filter tabs */}
      <div
        style={{
          display: "flex",
          gap: "var(--spacing-2)",
          marginBottom: "var(--spacing-4)",
        }}
      >
        {(["all", "active", "suspended", "deleted"] as StatusFilter[]).map(
          (s) => {
            const label = s.charAt(0).toUpperCase() + s.slice(1);
            const count = data?.counts[s] ?? 0;
            const isActive = statusFilter === s;
            return (
              <button
                key={s}
                onClick={() => handleStatusFilter(s)}
                style={{
                  padding: "var(--spacing-1) var(--spacing-3)",
                  border: `1px solid ${isActive ? "var(--color-primary)" : "var(--color-border)"}`,
                  borderRadius: "var(--radius-md)",
                  fontSize: "var(--text-sm)",
                  fontWeight: isActive ? "var(--font-semibold)" : "var(--font-normal)",
                  background: isActive ? "var(--color-primary-light)" : "var(--color-surface)",
                  color: isActive ? "var(--color-primary)" : "var(--color-text-secondary)",
                  cursor: "pointer",
                }}
              >
                {label} ({count})
              </button>
            );
          }
        )}
      </div>

      {/* Content */}
      {loading && !data && (
        <div
          style={{
            textAlign: "center",
            padding: "var(--spacing-10)",
            color: "var(--color-text-secondary)",
          }}
        >
          <p>Loading users...</p>
        </div>
      )}

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
          <p style={{ margin: 0 }}>{error}</p>
          <button
            onClick={fetchUsers}
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

      {data && data.users.length === 0 && !loading && (
        <div
          style={{
            textAlign: "center",
            padding: "var(--spacing-10)",
            color: "var(--color-text-secondary)",
          }}
        >
          <p style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-medium)" }}>
            No users found
          </p>
          <p style={{ fontSize: "var(--text-sm)" }}>
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}

      {data && data.users.length > 0 && (
        <>
          {/* Table */}
          <div
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
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
                  <th
                    onClick={() => handleSort("name")}
                    style={{
                      padding: "var(--spacing-3) var(--spacing-4)",
                      textAlign: "left",
                      fontWeight: "var(--font-medium)",
                      color: "var(--color-text-secondary)",
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    Name{sortArrow("name")}
                  </th>
                  <th
                    onClick={() => handleSort("email")}
                    style={{
                      padding: "var(--spacing-3) var(--spacing-4)",
                      textAlign: "left",
                      fontWeight: "var(--font-medium)",
                      color: "var(--color-text-secondary)",
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    Email{sortArrow("email")}
                  </th>
                  <th
                    style={{
                      padding: "var(--spacing-3) var(--spacing-4)",
                      textAlign: "left",
                      fontWeight: "var(--font-medium)",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    Company
                  </th>
                  <th
                    style={{
                      padding: "var(--spacing-3) var(--spacing-4)",
                      textAlign: "left",
                      fontWeight: "var(--font-medium)",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    Status
                  </th>
                  <th
                    onClick={() => handleSort("lastLoginAt")}
                    style={{
                      padding: "var(--spacing-3) var(--spacing-4)",
                      textAlign: "left",
                      fontWeight: "var(--font-medium)",
                      color: "var(--color-text-secondary)",
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    Last Login{sortArrow("lastLoginAt")}
                  </th>
                  <th
                    onClick={() => handleSort("createdAt")}
                    style={{
                      padding: "var(--spacing-3) var(--spacing-4)",
                      textAlign: "left",
                      fontWeight: "var(--font-medium)",
                      color: "var(--color-text-secondary)",
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    Created{sortArrow("createdAt")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((user) => {
                  const statusStyle = STATUS_COLORS[user.status] || STATUS_COLORS.active;
                  return (
                    <tr
                      key={user.id}
                      onClick={() => {
                        window.location.href = `/admin/users/${user.id}`;
                      }}
                      style={{
                        borderBottom: "1px solid var(--color-border)",
                        transition: "background var(--duration-default, 150ms)",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background =
                          "var(--color-primary-light)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "";
                      }}
                    >
                      <td
                        style={{
                          padding: "var(--spacing-3) var(--spacing-4)",
                          fontWeight: "var(--font-medium)",
                          color: "var(--color-text)",
                        }}
                      >
                        {user.name}
                      </td>
                      <td
                        style={{
                          padding: "var(--spacing-3) var(--spacing-4)",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        {user.email}
                      </td>
                      <td
                        style={{
                          padding: "var(--spacing-3) var(--spacing-4)",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        {user.company || "\u2014"}
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
                          }}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "var(--spacing-3) var(--spacing-4)",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        {formatDate(user.lastLoginAt)}
                      </td>
                      <td
                        style={{
                          padding: "var(--spacing-3) var(--spacing-4)",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        {formatDate(user.createdAt)}
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
