import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { db, schema } from "@/lib/db";
import { sql, eq, gte, lt, and } from "drizzle-orm";
import { registry } from "@/lib/services/data-source-registry";

export interface MonitoringData {
  summary: {
    totalApiCalls: number;
    totalCost: number;
    cacheHitRate: number;
    pipelineSuccessRate: number;
  };
  byProvider: {
    provider: string;
    callCount: number;
    totalCost: number;
    cacheHits: number;
    avgResponseTimeMs: number;
  }[];
  cacheHealth: {
    bySource: { source: string; entryCount: number }[];
    totalEntries: number;
    expiringSoon: number;
    expired: number;
  };
  pipelineHealth: {
    total: number;
    completed: number;
    failed: number;
    generating: number;
    queued: number;
    avgDurationMs: number;
    recentFailures: {
      title: string;
      errorMessage: string;
      createdAt: string;
    }[];
  };
  dataSources: {
    name: string;
    status: string;
    latencyMs: number;
    lastChecked: string | null;
    error?: string;
  }[];
  timestamp: string;
}

function getPeriodDate(period: string): Date {
  const now = new Date();
  switch (period) {
    case "24h":
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
}

/**
 * GET /api/admin/monitoring
 * Returns aggregated system monitoring data.
 * Query params: ?period=24h|7d|30d (default: 7d)
 */
export async function GET(request: Request) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const period = url.searchParams.get("period") ?? "7d";
  const since = getPeriodDate(period);

  const [providerRows, cacheBySource, cacheExpiring, cacheExpired, pipelineStats, recentFailures] =
    await Promise.all([
      db
        .select({
          provider: schema.apiUsage.provider,
          callCount: sql<number>`count(*)::int`.as("callCount"),
          totalCost: sql<string>`coalesce(sum(${schema.apiUsage.cost}), '0')`.as("totalCost"),
          cacheHits: sql<number>`coalesce(sum(${schema.apiUsage.cached}), 0)::int`.as("cacheHits"),
          avgResponseTimeMs: sql<number>`coalesce(avg(${schema.apiUsage.responseTimeMs}), 0)::int`.as("avgResponseTimeMs"),
        })
        .from(schema.apiUsage)
        .where(gte(schema.apiUsage.createdAt, since))
        .groupBy(schema.apiUsage.provider),

      db
        .select({
          source: schema.cache.source,
          entryCount: sql<number>`count(*)::int`.as("entryCount"),
        })
        .from(schema.cache)
        .groupBy(schema.cache.source),

      db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.cache)
        .where(
          and(
            gte(schema.cache.expiresAt, new Date()),
            lt(schema.cache.expiresAt, new Date(Date.now() + 24 * 60 * 60 * 1000))
          )
        ),

      db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.cache)
        .where(lt(schema.cache.expiresAt, new Date())),

      db
        .select({
          status: schema.reports.status,
          statusCount: sql<number>`count(*)::int`.as("statusCount"),
          avgDuration: sql<number>`coalesce(avg(extract(epoch from (${schema.reports.generationCompletedAt} - ${schema.reports.generationStartedAt})) * 1000), 0)::int`.as("avgDuration"),
        })
        .from(schema.reports)
        .where(gte(schema.reports.createdAt, since))
        .groupBy(schema.reports.status),

      db
        .select({
          title: schema.reports.title,
          errorMessage: schema.reports.errorMessage,
          createdAt: schema.reports.createdAt,
        })
        .from(schema.reports)
        .where(
          and(
            eq(schema.reports.status, "failed"),
            gte(schema.reports.createdAt, since)
          )
        )
        .orderBy(sql`${schema.reports.createdAt} DESC`)
        .limit(5),
    ]);

  const byProvider = providerRows.map((r) => ({
    provider: r.provider,
    callCount: r.callCount,
    totalCost: parseFloat(r.totalCost) || 0,
    cacheHits: r.cacheHits,
    avgResponseTimeMs: r.avgResponseTimeMs,
  }));

  const totalApiCalls = byProvider.reduce((s, p) => s + p.callCount, 0);
  const totalCost = byProvider.reduce((s, p) => s + p.totalCost, 0);
  const totalCacheHits = byProvider.reduce((s, p) => s + p.cacheHits, 0);
  const cacheHitRate = totalApiCalls > 0 ? (totalCacheHits / totalApiCalls) * 100 : 0;

  const pipelineMap: Record<string, number> = {};
  let avgDurationMs = 0;
  for (const row of pipelineStats) {
    pipelineMap[row.status] = row.statusCount;
    if (row.status === "completed" && row.avgDuration > 0) {
      avgDurationMs = row.avgDuration;
    }
  }
  const pipelineTotal = Object.values(pipelineMap).reduce((s, c) => s + c, 0);
  const pipelineCompleted = pipelineMap["completed"] ?? 0;
  const pipelineSuccessRate =
    pipelineTotal > 0 ? (pipelineCompleted / pipelineTotal) * 100 : 0;

  const totalEntries = cacheBySource.reduce((s, r) => s + r.entryCount, 0);

  const dataSources = registry.toJSON().map((ds) => ({
    name: ds.name,
    status: ds.health?.status ?? "unknown",
    latencyMs: ds.health?.latencyMs ?? 0,
    lastChecked: ds.health?.lastChecked
      ? new Date(ds.health.lastChecked).toISOString()
      : null,
    error: ds.health?.error,
  }));

  const data: MonitoringData = {
    summary: {
      totalApiCalls,
      totalCost,
      cacheHitRate,
      pipelineSuccessRate,
    },
    byProvider,
    cacheHealth: {
      bySource: cacheBySource.map((r) => ({
        source: r.source,
        entryCount: r.entryCount,
      })),
      totalEntries,
      expiringSoon: cacheExpiring[0]?.count ?? 0,
      expired: cacheExpired[0]?.count ?? 0,
    },
    pipelineHealth: {
      total: pipelineTotal,
      completed: pipelineCompleted,
      failed: pipelineMap["failed"] ?? 0,
      generating: pipelineMap["generating"] ?? 0,
      queued: pipelineMap["queued"] ?? 0,
      avgDurationMs,
      recentFailures: recentFailures.map((f) => ({
        title: f.title,
        errorMessage: f.errorMessage ?? "Unknown error",
        createdAt: f.createdAt.toISOString(),
      })),
    },
    dataSources,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(data);
}

/**
 * POST /api/admin/monitoring
 * Actions: "health-check" — runs health checks on all data sources.
 */
export async function POST(request: Request) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (body.action === "health-check") {
    const results = await registry.checkAllHealth();

    const serialized: Record<string, unknown> = {};
    for (const [name, health] of Object.entries(results)) {
      serialized[name] = {
        ...health,
        lastChecked: health.lastChecked.toISOString(),
      };
    }

    const dataSources = registry.toJSON().map((ds) => ({
      name: ds.name,
      status: ds.health?.status ?? "unknown",
      latencyMs: ds.health?.latencyMs ?? 0,
      lastChecked: ds.health?.lastChecked
        ? new Date(ds.health.lastChecked).toISOString()
        : null,
      error: ds.health?.error,
    }));

    return NextResponse.json({ results: serialized, dataSources });
  }

  return NextResponse.json(
    { error: "Unknown action. Supported: health-check" },
    { status: 400 }
  );
}
