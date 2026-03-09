import { getAuthUserId } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";
import {
  getMarkets,
  createMarket,
  validateMarketData,
} from "@/lib/services/market";

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const markets = await getMarkets(userId);
  return NextResponse.json({ markets });
}

export async function POST(request: Request) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const validation = validateMarketData(body as any);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Validation failed", errors: validation.errors },
      { status: 422 }
    );
  }

  try {
    const market = await createMarket(userId, validation.data!);
    return NextResponse.json({ market }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create market";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
