import { getAuthUser } from "@/lib/supabase/auth";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/services/profile";
import { AccountSettings } from "@/components/account/account-settings";
import { db, schema } from "@/lib/db";
import { eq, count } from "drizzle-orm";

export default async function AccountPage() {
  const authUser = await getAuthUser();
  if (!authUser) {
    redirect("/sign-in");
  }

  const profile = await getProfile(authUser.id);

  // Fetch real report and market counts from DB
  let reportCount = 0;
  let marketCount = 0;

  if (profile) {
    const [reportResult] = await db
      .select({ count: count() })
      .from(schema.reports)
      .where(eq(schema.reports.userId, profile.id));

    const [marketResult] = await db
      .select({ count: count() })
      .from(schema.markets)
      .where(eq(schema.markets.userId, profile.id));

    reportCount = reportResult?.count ?? 0;
    marketCount = marketResult?.count ?? 0;
  }

  return (
    <div className="max-w-3xl">
      <AccountSettings
        email={authUser.email}
        memberSince={profile?.createdAt?.toISOString() || new Date().toISOString()}
        stats={{ reportCount, marketCount }}
      />
    </div>
  );
}
