/**
 * POST /api/admin/test-suite/runs/[id]/pdf — generate PDF from completed test run
 *
 * Uses the same production renderReportPdf() path to ensure PDF output matches
 * what real users would see.
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { renderReportPdf } from "@/lib/pdf/renderer";
import type { ReportData } from "@/lib/agents/schema";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Fetch run
  const [run] = await db
    .select()
    .from(schema.pipelineTestRuns)
    .where(eq(schema.pipelineTestRuns.id, id))
    .limit(1);

  if (!run) {
    return NextResponse.json({ error: "Test run not found" }, { status: 404 });
  }

  if (run.status !== "completed") {
    return NextResponse.json(
      { error: "Can only generate PDF from completed test runs" },
      { status: 400 }
    );
  }

  // Fetch the snapshot for market info
  const [snapshot] = await db
    .select()
    .from(schema.pipelineSnapshots)
    .where(eq(schema.pipelineSnapshots.id, run.snapshotId))
    .limit(1);

  // Build ReportData from test run results
  const layer3 = run.layer3Result as { sections: Array<{ sectionType: string; title: string; content: unknown }> } | null;
  const sections = layer3?.sections ?? [];

  const reportData: ReportData = {
    sections: sections.map((s, i) => ({
      sectionType: s.sectionType,
      sectionNumber: i + 1,
      title: s.title,
      content: s.content,
    })),
    pullQuotes: [],
    metadata: {
      generatedAt: run.createdAt.toISOString(),
      totalDurationMs: 0,
      agentDurations: (run.layerDurations as Record<string, number>) ?? {},
      confidence: (run.layer1Result as any)?.confidence ?? { level: "medium", sampleSize: 0, staleDataSources: [] },
    },
  };

  const branding = {
    name: "Test Suite",
    company: "Pipeline Test",
  };

  const marketName = snapshot?.marketName ?? "Test Market";
  const title = `${marketName} — Test Run`;

  const pdfBuffer = await renderReportPdf({
    reportData,
    branding,
    title,
    marketName,
  });

  return new Response(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="test-run-${id}.pdf"`,
    },
  });
}
