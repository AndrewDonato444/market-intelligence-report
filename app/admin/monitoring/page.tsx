import { requireAdmin } from "@/lib/supabase/admin-auth";
import { redirect } from "next/navigation";
import { SystemMonitoringDashboard } from "@/components/admin/system-monitoring-dashboard";

export default async function AdminMonitoringPage() {
  const adminId = await requireAdmin();
  if (!adminId) {
    redirect("/dashboard");
  }

  return <SystemMonitoringDashboard />;
}
