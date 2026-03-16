import Link from "next/link";
import { getAuthUserId } from "@/lib/supabase/auth";
import { redirect } from "next/navigation";
import { getReports, reapStaleReports } from "@/lib/services/report";
import { getKitStatusesForReports } from "@/lib/services/social-media-kit";
import { DownloadPdfButton } from "@/components/reports/download-pdf-button";
import { GenerateKitButton } from "@/components/reports/generate-kit-button";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  queued: { label: "Queued", color: "var(--color-text-secondary)" },
  generating: { label: "Generating", color: "var(--color-accent)" },
  completed: { label: "Completed", color: "var(--color-success)" },
  failed: { label: "Failed", color: "var(--color-error)" },
};

export default async function ReportsPage() {
  const authId = await getAuthUserId();
  if (!authId) redirect("/sign-in");

  let reports: Awaited<ReturnType<typeof getReports>> = [];
  let kitStatuses = new Map<string, { status: string; errorMessage: string | null }>();

  try {
    await reapStaleReports();
    reports = await getReports(authId);

    // Batch-load kit statuses for completed reports
    const completedReportIds = reports
      .filter((r) => r.status === "completed")
      .map((r) => r.id);
    kitStatuses = await getKitStatusesForReports(completedReportIds);
  } catch (error) {
    console.error("[ReportsPage] Failed to load data:", error);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-[family-name:var(--font-serif)] text-2xl font-bold text-[var(--color-primary)]">
            Reports
          </h2>
          <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] mt-1">
            Your generated market intelligence reports.
          </p>
        </div>
        <Link
          href="/reports/create"
          className="px-4 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-primary)] font-[family-name:var(--font-sans)] font-semibold text-sm rounded-[var(--radius-sm)] transition-colors duration-[var(--duration-default)]"
        >
          Generate New Report
        </Link>
      </div>

      {reports.length === 0 ? (
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] p-8 text-center">
          <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)]">
            No reports yet. Generate your first market intelligence report.
          </p>
          <Link
            href="/reports/create"
            className="inline-block mt-4 px-6 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-primary)] font-[family-name:var(--font-sans)] font-semibold text-sm rounded-[var(--radius-sm)] transition-colors duration-[var(--duration-default)]"
          >
            Generate New Report
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const status = STATUS_LABELS[report.status] || {
              label: report.status,
              color: "var(--color-text-secondary)",
            };

            return (
              <div
                key={report.id}
                className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] p-4 flex items-center justify-between"
              >
                <Link href={`/reports/${report.id}`} className="flex-1 min-w-0">
                  <h3 className="font-[family-name:var(--font-sans)] text-sm font-medium text-[var(--color-text)] hover:text-[var(--color-accent)] transition-colors">
                    {report.title}
                  </h3>
                  <p className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)] mt-0.5">
                    {report.marketName} &middot; Created{" "}
                    {report.createdAt
                      ? new Date(report.createdAt).toLocaleDateString()
                      : "—"}
                  </p>
                </Link>
                <div className="flex items-center gap-3 ml-4">
                  {report.status === "completed" && (
                    <>
                      <DownloadPdfButton
                        reportId={report.id}
                        reportTitle={report.title}
                      />
                      <GenerateKitButton
                        reportId={report.id}
                        initialKitStatus={
                          kitStatuses.get(report.id)?.status as
                            | "queued"
                            | "generating"
                            | "completed"
                            | "failed"
                            | undefined ?? "none"
                        }
                        initialErrorMessage={kitStatuses.get(report.id)?.errorMessage ?? null}
                        compact
                      />
                    </>
                  )}
                  <span
                    className="font-[family-name:var(--font-sans)] text-xs font-medium px-2 py-1 rounded-[var(--radius-sm)]"
                    style={{
                      color: status.color,
                      backgroundColor: `color-mix(in srgb, ${status.color} 10%, transparent)`,
                    }}
                  >
                    {status.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
