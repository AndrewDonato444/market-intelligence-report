"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

type CampaignStatus = "none" | "queued" | "generating" | "completed" | "failed";

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

  // --- Campaign status is "none" — show generate button ---
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
