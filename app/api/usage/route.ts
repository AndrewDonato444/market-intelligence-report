import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/supabase/auth";
import { getUsageSummary } from "@/lib/services/api-usage";

export async function GET(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const since = searchParams.get("since") ?? undefined;

  const summary = await getUsageSummary(userId, since ? { since } : undefined);
  return NextResponse.json(summary);
}
