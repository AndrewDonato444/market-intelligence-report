"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { getMarketImageUrl } from "@/lib/utils/market-image";
import { DownloadPdfButton } from "./download-pdf-button";

interface Report {
  id: string;
  title: string;
  status: "queued" | "generating" | "completed" | "failed";
  marketId: string;
  marketName: string;
  marketCity: string;
  marketState: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ReportTileGridProps {
  reports: Report[];
}

interface MarketGroup {
  marketId: string;
  marketName: string;
  marketCity: string;
  marketState: string;
  reports: Report[];
}

const STATUS_CONFIG: Record<string, { label: string; colorVar: string }> = {
  queued: { label: "Queued", colorVar: "var(--color-app-text-tertiary)" },
  generating: { label: "Generating", colorVar: "var(--color-app-accent)" },
  completed: { label: "Ready", colorVar: "var(--color-success)" },
};

/** Strip tier and trailing words like "Luxury", "Ultra Luxury", "Report" from market display names */
function cleanMarketName(name: string): string {
  return name
    .replace(/\s*(Ultra Luxury|High Luxury|Luxury)\s*(Report)?\s*$/i, "")
    .trim() || name;
}

function formatShortDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  });
}

function ReportTile({ report }: { report: Report }) {
  const [imgFailed, setImgFailed] = useState(false);
  const imageUrl = getMarketImageUrl(report.marketCity, report.marketState);
  const showPhoto = imageUrl && !imgFailed;
  const status = STATUS_CONFIG[report.status];

  return (
    <div
      data-testid={`report-tile-${report.id}`}
      className="group relative block overflow-hidden rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-shadow"
      style={{ height: "160px" }}
    >
      {/* Background photo or gradient */}
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
              "linear-gradient(135deg, var(--color-app-nav-bg) 0%, #2C2825 100%)",
          }}
        />
      )}

      {/* Darker gradient overlay for text legibility */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(26,23,20,0.3) 0%, rgba(26,23,20,0.6) 35%, rgba(26,23,20,0.92) 100%)",
        }}
      />

      {/* Status pill — top right */}
      {status && (
        <div className="absolute top-[var(--spacing-2)] right-[var(--spacing-2)] z-[6]">
          <span
            data-testid={`status-pill-${report.id}`}
            className={`font-[family-name:var(--font-body)] text-xs font-medium px-2 py-0.5 rounded-[var(--radius-sm)] whitespace-nowrap ${
              report.status === "generating" ? "animate-pulse" : ""
            }`}
            style={{
              color: "#fff",
              backgroundColor: status.colorVar,
              backdropFilter: "blur(4px)",
              boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
            }}
          >
            {status.label}
          </span>
        </div>
      )}

      {/* Card content — bottom */}
      <div className="absolute inset-0 flex flex-col justify-end p-[var(--spacing-3)] z-[5]">
        <Link
          href={`/reports/${report.id}`}
          className="font-[family-name:var(--font-body)] text-sm font-medium leading-snug text-[var(--color-text-inverse)] hover:underline line-clamp-2"
        >
          {report.title}
        </Link>

        <div className="flex items-center gap-[var(--spacing-2)] mt-[var(--spacing-2)]">
          {report.status === "completed" && (
            <>
              <DownloadPdfButton
                reportId={report.id}
                reportTitle={report.title}
              />
              <Link
                href={`/reports/${report.id}/kit`}
                className="font-[family-name:var(--font-body)] text-xs font-medium px-3 py-1 rounded-[var(--radius-sm)] bg-[var(--color-app-accent)] text-white hover:bg-[var(--color-app-accent-hover)] transition-colors whitespace-nowrap"
              >
                Content Studio
              </Link>
            </>
          )}
        </div>

        <p
          className="font-[family-name:var(--font-body)] text-xs mt-[var(--spacing-1)]"
          style={{ color: "rgba(248,250,252,0.55)" }}
        >
          {formatShortDate(report.createdAt)}
        </p>
      </div>
    </div>
  );
}

export function ReportTileGrid({ reports }: ReportTileGridProps) {
  const [showFailed, setShowFailed] = useState(false);

  const { marketGroups, failed } = useMemo(() => {
    const failed: Report[] = [];
    const groupMap = new Map<string, MarketGroup>();

    for (const r of reports) {
      if (r.status === "failed") {
        failed.push(r);
        continue;
      }
      let group = groupMap.get(r.marketId);
      if (!group) {
        group = {
          marketId: r.marketId,
          marketName: r.marketName,
          marketCity: r.marketCity,
          marketState: r.marketState,
          reports: [],
        };
        groupMap.set(r.marketId, group);
      }
      group.reports.push(r);
    }

    return { marketGroups: Array.from(groupMap.values()), failed };
  }, [reports]);

  if (reports.length === 0) return null;

  return (
    <div data-testid="report-tile-grid">
      {/* Market-grouped tiles */}
      <div className="space-y-[var(--spacing-8)]">
        {marketGroups.map((group) => (
          <div key={group.marketId} data-testid={`market-group-${group.marketId}`}>
            <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--color-app-text)] mb-[var(--spacing-3)] pb-[var(--spacing-1)] inline-block border-b-2 border-[var(--color-app-accent)]">
              {cleanMarketName(group.marketName)}
            </h3>
            <div className="grid gap-[var(--spacing-4)] grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {group.reports.map((report) => (
                <ReportTile key={report.id} report={report} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Failed reports toggle */}
      {failed.length > 0 && (
        <div className="mt-[var(--spacing-6)]">
          <div className="border-t border-[var(--color-app-border)] pt-[var(--spacing-4)]">
            <button
              data-testid="failed-reports-toggle"
              onClick={() => setShowFailed((prev) => !prev)}
              className="font-[family-name:var(--font-body)] text-sm text-[var(--color-app-text-secondary)] hover:text-[var(--color-app-text)] transition-colors duration-[var(--duration-default)]"
            >
              {showFailed
                ? "Hide failed reports"
                : `Show failed reports (${failed.length})`}
            </button>
          </div>

          {showFailed && (
            <div
              data-testid="failed-reports-list"
              className="mt-[var(--spacing-3)] space-y-2"
            >
              {failed.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between bg-[var(--color-app-surface)] rounded-[var(--radius-sm)] shadow-[var(--shadow-sm)] px-[var(--spacing-3)] py-[var(--spacing-2)]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-app-text)] truncate">
                      {report.title}
                    </p>
                    <p className="font-[family-name:var(--font-body)] text-xs text-[var(--color-app-text-secondary)]">
                      {cleanMarketName(report.marketName)} &middot;{" "}
                      {formatShortDate(report.createdAt)}
                    </p>
                  </div>
                  <span
                    className="font-[family-name:var(--font-body)] text-xs font-medium px-2 py-0.5 rounded-[var(--radius-sm)] ml-[var(--spacing-3)] whitespace-nowrap"
                    style={{
                      color: "var(--color-error)",
                      backgroundColor:
                        "color-mix(in srgb, var(--color-error) 10%, transparent)",
                    }}
                  >
                    Failed
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
