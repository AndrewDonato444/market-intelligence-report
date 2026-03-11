"use client";

interface DashboardStatsProps {
  totalReports: number;
  lastReportDate: Date | null;
  activeMarkets: number;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function DashboardStats({
  totalReports,
  lastReportDate,
  activeMarkets,
}: DashboardStatsProps) {
  return (
    <div
      data-testid="dashboard-stats"
      className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] p-[var(--spacing-6)]"
    >
      <div className="grid grid-cols-3 gap-[var(--spacing-6)]">
        <div className="text-center">
          <div className="font-[family-name:var(--font-sans)] text-3xl font-bold text-[var(--color-accent)]">
            {totalReports}
          </div>
          <div className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] mt-[var(--spacing-1)]">
            Reports Generated
          </div>
        </div>
        <div className="text-center">
          <div className="font-[family-name:var(--font-sans)] text-lg font-bold text-[var(--color-accent)]">
            {lastReportDate ? formatDate(lastReportDate) : "\u2014"}
          </div>
          <div className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] mt-[var(--spacing-1)]">
            Last Report
          </div>
        </div>
        <div className="text-center">
          <div className="font-[family-name:var(--font-sans)] text-3xl font-bold text-[var(--color-accent)]">
            {activeMarkets}
          </div>
          <div className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] mt-[var(--spacing-1)]">
            Active Markets
          </div>
        </div>
      </div>
    </div>
  );
}
