import { requireAdmin } from "@/lib/supabase/admin-auth";
import { redirect } from "next/navigation";
import { UserListDashboard } from "@/components/admin/user-list-dashboard";

export default async function AdminUsersPage() {
  const adminId = await requireAdmin();
  if (!adminId) {
    redirect("/dashboard");
  }

  return <UserListDashboard />;
}
