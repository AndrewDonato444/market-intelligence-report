import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { suspendUser, unsuspendUser } from "@/lib/services/user-status";
import { logActivity } from "@/lib/services/activity-log";
import { getProfile } from "@/lib/services/profile";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminAuthId = await requireAdmin();
  if (!adminAuthId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: targetUserId } = await params;

  // Parse request body
  let body: { action: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { action } = body;
  if (action !== "suspend" && action !== "unsuspend") {
    return NextResponse.json(
      { error: "Invalid action. Must be 'suspend' or 'unsuspend'" },
      { status: 400 }
    );
  }

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

    // Prevent admin from suspending themselves
    if (targetUser.authId === adminAuthId) {
      return NextResponse.json(
        { error: "Cannot modify your own account status" },
        { status: 403 }
      );
    }

    // Validate state transitions
    if (action === "suspend" && targetUser.status !== "active") {
      return NextResponse.json(
        { error: "Can only suspend active accounts" },
        { status: 409 }
      );
    }

    if (action === "unsuspend" && targetUser.status !== "suspended") {
      return NextResponse.json(
        { error: "Can only unsuspend suspended accounts" },
        { status: 409 }
      );
    }

    // Perform the action
    const updated = action === "suspend"
      ? await suspendUser(targetUserId)
      : await unsuspendUser(targetUserId);

    if (!updated) {
      return NextResponse.json(
        { error: "Failed to update user status" },
        { status: 500 }
      );
    }

    // Get admin profile for activity log
    const adminProfile = await getProfile(adminAuthId);

    // Log the activity
    await logActivity({
      userId: targetUserId,
      action: action === "suspend" ? "account.suspended" : "account.unsuspended",
      entityType: "user",
      entityId: targetUserId,
      metadata: {
        performedBy: adminProfile?.id ?? adminAuthId,
        performedByName: adminProfile?.name ?? "Admin",
      },
    });

    return NextResponse.json({
      success: true,
      status: updated.status,
      suspendedAt: updated.suspendedAt?.toISOString() ?? null,
    });
  } catch (error) {
    console.error("Error updating user status:", error);
    return NextResponse.json(
      { error: "Failed to update user status" },
      { status: 500 }
    );
  }
}
