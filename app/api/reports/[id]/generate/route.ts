/**
 * POST /api/reports/[id]/generate
 *
 * Triggers pipeline execution for a report.
 * Returns 202 with status "generating" on success.
 * Fire-and-forget: the pipeline runs asynchronously.
 */

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

  // Fire and forget — pipeline runs async
  executePipeline(reportId).catch((err) => {
    console.error(`Pipeline execution failed for report ${reportId}:`, err);
  });

  return NextResponse.json(
    { reportId, status: "generating" },
    { status: 202 }
  );
}
