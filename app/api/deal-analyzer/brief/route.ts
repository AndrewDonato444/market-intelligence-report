import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/supabase/auth";
import { db, schema } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { getReportPersonas } from "@/lib/services/buyer-personas";
import { executeDealBrief, type DealBriefInput } from "@/lib/agents/deal-brief";

export async function POST(request: Request) {
  // 1. Auth
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse input
  let body: { dealAnalysisId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.dealAnalysisId) {
    return NextResponse.json({ error: "dealAnalysisId is required" }, { status: 400 });
  }

  // 3. Load deal analysis
  const [dealAnalysis] = await db
    .select()
    .from(schema.dealAnalyses)
    .where(eq(schema.dealAnalyses.id, body.dealAnalysisId))
    .limit(1);

  if (!dealAnalysis) {
    return NextResponse.json({ error: "Deal analysis not found" }, { status: 404 });
  }

  if (dealAnalysis.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (dealAnalysis.status === "generating") {
    return NextResponse.json(
      { error: "Brief generation already in progress" },
      { status: 409 }
    );
  }

  if (!dealAnalysis.propertyData) {
    return NextResponse.json(
      { error: "Property data not available — run lookup first" },
      { status: 422 }
    );
  }

  // 4. Load market
  const [market] = await db
    .select()
    .from(schema.markets)
    .where(eq(schema.markets.id, dealAnalysis.marketId))
    .limit(1);

  // 5. Load report sections (analytics + forecast)
  const sections = await db
    .select()
    .from(schema.reportSections)
    .where(eq(schema.reportSections.reportId, dealAnalysis.reportId));

  const dashboardSection = sections.find(
    (s) => s.sectionType === "luxury_market_dashboard"
  );
  const forwardLookSection = sections.find(
    (s) => s.sectionType === "forward_look"
  );

  if (!dashboardSection) {
    return NextResponse.json(
      { error: "Report analytics not available" },
      { status: 422 }
    );
  }

  // 6. Load personas
  const reportPersonas = await getReportPersonas(dealAnalysis.reportId);

  // 7. Set status to generating
  await db
    .update(schema.dealAnalyses)
    .set({ status: "generating", updatedAt: new Date() })
    .where(eq(schema.dealAnalyses.id, dealAnalysis.id));

  // 8. Build input and execute agent
  const dashboardContent = dashboardSection.content as Record<string, unknown>;
  const forwardContent = forwardLookSection?.content as Record<string, unknown> | undefined;

  const input: DealBriefInput = {
    propertyData: dealAnalysis.propertyData,
    motivatedSellerScore: dealAnalysis.motivatedSellerScore ?? 0,
    motivatedSellerSignals: dealAnalysis.motivatedSellerSignals ?? {
      inherited: { fired: false, weight: 20 },
      nonOwnerOccupied: { fired: false, weight: 15 },
      adjustableRate: { fired: false, weight: 15 },
      longHoldPeriod: { fired: false, weight: 20 },
      helocPattern: { fired: false, weight: 15 },
      highEquity: { fired: false, weight: 15 },
      totalScore: 0,
    },
    marketAnalytics: {
      market: dashboardContent.market as DealBriefInput["marketAnalytics"]["market"],
      segments: (dashboardContent.segments ?? []) as DealBriefInput["marketAnalytics"]["segments"],
      yoy: (dashboardContent.yoy ?? {}) as DealBriefInput["marketAnalytics"]["yoy"],
    },
    forecast: forwardContent
      ? {
          projections: (forwardContent.projections ?? []) as DealBriefInput["forecast"] extends infer T ? T extends { projections: infer P } ? P : never : never,
          timing: forwardContent.timing as { buyers: string; sellers: string } | undefined,
        }
      : null,
    personas: reportPersonas.map((rp) => ({
      slug: rp.persona.slug,
      name: rp.persona.name,
      description: rp.persona.profileOverview ?? undefined,
      decisionDrivers: rp.persona.decisionDrivers as DealBriefInput["personas"][0]["decisionDrivers"],
      narrativeFraming: rp.persona.narrativeFraming as DealBriefInput["personas"][0]["narrativeFraming"],
      propertyFilters: rp.persona.propertyFilters as Record<string, unknown> | undefined,
    })),
    marketName: market?.name ?? "Unknown Market",
  };

  try {
    const briefContent = await executeDealBrief(input);

    // 9. Write result
    await db
      .update(schema.dealAnalyses)
      .set({
        briefContent,
        status: "completed",
        generatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.dealAnalyses.id, dealAnalysis.id));

    return NextResponse.json({ briefContent });
  } catch (err) {
    // 10. Handle failure
    const message = err instanceof Error ? err.message : "Unknown error";
    await db
      .update(schema.dealAnalyses)
      .set({
        status: "failed",
        errorMessage: `Brief generation failed: ${message}`,
        updatedAt: new Date(),
      })
      .where(eq(schema.dealAnalyses.id, dealAnalysis.id));

    return NextResponse.json(
      { error: `Brief generation failed: ${message}` },
      { status: 502 }
    );
  }
}
