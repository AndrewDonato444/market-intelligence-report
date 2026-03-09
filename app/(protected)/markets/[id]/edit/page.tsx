import { currentUser } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { getMarket } from "@/lib/services/market";
import { MarketWizard } from "@/components/markets/market-wizard";

export default async function EditMarketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const { id } = await params;
  const market = await getMarket(user.id, id);
  if (!market) notFound();

  const geo = market.geography as {
    city: string;
    state: string;
    county?: string;
    region?: string;
  };

  return (
    <div>
      <MarketWizard
        mode="edit"
        marketId={market.id}
        initialData={{
          name: market.name,
          geography: geo,
          luxuryTier: market.luxuryTier as "luxury" | "high_luxury" | "ultra_luxury",
          priceFloor: market.priceFloor,
          priceCeiling: market.priceCeiling,
          segments: market.segments as string[] | null,
          propertyTypes: market.propertyTypes as string[] | null,
        }}
      />
    </div>
  );
}
