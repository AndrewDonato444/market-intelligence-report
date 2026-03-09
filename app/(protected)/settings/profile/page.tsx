import { getAuthUser } from "@/lib/supabase/auth";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/services/profile";
import { ProfileForm } from "@/components/profile/profile-form";

export default async function ProfilePage() {
  const authUser = await getAuthUser();
  if (!authUser) {
    redirect("/sign-in");
  }

  const profile = await getProfile(authUser.id);

  const initialData = {
    name: profile?.name || "",
    email: authUser.email,
    company: profile?.company || "",
    title: profile?.title || "",
    phone: profile?.phone || "",
    bio: profile?.bio || "",
    brandColors: (profile?.brandColors as {
      primary?: string;
      secondary?: string;
      accent?: string;
    }) || null,
  };

  return (
    <div className="max-w-3xl">
      <ProfileForm initialData={initialData} />
    </div>
  );
}
