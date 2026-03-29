"use client";

import Link from "next/link";
import { useState } from "react";

interface MarketCardProps {
  market: {
    id: string;
    name: string;
    geography: { city: string; state: string };
    luxuryTier: "luxury" | "high_luxury" | "ultra_luxury";
    priceFloor: number;
    priceCeiling: number | null;
    segments: string[] | null;
  };
  lastReportDate?: Date | null;
}

const TIER_LABELS: Record<string, string> = {
  luxury: "LUXURY",
  high_luxury: "HIGH LUXURY",
  ultra_luxury: "ULTRA LUXURY",
};

// State name → abbreviation for building image file slugs.
const STATE_ABBR: Record<string, string> = {
  alabama: "al", alaska: "ak", arizona: "az", arkansas: "ar", california: "ca",
  colorado: "co", connecticut: "ct", delaware: "de", "district of columbia": "dc",
  florida: "fl", georgia: "ga", hawaii: "hi", idaho: "id", illinois: "il",
  indiana: "in", iowa: "ia", kansas: "ks", kentucky: "ky", louisiana: "la",
  maine: "me", maryland: "md", massachusetts: "ma", michigan: "mi", minnesota: "mn",
  mississippi: "ms", missouri: "mo", montana: "mt", nebraska: "ne", nevada: "nv",
  "new hampshire": "nh", "new jersey": "nj", "new mexico": "nm", "new york": "ny",
  "north carolina": "nc", "north dakota": "nd", ohio: "oh", oklahoma: "ok",
  oregon: "or", pennsylvania: "pa", "rhode island": "ri", "south carolina": "sc",
  "south dakota": "sd", tennessee: "tn", texas: "tx", utah: "ut", vermont: "vt",
  virginia: "va", washington: "wa", "west virginia": "wv", wisconsin: "wi",
  wyoming: "wy",
};

const SUPABASE_STORAGE_URL =
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/market-images`;

function getMarketImageUrl(city: string, state: string): string {
  const citySlug = city
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+$/, "")
    .replace(/^-+/, "");
  const abbr = STATE_ABBR[state.toLowerCase()] || "";
  if (!citySlug || !abbr) return "";
  return `${SUPABASE_STORAGE_URL}/${citySlug}-${abbr}.jpg`;
}

function formatPriceFloor(price: number): string {
  if (price >= 1_000_000) {
    const millions = price / 1_000_000;
    return `$${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M+`;
  }
  return `$${(price / 1000).toFixed(0)}K+`;
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function MarketCard({ market, lastReportDate }: MarketCardProps) {
  const tierLabel = TIER_LABELS[market.luxuryTier] || "LUXURY";
  const imageUrl = getMarketImageUrl(market.geography.city, market.geography.state);
  const [imgFailed, setImgFailed] = useState(false);

  const showPhoto = imageUrl && !imgFailed;

  return (
    <Link
      href={`/reports/create?marketId=${market.id}`}
      className="group relative block overflow-hidden rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-shadow h-[220px]"
    >
      {/* Background: AI-generated photo or branded gradient fallback */}
      {showPhoto ? (
        <img
          src={imageUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, var(--color-app-nav-bg) 0%, #2C2825 100%)",
          }}
        />
      )}

      {/* Gradient overlay for text legibility */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, transparent 10%, rgba(26,23,20,0.4) 45%, rgba(26,23,20,0.85) 100%)",
        }}
      />

      {/* Hover overlay — fades in on hover */}
      <div
        data-testid="market-card-hover-overlay"
        className="absolute inset-0 flex items-center justify-center bg-[rgba(26,23,20,0.75)] opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
      >
        <span className="font-[family-name:var(--font-body)] text-sm font-semibold text-[var(--color-text-inverse)] tracking-wide">
          Generate New Report
        </span>
      </div>

      {/* Card content — centered */}
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-[var(--spacing-6)] px-[var(--spacing-4)] z-[5]">
        <h3
          className="font-[family-name:var(--font-display)] text-xl font-semibold leading-snug text-center"
          style={{ color: "var(--color-text-inverse)" }}
        >
          {market.geography.city}
        </h3>
        <div className="flex items-center gap-[var(--spacing-2)] mt-[var(--spacing-2)]">
          <span className="inline-block bg-[var(--color-app-accent-light)] text-[var(--color-app-accent)] text-xs font-medium px-2 py-0.5 rounded-full">
            {tierLabel}
          </span>
          <span
            className="text-xs"
            style={{ color: "rgba(253,252,250,0.55)" }}
          >
            {formatPriceFloor(market.priceFloor)} floor
          </span>
        </div>
        {lastReportDate && (
          <span
            className="text-xs mt-[var(--spacing-1)]"
            style={{ color: "rgba(253,252,250,0.45)" }}
          >
            Last run: {formatShortDate(lastReportDate)}
          </span>
        )}
      </div>
    </Link>
  );
}
