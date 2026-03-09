import { getAuthUserId } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";
import { getProfile } from "@/lib/services/profile";
import { getUsageLog } from "@/lib/services/api-usage";

export async function GET(request: Request) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getProfile(userId);
  if (!profile) {
    return NextResponse.json({ entries: [], total: 0 });
  }

  const url = new URL(request.url);
  const provider = url.searchParams.get("provider") || undefined;
  const limit = parseInt(url.searchParams.get("limit") || "50", 10);
  const offset = parseInt(url.searchParams.get("offset") || "0", 10);
  const sinceParam = url.searchParams.get("since");
  const since = sinceParam ? new Date(sinceParam) : undefined;

  const result = await getUsageLog(profile.id, { provider, limit, offset, since });
  return NextResponse.json(result);
}
