import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { db, schema } from "@/lib/db";
import { sql, eq, and, ilike, or, desc, asc, count, gte, isNotNull } from "drizzle-orm";

export interface ErrorTriageItem {
  id: string;
  title: string;
  userId: string;
  userName: string;
  userCompany: string | null;
  marketName: string;
  failingAgent: string;
  errorMessage: string;
  failedAt: string;
  stageIndex: number | null;
  totalStages: number | null;
  stack: string | null;
  previousErrors: Array<{
    agent: string;
    message: string;
    occurredAt: string;
  }>;
  retriedAt: string | null;
  retriedBy: string | null;
}

export interface ErrorTriageSummary {
  totalErrors: number;
  errorsToday: number;
  mostFailingAgent: { agent: string; count: number } | null;
  retryRate: { retried: number; total: number };
}

export interface ErrorTriageResponse {
  errors: ErrorTriageItem[];
  total: number;
  summary: ErrorTriageSummary;
  failingAgents: string[];
  page: number;
  pageSize: number;
}

function getDateRangeStart(range: string): Date | null {
  const now = new Date();
  switch (range) {
    case "today": {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return start;
    }
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "90d":
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    default:
      return null;
  }
}

export async function GET(request: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const failingAgent = searchParams.get("failingAgent") || "";
  const dateRange = searchParams.get("dateRange") || "all";
  const sortBy = searchParams.get("sortBy") || "failedAt";
  const sortOrder = searchParams.get("sortOrder") || "desc";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);
  const offset = (page - 1) * pageSize;

  try {
    // Base condition: only failed reports
    const conditions = [
      eq(schema.reports.status, "failed"),
    ];

    // Date range filter
    const dateStart = getDateRangeStart(dateRange);
    if (dateStart) {
      conditions.push(gte(schema.reports.generationCompletedAt, dateStart));
    }

    // Search filter
    if (search) {
      conditions.push(
        or(
          ilike(schema.reports.title, `%${search}%`),
          ilike(schema.users.name, `%${search}%`),
          ilike(schema.reports.errorMessage, `%${search}%`)
        )!
      );
    }

    // Failing agent filter — uses JSONB extraction
    if (failingAgent) {
      conditions.push(
        sql`${schema.reports.errorDetails}->>'agent' = ${failingAgent}`
      );
    }

    const whereClause = and(...conditions);

    // Determine sort column
    const sortColumn =
      sortBy === "title"
        ? schema.reports.title
        : sortBy === "failingAgent"
        ? sql`${schema.reports.errorDetails}->>'agent'`
        : schema.reports.generationCompletedAt;

    const orderFn = sortOrder === "asc" ? asc : desc;

    // Query failed reports with user and market joins
    const reports = await db
      .select({
        id: schema.reports.id,
        title: schema.reports.title,
        userId: schema.reports.userId,
        userName: schema.users.name,
        userCompany: schema.users.company,
        marketName: schema.markets.name,
        errorDetails: schema.reports.errorDetails,
        errorMessage: schema.reports.errorMessage,
        generationCompletedAt: schema.reports.generationCompletedAt,
        retriedAt: schema.reports.retriedAt,
        retriedBy: schema.reports.retriedBy,
      })
      .from(schema.reports)
      .innerJoin(schema.users, eq(schema.reports.userId, schema.users.id))
      .innerJoin(schema.markets, eq(schema.reports.marketId, schema.markets.id))
      .where(whereClause)
      .orderBy(orderFn(sortColumn))
      .limit(pageSize)
      .offset(offset);

    // Count total matching
    const [totalResult] = await db
      .select({ count: count() })
      .from(schema.reports)
      .innerJoin(schema.users, eq(schema.reports.userId, schema.users.id))
      .innerJoin(schema.markets, eq(schema.reports.marketId, schema.markets.id))
      .where(whereClause);

    // Summary metrics (unfiltered — all failed reports)
    const allFailedCondition = eq(schema.reports.status, "failed");

    const [totalErrorsResult] = await db
      .select({ count: count() })
      .from(schema.reports)
      .where(allFailedCondition);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const [errorsTodayResult] = await db
      .select({ count: count() })
      .from(schema.reports)
      .where(
        and(allFailedCondition, gte(schema.reports.generationCompletedAt, todayStart))
      );

    const [retriedResult] = await db
      .select({ count: count() })
      .from(schema.reports)
      .where(
        and(allFailedCondition, isNotNull(schema.reports.retriedAt))
      );

    // Get distinct failing agents and counts
    const agentCountRows = await db
      .select({
        agent: sql<string>`${schema.reports.errorDetails}->>'agent'`,
        count: count(),
      })
      .from(schema.reports)
      .where(
        and(
          allFailedCondition,
          isNotNull(schema.reports.errorDetails)
        )
      )
      .groupBy(sql`${schema.reports.errorDetails}->>'agent'`);

    const totalErrors = Number(totalErrorsResult?.count ?? 0);
    const errorsToday = Number(errorsTodayResult?.count ?? 0);
    const retriedCount = Number(retriedResult?.count ?? 0);

    // Find most failing agent
    let mostFailingAgent: ErrorTriageSummary["mostFailingAgent"] = null;
    const failingAgents: string[] = [];
    let maxCount = 0;

    for (const row of agentCountRows) {
      if (row.agent) {
        failingAgents.push(row.agent);
        const cnt = Number(row.count);
        if (cnt > maxCount) {
          maxCount = cnt;
          mostFailingAgent = { agent: row.agent, count: cnt };
        }
      }
    }

    const response: ErrorTriageResponse = {
      errors: reports.map((r) => {
        const ed = r.errorDetails as {
          agent: string;
          message: string;
          stack?: string;
          occurredAt: string;
          stageIndex?: number;
          totalStages?: number;
          previousErrors?: Array<{ agent: string; message: string; occurredAt: string }>;
        } | null;

        return {
          id: r.id,
          title: r.title,
          userId: r.userId,
          userName: r.userName,
          userCompany: r.userCompany,
          marketName: r.marketName,
          failingAgent: ed?.agent ?? "Unknown",
          errorMessage: ed?.message ?? r.errorMessage ?? "Unknown error",
          failedAt: r.generationCompletedAt
            ? r.generationCompletedAt instanceof Date
              ? r.generationCompletedAt.toISOString()
              : String(r.generationCompletedAt)
            : new Date().toISOString(),
          stageIndex: ed?.stageIndex ?? null,
          totalStages: ed?.totalStages ?? null,
          stack: ed?.stack ?? null,
          previousErrors: ed?.previousErrors ?? [],
          retriedAt: r.retriedAt
            ? r.retriedAt instanceof Date
              ? r.retriedAt.toISOString()
              : String(r.retriedAt)
            : null,
          retriedBy: r.retriedBy,
        };
      }),
      total: Number(totalResult?.count ?? 0),
      summary: {
        totalErrors,
        errorsToday,
        mostFailingAgent,
        retryRate: { retried: retriedCount, total: totalErrors },
      },
      failingAgents: failingAgents.sort(),
      page,
      pageSize,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching error triage data:", error);
    return NextResponse.json(
      { error: "Failed to fetch error triage data" },
      { status: 500 }
    );
  }
}
