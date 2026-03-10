import { getAuthUserId } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";
import { getAllBuyerPersonas } from "@/lib/services/buyer-personas";

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const personas = await getAllBuyerPersonas();
    return NextResponse.json({ personas });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch buyer personas";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
