import { requireAdmin } from "@/lib/supabase/admin-auth";
import { redirect } from "next/navigation";
import { WaitlistDashboard } from "@/components/admin/waitlist-dashboard";

export default async function AdminWaitlistPage() {
  const adminId = await requireAdmin();
  if (!adminId) {
    redirect("/dashboard");
  }

  return <WaitlistDashboard />;
}
