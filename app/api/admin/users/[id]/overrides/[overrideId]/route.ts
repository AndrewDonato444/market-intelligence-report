import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { db, schema } from "@/lib/db";
import { and, eq } from "drizzle-orm";

type RouteContext = { params: Promise<{ id: string; overrideId: string }> };

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, overrideId } = await context.params;

    const result = await db
      .delete(schema.entitlementOverrides)
      .where(
        and(
          eq(schema.entitlementOverrides.id, overrideId),
          eq(schema.entitlementOverrides.userId, id)
        )
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Override not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting override:", error);
    return NextResponse.json(
      { error: "Failed to delete override" },
      { status: 500 }
    );
  }
}
