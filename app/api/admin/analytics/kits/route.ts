import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { db, schema } from "@/lib/db";
import { sql, eq, gte, and } from "drizzle-orm";
import type { SocialMediaKitContent } from "@/lib/db/schema";

const VALID_PERIODS = ["24h", "7d", "30d", "90d", "365d"];

const CONTENT_TYPES = [
  "postIdeas",
  "captions",
  "personaPosts",
  "polls",
  "conversationStarters",
  "statCallouts",
  "calendarSuggestions",
] as const;

function getPeriodDate(period: string): Date {
  const now = new Date();
  switch (period) {
    case "24h": return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case "7d": return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30d": return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "90d": return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case "365d": return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    default: return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

function zeroCounts(): Record<string, number> {
  return Object.fromEntries(CONTENT_TYPES.map((t) => [t, 0]));
}

export async function GET(request: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const period = request.nextUrl.searchParams.get("period") || "30d";
  if (!VALID_PERIODS.includes(period)) {
    return NextResponse.json({ error: `Invalid period. Must be one of: ${VALID_PERIODS.join(", ")}` }, { status: 400 });
  }

  try {
    const sinceDate = getPeriodDate(period);

    // Volume over time — kits generated per day within period
    const volumeOverTime = await db
      .select({
        date: sql<string>`date_trunc('day', ${schema.socialMediaKits.createdAt})::date::text`,
        count: sql<number>`count(*)::int`,
      })
      .from(schema.socialMediaKits)
      .where(
        and(
          eq(schema.socialMediaKits.status, "completed"),
          gte(schema.socialMediaKits.createdAt, sinceDate)
        )
      )
      .groupBy(sql`date_trunc('day', ${schema.socialMediaKits.createdAt})`)
      .orderBy(sql`date_trunc('day', ${schema.socialMediaKits.createdAt})`);

    // Completed kits within period — fetch content for aggregation
    const completedKits = await db
      .select({
        content: schema.socialMediaKits.content,
      })
      .from(schema.socialMediaKits)
      .where(
        and(
          eq(schema.socialMediaKits.status, "completed"),
          gte(schema.socialMediaKits.createdAt, sinceDate)
        )
      );

    // Kits by status (all time — current state count)
    const statusRows = await db
      .select({
        status: schema.socialMediaKits.status,
        count: sql<number>`count(*)::int`,
      })
      .from(schema.socialMediaKits)
      .groupBy(schema.socialMediaKits.status);

    // Aggregate content type counts
    const totalCounts = zeroCounts();
    const kitCount = completedKits.length;

    for (const kit of completedKits) {
      const content = kit.content as SocialMediaKitContent | null;
      if (!content) continue;
      for (const type of CONTENT_TYPES) {
        const arr = content[type];
        if (Array.isArray(arr)) {
          totalCounts[type] += arr.length;
        }
      }
    }

    // Average per kit
    const averageContentPerKit = Object.fromEntries(
      CONTENT_TYPES.map((t) => [t, kitCount > 0 ? Number((totalCounts[t] / kitCount).toFixed(1)) : 0])
    );

    // Top content types ranked by average count
    const topContentTypes = [...CONTENT_TYPES].sort(
      (a, b) => (averageContentPerKit[b] ?? 0) - (averageContentPerKit[a] ?? 0)
    );

    // Build kitsByStatus
    const kitsByStatus: Record<string, number> = { completed: 0, failed: 0, generating: 0, queued: 0 };
    for (const row of statusRows) {
      if (row.status in kitsByStatus) {
        kitsByStatus[row.status] = Number(row.count);
      }
    }

    return NextResponse.json({
      volumeOverTime: volumeOverTime.map((v) => ({ date: v.date, count: Number(v.count) })),
      contentTypeCounts: totalCounts,
      averageContentPerKit,
      topContentTypes,
      kitsByStatus,
      period,
    });
  } catch (error) {
    console.error("Error fetching kit analytics:", error);
    return NextResponse.json({ error: "Failed to fetch kit analytics" }, { status: 500 });
  }
}
