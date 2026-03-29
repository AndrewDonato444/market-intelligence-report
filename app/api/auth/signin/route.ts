import { verifyTurnstileToken } from "@/lib/security/verify-turnstile";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password, turnstileToken } = body;

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  // Verify Turnstile token (skipped if no secret key configured)
  if (turnstileToken) {
    const ip = request.headers.get("x-forwarded-for") ?? undefined;
    const verification = await verifyTurnstileToken(turnstileToken, ip);
    if (!verification.success) {
      return NextResponse.json(
        { error: "Verification failed" },
        { status: 403 }
      );
    }
  } else if (process.env.TURNSTILE_SECRET_KEY) {
    // Turnstile is configured but no token provided — reject
    return NextResponse.json(
      { error: "Verification required" },
      { status: 403 }
    );
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignored in server component context
          }
        },
      },
    }
  );

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  return NextResponse.json({ success: true });
}
