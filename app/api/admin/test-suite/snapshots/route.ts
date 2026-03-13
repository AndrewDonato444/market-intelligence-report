/**
 * GET  /api/admin/test-suite/snapshots — list all snapshots
 * POST /api/admin/test-suite/snapshots — create snapshot from report
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { db, schema } from "@/lib/db";
import { desc } from "drizzle-orm";

export async function GET() {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const snapshots = await db
    .select()
    .from(schema.pipelineSnapshots)
    .orderBy(desc(schema.pipelineSnapshots.createdAt));

  return NextResponse.json({ snapshots });
}

export async function POST(req: Request) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, compiledData, marketName, geography, sourceReportId, propertyCount, hasXSentiment, peerMarketCount } = body;

  if (!name || !compiledData || !marketName || !geography) {
    return NextResponse.json(
      { error: "Missing required fields: name, compiledData, marketName, geography" },
      { status: 400 }
    );
  }

  const [snapshot] = await db
    .insert(schema.pipelineSnapshots)
    .values({
      name,
      marketName,
      geography,
      compiledData,
      propertyCount: propertyCount ?? 0,
      hasXSentiment: hasXSentiment ?? false,
      peerMarketCount: peerMarketCount ?? 0,
      sourceReportId: sourceReportId ?? null,
    })
    .returning();

  return NextResponse.json({ snapshot });
}
