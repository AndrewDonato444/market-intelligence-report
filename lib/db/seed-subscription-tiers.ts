import { db } from "@/lib/db";
import { subscriptionTiers, type TierEntitlements } from "./schema";

export const DEFAULT_TIERS: Array<{
  name: string;
  slug: string;
  description: string;
  entitlements: TierEntitlements;
  displayPrice: string;
  monthlyPriceInCents: number | null;
  isActive: boolean;
  sortOrder: number;
}> = [
  {
    name: "Starter",
    slug: "starter",
    description:
      "Get started with basic market intelligence. Perfect for agents exploring the platform.",
    entitlements: {
      reports_per_month: 2,
      markets_created: 1,
      social_media_kits: 0,
      email_campaigns: 0,
      personas_per_report: 1,
      transaction_limit: 100,
    },
    displayPrice: "Free",
    monthlyPriceInCents: null,
    isActive: true,
    sortOrder: 1,
  },
  {
    name: "Professional",
    slug: "professional",
    description:
      "Full-featured market intelligence for serious luxury agents. Includes social media kits and multiple personas.",
    entitlements: {
      reports_per_month: 10,
      markets_created: 3,
      social_media_kits: 1,
      email_campaigns: 1,
      personas_per_report: 3,
      transaction_limit: 500,
    },
    displayPrice: "$199/mo",
    monthlyPriceInCents: 19900,
    isActive: true,
    sortOrder: 2,
  },
  {
    name: "Enterprise",
    slug: "enterprise",
    description:
      "Unlimited access for teams and brokerages. Custom pricing with dedicated support.",
    entitlements: {
      reports_per_month: -1,
      markets_created: -1,
      social_media_kits: -1,
      email_campaigns: -1,
      personas_per_report: 3,
      transaction_limit: -1,
    },
    displayPrice: "Custom",
    monthlyPriceInCents: null,
    isActive: true,
    sortOrder: 3,
  },
];

/**
 * Seed the subscription_tiers table with default tiers.
 * Idempotent — uses ON CONFLICT DO NOTHING so re-running is safe.
 */
export async function seedSubscriptionTiers() {
  await db
    .insert(subscriptionTiers)
    .values(DEFAULT_TIERS)
    .onConflictDoNothing();
}
