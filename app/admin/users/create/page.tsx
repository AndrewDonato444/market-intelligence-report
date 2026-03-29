import { requireAdmin } from "@/lib/supabase/admin-auth";
import { redirect } from "next/navigation";
import { CreateUserForm } from "@/components/admin/create-user-form";

export default async function AdminCreateUserPage() {
  const adminId = await requireAdmin();
  if (!adminId) {
    redirect("/dashboard");
  }

  return <CreateUserForm />;
}
