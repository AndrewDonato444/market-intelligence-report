import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin-client";
import { db } from "@/lib/db";
import { users, subscriptions, userActivity } from "@/lib/db/schema";
import { randomBytes } from "crypto";

export async function POST(request: Request) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  let authUserId: string | null = null;
  let supabase: ReturnType<typeof getSupabaseAdmin> | null = null;

  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const {
      email,
      firstName,
      lastName,
      company,
      phone,
      title,
      role = "user",
      tierId,
      sendInvite = true,
    } = body;

    // Validate required fields
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "A valid email address is required" },
        { status: 400 }
      );
    }

    if (!["user", "admin"].includes(role)) {
      return NextResponse.json(
        { error: "Role must be 'user' or 'admin'" },
        { status: 400 }
      );
    }

    // Create Supabase auth user with random password
    supabase = getSupabaseAdmin();
    const tempPassword = randomBytes(24).toString("base64url");

    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: email.toLowerCase().trim(),
        password: tempPassword,
        email_confirm: true, // Skip email verification since admin is creating
      });

    if (authError) {
      // Supabase returns 422 for duplicate users
      if (
        authError.message?.includes("already registered") ||
        authError.status === 422
      ) {
        return NextResponse.json(
          { error: "A user with this email already exists" },
          { status: 409 }
        );
      }
      console.error("Supabase auth error:", authError);
      return NextResponse.json(
        { error: "Failed to create user. Please try again." },
        { status: 500 }
      );
    }

    authUserId = authData.user?.id ?? null;
    if (!authUserId) {
      return NextResponse.json(
        { error: "Failed to create user. Please try again." },
        { status: 500 }
      );
    }

    // Build display name
    const name =
      [firstName?.trim(), lastName?.trim()].filter(Boolean).join(" ") ||
      email.split("@")[0];

    // Create profile row
    const [newUser] = await db
      .insert(users)
      .values({
        authId: authUserId,
        email: email.toLowerCase().trim(),
        name,
        company: company?.trim() || null,
        phone: phone?.trim() || null,
        title: title?.trim() || null,
        role,
        status: "active",
      })
      .returning({ id: users.id });

    // Create subscription if tier specified
    if (tierId) {
      await db.insert(subscriptions).values({
        userId: newUser.id,
        tierId,
        status: "active",
        plan: "admin_assigned",
      });
    }

    // Log activity
    await db.insert(userActivity).values({
      userId: newUser.id,
      action: "account_created_by_admin",
      entityType: "user",
      entityId: newUser.id,
      metadata: {
        createdBy: adminId,
        role,
        sendInvite,
      },
    });

    // Send invite email (password reset) if requested
    let inviteSent = false;
    if (sendInvite) {
      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(
          email.toLowerCase().trim(),
          {
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback?type=recovery`,
          }
        );
      if (resetError) {
        console.error("Failed to send invite email:", resetError);
      } else {
        inviteSent = true;
      }
    }

    const message = inviteSent
      ? `User created successfully. Invite email sent to ${email}.`
      : "User created successfully.";

    return NextResponse.json(
      { success: true, userId: newUser.id, message },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin create user error:", error);

    // Clean up orphaned Supabase auth user if profile/subscription insert failed
    if (authUserId && supabase) {
      await supabase.auth.admin.deleteUser(authUserId).catch((err) => {
        console.error("Failed to clean up orphaned auth user:", err);
      });
    }

    return NextResponse.json(
      { error: "Failed to create user. Please try again." },
      { status: 500 }
    );
  }
}
