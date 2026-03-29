"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { getMarketImageUrl } from "@/lib/utils/market-image";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ContentStudioItem {
  reportId: string;
  reportTitle: string;
  marketId: string;
  marketName: string;
  marketCity: string;
  marketState: string;
  kitStatus: "queued" | "generating" | "completed" | "failed" | null;
  kitGeneratedAt: string | null;
  emailStatus: "queued" | "generating" | "completed" | "failed" | null;
  emailGeneratedAt: string | null;
  latestActivityAt: Date;
}

interface MarketGroup {
  marketId: string;
  marketName: string;
  marketCity: string;
  marketState: string;
  items: ContentStudioItem[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cleanMarketName(name: string): string {
  return (
    name
      .replace(/\s*(Ultra Luxury|High Luxury|Luxury)\s*(Report)?\s*$/i, "")
      .trim() || name
  );
}

function formatShortDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Action Button — handles generate trigger + status transitions
// ---------------------------------------------------------------------------

type ContentStatus = "queued" | "generating" | "completed" | "failed" | null;

function TileActionButton({
  type,
  reportId,
  initialStatus,
}: {
  type: "social" | "email";
  reportId: string;
  initialStatus: ContentStatus;
}) {
  const [status, setStatus] = useState<ContentStatus>(initialStatus);
  const [triggering, setTriggering] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const apiPath =
    type === "social"
      ? `/api/reports/${reportId}/kit/generate`
      : `/api/reports/${reportId}/email-campaign/generate`;

  const pollPath =
    type === "social"
      ? `/api/reports/${reportId}/kit/status`
      : `/api/reports/${reportId}/email-campaign/status`;

  const statusKey = type === "social" ? "kit" : "campaign";

  const handleGenerate = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setTriggering(true);

      try {
        const res = await fetch(apiPath, { method: "POST" });
        if (res.ok) {
          setStatus("generating");
          // Start polling
          pollRef.current = setInterval(async () => {
            try {
              const pollRes = await fetch(pollPath);
              if (!pollRes.ok) return;
              const data = await pollRes.json();
              const newStatus = data[statusKey]?.status;
              if (newStatus === "completed" || newStatus === "failed") {
                setStatus(newStatus);
                if (pollRef.current) {
                  clearInterval(pollRef.current);
                  pollRef.current = null;
                }
              }
            } catch {
              // Polling failure is non-critical
            }
          }, 3000);
        } else {
          setStatus("failed");
        }
      } catch {
        setStatus("failed");
      } finally {
        setTriggering(false);
      }
    },
    [apiPath, pollPath, statusKey],
  );

  const label = type === "social" ? "Social Media Kit" : "Email Kit";

  // Completed — link to content studio
  if (status === "completed") {
    const href =
      type === "social"
        ? `/reports/${reportId}/kit`
        : `/reports/${reportId}/kit?tab=email`;

    return (
      <Link
        href={href}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-sm)] bg-[var(--color-accent)] text-[var(--color-primary)] font-[family-name:var(--font-sans)] text-xs font-medium hover:opacity-90 transition-opacity"
      >
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: "var(--color-success)" }}
        />
        Open {label}
        <span aria-hidden="true">&rarr;</span>
      </Link>
    );
  }

  // Generating / queued — disabled pulsing state
  if (status === "generating" || status === "queued") {
    return (
      <button
        disabled
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border)] font-[family-name:var(--font-sans)] text-xs text-[var(--color-accent)] opacity-80 animate-pulse"
      >
        <span
          className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse"
          style={{ backgroundColor: "var(--color-accent)" }}
        />
        Generating...
      </button>
    );
  }

  // Failed — retry button
  if (status === "failed") {
    return (
      <button
        onClick={handleGenerate}
        disabled={triggering}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-sm)] border border-[var(--color-error)] font-[family-name:var(--font-sans)] text-xs text-[var(--color-error)] hover:bg-red-50 disabled:opacity-50 transition-colors"
      >
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: "var(--color-error)" }}
        />
        {triggering ? "Retrying..." : `Retry ${label}`}
      </button>
    );
  }

  // Not generated — generate button
  return (
    <button
      onClick={handleGenerate}
      disabled={triggering}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border)] font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:border-[var(--color-accent)] disabled:opacity-50 transition-colors"
    >
      <span
        className="w-2 h-2 rounded-full border flex-shrink-0"
        style={{ borderColor: "var(--color-border)" }}
      />
      {triggering ? "Starting..." : `Generate ${label}`}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Tile component — photo (left) + action panel (right)
// ---------------------------------------------------------------------------

function ContentStudioTile({ item }: { item: ContentStudioItem }) {
  const [imgFailed, setImgFailed] = useState(false);
  const imageUrl = getMarketImageUrl(item.marketCity, item.marketState);
  const showPhoto = imageUrl && !imgFailed;

  return (
    <div
      data-testid={`studio-tile-${item.reportId}`}
      className="flex flex-col md:flex-row gap-[var(--spacing-4)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] overflow-hidden hover:shadow-[var(--shadow-md)] transition-shadow"
    >
      {/* Photo tile — left (links to report) */}
      <Link
        href={`/reports/${item.reportId}`}
        className="group/photo relative w-full md:w-60 flex-shrink-0 block"
        style={{ minHeight: "160px" }}
        aria-label={`View report: ${item.reportTitle}`}
      >
        {showPhoto ? (
          <img
            src={imageUrl}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, var(--color-primary) 0%, #1E293B 100%)",
            }}
          />
        )}

        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(15,23,42,0.2) 0%, rgba(15,23,42,0.5) 50%, rgba(15,23,42,0.85) 100%)",
          }}
        />

        {/* Hover label */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity z-10">
          <span className="font-[family-name:var(--font-sans)] text-xs font-medium text-white bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-[var(--radius-sm)]">
            View Report &rarr;
          </span>
        </div>
      </Link>

      {/* Action panel — right */}
      <div className="flex-1 p-[var(--spacing-4)] flex flex-col justify-center">
        <h4 className="font-[family-name:var(--font-serif)] text-base font-semibold leading-snug mb-[var(--spacing-1)]">
          <Link
            href={`/reports/${item.reportId}`}
            className="text-[var(--color-text)] hover:text-[var(--color-accent)] transition-colors"
          >
            {item.reportTitle}
          </Link>
        </h4>
        <p
          className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)] mb-[var(--spacing-3)]"
        >
          {formatShortDate(item.latestActivityAt)}
        </p>

        <p className="font-[family-name:var(--font-sans)] text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mb-[var(--spacing-1)]">
          Content Studio
        </p>
        <div className="flex flex-wrap gap-[var(--spacing-2)]">
          <TileActionButton
            type="social"
            reportId={item.reportId}
            initialStatus={item.kitStatus}
          />
          <TileActionButton
            type="email"
            reportId={item.reportId}
            initialStatus={item.emailStatus}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Grid component
// ---------------------------------------------------------------------------

export function ContentStudioTileGrid({
  items,
}: {
  items: ContentStudioItem[];
}) {
  const marketGroups = useMemo(() => {
    const groupMap = new Map<string, MarketGroup>();

    for (const item of items) {
      let group = groupMap.get(item.marketId);
      if (!group) {
        group = {
          marketId: item.marketId,
          marketName: item.marketName,
          marketCity: item.marketCity,
          marketState: item.marketState,
          items: [],
        };
        groupMap.set(item.marketId, group);
      }
      group.items.push(item);
    }

    // Sort items within each group newest first
    for (const group of groupMap.values()) {
      group.items.sort(
        (a, b) =>
          new Date(b.latestActivityAt).getTime() -
          new Date(a.latestActivityAt).getTime(),
      );
    }

    return Array.from(groupMap.values());
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] p-8 text-center">
        <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)]">
          No content studios yet.
        </p>
        <p className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-tertiary)] mt-1">
          Generate content from a completed report to see it here.
        </p>
        <Link
          href="/reports"
          className="inline-block mt-4 px-6 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-primary)] font-[family-name:var(--font-sans)] font-semibold text-sm rounded-[var(--radius-sm)] transition-colors duration-[var(--duration-default)]"
        >
          View Reports
        </Link>
      </div>
    );
  }

  return (
    <div data-testid="content-studio-tile-grid">
      <div className="space-y-[var(--spacing-8)]">
        {marketGroups.map((group) => (
          <div
            key={group.marketId}
            data-testid={`studio-market-group-${group.marketId}`}
          >
            <h3 className="font-[family-name:var(--font-serif)] text-lg font-semibold text-[var(--color-primary)] mb-[var(--spacing-3)] pb-[var(--spacing-1)] inline-block border-b-2 border-[var(--color-accent)]">
              {cleanMarketName(group.marketName)}
            </h3>
            <div className="space-y-[var(--spacing-4)]">
              {group.items.map((item) => (
                <ContentStudioTile key={item.reportId} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
