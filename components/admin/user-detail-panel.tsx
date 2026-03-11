"use client";

import { useEffect, useState, useCallback } from "react";
import type { UserDetailResponse } from "@/app/api/admin/users/[id]/route";

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

const TIER_LABELS: Record<string, string> = {
  luxury: "Luxury",
  high_luxury: "High Luxury",
  ultra_luxury: "Ultra Luxury",
};

function formatDate(iso: string | null): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatPrice(price: number): string {
  if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(0)}M+`;
  if (price >= 1_000) return `$${(price / 1_000).toFixed(0)}K+`;
  return `$${price}+`;
}

export function UserDetailPanel({ userId }: { userId: string }) {
  const [data, setData] = useState<UserDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      if (res.status === 404) {
        setError("User not found");
        return;
      }
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const handleStatusAction = useCallback(async (action: "suspend" | "unsuspend") => {
    setActionLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update status");
      }
      setActionMessage({
        type: "success",
        text: action === "suspend" ? "Account suspended" : "Account unsuspended",
      });
      setShowConfirm(false);
      // Refresh data to reflect new status
      await fetchDetail();
    } catch (err) {
      setActionMessage({ type: "error", text: (err as Error).message });
    } finally {
      setActionLoading(false);
    }
  }, [userId, fetchDetail]);

  const handleDelete = useCallback(async () => {
    setActionLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/delete`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete account");
      }
      setActionMessage({ type: "success", text: "Account deleted" });
      setShowDeleteConfirm(false);
      await fetchDetail();
    } catch (err) {
      setActionMessage({ type: "error", text: (err as Error).message });
    } finally {
      setActionLoading(false);
    }
  }, [userId, fetchDetail]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  if (loading) {
    return (
      <div
        style={{
          padding: "var(--spacing-6)",
          fontFamily: "var(--font-sans)",
          maxWidth: 1000,
        }}
      >
        <BackLink />
        <div
          style={{
            textAlign: "center",
            padding: "var(--spacing-10)",
            color: "var(--color-text-secondary)",
          }}
        >
          <p>Loading user details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: "var(--spacing-6)",
          fontFamily: "var(--font-sans)",
          maxWidth: 1000,
        }}
      >
        <BackLink />
        <div
          style={{
            padding: "var(--spacing-4)",
            background: "var(--color-error-light, rgba(239,68,68,0.1))",
            border: "1px solid var(--color-error)",
            borderRadius: "var(--radius-md)",
            color: "var(--color-error)",
            marginTop: "var(--spacing-4)",
          }}
        >
          <p style={{ margin: 0 }}>{error}</p>
          {error !== "User not found" && (
            <button
              onClick={fetchDetail}
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
          )}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { user, reportCounts, markets, activity } = data;
  const statusStyle = STATUS_COLORS[user.status] || STATUS_COLORS.active;

  return (
    <div
      style={{
        padding: "var(--spacing-6)",
        fontFamily: "var(--font-sans)",
        maxWidth: 1000,
      }}
    >
      <BackLink />

      {/* Profile Card */}
      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          padding: "var(--spacing-5)",
          marginTop: "var(--spacing-4)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
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
              {user.name}
            </h1>
            <p
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--color-text-secondary)",
                margin: "var(--spacing-1) 0 0",
              }}
            >
              {user.email}
            </p>
            {user.company && (
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  color: "var(--color-text-secondary)",
                  margin: "var(--spacing-1) 0 0",
                }}
              >
                {user.company}
              </p>
            )}
            {(user.title || user.phone) && (
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  color: "var(--color-text-secondary)",
                  margin: "var(--spacing-1) 0 0",
                }}
              >
                {[user.title, user.phone].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
          <span
            style={{
              display: "inline-block",
              padding: "2px var(--spacing-2)",
              borderRadius: "var(--radius-sm)",
              fontSize: "var(--text-xs)",
              fontWeight: "var(--font-medium)",
              color: statusStyle.color,
              background: statusStyle.bg,
              textTransform: "uppercase",
            }}
          >
            {user.status}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            gap: "var(--spacing-6)",
            marginTop: "var(--spacing-4)",
            fontSize: "var(--text-sm)",
            color: "var(--color-text-secondary)",
          }}
        >
          <span>Created: {formatDate(user.createdAt)}</span>
          <span>Last Login: {formatDate(user.lastLoginAt)}</span>
          {user.suspendedAt && (
            <span>Suspended: {formatDate(user.suspendedAt)}</span>
          )}
          {user.deletedAt && (
            <span>Deleted: {formatDate(user.deletedAt)}</span>
          )}
        </div>

        {/* Action Message */}
        {actionMessage && (
          <div
            style={{
              marginTop: "var(--spacing-3)",
              padding: "var(--spacing-2) var(--spacing-3)",
              borderRadius: "var(--radius-sm)",
              fontSize: "var(--text-sm)",
              color: actionMessage.type === "success" ? "var(--color-success)" : "var(--color-error)",
              background: actionMessage.type === "success"
                ? "var(--color-success-light, rgba(34,197,94,0.1))"
                : "var(--color-error-light, rgba(239,68,68,0.1))",
            }}
          >
            {actionMessage.text}
          </div>
        )}

        {/* Suspend / Unsuspend Actions */}
        {!data.isOwnAccount && user.status !== "deleted" && (
          <div style={{ marginTop: "var(--spacing-4)" }}>
            {user.status === "active" && !showConfirm && (
              <button
                onClick={() => setShowConfirm(true)}
                style={{
                  padding: "var(--spacing-2) var(--spacing-4)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-warning)",
                  background: "var(--color-warning-light, rgba(234,179,8,0.1))",
                  color: "var(--color-warning)",
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-medium)",
                  cursor: "pointer",
                }}
              >
                Suspend Account
              </button>
            )}

            {user.status === "active" && showConfirm && (
              <div
                style={{
                  padding: "var(--spacing-4)",
                  background: "var(--color-warning-light, rgba(234,179,8,0.05))",
                  border: "1px solid var(--color-warning)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <p style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: "var(--font-semibold)", color: "var(--color-text)" }}>
                  Suspend Account
                </p>
                <p style={{ margin: "var(--spacing-2) 0 0", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                  Are you sure you want to suspend {user.name}&apos;s account? They will be unable to access the platform until unsuspended.
                </p>
                <div style={{ display: "flex", gap: "var(--spacing-2)", marginTop: "var(--spacing-3)" }}>
                  <button
                    onClick={() => setShowConfirm(false)}
                    disabled={actionLoading}
                    style={{
                      padding: "var(--spacing-1) var(--spacing-3)",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-border)",
                      background: "var(--color-surface)",
                      color: "var(--color-text-secondary)",
                      fontSize: "var(--text-sm)",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleStatusAction("suspend")}
                    disabled={actionLoading}
                    style={{
                      padding: "var(--spacing-1) var(--spacing-3)",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-warning)",
                      background: "var(--color-warning)",
                      color: "#fff",
                      fontSize: "var(--text-sm)",
                      fontWeight: "var(--font-medium)",
                      cursor: actionLoading ? "not-allowed" : "pointer",
                      opacity: actionLoading ? 0.6 : 1,
                    }}
                  >
                    {actionLoading ? "Suspending..." : "Suspend Account"}
                  </button>
                </div>
              </div>
            )}

            {user.status === "suspended" && (
              <button
                onClick={() => handleStatusAction("unsuspend")}
                disabled={actionLoading}
                style={{
                  padding: "var(--spacing-2) var(--spacing-4)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-primary)",
                  background: "var(--color-primary)",
                  color: "#fff",
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-medium)",
                  cursor: actionLoading ? "not-allowed" : "pointer",
                  opacity: actionLoading ? 0.6 : 1,
                }}
              >
                {actionLoading ? "Unsuspending..." : "Unsuspend Account"}
              </button>
            )}

            {/* Delete Account Button */}
            {!showDeleteConfirm && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                style={{
                  padding: "var(--spacing-2) var(--spacing-4)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-error)",
                  background: "var(--color-error-light, rgba(239,68,68,0.1))",
                  color: "var(--color-error)",
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-medium)",
                  cursor: "pointer",
                  marginLeft: "var(--spacing-2)",
                }}
              >
                Delete Account
              </button>
            )}

            {/* Delete Confirmation Dialog */}
            {showDeleteConfirm && (
              <div
                style={{
                  padding: "var(--spacing-4)",
                  background: "var(--color-error-light, rgba(239,68,68,0.05))",
                  border: "1px solid var(--color-error)",
                  borderRadius: "var(--radius-md)",
                  marginTop: "var(--spacing-3)",
                }}
              >
                <p style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: "var(--font-semibold)", color: "var(--color-text)" }}>
                  Delete Account
                </p>
                <p style={{ margin: "var(--spacing-2) 0 0", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                  This will permanently delete {user.name}&apos;s account. Their reports will be kept for analytics but de-linked from their profile.
                </p>
                <p style={{ margin: "var(--spacing-2) 0 0", fontSize: "var(--text-sm)", color: "var(--color-error)", fontWeight: "var(--font-medium)" }}>
                  This action cannot be undone.
                </p>
                <div style={{ display: "flex", gap: "var(--spacing-2)", marginTop: "var(--spacing-3)" }}>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={actionLoading}
                    style={{
                      padding: "var(--spacing-1) var(--spacing-3)",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-border)",
                      background: "var(--color-surface)",
                      color: "var(--color-text-secondary)",
                      fontSize: "var(--text-sm)",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={actionLoading}
                    style={{
                      padding: "var(--spacing-1) var(--spacing-3)",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-error)",
                      background: "var(--color-error)",
                      color: "#fff",
                      fontSize: "var(--text-sm)",
                      fontWeight: "var(--font-medium)",
                      cursor: actionLoading ? "not-allowed" : "pointer",
                      opacity: actionLoading ? 0.6 : 1,
                    }}
                  >
                    {actionLoading ? "Deleting..." : "Delete Account"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "var(--spacing-4)",
          marginTop: "var(--spacing-4)",
        }}
      >
        <StatCard label="Reports" value={reportCounts.total} />
        <StatCard label="Markets" value={markets.length} />
        <StatCard label="Activity" value={activity.length} />
      </div>

      {/* Reports by Status */}
      {reportCounts.total > 0 && (
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: "var(--spacing-4)",
            marginTop: "var(--spacing-4)",
          }}
        >
          <h2
            style={{
              fontSize: "var(--text-sm)",
              fontWeight: "var(--font-semibold)",
              color: "var(--color-text)",
              margin: "0 0 var(--spacing-3)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Reports by Status
          </h2>
          <div
            style={{
              display: "flex",
              gap: "var(--spacing-6)",
              fontSize: "var(--text-sm)",
              color: "var(--color-text-secondary)",
            }}
          >
            <span>
              <strong style={{ color: "var(--color-success)" }}>
                {reportCounts.completed}
              </strong>{" "}
              Completed
            </span>
            <span>
              <strong style={{ color: "var(--color-error)" }}>
                {reportCounts.failed}
              </strong>{" "}
              Failed
            </span>
            <span>
              <strong style={{ color: "var(--color-warning)" }}>
                {reportCounts.generating}
              </strong>{" "}
              Generating
            </span>
            <span>
              <strong style={{ color: "var(--color-text-secondary)" }}>
                {reportCounts.queued}
              </strong>{" "}
              Queued
            </span>
          </div>
        </div>
      )}

      {/* Markets */}
      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          padding: "var(--spacing-4)",
          marginTop: "var(--spacing-4)",
        }}
      >
        <h2
          style={{
            fontSize: "var(--text-sm)",
            fontWeight: "var(--font-semibold)",
            color: "var(--color-text)",
            margin: "0 0 var(--spacing-3)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Markets
        </h2>
        {markets.length === 0 ? (
          <p
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--color-text-tertiary)",
              margin: 0,
            }}
          >
            No markets defined
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-2)" }}>
            {markets.map((m) => (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "var(--spacing-2) var(--spacing-3)",
                  background: "var(--color-background)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "var(--text-sm)",
                }}
              >
                <span style={{ color: "var(--color-text)" }}>
                  {m.city}, {m.state}
                </span>
                <span style={{ color: "var(--color-text-secondary)" }}>
                  {TIER_LABELS[m.luxuryTier] || m.luxuryTier} — {formatPrice(m.priceFloor)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity Timeline */}
      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          padding: "var(--spacing-4)",
          marginTop: "var(--spacing-4)",
        }}
      >
        <h2
          style={{
            fontSize: "var(--text-sm)",
            fontWeight: "var(--font-semibold)",
            color: "var(--color-text)",
            margin: "0 0 var(--spacing-3)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Recent Activity
        </h2>
        {activity.length === 0 ? (
          <p
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--color-text-tertiary)",
              margin: 0,
            }}
          >
            No activity recorded
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-2)" }}>
            {activity.map((entry) => (
              <div
                key={entry.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "var(--spacing-2) var(--spacing-3)",
                  background: "var(--color-background)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "var(--text-sm)",
                }}
              >
                <div style={{ display: "flex", gap: "var(--spacing-3)" }}>
                  <span
                    style={{
                      fontWeight: "var(--font-medium)",
                      color: "var(--color-text)",
                    }}
                  >
                    {entry.action}
                  </span>
                  <span style={{ color: "var(--color-text-secondary)" }}>
                    {entry.entityType}
                  </span>
                </div>
                <span style={{ color: "var(--color-text-tertiary)" }}>
                  {formatDateTime(entry.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <a
      href="/admin/users"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--spacing-1)",
        fontSize: "var(--text-sm)",
        color: "var(--color-primary)",
        textDecoration: "none",
        fontWeight: "var(--font-medium)",
      }}
    >
      ← Back to Users
    </a>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        padding: "var(--spacing-4)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: "var(--text-2xl)",
          fontWeight: "var(--font-semibold)",
          color: "var(--color-text)",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: "var(--text-sm)",
          color: "var(--color-text-secondary)",
          marginTop: "var(--spacing-1)",
        }}
      >
        {label}
      </div>
    </div>
  );
}
