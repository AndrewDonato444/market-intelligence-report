import { TopNav, Sidebar, PageShell } from "@/components/layout";
import { getAuthUserId } from "@/lib/supabase/auth";
import { getProfile } from "@/lib/services/profile";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let isAdmin = false;
  try {
    const authId = await getAuthUserId();
    if (authId) {
      const profile = await getProfile(authId);
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
