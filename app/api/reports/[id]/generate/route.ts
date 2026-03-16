/**
 * POST /api/reports/[id]/generate
 *
 * Triggers pipeline execution for a report.
 * Returns 202 with status "generating" on success.
 * Uses next/server after() to keep function alive for pipeline execution.
 */

export const maxDuration = 300; // 5 min — pipeline needs time

import { after } from "next/server";
import { getAuthUserId } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";
import { getReport } from "@/lib/services/report";
import { executePipeline } from "@/lib/services/pipeline-executor";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: reportId } = await params;

  // Verify report exists and belongs to user
  const report = await getReport(userId, reportId);
  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  // Only allow generation from queued or failed status
  if (report.status === "generating") {
    return NextResponse.json(
      { error: "Report is already generating" },
      { status: 409 }
    );
  }

  if (report.status === "completed") {
    return NextResponse.json(
      { error: "Report is already completed. Create a new version to regenerate." },
      { status: 409 }
    );
  }

  // Use after() to run pipeline after response is sent — keeps function alive
  after(async () => {
    try {
      console.log(`[generate] Starting pipeline for report ${reportId}`);
      await executePipeline(reportId);
      console.log(`[generate] Pipeline completed for report ${reportId}`);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error(`[generate] Pipeline FAILED for report ${reportId}:`, error.message, error.stack);
    }
  });

  return NextResponse.json(
    { reportId, status: "generating" },
    { status: 202 }
  );
}
