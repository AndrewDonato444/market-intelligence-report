import { db, schema } from "@/lib/db";
import { eq, and, isNull, sql } from "drizzle-orm";
import { resolveUserId } from "./resolve-user-id";

// --- Entitlement Classification ---

const MONTHLY_ENTITLEMENTS = [
  "reports_per_month",
  "social_media_kits",
] as const;
const CUMULATIVE_ENTITLEMENTS = ["markets_created"] as const;

type MonthlyEntitlement = (typeof MONTHLY_ENTITLEMENTS)[number];
type CumulativeEntitlement = (typeof CUMULATIVE_ENTITLEMENTS)[number];

const CUMULATIVE_EPOCH = new Date("2024-01-01T00:00:00Z");

function isMonthlyEntitlement(type: string): type is MonthlyEntitlement {
  return (MONTHLY_ENTITLEMENTS as readonly string[]).includes(type);
}

function isCumulativeEntitlement(type: string): type is CumulativeEntitlement {
  return (CUMULATIVE_ENTITLEMENTS as readonly string[]).includes(type);
}

// --- Period Resolution ---

/**
 * Determine the current billing period for an entitlement type.
 * Monthly: 1st of current month UTC → 1st of next month UTC.
 * Cumulative: fixed epoch → null (never resets).
 */
export function getEntitlementPeriod(entitlementType: string): {
  periodStart: Date;
  periodEnd: Date | null;
} {
  if (isCumulativeEntitlement(entitlementType)) {
    return { periodStart: CUMULATIVE_EPOCH, periodEnd: null };
  }

  // Monthly (default for unknown types too)
  const now = new Date();
  const periodStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  );
  const periodEnd = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)
  );
  return { periodStart, periodEnd };
}

// --- Service Functions ---

/**
 * Increment usage for a gated action. Creates a record if none exists for the period.
 * Uses INSERT ... ON CONFLICT DO UPDATE SET count = count + 1 for atomic increments.
 */
export async function incrementUsage(
  userId: string,
  entitlementType: string
): Promise<void> {
  try {
    // Resolve auth ID → internal users.id (handles both auth and internal IDs)
    const internalId = await resolveUserId(userId);
    if (!internalId) {
      console.warn("[usage-tracking] No user found for id:", userId);
      return;
    }

    const { periodStart, periodEnd } =
      getEntitlementPeriod(entitlementType);

    await db
      .insert(schema.usageRecords)
      .values({
        userId: internalId,
        entitlementType,
        periodStart,
        periodEnd,
        count: 1,
      })
      .onConflictDoUpdate({
        target: [
          schema.usageRecords.userId,
          schema.usageRecords.entitlementType,
          schema.usageRecords.periodStart,
        ],
        set: {
          count: sql`${schema.usageRecords.count} + 1`,
        },
      });
  } catch (err) {
    console.error("[usage-tracking] Failed to increment usage:", err);
  }
}

/**
 * Get current usage count for an entitlement type.
 * For monthly: finds the record matching the current billing period.
 * For cumulative: finds the record with null periodEnd.
 * Returns 0 if no record exists.
 */
export async function getCurrentUsage(
  userId: string,
  entitlementType: string
): Promise<number> {
  try {
    // Resolve auth ID → internal users.id (handles both auth and internal IDs)
    const internalId = await resolveUserId(userId);
    if (!internalId) {
      console.warn("[usage-tracking] No user found for id:", userId);
      return 0;
    }

    const { periodStart } = getEntitlementPeriod(entitlementType);

    if (isCumulativeEntitlement(entitlementType)) {
      const [row] = await db
        .select({ count: schema.usageRecords.count })
        .from(schema.usageRecords)
        .where(
          and(
            eq(schema.usageRecords.userId, internalId),
            eq(schema.usageRecords.entitlementType, entitlementType),
            isNull(schema.usageRecords.periodEnd)
          )
        )
        .limit(1);
      return row?.count ?? 0;
    }

    // Monthly
    const [row] = await db
      .select({ count: schema.usageRecords.count })
      .from(schema.usageRecords)
      .where(
        and(
          eq(schema.usageRecords.userId, internalId),
          eq(schema.usageRecords.entitlementType, entitlementType),
          eq(schema.usageRecords.periodStart, periodStart)
        )
      )
      .limit(1);
    return row?.count ?? 0;
  } catch (err) {
    console.error("[usage-tracking] Failed to get current usage:", err);
    return 0;
  }
}

/**
 * Get usage for a specific period (for historical display, account page).
 * Returns 0 if no record exists for that period.
 */
export async function getUsageForPeriod(
  userId: string,
  entitlementType: string,
  periodStart: Date
): Promise<number> {
  try {
    // Resolve auth ID → internal users.id (handles both auth and internal IDs)
    const internalId = await resolveUserId(userId);
    if (!internalId) {
      console.warn("[usage-tracking] No user found for id:", userId);
      return 0;
    }

    const [row] = await db
      .select({ count: schema.usageRecords.count })
      .from(schema.usageRecords)
      .where(
        and(
          eq(schema.usageRecords.userId, internalId),
          eq(schema.usageRecords.entitlementType, entitlementType),
          eq(schema.usageRecords.periodStart, periodStart)
        )
      )
      .limit(1);
    return row?.count ?? 0;
  } catch (err) {
    console.error("[usage-tracking] Failed to get usage for period:", err);
    return 0;
  }
}
