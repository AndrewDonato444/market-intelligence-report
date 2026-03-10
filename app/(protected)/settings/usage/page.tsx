import { getAuthUserId } from "@/lib/supabase/auth";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/services/profile";
import { getUsageSummary, getUsageLog } from "@/lib/services/api-usage";
import { UsageSummaryCards } from "@/components/account/usage-summary-cards";
import { UsageByProvider } from "@/components/account/usage-by-provider";
import { UsageLog } from "@/components/account/usage-log";

export default async function UsagePage() {
  const authId = await getAuthUserId();
  if (!authId) {
    redirect("/sign-in");
  }

  // Resolve Supabase auth ID → internal DB user ID for api_usage queries
  const profile = await getProfile(authId);
  if (!profile) {
    redirect("/sign-in");
  }

  const summary = await getUsageSummary(profile.id);
  const logResult = await getUsageLog(profile.id, { limit: 20 });

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
