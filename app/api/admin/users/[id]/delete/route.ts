import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { softDeleteUser } from "@/lib/services/user-status";
import { logActivity } from "@/lib/services/activity-log";
import { getProfile } from "@/lib/services/profile";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminAuthId = await requireAdmin();
  if (!adminAuthId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: targetUserId } = await params;

  try {
    // Verify target user exists
    const [targetUser] = await db
      .select({
        id: schema.users.id,
        authId: schema.users.authId,
        status: schema.users.status,
        name: schema.users.name,
      })
      .from(schema.users)
      .where(eq(schema.users.id, targetUserId))
      .limit(1);

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent admin from deleting themselves
    if (targetUser.authId === adminAuthId) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 403 }
      );
    }

    // Validate state: cannot delete already-deleted accounts
    if (targetUser.status === "deleted") {
      return NextResponse.json(
        { error: "Account is already deleted" },
        { status: 409 }
      );
    }

    // Perform the soft delete
    const updated = await softDeleteUser(targetUserId);

    if (!updated) {
      return NextResponse.json(
        { error: "Failed to delete account" },
        { status: 500 }
      );
    }

    // Get admin profile for activity log
    const adminProfile = await getProfile(adminAuthId);

    // Log the activity
    await logActivity({
      userId: targetUserId,
      action: "account.deleted",
      entityType: "user",
      entityId: targetUserId,
      metadata: {
        performedBy: adminProfile?.id ?? adminAuthId,
        performedByName: adminProfile?.name ?? "Admin",
        previousStatus: targetUser.status,
      },
    });

    return NextResponse.json({
      success: true,
      status: updated.status,
      deletedAt: updated.deletedAt?.toISOString() ?? null,
    });
  } catch (error) {
    console.error("Error deleting user account:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
