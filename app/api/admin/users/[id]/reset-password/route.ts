import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin-client";
import { db } from "@/lib/db";
import { users, userActivity } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;

    // Look up user
    const [user] = await db
      .select({ id: users.id, email: users.email, authId: users.authId })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const supabase = getSupabaseAdmin();
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const { error: resetError } =
      await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${siteUrl}/auth/callback?type=recovery`,
      });

    if (resetError) {
      console.error("Admin password reset error:", resetError);
      return NextResponse.json(
        { error: "Could not send reset email. User may not have an auth account." },
        { status: 500 }
      );
    }

    // Log activity
    await db.insert(userActivity).values({
      userId: user.id,
      action: "password_reset_sent",
      entityType: "user",
      entityId: user.id,
      metadata: {
        triggeredBy: adminId,
        targetEmail: user.email,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Reset email sent to ${user.email}`,
    });
  } catch (error) {
    console.error("Admin reset password error:", error);
    return NextResponse.json(
      { error: "Failed to send reset email. Please try again." },
      { status: 500 }
    );
  }
}
