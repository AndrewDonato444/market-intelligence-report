import { getAuthUserId } from "@/lib/supabase/auth";
import { redirect, notFound } from "next/navigation";
import { getReportWithMarket, getReportSections } from "@/lib/services/report";
import { PipelineStatusDashboard } from "@/components/reports/pipeline-status";
import { ReportPreview } from "@/components/reports/report-preview";
import { ReportActions } from "@/components/reports/report-actions";
import { ContentStudioButton } from "@/components/reports/content-studio-button";
import { ReportDisclaimer } from "@/components/reports/report-disclaimer";

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

  // Load sections and kit status for completed reports
  const sections =
    report.status === "completed"
      ? (await getReportSections(authId, id)) ?? []
      : [];

  return (
    <div className="space-y-6">
      <PipelineStatusDashboard report={{
        id: report.id,
        title: report.title,
        status: report.status,
        marketName: report.marketName,
        config: report.config,
        createdAt: report.createdAt?.toISOString() ?? null,
        generationStartedAt: report.generationStartedAt?.toISOString() ?? null,
        generationCompletedAt: report.generationCompletedAt?.toISOString() ?? null,
        errorMessage: report.errorMessage,
      }} />
      {report.status === "completed" && (
        <>
          <ReportActions
            reportId={id}
            reportTitle={report.title}
            shareToken={report.shareToken}
            shareTokenExpiresAt={report.shareTokenExpiresAt?.toISOString()}
          />
          <ContentStudioButton reportId={id} />
          <ReportDisclaimer />
          <ReportPreview sections={sections} />
        </>
      )}
    </div>
  );
}
