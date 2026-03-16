import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/supabase/auth";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { lookupProperty } from "@/lib/services/deal-analyzer/property-lookup";

export async function POST(request: Request) {
  // 1. Auth
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse and validate input
  let body: { address?: string; marketId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const address = body.address?.trim();
  if (!address) {
    return NextResponse.json(
      { error: "address is required" },
      { status: 400 }
    );
  }

  const marketId = body.marketId;
  if (!marketId) {
    return NextResponse.json(
      { error: "marketId is required" },
      { status: 400 }
    );
  }

  // 3. Fetch market and verify ownership
  const markets = await db
    .select()
    .from(schema.markets)
    .where(eq(schema.markets.id, marketId))
    .limit(1);

  if (markets.length === 0) {
    return NextResponse.json({ error: "Market not found" }, { status: 404 });
  }

  const market = markets[0];
  if (market.userId !== userId) {
    return NextResponse.json(
      { error: "You don't have access to this market" },
      { status: 403 }
    );
  }

  // 4. Perform property lookup
  const result = await lookupProperty(
    address,
    market.geography as {
      city: string;
      state: string;
      county?: string;
      region?: string;
      zipCodes?: string[];
    },
    market.name,
    { userId }
  );

  // Check if result is an error
  if ("status" in result && "error" in result && !("property" in result)) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }

  return NextResponse.json(result);
}
