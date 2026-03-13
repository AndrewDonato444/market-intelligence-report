import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { db, schema } from "@/lib/db";
import { eq, desc } from "drizzle-orm";

const VALID_ENTITLEMENT_TYPES = [
  "reports_per_month",
  "markets_created",
  "social_media_kits",
  "email_campaigns",
  "personas_per_report",
];

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;

    const overrides = await db
      .select()
      .from(schema.entitlementOverrides)
      .where(eq(schema.entitlementOverrides.userId, id))
      .orderBy(desc(schema.entitlementOverrides.createdAt));

    // Fetch user's tier info for effective entitlements summary
    let tierInfo = { tierName: "Starter", entitlements: { reports_per_month: 2, markets_created: 1, social_media_kits: 0, email_campaigns: 0, personas_per_report: 1 } };
    try {
      const [subscription] = await db
        .select({ tierId: schema.subscriptions.tierId })
        .from(schema.subscriptions)
        .where(eq(schema.subscriptions.userId, id))
        .limit(1);

      if (subscription?.tierId) {
        const [tier] = await db
          .select({ name: schema.subscriptionTiers.name, entitlements: schema.subscriptionTiers.entitlements })
          .from(schema.subscriptionTiers)
          .where(eq(schema.subscriptionTiers.id, subscription.tierId))
          .limit(1);

        if (tier) {
          tierInfo = { tierName: tier.name, entitlements: tier.entitlements as typeof tierInfo.entitlements };
        }
      }
    } catch {
      // Fail gracefully — tier info is supplementary
    }

    return NextResponse.json({ overrides, tier: tierInfo });
  } catch (error) {
    console.error("Error fetching overrides:", error);
    return NextResponse.json(
      { error: "Failed to fetch overrides" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const { entitlementType, value, expiresAt, reason } = body;

    // Validation
    if (!entitlementType || !VALID_ENTITLEMENT_TYPES.includes(entitlementType)) {
      return NextResponse.json(
        { error: "Invalid or missing entitlementType. Must be one of: " + VALID_ENTITLEMENT_TYPES.join(", ") },
        { status: 400 }
      );
    }

    if (value === undefined || value === null || typeof value !== "number") {
      return NextResponse.json(
        { error: "Value is required and must be a number" },
        { status: 400 }
      );
    }

    if (value !== -1 && value < 1) {
      return NextResponse.json(
        { error: "Value must be at least 1, or use -1 for Unlimited" },
        { status: 400 }
      );
    }

    if (expiresAt) {
      const expiryDate = new Date(expiresAt);
      if (expiryDate <= new Date()) {
        return NextResponse.json(
          { error: "Expiry must be a future date" },
          { status: 400 }
        );
      }
    }

    const result = await db
      .insert(schema.entitlementOverrides)
      .values({
        userId: id,
        entitlementType,
        value,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        grantedBy: adminId,
        reason: reason || null,
      })
      .returning();

    return NextResponse.json({ override: result[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating override:", error);
    return NextResponse.json(
      { error: "Failed to create override" },
      { status: 500 }
    );
  }
}
