import { requireAdmin } from "@/lib/supabase/admin-auth";
import { redirect } from "next/navigation";
import { UserAnalyticsDashboard } from "@/components/admin/user-analytics-dashboard";

export default async function AdminUserAnalyticsPage() {
  const adminId = await requireAdmin();
  if (!adminId) {
    redirect("/dashboard");
  }

  return <UserAnalyticsDashboard />;
}
