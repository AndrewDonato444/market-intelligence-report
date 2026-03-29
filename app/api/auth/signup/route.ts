import { verifyTurnstileToken } from "@/lib/security/verify-turnstile";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password, turnstileToken, tosAcceptedAt } = body;

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  // Require ToS acceptance — must be a valid ISO 8601 timestamp
  if (!tosAcceptedAt || typeof tosAcceptedAt !== "string") {
    return NextResponse.json(
      { error: "You must accept the Terms of Service to create an account" },
      { status: 400 }
    );
  }

  const tosDate = new Date(tosAcceptedAt);
  if (isNaN(tosDate.getTime())) {
    return NextResponse.json(
      { error: "Invalid Terms of Service acceptance timestamp" },
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

  const origin = request.headers.get("origin") || request.nextUrl.origin;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: tosAcceptedAt ? { tos_accepted_at: tosAcceptedAt } : undefined,
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const needsConfirmation =
    data.user && data.user.identities && data.user.identities.length === 0;
  const hasSession = !!(data.user && data.session);

  return NextResponse.json({
    needsConfirmation: needsConfirmation || (data.user && !data.session),
    hasSession,
  });
}
