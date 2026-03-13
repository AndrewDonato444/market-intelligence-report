/**
 * GET  /api/admin/test-suite/runs — list recent test runs
 * POST /api/admin/test-suite/runs — start a pipeline test run from snapshot
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { db, schema } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { runPipelineTest } from "@/lib/services/pipeline-test-runner";

export async function GET() {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const runs = await db
    .select()
    .from(schema.pipelineTestRuns)
    .orderBy(desc(schema.pipelineTestRuns.createdAt))
    .limit(50);

  return NextResponse.json({ runs });
}

export async function POST(req: Request) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { snapshotId, useDraftPrompts } = body;

  if (!snapshotId) {
    return NextResponse.json({ error: "snapshotId is required" }, { status: 400 });
  }

  // Fetch snapshot
  const [snapshot] = await db
    .select()
    .from(schema.pipelineSnapshots)
    .where(eq(schema.pipelineSnapshots.id, snapshotId))
    .limit(1);

  if (!snapshot) {
    return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
  }

  // Create run record
  const [run] = await db
    .insert(schema.pipelineTestRuns)
    .values({
      snapshotId: snapshot.id,
      status: "running",
      isDraft: useDraftPrompts ?? false,
    })
    .returning();

  // Execute pipeline (fire-and-forget for long-running runs)
  runPipelineTest({
    snapshotId: snapshot.id,
    compiledData: snapshot.compiledData as any,
    marketName: snapshot.marketName,
    geography: snapshot.geography,
    useDraftPrompts,
  }).then(async (result) => {
    await db
      .update(schema.pipelineTestRuns)
      .set({
        status: result.status,
        layer1Result: result.computedAnalytics,
        layer2Result: result.agentResults,
        layer3Result: result.reportSections.length > 0 ? { sections: result.reportSections } : null,
        layerDurations: result.layerDurations,
        error: result.error ?? null,
      })
      .where(eq(schema.pipelineTestRuns.id, run.id));
  }).catch(async (err) => {
    await db
      .update(schema.pipelineTestRuns)
      .set({
        status: "failed",
        error: { layer: 0, message: err instanceof Error ? err.message : String(err) },
      })
      .where(eq(schema.pipelineTestRuns.id, run.id));
  });

  return NextResponse.json({ run });
}
