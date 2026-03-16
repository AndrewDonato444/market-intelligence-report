import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getMarkets } from "@/lib/services/market";
import { getReports } from "@/lib/services/report";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

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

  return (
    <div>
      <DashboardContent markets={markets} reports={reports} />
    </div>
  );
}
