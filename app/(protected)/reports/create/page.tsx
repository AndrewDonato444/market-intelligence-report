import { getAuthUserId } from "@/lib/supabase/auth";
import { redirect } from "next/navigation";
import { getMarkets } from "@/lib/services/market";
import { CreationFlowShell } from "@/components/reports/creation-flow-shell";

export default async function CreateReportPage() {
  const authId = await getAuthUserId();
  if (!authId) redirect("/sign-in");

  const markets = await getMarkets(authId);

  return <CreationFlowShell markets={markets} />;
}
