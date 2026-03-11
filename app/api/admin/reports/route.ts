import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { db, schema } from "@/lib/db";
import { sql, eq, or, ilike, desc, asc, and, count, gte } from "drizzle-orm";

export interface ReportListItem {
  id: string;
  title: string;
  status: string;
  userId: string;
  userName: string;
  userCompany: string | null;
  marketId: string;
  marketName: string;
  createdAt: string;
  generationStartedAt: string | null;
  generationCompletedAt: string | null;
  generationTimeMs: number | null;
  errorSummary: string | null;
}

export interface ReportListResponse {
  reports: ReportListItem[];
  total: number;
  statusCounts: {
    all: number;
    completed: number;
    generating: number;
    queued: number;
    failed: number;
  };
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

function buildErrorSummary(
  errorDetails: {
    agent: string;
    message: string;
  } | null
): string | null {
  if (!errorDetails) return null;
  const summary = `${errorDetails.agent}: ${errorDetails.message}`;
  return summary.length > 80 ? summary.slice(0, 77) + "..." : summary;
}

export async function GET(request: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") as
    | "queued"
    | "generating"
    | "completed"
    | "failed"
    | null;
  const userId = searchParams.get("userId");
  const marketId = searchParams.get("marketId");
  const dateRange = searchParams.get("dateRange") || "all";
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") || "desc";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);
  const offset = (page - 1) * pageSize;

  try {
    // Build where conditions
    const conditions = [];

    if (status) {
      conditions.push(eq(schema.reports.status, status));
    }

    if (userId) {
      conditions.push(eq(schema.reports.userId, userId));
    }

    if (marketId) {
      conditions.push(eq(schema.reports.marketId, marketId));
    }

    const dateStart = getDateRangeStart(dateRange);
    if (dateStart) {
      conditions.push(gte(schema.reports.createdAt, dateStart));
    }

    if (search) {
      conditions.push(
        or(
          ilike(schema.reports.title, `%${search}%`),
          ilike(schema.users.name, `%${search}%`),
          ilike(schema.markets.name, `%${search}%`)
        )!
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Determine sort column
    const sortColumn =
      sortBy === "title"
        ? schema.reports.title
        : sortBy === "status"
        ? schema.reports.status
        : sortBy === "generationTime"
        ? schema.reports.generationCompletedAt
        : schema.reports.createdAt;

    const orderFn = sortOrder === "asc" ? asc : desc;

    // Query reports with user and market joins
    const reports = await db
      .select({
        id: schema.reports.id,
        title: schema.reports.title,
        status: schema.reports.status,
        userId: schema.reports.userId,
        userName: schema.users.name,
        userCompany: schema.users.company,
        marketId: schema.reports.marketId,
        marketName: schema.markets.name,
        createdAt: schema.reports.createdAt,
        generationStartedAt: schema.reports.generationStartedAt,
        generationCompletedAt: schema.reports.generationCompletedAt,
        errorDetails: schema.reports.errorDetails,
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

    // Count by status (unfiltered for tab badges)
    const statusCountRows = await db
      .select({
        status: schema.reports.status,
        count: count(),
      })
      .from(schema.reports)
      .groupBy(schema.reports.status);

    const statusCounts = {
      all: 0,
      completed: 0,
      generating: 0,
      queued: 0,
      failed: 0,
    };
    for (const row of statusCountRows) {
      const s = row.status as keyof typeof statusCounts;
      if (s in statusCounts) {
        statusCounts[s] = Number(row.count);
      }
      statusCounts.all += Number(row.count);
    }

    const response: ReportListResponse = {
      reports: reports.map((r) => {
        const startedAt = r.generationStartedAt;
        const completedAt = r.generationCompletedAt;
        const generationTimeMs =
          startedAt && completedAt
            ? new Date(completedAt).getTime() - new Date(startedAt).getTime()
            : null;

        return {
          id: r.id,
          title: r.title,
          status: r.status,
          userId: r.userId,
          userName: r.userName,
          userCompany: r.userCompany,
          marketId: r.marketId,
          marketName: r.marketName,
          createdAt:
            r.createdAt instanceof Date
              ? r.createdAt.toISOString()
              : String(r.createdAt),
          generationStartedAt: startedAt
            ? startedAt instanceof Date
              ? startedAt.toISOString()
              : String(startedAt)
            : null,
          generationCompletedAt: completedAt
            ? completedAt instanceof Date
              ? completedAt.toISOString()
              : String(completedAt)
            : null,
          generationTimeMs,
          errorSummary: buildErrorSummary(
            r.errorDetails as { agent: string; message: string } | null
          ),
        };
      }),
      total: Number(totalResult?.count ?? 0),
      statusCounts,
      page,
      pageSize,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching admin reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}
