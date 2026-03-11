import { requireAdmin } from "@/lib/supabase/admin-auth";
import { redirect } from "next/navigation";
import { ReportListDashboard } from "@/components/admin/report-list-dashboard";

export default async function AdminReportsPage() {
  const adminId = await requireAdmin();
  if (!adminId) {
    redirect("/dashboard");
  }

  return <ReportListDashboard />;
}
