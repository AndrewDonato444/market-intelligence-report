import { getAuthUserId } from "@/lib/supabase/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getMarkets, getMarketReportCount } from "@/lib/services/market";
import { DeleteMarketButton } from "@/components/markets/delete-market-button";

const TIER_LABELS: Record<string, string> = {
  luxury: "Luxury",
  high_luxury: "High Luxury",
  ultra_luxury: "Ultra Luxury",
};

function formatPrice(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(value % 1000000 === 0 ? 0 : 1)}M`;
  }
  return `$${value.toLocaleString()}`;
}

export default async function MarketsPage() {
  const userId = await getAuthUserId();
  if (!userId) redirect("/sign-in");

  const markets = await getMarkets(userId);

  // Fetch report counts for each market (for delete confirmation)
  const reportCounts = await Promise.all(
    markets.map((m) => getMarketReportCount(userId, m.id))
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-[family-name:var(--font-serif)] text-2xl font-bold text-[var(--color-primary)]">
            Markets
          </h2>
          <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] mt-1">
            Define and manage your target luxury markets.
          </p>
        </div>
        <Link
          href="/markets/new"
          className="px-4 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-primary)] font-[family-name:var(--font-sans)] font-semibold text-sm rounded-[var(--radius-sm)] transition-colors duration-[var(--duration-default)]"
        >
          Define New Market
        </Link>
      </div>

      {markets.length === 0 ? (
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] p-8 text-center">
          <h3 className="font-[family-name:var(--font-serif)] text-lg font-semibold text-[var(--color-primary)]">
            No markets defined yet
          </h3>
          <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] mt-2">
            Define your first target market to start generating intelligence
            reports.
          </p>
          <Link
            href="/markets/new"
            className="inline-block mt-4 px-6 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-primary)] font-[family-name:var(--font-sans)] font-semibold text-sm rounded-[var(--radius-sm)] transition-colors duration-[var(--duration-default)]"
          >
            Define New Market
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {markets.map((market, idx) => {
            const geo = market.geography as {
              city: string;
              state: string;
              county?: string;
            };
            return (
              <div
                key={market.id}
                className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] p-5 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-[family-name:var(--font-sans)] text-base font-semibold text-[var(--color-text)]">
                      {market.name}
                    </h3>
                    {market.isDefault === 1 && (
                      <span className="px-2 py-0.5 bg-[var(--color-accent-light)] text-[var(--color-accent)] font-[family-name:var(--font-sans)] text-xs font-medium rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] mt-1">
                    {geo.city}, {geo.state}
                    {geo.county ? ` · ${geo.county}` : ""}
                  </p>
                  <div className="flex gap-3 mt-2">
                    <span className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-tertiary)]">
                      {TIER_LABELS[market.luxuryTier] || market.luxuryTier}
                    </span>
                    <span className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-tertiary)]">
                      {formatPrice(market.priceFloor)}
                      {market.priceCeiling
                        ? ` – ${formatPrice(market.priceCeiling)}`
                        : "+"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/markets/${market.id}/edit`}
                    className="px-3 py-1.5 text-xs font-[family-name:var(--font-sans)] font-medium text-[var(--color-text-secondary)] border border-[var(--color-border)] rounded-[var(--radius-sm)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors duration-[var(--duration-default)]"
                  >
                    Edit
                  </Link>
                  <Link
                    href={`/markets/${market.id}/peers`}
                    className="px-3 py-1.5 text-xs font-[family-name:var(--font-sans)] font-medium text-[var(--color-accent)] border border-[var(--color-accent)] rounded-[var(--radius-sm)] hover:bg-[var(--color-accent-light)] transition-colors duration-[var(--duration-default)]"
                  >
                    Peers
                  </Link>
                  <DeleteMarketButton
                    marketId={market.id}
                    marketName={market.name}
                    reportCount={reportCounts[idx]}
                  />
                  <div className="w-1 h-8 bg-[var(--color-accent)] rounded-full" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
