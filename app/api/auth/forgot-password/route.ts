import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (
      !email ||
      typeof email !== "string" ||
      !email.includes("@") ||
      email.length > 254
    ) {
      return NextResponse.json(
        { error: "A valid email address is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const supabase = await createClient();

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    // Always return success regardless of outcome to prevent email enumeration
    await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${siteUrl}/auth/callback?type=recovery`,
    });

    return NextResponse.json({
      success: true,
      message: "Check your email for a reset link",
    });
  } catch {
    // Still return success to prevent enumeration
    return NextResponse.json({
      success: true,
      message: "Check your email for a reset link",
    });
  }
}
