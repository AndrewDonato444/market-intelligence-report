import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { db, schema } from "@/lib/db";
import { sql, gte, and, lt } from "drizzle-orm";

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
    const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const since60d = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const since90d = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const trunc = getTruncFn(granularity as Granularity);

    // Signup time series
    const signupRows = await db
      .select({
        date: sql<string>`to_char(date_trunc(${sql.raw(`'${trunc}'`)}, ${schema.users.createdAt}), 'YYYY-MM-DD')`.as("date"),
        count: sql<number>`count(*)::int`.as("count"),
      })
      .from(schema.users)
      .where(gte(schema.users.createdAt, since))
      .groupBy(sql`date_trunc(${sql.raw(`'${trunc}'`)}, ${schema.users.createdAt})`)
      .orderBy(sql`date_trunc(${sql.raw(`'${trunc}'`)}, ${schema.users.createdAt})`);

    // Summary queries
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
      .where(gte(schema.users.createdAt, since));

    // Inactive users: users who have NOT generated a report in the last 60 days
    const [inactiveResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.users)
      .where(
        sql`${schema.users.id} not in (
          select distinct ${schema.reports.userId} from ${schema.reports}
          where ${schema.reports.createdAt} >= ${since60d}
        )`
      );

    // Power users: top 10 users by report count
    const powerUsersRows = await db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        reportCount: sql<number>`count(${schema.reports.id})::int`.as("report_count"),
        lastReportDate: sql<string>`max(${schema.reports.createdAt})::text`.as("last_report_date"),
      })
      .from(schema.users)
      .innerJoin(schema.reports, sql`${schema.users.id} = ${schema.reports.userId}`)
      .groupBy(schema.users.id, schema.users.name, schema.users.email)
      .orderBy(sql`count(${schema.reports.id}) desc`)
      .limit(10);

    const powerUsers = powerUsersRows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      reportCount: Number(row.reportCount),
      lastReportDate: row.lastReportDate,
    }));

    // Churn risk: users who had a report in the 30d-90d window but NOT in the last 30d
    const churnRiskRows = await db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        lastReportDate: sql<string>`max(${schema.reports.createdAt})::text`.as("last_report_date"),
        daysSinceLastReport: sql<number>`extract(day from now() - max(${schema.reports.createdAt}))::int`.as("days_since"),
      })
      .from(schema.users)
      .innerJoin(schema.reports, sql`${schema.users.id} = ${schema.reports.userId}`)
      .groupBy(schema.users.id, schema.users.name, schema.users.email)
      .having(
        and(
          sql`max(${schema.reports.createdAt}) < ${since30d}`,
          sql`max(${schema.reports.createdAt}) >= ${since90d}`
        )
      )
      .orderBy(sql`max(${schema.reports.createdAt}) asc`);

    const churnRisk = churnRiskRows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      lastReportDate: row.lastReportDate,
      daysSinceLastReport: Number(row.daysSinceLastReport),
    }));

    // Zero-fill signups
    const dateBuckets = generateDateBuckets(since, now, granularity as Granularity);
    const rowMap = new Map<string, number>();
    for (const row of signupRows) {
      rowMap.set(row.date, Number(row.count));
    }

    const signups = dateBuckets.map((date) => ({
      date,
      count: rowMap.get(date) ?? 0,
    }));

    return NextResponse.json({
      signups,
      summary: {
        totalUsers: Number(totalUsers?.count ?? 0),
        activeUsers: Number(activeUsers?.count ?? 0),
        newSignups: Number(newSignups?.count ?? 0),
        inactiveOver60d: Number(inactiveResult?.count ?? 0),
      },
      powerUsers,
      churnRisk,
      period,
      granularity,
    });
  } catch (error) {
    console.error("Error fetching user analytics:", error);
    return NextResponse.json({ error: "Failed to fetch user analytics" }, { status: 500 });
  }
}
