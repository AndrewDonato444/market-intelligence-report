import { getAuthUserId } from "@/lib/supabase/auth";
import { redirect } from "next/navigation";
import { getUsageSummary, getUsageLog } from "@/lib/services/api-usage";
import { UsageSummaryCards } from "@/components/account/usage-summary-cards";
import { UsageByProvider } from "@/components/account/usage-by-provider";
import { UsageLog } from "@/components/account/usage-log";

export default async function UsagePage() {
  const authId = await getAuthUserId();
  if (!authId) {
    redirect("/sign-in");
  }

  const summary = await getUsageSummary(authId);
  const logResult = await getUsageLog(authId, { limit: 20 });

  return (
    <div className="max-w-4xl space-y-6">
      <UsageSummaryCards
        totalCost={summary.totalCost}
        totalCalls={summary.totalCalls}
        cacheHitRate={summary.cacheHitRate}
      />

      <UsageByProvider providers={summary.byProvider} />

      <UsageLog
        entries={logResult.entries.map((e) => ({
          ...e,
          createdAt: e.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
