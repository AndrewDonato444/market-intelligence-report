import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { db, schema } from "@/lib/db";
import { eq, asc, sum } from "drizzle-orm";
import { reapStaleReports } from "@/lib/services/report";

export interface ReportDetailSection {
  id: string;
  sectionType: string;
  title: string;
  agentName: string | null;
  sortOrder: number;
  generatedAt: string | null;
}

export interface ReportDetailApiUsage {
  id: string;
  provider: string;
  endpoint: string;
  cost: string;
  tokensUsed: number | null;
  responseTimeMs: number | null;
  cached: number;
  createdAt: string;
}

export interface SocialMediaKitSummary {
  id: string;
  status: string;
  generatedAt: string | null;
  errorMessage: string | null;
  contentCounts: {
    postIdeas: number;
    captions: number;
    personaPosts: number;
    polls: number;
    conversationStarters: number;
    statCallouts: number;
    calendarSuggestions: number;
  };
}

export interface ReportDetailResponse {
  report: {
    id: string;
    title: string;
    status: string;
    config: Record<string, unknown> | null;
    version: number;
    createdAt: string;
    updatedAt: string;
    generationStartedAt: string | null;
    generationCompletedAt: string | null;
    generationTimeMs: number | null;
    errorMessage: string | null;
    errorDetails: {
      agent: string;
      message: string;
      stack?: string;
      inputSnapshot?: Record<string, unknown>;
      occurredAt: string;
      stageIndex?: number;
      totalStages?: number;
      previousErrors?: Array<{
        agent: string;
        message: string;
        occurredAt: string;
      }>;
    } | null;
    retriedAt: string | null;
    retriedBy: string | null;
    pdfUrl: string | null;
    shareToken: string | null;
  };
  user: {
    id: string;
    name: string;
    company: string | null;
    email: string;
  };
  market: {
    id: string;
    name: string;
    city: string;
    state: string;
    luxuryTier: string;
    priceFloor: number;
  };
  sections: ReportDetailSection[];
  apiUsage: ReportDetailApiUsage[];
  totalApiCost: string;
  socialMediaKit: SocialMediaKitSummary | null;
}

function toISOOrNull(val: Date | string | null): string | null {
  if (!val) return null;
  return val instanceof Date ? val.toISOString() : String(val);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Reap stale reports so admin sees accurate status (not stuck "generating")
  await reapStaleReports();

  try {
    // Fetch report with user and market joins
    const [reportRow] = await db
      .select({
        id: schema.reports.id,
        title: schema.reports.title,
        status: schema.reports.status,
        config: schema.reports.config,
        version: schema.reports.version,
        createdAt: schema.reports.createdAt,
        updatedAt: schema.reports.updatedAt,
        generationStartedAt: schema.reports.generationStartedAt,
        generationCompletedAt: schema.reports.generationCompletedAt,
        errorMessage: schema.reports.errorMessage,
        errorDetails: schema.reports.errorDetails,
        retriedAt: schema.reports.retriedAt,
        retriedBy: schema.reports.retriedBy,
        pdfUrl: schema.reports.pdfUrl,
        shareToken: schema.reports.shareToken,
        userId: schema.users.id,
        userName: schema.users.name,
        userCompany: schema.users.company,
        userEmail: schema.users.email,
        marketId: schema.markets.id,
        marketName: schema.markets.name,
        marketGeography: schema.markets.geography,
        marketLuxuryTier: schema.markets.luxuryTier,
        marketPriceFloor: schema.markets.priceFloor,
      })
      .from(schema.reports)
      .innerJoin(schema.users, eq(schema.reports.userId, schema.users.id))
      .innerJoin(schema.markets, eq(schema.reports.marketId, schema.markets.id))
      .where(eq(schema.reports.id, id))
      .limit(1);

    if (!reportRow) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Fetch report sections
    const sections = await db
      .select({
        id: schema.reportSections.id,
        sectionType: schema.reportSections.sectionType,
        title: schema.reportSections.title,
        agentName: schema.reportSections.agentName,
        sortOrder: schema.reportSections.sortOrder,
        generatedAt: schema.reportSections.generatedAt,
      })
      .from(schema.reportSections)
      .where(eq(schema.reportSections.reportId, id))
      .orderBy(asc(schema.reportSections.sortOrder));

    // Fetch API usage for this report
    const apiUsageRows = await db
      .select({
        id: schema.apiUsage.id,
        provider: schema.apiUsage.provider,
        endpoint: schema.apiUsage.endpoint,
        cost: schema.apiUsage.cost,
        tokensUsed: schema.apiUsage.tokensUsed,
        responseTimeMs: schema.apiUsage.responseTimeMs,
        cached: schema.apiUsage.cached,
        createdAt: schema.apiUsage.createdAt,
      })
      .from(schema.apiUsage)
      .where(eq(schema.apiUsage.reportId, id));

    // Total API cost
    const [costResult] = await db
      .select({ total: sum(schema.apiUsage.cost) })
      .from(schema.apiUsage)
      .where(eq(schema.apiUsage.reportId, id));

    // Fetch social media kit for this report
    const kitRows = await db
      .select({
        id: schema.socialMediaKits.id,
        status: schema.socialMediaKits.status,
        generatedAt: schema.socialMediaKits.generatedAt,
        errorMessage: schema.socialMediaKits.errorMessage,
        content: schema.socialMediaKits.content,
      })
      .from(schema.socialMediaKits)
      .where(eq(schema.socialMediaKits.reportId, id))
      .limit(1);

    // Compute generation time
    const startedAt = reportRow.generationStartedAt;
    const completedAt = reportRow.generationCompletedAt;
    const generationTimeMs =
      startedAt && completedAt
        ? new Date(completedAt).getTime() - new Date(startedAt).getTime()
        : null;

    const geo = reportRow.marketGeography as { city: string; state: string };

    const response: ReportDetailResponse = {
      report: {
        id: reportRow.id,
        title: reportRow.title,
        status: reportRow.status,
        config: reportRow.config as Record<string, unknown> | null,
        version: reportRow.version,
        createdAt: reportRow.createdAt.toISOString(),
        updatedAt: reportRow.updatedAt.toISOString(),
        generationStartedAt: toISOOrNull(reportRow.generationStartedAt),
        generationCompletedAt: toISOOrNull(reportRow.generationCompletedAt),
        generationTimeMs,
        errorMessage: reportRow.errorMessage,
        errorDetails: reportRow.errorDetails as ReportDetailResponse["report"]["errorDetails"],
        retriedAt: toISOOrNull(reportRow.retriedAt),
        retriedBy: reportRow.retriedBy,
        pdfUrl: reportRow.pdfUrl,
        shareToken: reportRow.shareToken,
      },
      user: {
        id: reportRow.userId,
        name: reportRow.userName,
        company: reportRow.userCompany,
        email: reportRow.userEmail,
      },
      market: {
        id: reportRow.marketId,
        name: reportRow.marketName,
        city: geo.city,
        state: geo.state,
        luxuryTier: reportRow.marketLuxuryTier,
        priceFloor: reportRow.marketPriceFloor,
      },
      sections: sections.map((s) => ({
        id: s.id,
        sectionType: s.sectionType,
        title: s.title,
        agentName: s.agentName,
        sortOrder: s.sortOrder,
        generatedAt: toISOOrNull(s.generatedAt),
      })),
      apiUsage: apiUsageRows.map((a) => ({
        id: a.id,
        provider: a.provider,
        endpoint: a.endpoint,
        cost: String(a.cost),
        tokensUsed: a.tokensUsed,
        responseTimeMs: a.responseTimeMs,
        cached: a.cached,
        createdAt: a.createdAt.toISOString(),
      })),
      totalApiCost: costResult?.total ? String(Number(costResult.total).toFixed(4)) : "0.0000",
      socialMediaKit: kitRows.length > 0
        ? (() => {
            const kit = kitRows[0];
            const content = kit.content as Record<string, unknown[]> | null;
            return {
              id: kit.id,
              status: kit.status,
              generatedAt: toISOOrNull(kit.generatedAt),
              errorMessage: kit.errorMessage,
              contentCounts: {
                postIdeas: content?.postIdeas?.length ?? 0,
                captions: content?.captions?.length ?? 0,
                personaPosts: content?.personaPosts?.length ?? 0,
                polls: content?.polls?.length ?? 0,
                conversationStarters: content?.conversationStarters?.length ?? 0,
                statCallouts: content?.statCallouts?.length ?? 0,
                calendarSuggestions: content?.calendarSuggestions?.length ?? 0,
              },
            };
          })()
        : null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching report detail:", error);
    return NextResponse.json(
      { error: "Failed to fetch report details" },
      { status: 500 }
    );
  }
}
