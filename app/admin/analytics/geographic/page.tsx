import { requireAdmin } from "@/lib/supabase/admin-auth";
import { redirect } from "next/navigation";
import { GeographicAnalyticsDashboard } from "@/components/admin/geographic-analytics-dashboard";

export default async function AdminGeographicAnalyticsPage() {
  const adminId = await requireAdmin();
  if (!adminId) {
    redirect("/dashboard");
  }

  return <GeographicAnalyticsDashboard />;
}
