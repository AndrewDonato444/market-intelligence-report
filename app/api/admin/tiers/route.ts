import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { db, schema } from "@/lib/db";
import { asc } from "drizzle-orm";

export interface TierListResponse {
  tiers: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    entitlements: {
      reports_per_month: number;
      markets_created: number;
      social_media_kits: number;
      personas_per_report: number;
      deal_analyses_per_month: number;
    };
    displayPrice: string;
    monthlyPriceInCents: number | null;
    isActive: boolean;
    sortOrder: number;
  }[];
}

export async function GET(_request: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tiers = await db
      .select()
      .from(schema.subscriptionTiers)
      .orderBy(asc(schema.subscriptionTiers.sortOrder));

    return NextResponse.json({ tiers });
  } catch (error) {
    console.error("Error fetching tiers:", error);
    return NextResponse.json(
      { error: "Failed to fetch tiers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, slug, description, displayPrice, monthlyPriceInCents, entitlements, sortOrder, isActive } = body;

    if (!name || !slug || !displayPrice || !entitlements) {
      return NextResponse.json(
        { error: "Missing required fields: name, slug, displayPrice, entitlements" },
        { status: 400 }
      );
    }

    const result = await db
      .insert(schema.subscriptionTiers)
      .values({
        name,
        slug,
        description: description || null,
        displayPrice,
        monthlyPriceInCents: monthlyPriceInCents ?? null,
        entitlements,
        sortOrder: sortOrder ?? 0,
        isActive: isActive ?? true,
      })
      .returning();

    return NextResponse.json({ tier: result[0] }, { status: 201 });
  } catch (error) {
    if ((error as Error & { code?: string }).code === "23505") {
      return NextResponse.json(
        { error: "A tier with this name already exists" },
        { status: 409 }
      );
    }
    console.error("Error creating tier:", error);
    return NextResponse.json(
      { error: "Failed to create tier" },
      { status: 500 }
    );
  }
}
