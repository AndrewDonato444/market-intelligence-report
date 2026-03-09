import Link from "next/link";
import { getAuthUserId } from "@/lib/supabase/auth";
import { redirect } from "next/navigation";
import { getReports } from "@/lib/services/report";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  queued: { label: "Queued", color: "var(--color-text-secondary)" },
  generating: { label: "Generating", color: "var(--color-accent)" },
  completed: { label: "Completed", color: "var(--color-success)" },
  failed: { label: "Failed", color: "var(--color-error)" },
};

export default async function ReportsPage() {
  const authId = await getAuthUserId();
  if (!authId) redirect("/sign-in");

  const reports = await getReports(authId);

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
          href="/reports/new"
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
            href="/reports/new"
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
                <div>
                  <h3 className="font-[family-name:var(--font-sans)] text-sm font-medium text-[var(--color-text)]">
                    {report.title}
                  </h3>
                  <p className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)] mt-0.5">
                    {report.marketName} &middot; Created{" "}
                    {report.createdAt
                      ? new Date(report.createdAt).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
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
            );
          })}
        </div>
      )}
    </div>
  );
}
