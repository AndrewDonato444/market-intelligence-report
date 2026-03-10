import { requireAdmin } from "@/lib/supabase/admin-auth";
import { redirect } from "next/navigation";
import { DataSourcesDashboard } from "@/components/admin/data-sources-dashboard";

export default async function AdminDataSourcesPage() {
  const adminId = await requireAdmin();
  if (!adminId) {
    redirect("/dashboard");
  }

  return <DataSourcesDashboard />;
}
