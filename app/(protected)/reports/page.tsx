import Link from "next/link";
import { getAuthUserId } from "@/lib/supabase/auth";
import { redirect } from "next/navigation";
import { getReports, reapStaleReports } from "@/lib/services/report";
import { ReportTileGrid } from "@/components/reports/report-tile-grid";
import { ReportEntitlementBadge } from "@/components/reports/report-entitlement-badge";

export default async function ReportsPage() {
  const authId = await getAuthUserId();
  if (!authId) redirect("/sign-in");

  let reports: Awaited<ReturnType<typeof getReports>> = [];
  try {
    await reapStaleReports();
    reports = await getReports(authId);
  } catch (error) {
    console.error("[ReportsPage] Failed to load data:", error);
  }

  // Normalize geography for the tile grid
  const reportsWithGeo = reports.map((r) => {
    const geo = r.marketGeography as { city?: string; state?: string } | null;
    return {
      ...r,
      marketCity: geo?.city ?? "",
      marketState: geo?.state ?? "",
    };
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--color-app-text)]">
            Reports
          </h2>
          <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-app-text-secondary)] mt-1">
            Your generated market intelligence reports.
          </p>
        </div>
        <div className="text-right">
          <Link
            href="/reports/create"
            className="inline-block px-4 py-2 bg-[var(--color-app-accent)] hover:bg-[var(--color-app-accent-hover)] text-white font-[family-name:var(--font-body)] font-semibold text-sm rounded-[var(--radius-sm)] transition-colors duration-[var(--duration-default)]"
          >
            Generate New Report
          </Link>
          <ReportEntitlementBadge />
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="bg-[var(--color-app-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] p-8 text-center">
          <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-app-text-secondary)]">
            No reports yet. Generate your first market intelligence report.
          </p>
          <Link
            href="/reports/create"
            className="inline-block mt-4 px-6 py-2 bg-[var(--color-app-accent)] hover:bg-[var(--color-app-accent-hover)] text-white font-[family-name:var(--font-body)] font-semibold text-sm rounded-[var(--radius-sm)] transition-colors duration-[var(--duration-default)]"
          >
            Generate New Report
          </Link>
        </div>
      ) : (
        <ReportTileGrid reports={reportsWithGeo} />
      )}
    </div>
  );
}
