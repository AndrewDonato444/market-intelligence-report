import { getAuthUserId } from "@/lib/supabase/auth";
import { redirect } from "next/navigation";
import { getMarkets } from "@/lib/services/market";
import { CreationFlowShell } from "@/components/reports/creation-flow-shell";

interface CreateReportPageProps {
  searchParams: Promise<{ marketId?: string }>;
}

export default async function CreateReportPage({ searchParams }: CreateReportPageProps) {
  const authId = await getAuthUserId();
  if (!authId) redirect("/sign-in");

  const [markets, params] = await Promise.all([
    getMarkets(authId),
    searchParams,
  ]);

  return (
    <CreationFlowShell
      markets={markets}
      preselectedMarketId={params.marketId}
    />
  );
}
