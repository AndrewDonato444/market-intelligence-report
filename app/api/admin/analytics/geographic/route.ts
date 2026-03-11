import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { db, schema } from "@/lib/db";
import { sql, gte, eq } from "drizzle-orm";

const VALID_PERIODS = ["7d", "30d", "90d", "365d", "all"] as const;
type Period = (typeof VALID_PERIODS)[number];

function getPeriodMs(period: Period): number | null {
  switch (period) {
    case "7d": return 7 * 24 * 60 * 60 * 1000;
    case "30d": return 30 * 24 * 60 * 60 * 1000;
    case "90d": return 90 * 24 * 60 * 60 * 1000;
    case "365d": return 365 * 24 * 60 * 60 * 1000;
    case "all": return null;
  }
}

export async function GET(request: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const period = (searchParams.get("period") || "all") as string;

  if (!VALID_PERIODS.includes(period as Period)) {
    return NextResponse.json(
      { error: `Invalid period. Valid periods: ${VALID_PERIODS.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const periodMs = getPeriodMs(period as Period);
    const since = periodMs ? new Date(Date.now() - periodMs) : null;

    const whereClause = since ? gte(schema.reports.createdAt, since) : undefined;

    // Aggregate reports by state via market join
    const byStateRows = await db
      .select({
        state: sql<string>`${schema.markets.geography}->>'state'`.as("state"),
        count: sql<number>`count(*)::int`.as("count"),
      })
      .from(schema.reports)
      .innerJoin(schema.markets, eq(schema.reports.marketId, schema.markets.id))
      .where(whereClause)
      .groupBy(sql`${schema.markets.geography}->>'state'`)
      .orderBy(sql`count(*) desc`);

    // Aggregate reports by city+state via market join
    const byCityRows = await db
      .select({
        city: sql<string>`${schema.markets.geography}->>'city'`.as("city"),
        state: sql<string>`${schema.markets.geography}->>'state'`.as("state"),
        count: sql<number>`count(*)::int`.as("count"),
      })
      .from(schema.reports)
      .innerJoin(schema.markets, eq(schema.reports.marketId, schema.markets.id))
      .where(whereClause)
      .groupBy(sql`${schema.markets.geography}->>'city'`, sql`${schema.markets.geography}->>'state'`)
      .orderBy(sql`count(*) desc`);

    const totalReports = byStateRows.reduce((sum, row) => sum + Number(row.count), 0);

    const byState = byStateRows.map((row) => ({
      state: row.state,
      count: Number(row.count),
      percentage: totalReports > 0 ? Number(((Number(row.count) / totalReports) * 100).toFixed(1)) : 0,
    }));

    const byCity = byCityRows.map((row) => ({
      city: row.city,
      state: row.state,
      count: Number(row.count),
      percentage: totalReports > 0 ? Number(((Number(row.count) / totalReports) * 100).toFixed(1)) : 0,
    }));

    const uniqueStates = new Set(byStateRows.map((r) => r.state)).size;
    const uniqueCities = byCityRows.length;
    const topState = byState.length > 0
      ? { name: byState[0].state, count: byState[0].count }
      : null;

    return NextResponse.json({
      byState,
      byCity,
      summary: {
        totalReports,
        uniqueStates,
        uniqueCities,
        topState,
      },
      period,
    });
  } catch (error) {
    console.error("Error fetching geographic analytics:", error);
    return NextResponse.json({ error: "Failed to fetch geographic analytics" }, { status: 500 });
  }
}
