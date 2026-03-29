import { redirect } from "next/navigation";
import { getAuthUserId } from "@/lib/supabase/auth";
import { getMarkets } from "@/lib/services/market";
import { getReports } from "@/lib/services/report";
import { getContentStudios } from "@/lib/services/content-studio";
import { HowToContent } from "@/components/how-to/how-to-content";

export default async function HowToPage() {
  const authId = await getAuthUserId();
  if (!authId) redirect("/sign-in");

  const [markets, reports, studios] = await Promise.all([
    getMarkets(authId).catch(() => [] as Awaited<ReturnType<typeof getMarkets>>),
    getReports(authId).catch(() => [] as Awaited<ReturnType<typeof getReports>>),
    getContentStudios(authId).catch(() => [] as Awaited<ReturnType<typeof getContentStudios>>),
  ]);

  return (
    <HowToContent
      hasMarkets={markets.length > 0}
      hasReports={reports.length > 0}
      hasKit={studios.length > 0}
    />
  );
}
