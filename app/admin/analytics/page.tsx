import { requireAdmin } from "@/lib/supabase/admin-auth";
import { redirect } from "next/navigation";
import { VolumeMetricsDashboard } from "@/components/admin/volume-metrics-dashboard";

export default async function AdminAnalyticsPage() {
  const adminId = await requireAdmin();
  if (!adminId) {
    redirect("/dashboard");
  }

  return <VolumeMetricsDashboard />;
}
