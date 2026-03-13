import { requireAdmin } from "@/lib/supabase/admin-auth";
import { redirect } from "next/navigation";
import { TestSuiteDashboard } from "@/components/admin/test-suite-dashboard";

export default async function AdminTestSuitePage() {
  const adminId = await requireAdmin();
  if (!adminId) {
    redirect("/dashboard");
  }

  return <TestSuiteDashboard />;
}
