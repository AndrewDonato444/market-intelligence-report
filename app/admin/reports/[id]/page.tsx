import { requireAdmin } from "@/lib/supabase/admin-auth";
import { redirect } from "next/navigation";
import { ReportDetailPanel } from "@/components/admin/report-detail-panel";

export default async function AdminReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const adminId = await requireAdmin();
  if (!adminId) {
    redirect("/dashboard");
  }

  const { id } = await params;

  return <ReportDetailPanel reportId={id} />;
}
