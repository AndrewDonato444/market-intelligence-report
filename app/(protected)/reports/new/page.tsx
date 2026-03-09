import { getAuthUserId } from "@/lib/supabase/auth";
import { redirect } from "next/navigation";
import { getMarkets } from "@/lib/services/market";
import { ReportWizard } from "@/components/reports/report-wizard";

export default async function NewReportPage() {
  const authId = await getAuthUserId();
  if (!authId) redirect("/sign-in");

  const markets = await getMarkets(authId);

  return <ReportWizard markets={markets} />;
}
