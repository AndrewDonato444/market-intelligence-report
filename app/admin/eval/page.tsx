import { requireAdmin } from "@/lib/supabase/admin-auth";
import { redirect } from "next/navigation";
import { EvalDashboard } from "@/components/eval/eval-dashboard";

export default async function AdminEvalPage() {
  const adminId = await requireAdmin();
  if (!adminId) {
    redirect("/dashboard");
  }

  return <EvalDashboard />;
}
