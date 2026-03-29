"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

type CampaignStatus = "none" | "queued" | "generating" | "completed" | "failed";

type EntitlementState =
  | { status: "loading" }
  | { status: "allowed"; limit: number; used: number; remaining: number }
  | { status: "not_included" } // Starter tier — cap is 0
  | { status: "at_cap"; limit: number; used: number } // Professional at monthly cap
  | { status: "error" }; // Fail-open

interface GenerateEmailButtonProps {
  reportId: string;
  initialCampaignStatus?: CampaignStatus;
  initialErrorMessage?: string | null;
  compact?: boolean;
  onCompleted?: () => void;
}

export function GenerateEmailButton({
  reportId,
  initialCampaignStatus = "none",
  initialErrorMessage = null,
  compact = false,
  onCompleted,
}: GenerateEmailButtonProps) {
  const [campaignStatus, setCampaignStatus] = useState<CampaignStatus>(initialCampaignStatus);
  const [errorMessage, setErrorMessage] = useState<string | null>(initialErrorMessage);
  const [triggering, setTriggering] = useState(false);
  const onCompletedRef = useRef(onCompleted);
  useEffect(() => { onCompletedRef.current = onCompleted; }, [onCompleted]);

  const [entitlement, setEntitlement] = useState<EntitlementState>(
    // Skip entitlement check for campaigns already in progress or completed
    initialCampaignStatus === "completed" || initialCampaignStatus === "generating" || initialCampaignStatus === "queued"
      ? { status: "allowed", limit: -1, used: 0, remaining: -1 }
      : { status: "loading" }
  );

  // Preflight entitlement check on mount (only for statuses that need it)
  useEffect(() => {
    if (
      initialCampaignStatus === "completed" ||
      initialCampaignStatus === "generating" ||
      initialCampaignStatus === "queued"
    ) {
      return;
    }

    let cancelled = false;

    async function fetchEntitlement() {
      try {
        const res = await fetch("/api/entitlements/check?type=email_campaigns");
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
  }, [initialCampaignStatus]);

  const pollStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/reports/${reportId}/email-campaign/status`);
      if (!res.ok) return;
      const data = await res.json();
      const newStatus = data.campaign.status;
      setCampaignStatus(newStatus);
      if (newStatus === "completed") {
        onCompletedRef.current?.();
      } else if (newStatus === "failed") {
        setErrorMessage(data.campaign.errorMessage);
      }
    } catch {
      // Polling failure is non-critical
    }
  }, [reportId]);

  useEffect(() => {
    if (campaignStatus !== "generating" && campaignStatus !== "queued") return;

    const interval = setInterval(pollStatus, 3000);
    return () => clearInterval(interval);
  }, [campaignStatus, pollStatus]);

  async function handleGenerate(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setTriggering(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/reports/${reportId}/email-campaign/generate`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        setErrorMessage(data.error ?? "Generation failed");
        return;
      }

      setCampaignStatus("generating");
    } catch {
      setErrorMessage("Failed to start email campaign generation");
    } finally {
      setTriggering(false);
    }
  }

  // Completed
  if (campaignStatus === "completed") {
    if (compact) {
      return (
        <Link
          href={`/reports/${reportId}/emails`}
          className="font-[family-name:var(--font-sans)] text-xs font-medium px-3 py-1 rounded-[var(--radius-sm)] bg-[var(--color-success)] text-white whitespace-nowrap hover:opacity-90 transition-opacity"
          title="View Email Campaign"
        >
          View Emails
        </Link>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <Link
          href={`/reports/${reportId}/emails`}
          className="font-[family-name:var(--font-sans)] text-xs font-medium px-3 py-1 rounded-[var(--radius-sm)] bg-[var(--color-success)] text-white whitespace-nowrap hover:opacity-90 transition-opacity"
        >
          View Email Campaign
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
  if (campaignStatus === "generating" || campaignStatus === "queued") {
    return (
      <button
        disabled
        className="font-[family-name:var(--font-sans)] text-xs font-medium px-3 py-1 rounded-[var(--radius-sm)] bg-[var(--color-accent)] text-[var(--color-primary)] opacity-70 whitespace-nowrap"
      >
        {compact ? "Generating..." : "Generating Email Campaign..."}
      </button>
    );
  }

  // Failed
  if (campaignStatus === "failed") {
    if (compact) {
      return (
        <button
          onClick={handleGenerate}
          disabled={triggering}
          className="font-[family-name:var(--font-sans)] text-xs font-medium px-3 py-1 rounded-[var(--radius-sm)] bg-[var(--color-error)] text-white hover:opacity-90 disabled:opacity-50 transition-colors whitespace-nowrap"
          title={errorMessage ?? "Email campaign generation failed"}
        >
          {triggering ? "Retrying..." : "Retry Emails"}
        </button>
      );
    }
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-error)]">
            Email campaign generation failed
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

  // --- Entitlement-gated states (campaign status is "none") ---

  // Loading entitlement check
  if (entitlement.status === "loading") {
    return (
      <span className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)] opacity-50 whitespace-nowrap">
        {compact ? "..." : "Checking availability..."}
      </span>
    );
  }

  // Starter tier — email campaigns not included (cap = 0)
  if (entitlement.status === "not_included") {
    if (compact) {
      return (
        <Link
          href="/account"
          className="font-[family-name:var(--font-sans)] text-xs font-medium px-3 py-1 rounded-[var(--radius-sm)] bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:border-[var(--color-accent)] transition-colors whitespace-nowrap"
        >
          Pro Feature
        </Link>
      );
    }

    return (
      <div className="p-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <p className="font-[family-name:var(--font-serif)] text-sm font-bold text-[var(--color-primary)] mb-2">
          Email Campaigns — Professional Feature
        </p>
        <p className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)] mb-3">
          Turn your report into ready-to-send email content:
        </p>
        <ul className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)] space-y-1 mb-4 list-disc list-inside">
          <li>Drip sequences for nurturing leads</li>
          <li>Market update newsletters</li>
          <li>Persona-targeted email copy</li>
          <li>Subject lines and CTAs</li>
          <li>Campaign scheduling suggestions</li>
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
    if (compact) {
      return (
        <span className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)] whitespace-nowrap">
          Limit reached
        </span>
      );
    }

    return (
      <div className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)] space-y-1">
        <p className="font-medium">Monthly limit reached</p>
        <p>{entitlement.used} of {entitlement.limit} campaigns used this month</p>
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
      {triggering
        ? "Starting..."
        : compact
          ? "Generate Emails"
          : "Generate Email Campaign"}
    </button>
  );
}
