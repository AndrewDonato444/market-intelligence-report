import { db, schema } from "@/lib/db";
import { eq, and, or, isNull, gt } from "drizzle-orm";
import { getCurrentUsage } from "@/lib/services/usage-tracking";
import type { TierEntitlements } from "@/lib/db/schema";

// --- Types ---

export type EntitlementCheckResult = {
  allowed: boolean;
  limit: number;
  used: number;
  remaining: number;
};

// --- Default Entitlements (Starter tier fallback) ---

const DEFAULT_ENTITLEMENTS: TierEntitlements = {
  reports_per_month: 2,
  markets_created: 1,
  social_media_kits: 0,
  personas_per_report: 1,
};

// --- Fail-open result for DB errors ---

const FAIL_OPEN_RESULT: EntitlementCheckResult = {
  allowed: true,
  limit: -1,
  used: 0,
  remaining: -1,
};

/**
 * Single entitlement check used app-wide before every gated action.
 * Resolves: tier entitlements + active overrides + current usage -> allowed/denied.
 *
 * Fails open on DB errors (returns allowed: true) to avoid blocking users
 * due to infrastructure issues. Logs all errors.
 */
export async function checkEntitlement(
  userId: string,
  entitlementType: string
): Promise<EntitlementCheckResult> {
  try {
    // 1. Fetch user's subscription -> get tierId
    const [subscription] = await db
      .select({ tierId: schema.subscriptions.tierId })
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.userId, userId))
      .limit(1);

    let tierEntitlements: TierEntitlements = DEFAULT_ENTITLEMENTS;

    // 2. If tierId exists, fetch tier -> get entitlements JSONB
    if (subscription?.tierId) {
      const [tier] = await db
        .select({ entitlements: schema.subscriptionTiers.entitlements })
        .from(schema.subscriptionTiers)
        .where(eq(schema.subscriptionTiers.id, subscription.tierId))
        .limit(1);

      if (tier?.entitlements) {
        tierEntitlements = tier.entitlements as TierEntitlements;
      }
    }

    // 3. Look up entitlementType in tier entitlements -> tierCap (default 0 if missing)
    const tierCap =
      (tierEntitlements as Record<string, number>)[entitlementType] ?? 0;

    // 4. Fetch all active overrides for (userId, entitlementType)
    //    Active = expiresAt IS NULL OR expiresAt > now()
    const activeOverrides = await db
      .select({ value: schema.entitlementOverrides.value })
      .from(schema.entitlementOverrides)
      .where(
        and(
          eq(schema.entitlementOverrides.userId, userId),
          eq(schema.entitlementOverrides.entitlementType, entitlementType),
          or(
            isNull(schema.entitlementOverrides.expiresAt),
            gt(schema.entitlementOverrides.expiresAt, new Date())
          )
        )
      );

    // 5. Pick the most favorable override -> overrideCap
    let overrideCap = 0;
    for (const override of activeOverrides) {
      if (override.value === -1) {
        overrideCap = -1;
        break;
      }
      if (override.value > overrideCap) {
        overrideCap = override.value;
      }
    }

    // 6. effectiveCap = max(tierCap, overrideCap)
    //    Special case: if either is -1, effectiveCap = -1 (unlimited wins)
    let effectiveCap: number;
    if (tierCap === -1 || overrideCap === -1) {
      effectiveCap = -1;
    } else {
      effectiveCap = Math.max(tierCap, overrideCap);
    }

    // 7. Fetch current usage
    const used = await getCurrentUsage(userId, entitlementType);

    // 8-9. Calculate remaining and allowed
    if (effectiveCap === -1) {
      return { allowed: true, limit: -1, used, remaining: -1 };
    }

    const remaining = effectiveCap - used;
    const allowed = remaining > 0;

    return { allowed, limit: effectiveCap, used, remaining };
  } catch (err) {
    console.error("[entitlement-check] Failed to check entitlement:", err);
    return FAIL_OPEN_RESULT;
  }
}
