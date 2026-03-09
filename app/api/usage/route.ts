import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getProfile } from "@/lib/services/profile";
import { getUsageSummary } from "@/lib/services/api-usage";

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getProfile(userId);
  if (!profile) {
    return NextResponse.json({ summary: { byProvider: [], totalCost: 0, totalCalls: 0, cacheHitRate: 0 } });
  }

  const url = new URL(request.url);
  const sinceParam = url.searchParams.get("since");
  const since = sinceParam ? new Date(sinceParam) : undefined;

  const summary = await getUsageSummary(profile.id, since);
  return NextResponse.json({ summary });
}
