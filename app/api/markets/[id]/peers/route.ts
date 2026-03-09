import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getMarket, updateMarketPeers } from "@/lib/services/market";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const market = await getMarket(userId, id);
  if (!market) {
    return NextResponse.json({ error: "Market not found" }, { status: 404 });
  }

  return NextResponse.json({
    peerMarkets: market.peerMarkets || [],
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: { peerMarkets?: Array<{ name: string; geography: { city: string; state: string } }> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const peers = body.peerMarkets || [];

  // Validate each peer has city + state
  for (let i = 0; i < peers.length; i++) {
    const peer = peers[i];
    if (!peer.geography?.city?.trim() || !peer.geography?.state?.trim()) {
      return NextResponse.json(
        {
          error: "Validation failed",
          errors: { [`peer_${i}`]: "City and state are required for each peer market" },
        },
        { status: 422 }
      );
    }
    if (!peer.name?.trim()) {
      peers[i].name = `${peer.geography.city}, ${peer.geography.state}`;
    }
  }

  try {
    const market = await updateMarketPeers(userId, id, peers);
    return NextResponse.json({ market });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update peer markets";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
