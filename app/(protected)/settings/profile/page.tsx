import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/services/profile";
import { ProfileForm } from "@/components/profile/profile-form";

export default async function ProfilePage() {
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const profile = await getProfile(user.id);
  const email = user.emailAddresses?.[0]?.emailAddress || "";

  const initialData = {
    name:
      profile?.name ||
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      "",
    email,
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
