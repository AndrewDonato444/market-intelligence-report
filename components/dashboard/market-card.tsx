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

/**
 * Builds the Supabase Storage CDN URL for a city hero image.
 * Images are AI-generated and stored as {city-slug}-{abbr}.jpg.
 */
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

export function MarketCard({ market }: MarketCardProps) {
  const tierLabel = TIER_LABELS[market.luxuryTier] || "LUXURY";
  const imageUrl = getMarketImageUrl(market.geography.city, market.geography.state);
  const [imgFailed, setImgFailed] = useState(false);

  const showPhoto = imageUrl && !imgFailed;

  return (
    <div className="relative overflow-hidden rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-shadow h-[220px]">
      {/* Background: local AI-generated photo or branded gradient fallback */}
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
              "linear-gradient(135deg, var(--color-primary) 0%, #1E293B 100%)",
          }}
        />
      )}

      {/* Gradient overlay — darkens bottom for legible text */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, transparent 15%, rgba(15,23,42,0.6) 55%, rgba(15,23,42,0.96) 100%)",
        }}
      />

      {/* Card content */}
      <div className="absolute bottom-0 left-0 right-0 p-[var(--spacing-4)]">
        <div className="flex items-end justify-between gap-[var(--spacing-3)]">
          <div className="flex-1 min-w-0">
            <h3
              className="font-[family-name:var(--font-sans)] text-base font-semibold leading-snug truncate"
              style={{ color: "var(--color-text-inverse)" }}
            >
              {market.name}
            </h3>
            <div className="flex items-center gap-[var(--spacing-2)] mt-[var(--spacing-1)]">
              <span className="inline-block bg-[var(--color-accent-light)] text-[var(--color-accent-hover)] text-xs font-medium px-2 py-0.5 rounded-full">
                {tierLabel}
              </span>
              <span
                className="text-xs"
                style={{ color: "rgba(248,250,252,0.55)" }}
              >
                {formatPriceFloor(market.priceFloor)} floor
              </span>
            </div>
          </div>
          <Link
            href={`/reports/create?marketId=${market.id}`}
            className="shrink-0 inline-flex items-center px-3 py-1.5 bg-[var(--color-accent)] text-[var(--color-primary)] rounded-[var(--radius-sm)] font-[family-name:var(--font-sans)] font-semibold text-sm hover:bg-[var(--color-accent-hover)] transition-colors whitespace-nowrap"
          >
            New Report
          </Link>
        </div>
      </div>
    </div>
  );
}
