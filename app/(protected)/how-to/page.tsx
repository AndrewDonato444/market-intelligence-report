import { redirect } from "next/navigation";
import { getAuthUserId } from "@/lib/supabase/auth";
import { getMarkets } from "@/lib/services/market";
import { getReports } from "@/lib/services/report";
import { HowToContent } from "@/components/how-to/how-to-content";

export default async function HowToPage() {
  const authId = await getAuthUserId();
  if (!authId) redirect("/sign-in");

  const [markets, reports] = await Promise.all([
    getMarkets(authId).catch(() => [] as Awaited<ReturnType<typeof getMarkets>>),
    getReports(authId).catch(() => [] as Awaited<ReturnType<typeof getReports>>),
  ]);

  return (
    <HowToContent
      hasMarkets={markets.length > 0}
      hasReports={reports.length > 0}
    />
  );
}
