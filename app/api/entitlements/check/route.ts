import { getAuthUserId } from "@/lib/supabase/auth";
import { checkEntitlement } from "@/lib/services/entitlement-check";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  if (!type) {
    return NextResponse.json(
      { error: "Missing required query parameter: type" },
      { status: 400 }
    );
  }

  const result = await checkEntitlement(userId, type);
  return NextResponse.json(result);
}
