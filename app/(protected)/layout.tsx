import { TopNav, Sidebar, PageShell } from "@/components/layout";
import { getAuthUser } from "@/lib/supabase/auth";
import { ensureUserProfile } from "@/lib/services/profile";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let isAdmin = false;
  try {
    const authUser = await getAuthUser();
    if (authUser) {
      const profile = await ensureUserProfile(authUser.id, authUser.email);
      isAdmin = profile?.role === "admin";
    }
  } catch {
    // Silently fail — non-admin by default
  }

  return (
    <div className="h-screen flex flex-col">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isAdmin={isAdmin} />
        <PageShell>{children}</PageShell>
      </div>
    </div>
  );
}
