import { NextResponse } from "next/server";

/**
 * GET /api/health
 *
 * Lightweight health check that tests database connectivity.
 * Returns 200 if DB is reachable, 503 if not.
 * No auth required — used for monitoring and debugging.
 */
export async function GET() {
  const checks: Record<string, { ok: boolean; ms?: number; error?: string }> = {};

  // Test database connection
  try {
    const start = Date.now();
    // Dynamic import to avoid module-level errors if DATABASE_URL is missing
    const { db } = await import("@/lib/db");
    const { sql } = await import("drizzle-orm");
    const result = await db.execute(sql`SELECT 1 as ok`);
    checks.database = { ok: !!result, ms: Date.now() - start };
  } catch (error: unknown) {
    const err = error as Error;
    checks.database = {
      ok: false,
      error: err.message?.includes("Circuit breaker")
        ? "Circuit breaker open — Supabase pooler cannot reach upstream database. Check if project is paused."
        : err.message?.substring(0, 200),
    };
  }

  // Test Supabase Auth (REST API, not DB)
  try {
    const start = Date.now();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && anonKey) {
      const resp = await fetch(`${supabaseUrl}/auth/v1/settings`, {
        headers: { apikey: anonKey },
      });
      checks.supabase_auth = { ok: resp.ok, ms: Date.now() - start };
    } else {
      checks.supabase_auth = { ok: false, error: "Supabase env vars not set" };
    }
  } catch (error: unknown) {
    checks.supabase_auth = { ok: false, error: (error as Error).message?.substring(0, 200) };
  }

  const allOk = Object.values(checks).every((c) => c.ok);

  return NextResponse.json(
    {
      status: allOk ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: allOk ? 200 : 503 }
  );
}
