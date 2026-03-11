import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { db, schema } from "@/lib/db";
import { sql, gte, eq, and } from "drizzle-orm";

const VALID_PERIODS = ["24h", "7d", "30d", "90d", "365d"] as const;
const VALID_GRANULARITIES = ["daily", "weekly", "monthly"] as const;

type Period = (typeof VALID_PERIODS)[number];
type Granularity = (typeof VALID_GRANULARITIES)[number];

function getPeriodMs(period: Period): number {
  switch (period) {
    case "24h": return 24 * 60 * 60 * 1000;
    case "7d": return 7 * 24 * 60 * 60 * 1000;
    case "30d": return 30 * 24 * 60 * 60 * 1000;
    case "90d": return 90 * 24 * 60 * 60 * 1000;
    case "365d": return 365 * 24 * 60 * 60 * 1000;
  }
}

function getTruncFn(granularity: Granularity): string {
  switch (granularity) {
    case "daily": return "day";
    case "weekly": return "week";
    case "monthly": return "month";
  }
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function generateDateBuckets(since: Date, now: Date, granularity: Granularity): string[] {
  const dates: string[] = [];
  const current = new Date(since);

  if (granularity === "daily") {
    current.setUTCHours(0, 0, 0, 0);
    while (current <= now) {
      dates.push(formatDate(current));
      current.setUTCDate(current.getUTCDate() + 1);
    }
  } else if (granularity === "weekly") {
    // Align to Monday
    const day = current.getUTCDay();
    const diff = day === 0 ? -6 : 1 - day;
    current.setUTCDate(current.getUTCDate() + diff);
    current.setUTCHours(0, 0, 0, 0);
    while (current <= now) {
      dates.push(formatDate(current));
      current.setUTCDate(current.getUTCDate() + 7);
    }
  } else if (granularity === "monthly") {
    current.setUTCDate(1);
    current.setUTCHours(0, 0, 0, 0);
    while (current <= now) {
      dates.push(formatDate(current));
      current.setUTCMonth(current.getUTCMonth() + 1);
    }
  }

  return dates;
}

export async function GET(request: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const period = (searchParams.get("period") || "30d") as string;
  const granularity = (searchParams.get("granularity") || "daily") as string;

  if (!VALID_PERIODS.includes(period as Period)) {
    return NextResponse.json(
      { error: `Invalid period. Valid periods: ${VALID_PERIODS.join(", ")}` },
      { status: 400 }
    );
  }

  if (!VALID_GRANULARITIES.includes(granularity as Granularity)) {
    return NextResponse.json(
      { error: `Invalid granularity. Valid granularities: ${VALID_GRANULARITIES.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const since = new Date(Date.now() - getPeriodMs(period as Period));
    const now = new Date();
    const trunc = getTruncFn(granularity as Granularity);

    // Query aggregated report counts by date bucket
    const rows = await db
      .select({
        date: sql<string>`to_char(date_trunc(${sql.raw(`'${trunc}'`)}, ${schema.reports.createdAt}), 'YYYY-MM-DD')`.as("date"),
        total: sql<number>`count(*)::int`.as("total"),
        completed: sql<number>`count(*) filter (where ${schema.reports.status} = 'completed')::int`.as("completed"),
        failed: sql<number>`count(*) filter (where ${schema.reports.status} = 'failed')::int`.as("failed"),
      })
      .from(schema.reports)
      .where(gte(schema.reports.createdAt, since))
      .groupBy(sql`date_trunc(${sql.raw(`'${trunc}'`)}, ${schema.reports.createdAt})`)
      .orderBy(sql`date_trunc(${sql.raw(`'${trunc}'`)}, ${schema.reports.createdAt})`);

    // Zero-fill: generate all date buckets, merge with DB results
    const dateBuckets = generateDateBuckets(since, now, granularity as Granularity);
    const rowMap = new Map<string, { total: number; completed: number; failed: number }>();
    for (const row of rows) {
      rowMap.set(row.date, {
        total: Number(row.total),
        completed: Number(row.completed),
        failed: Number(row.failed),
      });
    }

    const timeSeries = dateBuckets.map((date) => ({
      date,
      total: rowMap.get(date)?.total ?? 0,
      completed: rowMap.get(date)?.completed ?? 0,
      failed: rowMap.get(date)?.failed ?? 0,
    }));

    return NextResponse.json({
      timeSeries,
      period,
      granularity,
    });
  } catch (error) {
    console.error("Error fetching volume analytics:", error);
    return NextResponse.json({ error: "Failed to fetch volume analytics" }, { status: 500 });
  }
}
