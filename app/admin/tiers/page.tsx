import { requireAdmin } from "@/lib/supabase/admin-auth";
import { redirect } from "next/navigation";
import { TierManagementDashboard } from "@/components/admin/tier-management-dashboard";

export default async function AdminTiersPage() {
  const adminId = await requireAdmin();
  if (!adminId) {
    redirect("/dashboard");
  }

  return <TierManagementDashboard />;
}
