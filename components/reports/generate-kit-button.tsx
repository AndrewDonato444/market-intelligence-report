"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type KitStatus = "none" | "queued" | "generating" | "completed" | "failed";

interface GenerateKitButtonProps {
  reportId: string;
  initialKitStatus?: KitStatus;
  initialErrorMessage?: string | null;
  /** Compact mode for dashboard cards */
  compact?: boolean;
}

export function GenerateKitButton({
  reportId,
  initialKitStatus = "none",
  initialErrorMessage = null,
  compact = false,
}: GenerateKitButtonProps) {
  const [kitStatus, setKitStatus] = useState<KitStatus>(initialKitStatus);
  const [errorMessage, setErrorMessage] = useState<string | null>(initialErrorMessage);
  const [triggering, setTriggering] = useState(false);

  const pollStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/reports/${reportId}/kit/status`);
      if (!res.ok) return;
      const data = await res.json();
      setKitStatus(data.kit.status);
      if (data.kit.status === "failed") {
        setErrorMessage(data.kit.errorMessage);
      }
    } catch {
      // Polling failure is non-critical
    }
  }, [reportId]);

  // Poll while generating
  useEffect(() => {
    if (kitStatus !== "generating" && kitStatus !== "queued") return;

    const interval = setInterval(pollStatus, 3000);
    return () => clearInterval(interval);
  }, [kitStatus, pollStatus]);

  async function handleGenerate(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setTriggering(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/reports/${reportId}/kit/generate`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        setErrorMessage(data.error ?? "Generation failed");
        return;
      }

      setKitStatus("generating");
    } catch {
      setErrorMessage("Failed to start kit generation");
    } finally {
      setTriggering(false);
    }
  }

  // Completed — show "View Kit" link to kit viewer
  if (kitStatus === "completed") {
    if (compact) {
      return (
        <Link
          href={`/reports/${reportId}/kit`}
          className="font-[family-name:var(--font-sans)] text-xs font-medium px-3 py-1 rounded-[var(--radius-sm)] bg-[var(--color-success)] text-white whitespace-nowrap hover:opacity-90 transition-opacity"
          title="Open Content Studio"
        >
          Content Studio
        </Link>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <Link
          href={`/reports/${reportId}/kit`}
          className="font-[family-name:var(--font-sans)] text-xs font-medium px-3 py-1 rounded-[var(--radius-sm)] bg-[var(--color-success)] text-white whitespace-nowrap hover:opacity-90 transition-opacity"
        >
          View Social Media Kit
        </Link>
        <button
          onClick={handleGenerate}
          className="font-[family-name:var(--font-sans)] text-xs px-2 py-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] hover:bg-[var(--color-muted)] transition-colors whitespace-nowrap"
        >
          Regenerate
        </button>
      </div>
    );
  }

  // Generating / queued
  if (kitStatus === "generating" || kitStatus === "queued") {
    return (
      <button
        disabled
        className="font-[family-name:var(--font-sans)] text-xs font-medium px-3 py-1 rounded-[var(--radius-sm)] bg-[var(--color-accent)] text-[var(--color-primary)] opacity-70 whitespace-nowrap"
      >
        {compact ? "Generating..." : "Generating Kit..."}
      </button>
    );
  }

  // Failed — show error + retry
  if (kitStatus === "failed") {
    if (compact) {
      return (
        <button
          onClick={handleGenerate}
          disabled={triggering}
          className="font-[family-name:var(--font-sans)] text-xs font-medium px-3 py-1 rounded-[var(--radius-sm)] bg-[var(--color-error)] text-white hover:opacity-90 disabled:opacity-50 transition-colors whitespace-nowrap"
          title={errorMessage ?? "Kit generation failed"}
        >
          {triggering ? "Retrying..." : "Retry Kit"}
        </button>
      );
    }
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-error)]">
            Kit generation failed
          </span>
          <button
            onClick={handleGenerate}
            disabled={triggering}
            className="font-[family-name:var(--font-sans)] text-xs px-2 py-1 rounded-[var(--radius-sm)] border border-[var(--color-error)] text-[var(--color-error)] hover:bg-red-50 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {triggering ? "Retrying..." : "Retry"}
          </button>
        </div>
        {errorMessage && (
          <p className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)]">
            {errorMessage}
          </p>
        )}
      </div>
    );
  }

  // --- Kit status is "none" — show generate button ---

  // Compact mode: link to report detail
  if (compact) {
    return (
      <Link
        href={`/reports/${reportId}#social-media-kit`}
        className="font-[family-name:var(--font-sans)] text-xs font-medium px-3 py-1 rounded-[var(--radius-sm)] bg-[var(--color-accent)] text-[var(--color-primary)] hover:bg-[var(--color-accent-hover)] transition-colors whitespace-nowrap"
      >
        Get Kit
      </Link>
    );
  }

  // Full mode — show generate button
  return (
    <button
      onClick={handleGenerate}
      disabled={triggering}
      className="font-[family-name:var(--font-sans)] text-xs font-medium px-3 py-1 rounded-[var(--radius-sm)] bg-[var(--color-accent)] text-[var(--color-primary)] hover:bg-[var(--color-accent-hover)] disabled:opacity-50 transition-colors whitespace-nowrap"
    >
      {triggering ? "Starting..." : "Generate Social Media Kit"}
    </button>
  );
}
