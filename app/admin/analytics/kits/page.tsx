import { requireAdmin } from "@/lib/supabase/admin-auth";
import { redirect } from "next/navigation";
import { KitAnalyticsDashboard } from "@/components/admin/kit-analytics-dashboard";

export default async function AdminKitAnalyticsPage() {
  const adminId = await requireAdmin();
  if (!adminId) {
    redirect("/dashboard");
  }

  return <KitAnalyticsDashboard />;
}
