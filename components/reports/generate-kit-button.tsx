"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type KitStatus = "none" | "queued" | "generating" | "completed" | "failed";

type EntitlementState =
  | { status: "loading" }
  | { status: "allowed"; limit: number; used: number; remaining: number }
  | { status: "not_included" } // Starter tier — cap is 0
  | { status: "at_cap"; limit: number; used: number } // Professional at monthly cap
  | { status: "error" }; // Fail-open

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
  const [entitlement, setEntitlement] = useState<EntitlementState>(
    // Skip entitlement check for kits already in progress or completed
    initialKitStatus === "completed" || initialKitStatus === "generating" || initialKitStatus === "queued"
      ? { status: "allowed", limit: -1, used: 0, remaining: -1 }
      : { status: "loading" }
  );

  // Preflight entitlement check on mount (only for statuses that need it)
  useEffect(() => {
    if (
      initialKitStatus === "completed" ||
      initialKitStatus === "generating" ||
      initialKitStatus === "queued"
    ) {
      return;
    }

    let cancelled = false;

    async function fetchEntitlement() {
      try {
        const res = await fetch("/api/entitlements/check?type=social_media_kits");
        if (!res.ok) {
          if (!cancelled) setEntitlement({ status: "error" });
          return;
        }
        const data = await res.json();

        if (cancelled) return;

        if (data.limit === 0) {
          setEntitlement({ status: "not_included" });
        } else if (!data.allowed && data.limit > 0) {
          setEntitlement({ status: "at_cap", limit: data.limit, used: data.used });
        } else {
          setEntitlement({
            status: "allowed",
            limit: data.limit,
            used: data.used,
            remaining: data.remaining,
          });
        }
      } catch {
        // Fail-open: show generate button on error
        if (!cancelled) setEntitlement({ status: "error" });
      }
    }

    fetchEntitlement();
    return () => { cancelled = true; };
  }, [initialKitStatus]);

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
          title="View Social Media Kit"
        >
          View Kit
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

  // --- Entitlement-gated states (kit status is "none") ---

  // Compact mode: all non-active states show "Get Kit" linking to report detail
  // The report detail page handles entitlement gating (upgrade prompt vs generate button)
  if (compact) {
    if (entitlement.status === "loading") {
      return (
        <span className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)] opacity-50 whitespace-nowrap">
          ...
        </span>
      );
    }

    return (
      <Link
        href={`/reports/${reportId}#social-media-kit`}
        className="font-[family-name:var(--font-sans)] text-xs font-medium px-3 py-1 rounded-[var(--radius-sm)] bg-[var(--color-accent)] text-[var(--color-primary)] hover:bg-[var(--color-accent-hover)] transition-colors whitespace-nowrap"
      >
        Get Kit
      </Link>
    );
  }

  // --- Full mode (report detail page) — unchanged behavior ---

  // Loading entitlement check
  if (entitlement.status === "loading") {
    return (
      <span className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)] opacity-50 whitespace-nowrap">
        Checking availability...
      </span>
    );
  }

  // Starter tier — social media kit not included (cap = 0)
  if (entitlement.status === "not_included") {
    return (
      <div className="p-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <p className="font-[family-name:var(--font-serif)] text-sm font-bold text-[var(--color-primary)] mb-2">
          Social Media Kit — Professional Feature
        </p>
        <p className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)] mb-3">
          Turn your report into ready-to-post social content:
        </p>
        <ul className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)] space-y-1 mb-4 list-disc list-inside">
          <li>Platform-optimized posts (LinkedIn, Instagram, X, Facebook)</li>
          <li>Persona-targeted content for your audience</li>
          <li>Poll ideas with data-backed context</li>
          <li>Stat callouts for quick sharing</li>
          <li>Content calendar suggestions</li>
        </ul>
        <Link
          href="/account"
          className="inline-block w-full text-center px-4 py-2 bg-[var(--color-accent)] text-[var(--color-primary)] font-[family-name:var(--font-sans)] font-medium text-xs rounded-[var(--radius-sm)] transition-colors hover:opacity-90"
        >
          View Plans to Upgrade
        </Link>
      </div>
    );
  }

  // Professional user at monthly cap
  if (entitlement.status === "at_cap") {
    return (
      <div className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)] space-y-1">
        <p className="font-medium">Monthly limit reached</p>
        <p>{entitlement.used} of {entitlement.limit} kits used this month</p>
      </div>
    );
  }

  // Default — allowed or fail-open — show generate button
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
