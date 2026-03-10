import { requireAdmin } from "@/lib/supabase/admin-auth";
import { redirect } from "next/navigation";
import { PipelineVisualizer } from "@/components/admin/pipeline-visualizer";

export default async function AdminPipelinePage() {
  const adminId = await requireAdmin();
  if (!adminId) {
    redirect("/dashboard");
  }

  return <PipelineVisualizer />;
}
