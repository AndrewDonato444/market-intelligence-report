import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { db, schema } from "@/lib/db";
import { sql, eq, gte, and, count, isNotNull } from "drizzle-orm";

function getPeriodDate(period: string): Date {
  const now = new Date();
  switch (period) {
    case "24h": return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case "7d": return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30d": return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    default: return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

export async function GET(_request: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const since24h = getPeriodDate("24h");
    const since7d = getPeriodDate("7d");
    const since30d = getPeriodDate("30d");
    const since60d = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    // Report volume counts
    const [reports24h] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.reports)
      .where(gte(schema.reports.createdAt, since24h));

    const [reports7d] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.reports)
      .where(gte(schema.reports.createdAt, since7d));

    const [reports30d] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.reports)
      .where(gte(schema.reports.createdAt, since30d));

    const [reportsAll] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.reports);

    // User counts
    const [totalUsers] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.users);

    const [activeUsers] = await db
      .select({ count: sql<number>`count(distinct ${schema.reports.userId})::int` })
      .from(schema.reports)
      .where(gte(schema.reports.createdAt, since30d));

    const [newSignups] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.users)
      .where(gte(schema.users.createdAt, since30d));

    // Error rates
    const [failed7d] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.reports)
      .where(and(eq(schema.reports.status, "failed"), gte(schema.reports.createdAt, since7d)));

    const [total7d] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.reports)
      .where(gte(schema.reports.createdAt, since7d));

    const [failed30d] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.reports)
      .where(and(eq(schema.reports.status, "failed"), gte(schema.reports.createdAt, since30d)));

    const [total30d] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.reports)
      .where(gte(schema.reports.createdAt, since30d));

    // Avg generation time (in seconds)
    const [avgGen7d] = await db
      .select({
        avg: sql<number | null>`avg(extract(epoch from (${schema.reports.generationCompletedAt} - ${schema.reports.generationStartedAt})))`,
      })
      .from(schema.reports)
      .where(
        and(
          gte(schema.reports.createdAt, since7d),
          isNotNull(schema.reports.generationStartedAt),
          isNotNull(schema.reports.generationCompletedAt)
        )
      );

    const [avgGen30d] = await db
      .select({
        avg: sql<number | null>`avg(extract(epoch from (${schema.reports.generationCompletedAt} - ${schema.reports.generationStartedAt})))`,
      })
      .from(schema.reports)
      .where(
        and(
          gte(schema.reports.createdAt, since30d),
          isNotNull(schema.reports.generationStartedAt),
          isNotNull(schema.reports.generationCompletedAt)
        )
      );

    const f7d = Number(failed7d?.count ?? 0);
    const t7d = Number(total7d?.count ?? 0);
    const f30d = Number(failed30d?.count ?? 0);
    const t30d = Number(total30d?.count ?? 0);

    return NextResponse.json({
      reportVolume: {
        last24h: Number(reports24h?.count ?? 0),
        last7d: Number(reports7d?.count ?? 0),
        last30d: Number(reports30d?.count ?? 0),
        allTime: Number(reportsAll?.count ?? 0),
      },
      userCount: {
        total: Number(totalUsers?.count ?? 0),
        active: Number(activeUsers?.count ?? 0),
        newLast30d: Number(newSignups?.count ?? 0),
      },
      errorRate: {
        last7d: {
          failed: f7d,
          total: t7d,
          rate: t7d > 0 ? Number((f7d / t7d).toFixed(4)) : 0,
        },
        last30d: {
          failed: f30d,
          total: t30d,
          rate: t30d > 0 ? Number((f30d / t30d).toFixed(4)) : 0,
        },
      },
      avgGenerationTime: {
        last7d: avgGen7d?.avg != null ? Number(Number(avgGen7d.avg).toFixed(1)) : 0,
        last30d: avgGen30d?.avg != null ? Number(Number(avgGen30d.avg).toFixed(1)) : 0,
      },
    });
  } catch (error) {
    console.error("Error fetching analytics overview:", error);
    return NextResponse.json({ error: "Failed to fetch analytics overview" }, { status: 500 });
  }
}
