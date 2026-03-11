import { requireAdmin } from "@/lib/supabase/admin-auth";
import { redirect } from "next/navigation";
import { ReportEvalDashboard } from "@/components/eval/report-eval-dashboard";

export default async function AdminReportEvalPage() {
  const adminId = await requireAdmin();
  if (!adminId) {
    redirect("/dashboard");
  }

  return <ReportEvalDashboard />;
}
