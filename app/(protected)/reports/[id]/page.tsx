import { getAuthUserId } from "@/lib/supabase/auth";
import { redirect, notFound } from "next/navigation";
import { getReportWithMarket, getReportSections } from "@/lib/services/report";
import { PipelineStatusDashboard } from "@/components/reports/pipeline-status";
import { ReportPreview } from "@/components/reports/report-preview";
import { ReportActions } from "@/components/reports/report-actions";
import { ReportEditor } from "@/components/reports/report-editor";

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const authId = await getAuthUserId();
  if (!authId) redirect("/sign-in");

  const { id } = await params;
  const report = await getReportWithMarket(authId, id);

  if (!report) {
    notFound();
  }

  // Load sections for completed reports
  const sections =
    report.status === "completed"
      ? (await getReportSections(authId, id)) ?? []
      : [];

  return (
    <div className="space-y-6">
      <PipelineStatusDashboard report={report} />
      {report.status === "completed" && (
        <>
          <ReportActions
            reportId={id}
            reportTitle={report.title}
            shareToken={report.shareToken}
            shareTokenExpiresAt={report.shareTokenExpiresAt?.toISOString()}
          />
          <ReportEditor
            reportId={id}
            sections={sections.map((s) => ({
              id: s.id,
              sectionType: s.sectionType,
              title: s.title,
              content: s.content as Record<string, unknown>,
              sortOrder: s.sortOrder,
            }))}
          />
          <ReportPreview sections={sections} />
        </>
      )}
    </div>
  );
}
