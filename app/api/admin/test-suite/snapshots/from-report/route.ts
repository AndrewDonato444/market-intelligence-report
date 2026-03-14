/**
 * POST /api/admin/test-suite/snapshots/from-report
 *
 * Create a pipeline test snapshot from a completed report.
 * Re-runs Layer 0 (data fetch) using the report's market parameters
 * — should hit cache for recently completed reports.
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { fetchAllMarketData } from "@/lib/services/data-fetcher";

export const maxDuration = 300; // Data fetch may take time if cache is cold

export async function POST(req: Request) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { reportId } = body;

  if (!reportId) {
    return NextResponse.json(
      { error: "Missing required field: reportId" },
      { status: 400 }
    );
  }

  // 1. Fetch the report
  const [report] = await db
    .select({
      id: schema.reports.id,
      title: schema.reports.title,
      status: schema.reports.status,
      userId: schema.reports.userId,
      marketId: schema.reports.marketId,
    })
    .from(schema.reports)
    .where(eq(schema.reports.id, reportId))
    .limit(1);

  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  if (report.status !== "completed") {
    return NextResponse.json(
      { error: `Report must be completed to create snapshot (current status: ${report.status})` },
      { status: 422 }
    );
  }

  // 2. Fetch the market
  const [market] = await db
    .select({
      id: schema.markets.id,
      name: schema.markets.name,
      geography: schema.markets.geography,
      luxuryTier: schema.markets.luxuryTier,
      priceFloor: schema.markets.priceFloor,
      priceCeiling: schema.markets.priceCeiling,
      segments: schema.markets.segments,
      propertyTypes: schema.markets.propertyTypes,
      peerMarkets: schema.markets.peerMarkets,
    })
    .from(schema.markets)
    .where(eq(schema.markets.id, report.marketId))
    .limit(1);

  if (!market) {
    return NextResponse.json({ error: "Market not found for report" }, { status: 404 });
  }

  // 3. Re-run Layer 0 (should hit cache for recent reports)
  let compiledData;
  try {
    const controller = new AbortController();
    compiledData = await fetchAllMarketData({
      userId: report.userId,
      reportId: report.id,
      market: {
        name: market.name,
        geography: market.geography,
        luxuryTier: market.luxuryTier,
        priceFloor: market.priceFloor,
        priceCeiling: market.priceCeiling,
        segments: market.segments ?? [],
        propertyTypes: market.propertyTypes ?? [],
        peerMarkets: market.peerMarkets ?? [],
      },
      abortSignal: controller.signal,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to fetch market data: ${message}` },
      { status: 500 }
    );
  }

  // 4. Extract metadata
  const propertyCount = compiledData.targetMarket?.properties?.length ?? 0;
  const hasXSentiment = Boolean(compiledData.xSentiment);
  const peerMarketCount = compiledData.peerMarkets?.length ?? 0;

  // 5. Generate snapshot name
  const truncatedTitle = report.title.length > 40
    ? report.title.slice(0, 40) + "..."
    : report.title;
  const snapshotName = `${market.name} — from Report ${truncatedTitle}`;

  // 6. Insert snapshot
  const [snapshot] = await db
    .insert(schema.pipelineSnapshots)
    .values({
      name: snapshotName,
      marketName: market.name,
      geography: market.geography,
      compiledData: compiledData as any,
      propertyCount,
      hasXSentiment,
      peerMarketCount,
      sourceReportId: report.id,
    })
    .returning();

  // Return only metadata — compiledData can be huge and would blow up the response
  return NextResponse.json(
    {
      snapshot: {
        id: snapshot.id,
        name: snapshot.name,
        marketName: snapshot.marketName,
        propertyCount: snapshot.propertyCount,
        hasXSentiment: snapshot.hasXSentiment,
        peerMarketCount: snapshot.peerMarketCount,
        createdAt: snapshot.createdAt,
      },
    },
    { status: 201 }
  );
}
