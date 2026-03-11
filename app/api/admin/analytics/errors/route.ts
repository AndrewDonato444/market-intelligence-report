import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { db, schema } from "@/lib/db";
import { sql, gte, eq, and, isNotNull } from "drizzle-orm";

const VALID_PERIODS = ["7d", "30d", "90d", "365d"] as const;
const VALID_GRANULARITIES = ["daily", "weekly", "monthly"] as const;

type Period = (typeof VALID_PERIODS)[number];
type Granularity = (typeof VALID_GRANULARITIES)[number];

function getPeriodMs(period: Period): number {
  switch (period) {
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

    const failedCondition = and(
      eq(schema.reports.status, "failed"),
      gte(schema.reports.createdAt, since)
    );

    // Error time series
    const errorRows = await db
      .select({
        date: sql<string>`to_char(date_trunc(${sql.raw(`'${trunc}'`)}, ${schema.reports.createdAt}), 'YYYY-MM-DD')`.as("date"),
        count: sql<number>`count(*)::int`.as("count"),
      })
      .from(schema.reports)
      .where(failedCondition)
      .groupBy(sql`date_trunc(${sql.raw(`'${trunc}'`)}, ${schema.reports.createdAt})`)
      .orderBy(sql`date_trunc(${sql.raw(`'${trunc}'`)}, ${schema.reports.createdAt})`);

    // Errors by agent
    const agentRows = await db
      .select({
        agent: sql<string>`${schema.reports.errorDetails}->>'agent'`.as("agent"),
        count: sql<number>`count(*)::int`.as("count"),
      })
      .from(schema.reports)
      .where(and(failedCondition, isNotNull(schema.reports.errorDetails)))
      .groupBy(sql`${schema.reports.errorDetails}->>'agent'`)
      .orderBy(sql`count(*) desc`);

    // Summary: totalErrors
    const [totalErrorsResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.reports)
      .where(failedCondition);

    // Summary: totalReports (for error rate)
    const [totalReportsResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.reports)
      .where(gte(schema.reports.createdAt, since));

    // Summary: retried count
    const [retriedResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.reports)
      .where(and(failedCondition, isNotNull(schema.reports.retriedAt)));

    // Zero-fill error time series
    const dateBuckets = generateDateBuckets(since, now, granularity as Granularity);
    const rowMap = new Map<string, number>();
    for (const row of errorRows) {
      rowMap.set(row.date, Number(row.count));
    }

    const errorTimeSeries = dateBuckets.map((date) => ({
      date,
      count: rowMap.get(date) ?? 0,
    }));

    const errorsByAgent = agentRows.map((r) => ({
      agent: r.agent,
      count: Number(r.count),
    }));

    const totalErrors = Number(totalErrorsResult?.count ?? 0);
    const totalReports = Number(totalReportsResult?.count ?? 0);

    const mostFailingAgent = errorsByAgent.length > 0
      ? { agent: errorsByAgent[0].agent, count: errorsByAgent[0].count }
      : null;

    return NextResponse.json({
      errorTimeSeries,
      errorsByAgent,
      summary: {
        totalErrors,
        errorRate: totalReports > 0 ? Number((totalErrors / totalReports).toFixed(4)) : 0,
        mostFailingAgent,
        retriedCount: Number(retriedResult?.count ?? 0),
      },
      period,
      granularity,
    });
  } catch (error) {
    console.error("Error fetching error analytics:", error);
    return NextResponse.json({ error: "Failed to fetch error analytics" }, { status: 500 });
  }
}
