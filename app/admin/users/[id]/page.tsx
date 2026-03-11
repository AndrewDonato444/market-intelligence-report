import { requireAdmin } from "@/lib/supabase/admin-auth";
import { redirect } from "next/navigation";
import { UserDetailPanel } from "@/components/admin/user-detail-panel";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const adminId = await requireAdmin();
  if (!adminId) {
    redirect("/dashboard");
  }

  const { id } = await params;

  return <UserDetailPanel userId={id} />;
}
