/**
 * Account stats API — returns report count and market count for the current user.
 */

import { getAuthUserId } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, count } from "drizzle-orm";

export async function GET() {
  const authId = await getAuthUserId();
  if (!authId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [user] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.authId, authId))
    .limit(1);

  if (!user) {
    return NextResponse.json({
      reportCount: 0,
      marketCount: 0,
    });
  }

  const [reportResult] = await db
    .select({ count: count() })
    .from(schema.reports)
    .where(eq(schema.reports.userId, user.id));

  const [marketResult] = await db
    .select({ count: count() })
    .from(schema.markets)
    .where(eq(schema.markets.userId, user.id));

  return NextResponse.json({
    reportCount: reportResult?.count ?? 0,
    marketCount: marketResult?.count ?? 0,
  });
}
