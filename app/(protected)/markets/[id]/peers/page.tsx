import { getAuthUserId } from "@/lib/supabase/auth";
import { redirect, notFound } from "next/navigation";
import { getMarket } from "@/lib/services/market";
import { PeerMarketForm } from "@/components/markets/peer-market-form";

export default async function PeerMarketsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await getAuthUserId();
  if (!userId) redirect("/sign-in");

  const { id } = await params;
  const market = await getMarket(userId, id);
  if (!market) notFound();

  const peerMarkets = (market.peerMarkets as Array<{
    name: string;
    geography: { city: string; state: string };
  }>) || [];

  const geo = market.geography as { city: string; state: string };

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--color-app-text)]">
          {market.name}
        </h2>
        <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-app-text-secondary)] mt-1">
          {geo.city}, {geo.state} — Competitive analysis peers
        </p>
        <div className="w-12 h-0.5 bg-[var(--color-app-accent)] mt-3" />
      </div>

      <PeerMarketForm marketId={market.id} initialPeers={peerMarkets} />
    </div>
  );
}
