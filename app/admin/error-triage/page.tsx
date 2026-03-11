import { requireAdmin } from "@/lib/supabase/admin-auth";
import { redirect } from "next/navigation";
import { ErrorTriageDashboard } from "@/components/admin/error-triage-dashboard";

export default async function AdminErrorTriagePage() {
  const adminId = await requireAdmin();
  if (!adminId) {
    redirect("/dashboard");
  }

  return <ErrorTriageDashboard />;
}
