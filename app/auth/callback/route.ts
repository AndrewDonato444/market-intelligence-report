import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/dashboard";
  // Prevent open redirect: only allow relative paths starting with /
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//")
    ? rawNext
    : "/dashboard";

  if (code) {
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
              // Cookies can't be set in some contexts
            }
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Route based on auth flow type
      const type = searchParams.get("type");
      const isRecovery = type === "recovery";
      const isEmailConfirmation = type === "signup" || type === "email" || !type;
      const destination = isRecovery
        ? "/reset-password"
        : isEmailConfirmation
          ? "/auth/verified"
          : next;
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  // If no code or exchange failed, redirect to sign-in with error
  return NextResponse.redirect(
    `${origin}/sign-in?error=confirmation_failed`
  );
}
