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

    // --- Generation time time series ---
    const genTimeRows = await db
      .select({
        date: sql<string>`to_char(date_trunc(${sql.raw(`'${trunc}'`)}, ${schema.reports.createdAt}), 'YYYY-MM-DD')`.as("date"),
        avgSeconds: sql<number>`avg(extract(epoch from (${schema.reports.generationCompletedAt} - ${schema.reports.generationStartedAt})))`.as("avg_seconds"),
        count: sql<number>`count(*)::int`.as("count"),
      })
      .from(schema.reports)
      .where(
        and(
          gte(schema.reports.createdAt, since),
          isNotNull(schema.reports.generationStartedAt),
          isNotNull(schema.reports.generationCompletedAt)
        )
      )
      .groupBy(sql`date_trunc(${sql.raw(`'${trunc}'`)}, ${schema.reports.createdAt})`)
      .orderBy(sql`date_trunc(${sql.raw(`'${trunc}'`)}, ${schema.reports.createdAt})`);

    // Zero-fill generation time series
    const dateBuckets = generateDateBuckets(since, now, granularity as Granularity);
    const genTimeMap = new Map<string, { avgSeconds: number; count: number }>();
    for (const row of genTimeRows) {
      genTimeMap.set(row.date, {
        avgSeconds: Number(Number(row.avgSeconds).toFixed(1)),
        count: Number(row.count),
      });
    }

    const generationTimeSeries = dateBuckets.map((date) => ({
      date,
      avgSeconds: genTimeMap.get(date)?.avgSeconds ?? 0,
      count: genTimeMap.get(date)?.count ?? 0,
    }));

    // --- Summary: avg generation time ---
    const [avgGenResult] = await db
      .select({
        avg: sql<number | null>`avg(extract(epoch from (${schema.reports.generationCompletedAt} - ${schema.reports.generationStartedAt})))`,
      })
      .from(schema.reports)
      .where(
        and(
          gte(schema.reports.createdAt, since),
          isNotNull(schema.reports.generationStartedAt),
          isNotNull(schema.reports.generationCompletedAt)
        )
      );

    // --- Summary: cache hit rate from apiUsage ---
    const [cacheResult] = await db
      .select({
        totalRequests: sql<number>`count(*)::int`,
        cachedRequests: sql<number>`sum(${schema.apiUsage.cached})::int`,
      })
      .from(schema.apiUsage)
      .where(gte(schema.apiUsage.createdAt, since));

    const totalApiRequests = Number(cacheResult?.totalRequests ?? 0);
    const cachedApiRequests = Number(cacheResult?.cachedRequests ?? 0);
    const cacheHitRate = totalApiRequests > 0 ? cachedApiRequests / totalApiRequests : 0;

    // --- Summary: avg cost per report ---
    const [costPerReportResult] = await db
      .select({
        totalCost: sql<number>`coalesce(sum(${schema.apiUsage.cost}::numeric), 0)`,
        reportCount: sql<number>`count(distinct ${schema.apiUsage.reportId})::int`,
      })
      .from(schema.apiUsage)
      .where(
        and(
          gte(schema.apiUsage.createdAt, since),
          isNotNull(schema.apiUsage.reportId)
        )
      );

    const totalCost = Number(costPerReportResult?.totalCost ?? 0);
    const reportsWithCost = Number(costPerReportResult?.reportCount ?? 0);
    const avgCostPerReport = reportsWithCost > 0 ? totalCost / reportsWithCost : 0;

    // --- Summary: error rate ---
    const [totalReportsResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.reports)
      .where(gte(schema.reports.createdAt, since));

    const [failedReportsResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.reports)
      .where(
        and(
          eq(schema.reports.status, "failed"),
          gte(schema.reports.createdAt, since)
        )
      );

    const totalReports = Number(totalReportsResult?.count ?? 0);
    const totalErrors = Number(failedReportsResult?.count ?? 0);
    const errorRate = totalReports > 0 ? totalErrors / totalReports : 0;

    // --- Errors by agent ---
    const agentErrorRows = await db
      .select({
        agent: sql<string>`${schema.reports.errorDetails}->>'agent'`.as("agent"),
        count: sql<number>`count(*)::int`.as("count"),
      })
      .from(schema.reports)
      .where(
        and(
          eq(schema.reports.status, "failed"),
          gte(schema.reports.createdAt, since),
          isNotNull(schema.reports.errorDetails)
        )
      )
      .groupBy(sql`${schema.reports.errorDetails}->>'agent'`)
      .orderBy(sql`count(*) desc`);

    const errorsByAgent = agentErrorRows.map((r) => ({
      agent: r.agent || "Unknown",
      count: Number(r.count),
    }));

    // --- Cost by provider ---
    const costByProviderRows = await db
      .select({
        provider: schema.apiUsage.provider,
        requests: sql<number>`count(*)::int`.as("requests"),
        totalCost: sql<number>`sum(${schema.apiUsage.cost}::numeric)`.as("total_cost"),
      })
      .from(schema.apiUsage)
      .where(gte(schema.apiUsage.createdAt, since))
      .groupBy(schema.apiUsage.provider)
      .orderBy(sql`sum(${schema.apiUsage.cost}::numeric) desc`);

    const costByProvider = costByProviderRows.map((r) => {
      const tc = Number(r.totalCost ?? 0);
      const req = Number(r.requests);
      return {
        provider: r.provider,
        requests: req,
        totalCost: Number(tc.toFixed(2)),
        avgCostPerRequest: req > 0 ? Number((tc / req).toFixed(2)) : 0,
      };
    });

    return NextResponse.json({
      generationTimeSeries,
      summary: {
        avgGenerationTime: avgGenResult?.avg != null ? Number(Number(avgGenResult.avg).toFixed(1)) : 0,
        cacheHitRate: Number(cacheHitRate.toFixed(3)),
        avgCostPerReport: Number(avgCostPerReport.toFixed(2)),
        errorRate: Number(errorRate.toFixed(4)),
        totalReports,
        totalErrors,
      },
      errorsByAgent,
      costByProvider,
      period,
      granularity,
    });
  } catch (error) {
    console.error("Error fetching performance analytics:", error);
    return NextResponse.json({ error: "Failed to fetch performance analytics" }, { status: 500 });
  }
}
