import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getMarkets } from "@/lib/services/market";
import { getReports } from "@/lib/services/report";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  let markets: Awaited<ReturnType<typeof getMarkets>> = [];
  let reports: Awaited<ReturnType<typeof getReports>> = [];

  try {
    [markets, reports] = await Promise.all([
      getMarkets(user.id),
      getReports(user.id),
    ]);
  } catch (error) {
    console.error("[DashboardPage] Failed to load data:", error);
  }

  // Resolve first name from users table (has name field), fall back to Supabase metadata
  let firstName = "";
  try {
    const [dbUser] = await db
      .select({ name: schema.users.name })
      .from(schema.users)
      .where(eq(schema.users.authId, user.id))
      .limit(1);
    if (dbUser?.name) {
      firstName = dbUser.name.split(" ")[0];
    }
  } catch {
    // Graceful fallback — show "Welcome back." if DB lookup fails
  }
  if (!firstName) {
    const meta = user.user_metadata ?? {};
    const fullName = (meta.full_name || meta.name || "") as string;
    firstName = fullName.split(" ")[0] || "";
  }

  return (
    <div>
      <DashboardContent markets={markets} reports={reports} firstName={firstName} />
    </div>
  );
}
