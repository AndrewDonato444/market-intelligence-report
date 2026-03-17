import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  isBlockedUserAgent,
  isBlockedIp,
  computeSuspicionScore,
  isExemptRoute,
  SUSPICION_THRESHOLD,
} from "@/lib/security/anti-scraper";
import { checkRateLimit, extractClientIp } from "@/lib/security/rate-limiter";
import type { RateLimitResult } from "@/lib/security/rate-limiter";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // --- Anti-scraper checks (before any auth overhead) ---
  const pathname = request.nextUrl.pathname;
  let rateLimitResult: RateLimitResult | null = null;

  const isApiRoute = pathname.startsWith("/api");

  if (!isExemptRoute(pathname) && isApiRoute) {
    // Check honeypot-derived IP blocklist first (cheapest check)
    const clientIp = extractClientIp(request.headers);
    if (isBlockedIp(clientIp)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const ua = request.headers.get("user-agent");
    if (isBlockedUserAgent(ua)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const suspicionScore = computeSuspicionScore(request.headers);
    if (suspicionScore >= SUSPICION_THRESHOLD) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // --- Rate limiting (after anti-scraper, before auth) ---
    rateLimitResult = await checkRateLimit(clientIp, pathname);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimitResult.retryAfter),
            "X-RateLimit-Limit": String(rateLimitResult.limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(rateLimitResult.resetAt),
          },
        }
      );
    }
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    // Supabase not configured — skip auth checks in development
    return supabaseResponse;
  }

  // Supabase PKCE email confirmation redirects to the site root with a `code` param
  // instead of respecting the emailRedirectTo path. Intercept and forward to /auth/callback.
  const code = request.nextUrl.searchParams.get("code");
  if (code && request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    return NextResponse.redirect(url);
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicRoute =
    request.nextUrl.pathname === "/" ||
    request.nextUrl.pathname.startsWith("/sign-in") ||
    request.nextUrl.pathname.startsWith("/sign-up") ||
    request.nextUrl.pathname.startsWith("/auth/callback") ||
    request.nextUrl.pathname.startsWith("/auth/verified") ||
    request.nextUrl.pathname.startsWith("/api/webhooks") ||
    request.nextUrl.pathname.startsWith("/api/health");

  // Status pages are accessible without status check (to show the message)
  const isStatusPage =
    request.nextUrl.pathname === "/suspended" ||
    request.nextUrl.pathname === "/account-inactive";

  if (!user && !isPublicRoute && !isStatusPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    return NextResponse.redirect(url);
  }

  // Check user account status for authenticated, non-public routes
  if (user && !isPublicRoute && !isStatusPage) {
    const status = await getUserAccountStatus(user.id);

    if (status === "suspended") {
      const url = request.nextUrl.clone();
      url.pathname = "/suspended";
      return NextResponse.redirect(url);
    }

    if (status === "deleted") {
      const url = request.nextUrl.clone();
      url.pathname = "/account-inactive";
      return NextResponse.redirect(url);
    }
  }

  // Attach rate limit headers to successful responses (reuse result from earlier check)
  if (rateLimitResult) {
    supabaseResponse.headers.set("X-RateLimit-Limit", String(rateLimitResult.limit));
    supabaseResponse.headers.set("X-RateLimit-Remaining", String(rateLimitResult.remaining));
    supabaseResponse.headers.set("X-RateLimit-Reset", String(rateLimitResult.resetAt));
  }

  return supabaseResponse;
}

/**
 * Query user account status directly via Supabase client to avoid
 * importing Drizzle in Edge middleware (which uses postgres-js).
 * Uses the Supabase REST API which is Edge-compatible.
 */
async function getUserAccountStatus(
  supabaseAuthId: string
): Promise<string | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/users?auth_id=eq.${encodeURIComponent(supabaseAuthId)}&select=status`,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    if (!response.ok) return null;

    const rows = await response.json();
    return rows?.[0]?.status ?? null;
  } catch {
    // If status check fails, allow access (fail open for availability)
    return null;
  }
}
