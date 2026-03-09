import { getAuthUser } from "@/lib/supabase/auth";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/services/profile";
import { AccountSettings } from "@/components/account/account-settings";

export default async function AccountPage() {
  const authUser = await getAuthUser();
  if (!authUser) {
    redirect("/sign-in");
  }

  const profile = await getProfile(authUser.id);

  return (
    <div className="max-w-3xl">
      <AccountSettings
        email={authUser.email}
        memberSince={profile?.createdAt?.toISOString() || new Date().toISOString()}
        stats={{ reportCount: 0, marketCount: 0 }}
      />
    </div>
  );
}
