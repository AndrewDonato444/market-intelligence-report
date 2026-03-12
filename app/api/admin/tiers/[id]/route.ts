import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.displayPrice !== undefined) updateData.displayPrice = body.displayPrice;
    if (body.monthlyPriceInCents !== undefined) updateData.monthlyPriceInCents = body.monthlyPriceInCents;
    if (body.entitlements !== undefined) updateData.entitlements = body.entitlements;
    if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    updateData.updatedAt = new Date();

    const result = await db
      .update(schema.subscriptionTiers)
      .set(updateData)
      .where(eq(schema.subscriptionTiers.id, id))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: "Tier not found" }, { status: 404 });
    }

    return NextResponse.json({ tier: result[0] });
  } catch (error) {
    if ((error as Error & { code?: string }).code === "23505") {
      return NextResponse.json(
        { error: "A tier with this name already exists" },
        { status: 409 }
      );
    }
    console.error("Error updating tier:", error);
    return NextResponse.json(
      { error: "Failed to update tier" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;

    const result = await db
      .delete(schema.subscriptionTiers)
      .where(eq(schema.subscriptionTiers.id, id))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: "Tier not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting tier:", error);
    return NextResponse.json(
      { error: "Failed to delete tier" },
      { status: 500 }
    );
  }
}
