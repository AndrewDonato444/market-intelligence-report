"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import type { ReportDetailResponse } from "@/app/api/admin/reports/[id]/route";
import type { RetryResponse } from "@/app/api/admin/reports/[id]/retry/route";

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
    color: "var(--color-text-secondary)",
    bg: "var(--color-primary-light, rgba(15,23,42,0.05))",
  },
  failed: {
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
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDuration(ms: number | null): string {
  if (ms === null) return "—";
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

function formatResponseTime(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatPrice(price: number): string {
  if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(0)}M+`;
  if (price >= 1_000) return `$${(price / 1_000).toFixed(0)}K+`;
  return `$${price}+`;
}

export function ReportDetailPanel({ reportId }: { reportId: string }) {
  const [data, setData] = useState<ReportDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStack, setShowStack] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [showRetryConfirm, setShowRetryConfirm] = useState(false);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`);
      if (res.status === 404) {
        setError("Report not found");
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
  }, [reportId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleRetry = useCallback(async () => {
    setRetrying(true);
    setRetryError(null);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}/retry`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || `Failed: ${res.status}`);
      }
      setShowRetryConfirm(false);
      // Refresh the detail to show updated status
      await fetchDetail();
    } catch (err) {
      setRetryError((err as Error).message);
    } finally {
      setRetrying(false);
    }
  }, [reportId, fetchDetail]);

  if (loading) {
    return (
      <div style={{ padding: "var(--spacing-6)" }}>
        <div
          style={{
            marginBottom: "var(--spacing-6)",
            height: 20,
            width: 200,
            background: "var(--color-primary-light)",
            borderRadius: "var(--radius-sm)",
          }}
        />
        <div
          style={{
            height: 32,
            width: 400,
            background: "var(--color-primary-light)",
            borderRadius: "var(--radius-sm)",
            marginBottom: "var(--spacing-4)",
          }}
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--spacing-4)", marginBottom: "var(--spacing-6)" }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                height: 100,
                background: "var(--color-primary-light)",
                borderRadius: "var(--radius-md)",
              }}
            />
          ))}
        </div>
        <div
          style={{
            height: 200,
            background: "var(--color-primary-light)",
            borderRadius: "var(--radius-md)",
          }}
        />
      </div>
    );
  }

  if (error === "Report not found") {
    return (
      <div style={{ padding: "var(--spacing-6)" }}>
        <Link
          href="/admin/reports"
          style={{
            color: "var(--color-primary)",
            fontSize: "var(--text-sm)",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--spacing-1)",
            marginBottom: "var(--spacing-6)",
          }}
        >
          ← Back to Report Registry
        </Link>
        <div
          style={{
            textAlign: "center",
            padding: "var(--spacing-12)",
            background: "var(--color-surface)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border)",
          }}
        >
          <p style={{ fontSize: "var(--text-lg)", fontWeight: 600, color: "var(--color-text)", marginBottom: "var(--spacing-2)" }}>
            Report not found
          </p>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
            This report may have been deleted or the ID is invalid.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "var(--spacing-6)" }}>
        <Link
          href="/admin/reports"
          style={{
            color: "var(--color-primary)",
            fontSize: "var(--text-sm)",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--spacing-1)",
            marginBottom: "var(--spacing-6)",
          }}
        >
          ← Back to Report Registry
        </Link>
        <div
          style={{
            textAlign: "center",
            padding: "var(--spacing-8)",
            background: "var(--color-error-light, rgba(239,68,68,0.05))",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-error)",
          }}
        >
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-error)", marginBottom: "var(--spacing-3)" }}>
            {error}
          </p>
          <button
            onClick={fetchDetail}
            style={{
              padding: "var(--spacing-2) var(--spacing-4)",
              background: "var(--color-primary)",
              color: "white",
              border: "none",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
              fontSize: "var(--text-sm)",
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { report, user, market, sections, apiUsage, totalApiCost } = data;
  const statusStyle = STATUS_COLORS[report.status] || STATUS_COLORS.queued;

  return (
    <div style={{ padding: "var(--spacing-6)", maxWidth: 1100, margin: "0 auto" }}>
      {/* Back link */}
      <Link
        href="/admin/reports"
        style={{
          color: "var(--color-primary)",
          fontSize: "var(--text-sm)",
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: "var(--spacing-1)",
          marginBottom: "var(--spacing-6)",
        }}
      >
        ← Back to Report Registry
      </Link>

      {/* Title + status */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--spacing-2)" }}>
        <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 600, color: "var(--color-text)", margin: 0 }}>
          {report.title}
        </h1>
        <span
          style={{
            padding: "var(--spacing-1) var(--spacing-3)",
            borderRadius: "var(--radius-sm)",
            fontSize: "var(--text-xs)",
            fontWeight: 600,
            textTransform: "capitalize",
            color: statusStyle.color,
            background: statusStyle.bg,
            whiteSpace: "nowrap",
          }}
        >
          {report.status}
        </span>
      </div>
      <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", marginBottom: "var(--spacing-6)" }}>
        Created {formatDate(report.createdAt)} · Version {report.version}
      </p>

      {/* Info cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--spacing-4)", marginBottom: "var(--spacing-6)" }}>
        {/* Agent card */}
        <div
          style={{
            padding: "var(--spacing-4)",
            background: "var(--color-surface)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border)",
          }}
        >
          <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", marginBottom: "var(--spacing-2)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Agent
          </p>
          <p style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)", margin: 0 }}>
            {user.name}
          </p>
          {user.company && (
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", margin: 0 }}>
              {user.company}
            </p>
          )}
          <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", margin: 0 }}>
            {user.email}
          </p>
        </div>

        {/* Market card */}
        <div
          style={{
            padding: "var(--spacing-4)",
            background: "var(--color-surface)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border)",
          }}
        >
          <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", marginBottom: "var(--spacing-2)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Market
          </p>
          <p style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)", margin: 0 }}>
            {market.name}
          </p>
          <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", margin: 0 }}>
            {TIER_LABELS[market.luxuryTier] || market.luxuryTier} · {formatPrice(market.priceFloor)}
          </p>
        </div>

        {/* Generation time card */}
        <div
          style={{
            padding: "var(--spacing-4)",
            background: "var(--color-surface)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border)",
          }}
        >
          <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", marginBottom: "var(--spacing-2)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Generation Time
          </p>
          {report.status === "queued" ? (
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", margin: 0 }}>
              Not started yet
            </p>
          ) : (
            <>
              <p style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)", margin: 0 }}>
                {formatDuration(report.generationTimeMs)}
              </p>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", margin: 0 }}>
                Started {formatDateTime(report.generationStartedAt)}
              </p>
              {report.generationCompletedAt && (
                <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", margin: 0 }}>
                  Completed {formatDateTime(report.generationCompletedAt)}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Error details (failed reports only) */}
      {report.errorDetails && (
        <div
          style={{
            padding: "var(--spacing-4)",
            background: "var(--color-error-light, rgba(239,68,68,0.05))",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-error)",
            marginBottom: "var(--spacing-6)",
          }}
        >
          <p style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-error)", marginBottom: "var(--spacing-2)" }}>
            Error Details
          </p>
          <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text)" }}>
            <p style={{ margin: "0 0 var(--spacing-1) 0" }}>
              <strong>Agent:</strong> {report.errorDetails.agent}
            </p>
            <p style={{ margin: "0 0 var(--spacing-1) 0" }}>
              <strong>Error:</strong> {report.errorDetails.message}
            </p>
            <p style={{ margin: "0 0 var(--spacing-1) 0" }}>
              <strong>Occurred:</strong> {formatDateTime(report.errorDetails.occurredAt)}
            </p>
            {report.errorDetails.stageIndex !== undefined && report.errorDetails.totalStages !== undefined && (
              <p style={{ margin: "0 0 var(--spacing-1) 0" }}>
                <strong>Stage:</strong> {report.errorDetails.stageIndex + 1} of {report.errorDetails.totalStages}
              </p>
            )}
            {report.errorDetails.stack && (
              <>
                <button
                  onClick={() => setShowStack(!showStack)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--color-primary)",
                    cursor: "pointer",
                    fontSize: "var(--text-xs)",
                    padding: 0,
                    marginTop: "var(--spacing-2)",
                  }}
                >
                  {showStack ? "▼ Hide Stack Trace" : "▶ Show Stack Trace"}
                </button>
                {showStack && (
                  <pre
                    style={{
                      marginTop: "var(--spacing-2)",
                      padding: "var(--spacing-3)",
                      background: "var(--color-background, #f8f9fa)",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "var(--text-xs)",
                      fontFamily: "monospace",
                      overflow: "auto",
                      maxHeight: 300,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all",
                    }}
                  >
                    {report.errorDetails.stack}
                  </pre>
                )}
              </>
            )}
            {report.errorDetails.previousErrors && report.errorDetails.previousErrors.length > 0 && (
              <div style={{ marginTop: "var(--spacing-3)" }}>
                <p style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "var(--spacing-1)" }}>
                  Previous Errors:
                </p>
                {report.errorDetails.previousErrors.map((pe, i) => (
                  <p key={i} style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", margin: "0 0 2px 0" }}>
                    · {pe.agent}: {pe.message} ({formatDateTime(pe.occurredAt)})
                  </p>
                ))}
              </div>
            )}
          </div>
          {report.retriedAt && (
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", marginTop: "var(--spacing-2)" }}>
              Retried at {formatDateTime(report.retriedAt)}{report.retriedBy ? ` by ${report.retriedBy}` : ""}
            </p>
          )}
          {report.status === "failed" && !showRetryConfirm && (
            <button
              onClick={() => setShowRetryConfirm(true)}
              style={{
                marginTop: "var(--spacing-3)",
                padding: "var(--spacing-2) var(--spacing-4)",
                background: "var(--color-primary)",
                color: "white",
                border: "none",
                borderRadius: "var(--radius-sm)",
                cursor: "pointer",
                fontSize: "var(--text-sm)",
                fontWeight: 600,
              }}
            >
              Re-run Pipeline
            </button>
          )}
          {showRetryConfirm && (
            <div
              style={{
                marginTop: "var(--spacing-3)",
                padding: "var(--spacing-3)",
                background: "var(--color-surface)",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-border)",
              }}
            >
              <p style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)", margin: "0 0 var(--spacing-1) 0" }}>
                Re-run Pipeline?
              </p>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", margin: "0 0 var(--spacing-2) 0" }}>
                This will re-run the full pipeline for &quot;{report.title}&quot;
              </p>
              {report.errorDetails && (
                <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", margin: "0 0 var(--spacing-2) 0" }}>
                  Last error: {report.errorDetails.agent}: {report.errorDetails.message}
                </p>
              )}
              {retryError && (
                <p style={{ fontSize: "var(--text-xs)", color: "var(--color-error)", margin: "0 0 var(--spacing-2) 0" }}>
                  {retryError}
                </p>
              )}
              <div style={{ display: "flex", gap: "var(--spacing-2)" }}>
                <button
                  onClick={() => { setShowRetryConfirm(false); setRetryError(null); }}
                  disabled={retrying}
                  style={{
                    padding: "var(--spacing-1) var(--spacing-3)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--color-surface)",
                    color: "var(--color-text)",
                    cursor: retrying ? "default" : "pointer",
                    fontSize: "var(--text-sm)",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRetry}
                  disabled={retrying}
                  style={{
                    padding: "var(--spacing-1) var(--spacing-3)",
                    background: retrying ? "var(--color-text-secondary)" : "var(--color-primary)",
                    color: "white",
                    border: "none",
                    borderRadius: "var(--radius-sm)",
                    cursor: retrying ? "default" : "pointer",
                    fontSize: "var(--text-sm)",
                    fontWeight: 600,
                  }}
                >
                  {retrying ? "Re-running..." : "Re-run Pipeline"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Report sections */}
      <div
        style={{
          background: "var(--color-surface)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--color-border)",
          marginBottom: "var(--spacing-6)",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "var(--spacing-4)", borderBottom: "1px solid var(--color-border)" }}>
          <h2 style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--color-text)", margin: 0 }}>
            Report Sections ({sections.length})
          </h2>
        </div>
        {sections.length === 0 ? (
          <div style={{ padding: "var(--spacing-8)", textAlign: "center" }}>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
              {report.status === "queued" ? "No sections generated yet — report is queued." : "No sections found."}
            </p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                <th style={{ textAlign: "left", padding: "var(--spacing-3) var(--spacing-4)", fontSize: "var(--text-xs)", fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Section
                </th>
                <th style={{ textAlign: "left", padding: "var(--spacing-3) var(--spacing-4)", fontSize: "var(--text-xs)", fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Agent
                </th>
                <th style={{ textAlign: "left", padding: "var(--spacing-3) var(--spacing-4)", fontSize: "var(--text-xs)", fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Generated At
                </th>
              </tr>
            </thead>
            <tbody>
              {sections.map((section) => (
                <tr key={section.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "var(--spacing-3) var(--spacing-4)", fontSize: "var(--text-sm)", color: "var(--color-text)" }}>
                    {section.title}
                  </td>
                  <td style={{ padding: "var(--spacing-3) var(--spacing-4)", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                    {section.agentName || "—"}
                  </td>
                  <td style={{ padding: "var(--spacing-3) var(--spacing-4)", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                    {formatDateTime(section.generatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* API Usage */}
      <div
        style={{
          background: "var(--color-surface)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--color-border)",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "var(--spacing-4)", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--color-text)", margin: 0 }}>
            API Usage
          </h2>
          <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)", fontFamily: "monospace" }}>
            Total: ${totalApiCost}
          </span>
        </div>
        {apiUsage.length === 0 ? (
          <div style={{ padding: "var(--spacing-8)", textAlign: "center" }}>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
              No API usage recorded for this report.
            </p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                <th style={{ textAlign: "left", padding: "var(--spacing-3) var(--spacing-4)", fontSize: "var(--text-xs)", fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Provider
                </th>
                <th style={{ textAlign: "left", padding: "var(--spacing-3) var(--spacing-4)", fontSize: "var(--text-xs)", fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Endpoint
                </th>
                <th style={{ textAlign: "right", padding: "var(--spacing-3) var(--spacing-4)", fontSize: "var(--text-xs)", fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Cost
                </th>
                <th style={{ textAlign: "right", padding: "var(--spacing-3) var(--spacing-4)", fontSize: "var(--text-xs)", fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Time
                </th>
                <th style={{ textAlign: "center", padding: "var(--spacing-3) var(--spacing-4)", fontSize: "var(--text-xs)", fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Cached
                </th>
              </tr>
            </thead>
            <tbody>
              {apiUsage.map((usage) => (
                <tr key={usage.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "var(--spacing-3) var(--spacing-4)", fontSize: "var(--text-sm)", color: "var(--color-text)" }}>
                    {usage.provider}
                  </td>
                  <td style={{ padding: "var(--spacing-3) var(--spacing-4)", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", fontFamily: "monospace" }}>
                    {usage.endpoint}
                  </td>
                  <td style={{ padding: "var(--spacing-3) var(--spacing-4)", fontSize: "var(--text-sm)", color: "var(--color-text)", fontFamily: "monospace", textAlign: "right" }}>
                    ${Number(usage.cost).toFixed(4)}
                  </td>
                  <td style={{ padding: "var(--spacing-3) var(--spacing-4)", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", textAlign: "right" }}>
                    {formatResponseTime(usage.responseTimeMs)}
                  </td>
                  <td style={{ padding: "var(--spacing-3) var(--spacing-4)", fontSize: "var(--text-sm)", textAlign: "center", color: usage.cached ? "var(--color-success)" : "var(--color-text-secondary)" }}>
                    {usage.cached ? "Yes" : "No"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
