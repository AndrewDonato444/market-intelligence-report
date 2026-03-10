import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { db, schema } from "@/lib/db";
import { desc, eq, sql, count, sum } from "drizzle-orm";

export interface PipelineRunRow {
  id: string;
  title: string;
  marketName: string;
  status: "queued" | "generating" | "completed" | "failed";
  generationStartedAt: string | null;
  generationCompletedAt: string | null;
  errorMessage: string | null;
  durationMs: number | null;
  sectionCount: number;
  apiCallCount: number;
  totalCost: string;
  sections: {
    sectionType: string;
    title: string;
    agentName: string | null;
    generatedAt: string | null;
  }[];
}

/**
 * GET /api/admin/pipeline
 * Returns recent pipeline runs with timing, sections, and API usage.
 * Query params: ?status=completed|failed|generating|queued&limit=50
 */
export async function GET(request: Request) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const statusFilter = url.searchParams.get("status");
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50"), 200);

  const conditions = [];
  if (
    statusFilter &&
    ["queued", "generating", "completed", "failed"].includes(statusFilter)
  ) {
    conditions.push(
      eq(
        schema.reports.status,
        statusFilter as "queued" | "generating" | "completed" | "failed"
      )
    );
  }

  const reports = await db
    .select({
      id: schema.reports.id,
      title: schema.reports.title,
      status: schema.reports.status,
      generationStartedAt: schema.reports.generationStartedAt,
      generationCompletedAt: schema.reports.generationCompletedAt,
      errorMessage: schema.reports.errorMessage,
      marketName: schema.markets.name,
    })
    .from(schema.reports)
    .leftJoin(schema.markets, eq(schema.reports.marketId, schema.markets.id))
    .where(conditions.length > 0 ? conditions[0] : undefined)
    .orderBy(desc(schema.reports.createdAt))
    .limit(limit);

  if (reports.length === 0) {
    return NextResponse.json({ runs: [] });
  }

  const reportIds = reports.map((r) => r.id);

  const allSections = await db
    .select({
      reportId: schema.reportSections.reportId,
      sectionType: schema.reportSections.sectionType,
      title: schema.reportSections.title,
      agentName: schema.reportSections.agentName,
      generatedAt: schema.reportSections.generatedAt,
    })
    .from(schema.reportSections)
    .where(sql`${schema.reportSections.reportId} IN ${reportIds}`);

  const apiUsageAgg = await db
    .select({
      reportId: schema.apiUsage.reportId,
      callCount: count(),
      totalCost: sum(schema.apiUsage.cost),
    })
    .from(schema.apiUsage)
    .where(sql`${schema.apiUsage.reportId} IN ${reportIds}`)
    .groupBy(schema.apiUsage.reportId);

  const sectionsMap = new Map<string, typeof allSections>();
  for (const s of allSections) {
    const existing = sectionsMap.get(s.reportId) ?? [];
    existing.push(s);
    sectionsMap.set(s.reportId, existing);
  }

  const usageMap = new Map<string, { callCount: number; totalCost: string }>();
  for (const u of apiUsageAgg) {
    if (u.reportId) {
      usageMap.set(u.reportId, {
        callCount: Number(u.callCount),
        totalCost: u.totalCost ?? "0",
      });
    }
  }

  const runs: PipelineRunRow[] = reports.map((r) => {
    const sections = sectionsMap.get(r.id) ?? [];
    const usage = usageMap.get(r.id) ?? { callCount: 0, totalCost: "0" };

    let durationMs: number | null = null;
    if (r.generationStartedAt && r.generationCompletedAt) {
      durationMs =
        r.generationCompletedAt.getTime() - r.generationStartedAt.getTime();
    }

    return {
      id: r.id,
      title: r.title,
      marketName: r.marketName ?? "Unknown",
      status: r.status,
      generationStartedAt: r.generationStartedAt?.toISOString() ?? null,
      generationCompletedAt: r.generationCompletedAt?.toISOString() ?? null,
      errorMessage: r.errorMessage,
      durationMs,
      sectionCount: sections.length,
      apiCallCount: usage.callCount,
      totalCost: usage.totalCost,
      sections: sections.map((s) => ({
        sectionType: s.sectionType,
        title: s.title,
        agentName: s.agentName,
        generatedAt: s.generatedAt?.toISOString() ?? null,
      })),
    };
  });

  return NextResponse.json({ runs });
}
