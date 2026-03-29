"use client";

import { useState } from "react";

interface ReportActionsProps {
  reportId: string;
  reportTitle: string;
  shareToken?: string | null;
  shareTokenExpiresAt?: string | null;
}

export function ReportActions({
  reportId,
  reportTitle,
  shareToken: initialShareToken,
  shareTokenExpiresAt: initialExpiresAt,
}: ReportActionsProps) {
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareToken, setShareToken] = useState(initialShareToken ?? null);
  const [expiresAt, setExpiresAt] = useState(initialExpiresAt ?? null);
  const [copied, setCopied] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch(`/api/reports/${reportId}/pdf`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("PDF generation failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reportTitle.replace(/[^a-zA-Z0-9 ]/g, "")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Error handling — could show toast
    } finally {
      setDownloading(false);
    }
  }

  async function handleShare() {
    setSharing(true);
    try {
      const res = await fetch(`/api/reports/${reportId}/share`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Share link creation failed");

      const data = await res.json();
      setShareToken(data.shareToken);
      setExpiresAt(data.shareTokenExpiresAt);
    } catch {
      // Error handling
    } finally {
      setSharing(false);
    }
  }

  async function handleRevoke() {
    try {
      await fetch(`/api/reports/${reportId}/share`, {
        method: "DELETE",
      });
      setShareToken(null);
      setExpiresAt(null);
    } catch {
      // Error handling
    }
  }

  function handleCopy() {
    if (!shareToken) return;
    const shareUrl = `${window.location.origin}/reports/share/${shareToken}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const formattedExpiry = expiresAt
    ? new Date(expiresAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="space-y-4">
      <div>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-accent)] px-4 py-2 font-[family-name:var(--font-sans)] text-sm font-medium text-[var(--color-primary)] hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {downloading ? "Generating..." : "Download PDF"}
        </button>
      </div>

      {shareToken && (
        <div className="rounded-md border border-border bg-muted/50 p-4 space-y-2">
          <p className="text-sm font-medium">Share Link</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-background rounded px-2 py-1 truncate">
              {typeof window !== "undefined"
                ? `${window.location.origin}/reports/share/${shareToken}`
                : `/reports/share/${shareToken}`}
            </code>
            <button
              onClick={handleCopy}
              className="shrink-0 rounded-md border border-border px-3 py-1 text-xs hover:bg-muted"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              onClick={handleRevoke}
              className="shrink-0 rounded-md border border-red-300 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
            >
              Revoke
            </button>
          </div>
          {formattedExpiry && (
            <p className="text-xs text-muted-foreground">
              Expires: {formattedExpiry}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
