"use client";

import Link from "next/link";

interface MarketCardProps {
  market: {
    id: string;
    name: string;
    luxuryTier: "luxury" | "high_luxury" | "ultra_luxury";
    priceFloor: number;
    priceCeiling: number | null;
    segments: string[] | null;
  };
}

const TIER_LABELS: Record<string, string> = {
  luxury: "LUXURY",
  high_luxury: "HIGH LUXURY",
  ultra_luxury: "ULTRA LUXURY",
};

function formatPriceFloor(price: number): string {
  if (price >= 1_000_000) {
    const millions = price / 1_000_000;
    return `$${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M+`;
  }
  return `$${(price / 1000).toFixed(0)}K+`;
}

export function MarketCard({ market }: MarketCardProps) {
  const tierLabel = TIER_LABELS[market.luxuryTier] || "LUXURY";

  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-shadow p-[var(--spacing-4)]">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-[family-name:var(--font-sans)] text-lg font-semibold text-[var(--color-text)]">
            {market.name}
          </h3>
          <span className="inline-block mt-[var(--spacing-2)] bg-[var(--color-accent-light)] text-[var(--color-accent-hover)] text-xs font-medium px-2 py-0.5 rounded-full">
            {tierLabel}
          </span>
        </div>
        <Link
          href={`/reports/create?marketId=${market.id}`}
          className="ml-[var(--spacing-3)] inline-flex items-center px-3 py-1.5 bg-[var(--color-accent)] text-[var(--color-primary)] rounded-[var(--radius-sm)] font-[family-name:var(--font-sans)] font-semibold text-sm hover:bg-[var(--color-accent-hover)] transition-colors whitespace-nowrap"
        >
          New Report
        </Link>
      </div>

      <div className="mt-[var(--spacing-3)]">
        {market.segments && market.segments.length > 0 && (
          <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)]">
            {market.segments.join(" \u00B7 ")}
          </p>
        )}
        <p className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-tertiary)] mt-[var(--spacing-1)]">
          {formatPriceFloor(market.priceFloor)} floor
        </p>
      </div>
    </div>
  );
}
