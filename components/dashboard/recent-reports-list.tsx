"use client";

import Link from "next/link";
import { DownloadPdfButton } from "@/components/reports/download-pdf-button";

interface Report {
  id: string;
  title: string;
  status: "queued" | "generating" | "completed" | "failed";
  marketId: string;
  marketName: string;
  createdAt: Date;
  updatedAt: Date;
}

interface RecentReportsListProps {
  reports: Report[];
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  completed: {
    label: "Completed",
    className: "text-[var(--color-success)]",
  },
  generating: {
    label: "Generating",
    className: "text-[var(--color-app-accent)] animate-pulse",
  },
  failed: {
    label: "Failed",
    className: "text-[var(--color-error)]",
  },
  queued: {
    label: "Queued",
    className: "text-[var(--color-text-tertiary)]",
  },
};

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function RecentReportsList({ reports }: RecentReportsListProps) {
  const displayedReports = reports.slice(0, 5);

  return (
    <div className="space-y-[var(--spacing-3)]">
      {displayedReports.map((report) => {
        const statusConfig = STATUS_CONFIG[report.status] || STATUS_CONFIG.queued;

        return (
          <div
            key={report.id}
            data-testid="report-row"
            className="bg-[var(--color-app-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-shadow p-[var(--spacing-4)]"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <Link
                  href={`/reports/${report.id}`}
                  className="font-[family-name:var(--font-body)] text-sm font-medium text-[var(--color-app-text)] hover:text-[var(--color-app-accent)] transition-colors"
                >
                  {report.title}
                </Link>
                <p className="font-[family-name:var(--font-body)] text-xs text-[var(--color-app-text-secondary)] mt-[var(--spacing-1)]">
                  {report.marketName} &middot; {formatDate(report.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-[var(--spacing-3)] ml-[var(--spacing-3)]">
                {report.status !== "completed" && (
                  <span className={`font-[family-name:var(--font-body)] text-xs font-medium ${statusConfig.className}`}>
                    {statusConfig.label}
                  </span>
                )}
                {report.status === "completed" && (
                  <DownloadPdfButton reportId={report.id} reportTitle={report.title} />
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
