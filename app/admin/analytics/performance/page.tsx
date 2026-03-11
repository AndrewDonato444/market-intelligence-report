import { requireAdmin } from "@/lib/supabase/admin-auth";
import { redirect } from "next/navigation";
import { PipelinePerformanceDashboard } from "@/components/admin/pipeline-performance-dashboard";

export default async function AdminPipelinePerformancePage() {
  const adminId = await requireAdmin();
  if (!adminId) {
    redirect("/dashboard");
  }

  return <PipelinePerformanceDashboard />;
}
