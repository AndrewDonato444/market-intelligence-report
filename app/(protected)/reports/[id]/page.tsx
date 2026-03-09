import { getAuthUserId } from "@/lib/supabase/auth";
import { redirect, notFound } from "next/navigation";
import { getReportWithMarket, getReportSections } from "@/lib/services/report";
import { PipelineStatusDashboard } from "@/components/reports/pipeline-status";
import { ReportPreview } from "@/components/reports/report-preview";

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
      {report.status === "completed" && <ReportPreview sections={sections} />}
    </div>
  );
}
