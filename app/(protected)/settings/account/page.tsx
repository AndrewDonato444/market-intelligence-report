import { getAuthUser } from "@/lib/supabase/auth";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/services/profile";
import { AccountSettings } from "@/components/account/account-settings";
import type { SubscriptionData } from "@/components/account/account-settings";
import { db, schema } from "@/lib/db";
import { eq, count, gt, asc } from "drizzle-orm";
import { checkEntitlement } from "@/lib/services/entitlement-check";

export default async function AccountPage() {
  const authUser = await getAuthUser();
  if (!authUser) {
    redirect("/sign-in");
  }

  const profile = await getProfile(authUser.id);

  // Fetch real report and market counts from DB
  let reportCount = 0;
  let marketCount = 0;

  if (profile) {
    const [reportResult] = await db
      .select({ count: count() })
      .from(schema.reports)
      .where(eq(schema.reports.userId, profile.id));

    const [marketResult] = await db
      .select({ count: count() })
      .from(schema.markets)
      .where(eq(schema.markets.userId, profile.id));

    reportCount = reportResult?.count ?? 0;
    marketCount = marketResult?.count ?? 0;
  }

  // Fetch subscription + entitlement data
  let subscriptionData: SubscriptionData | null = null;

  if (profile) {
    try {
      // 1. Get user's subscription -> tier
      const [subscription] = await db
        .select({
          tierId: schema.subscriptions.tierId,
        })
        .from(schema.subscriptions)
        .where(eq(schema.subscriptions.userId, profile.id))
        .limit(1);

      // 2. Get tier details (or fall back to Starter defaults)
      let tierName = "Starter";
      let tierDescription =
        "Get started with basic market intelligence. Perfect for agents exploring the platform.";
      let displayPrice = "Free";
      let currentSortOrder = 1;

      if (subscription?.tierId) {
        const [tier] = await db
          .select({
            name: schema.subscriptionTiers.name,
            description: schema.subscriptionTiers.description,
            displayPrice: schema.subscriptionTiers.displayPrice,
            sortOrder: schema.subscriptionTiers.sortOrder,
          })
          .from(schema.subscriptionTiers)
          .where(eq(schema.subscriptionTiers.id, subscription.tierId))
          .limit(1);

        if (tier) {
          tierName = tier.name;
          tierDescription = tier.description || tierDescription;
          displayPrice = tier.displayPrice;
          currentSortOrder = tier.sortOrder;
        }
      }

      // 3. Check entitlements for all types
      const [reportsCheck, marketsCheck, kitsCheck, personasCheck] =
        await Promise.all([
          checkEntitlement(profile.id, "reports_per_month"),
          checkEntitlement(profile.id, "markets_created"),
          checkEntitlement(profile.id, "social_media_kits"),
          checkEntitlement(profile.id, "personas_per_report"),
        ]);

      // 4. Get billing period (1st of current month UTC → last day)
      const now = new Date();
      const periodStart = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
      );
      const periodEnd = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)
      );

      // 5. Get next tier up for upgrade prompt
      let nextTier: SubscriptionData["nextTier"] = null;
      const [nextTierRow] = await db
        .select({
          name: schema.subscriptionTiers.name,
          displayPrice: schema.subscriptionTiers.displayPrice,
          entitlements: schema.subscriptionTiers.entitlements,
        })
        .from(schema.subscriptionTiers)
        .where(gt(schema.subscriptionTiers.sortOrder, currentSortOrder))
        .orderBy(asc(schema.subscriptionTiers.sortOrder))
        .limit(1);

      if (nextTierRow?.entitlements) {
        const ent = nextTierRow.entitlements as {
          reports_per_month: number;
          markets_created: number;
          social_media_kits: number;
          personas_per_report: number;
        };
        nextTier = {
          name: nextTierRow.name,
          displayPrice: nextTierRow.displayPrice,
          entitlements: ent,
        };
      }

      subscriptionData = {
        tierName,
        tierDescription,
        displayPrice,
        entitlements: {
          reports: {
            used: reportsCheck.used,
            limit: reportsCheck.limit,
            remaining: reportsCheck.remaining,
          },
          markets: {
            used: marketsCheck.used,
            limit: marketsCheck.limit,
            remaining: marketsCheck.remaining,
          },
          socialMediaKits: {
            used: kitsCheck.used,
            limit: kitsCheck.limit,
            remaining: kitsCheck.remaining,
          },
          personasPerReport: {
            used: personasCheck.used,
            limit: personasCheck.limit,
            remaining: personasCheck.remaining,
          },
        },
        billingPeriod: {
          start: periodStart.toISOString().split("T")[0],
          end: periodEnd.toISOString().split("T")[0],
        },
        nextTier,
      };
    } catch (err) {
      console.error("[account-page] Failed to load subscription data:", err);
      // subscriptionData stays null -> graceful fallback
    }
  }

  return (
    <div className="max-w-3xl">
      <AccountSettings
        email={authUser.email}
        memberSince={
          profile?.createdAt?.toISOString() || new Date().toISOString()
        }
        stats={{ reportCount, marketCount }}
        subscriptionData={subscriptionData}
      />
    </div>
  );
}
