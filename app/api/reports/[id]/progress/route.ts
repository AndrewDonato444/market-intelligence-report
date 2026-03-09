/**
 * GET /api/reports/[id]/progress
 *
 * Returns real-time pipeline execution progress for a report.
 * Includes: percent complete, current agents, event log.
 */

import { getAuthUserId } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";
import { getReport } from "@/lib/services/report";
import { getExecutionProgress } from "@/lib/services/pipeline-executor";

export async function GET(
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

  const progress = getExecutionProgress(reportId);

  return NextResponse.json({
    reportId,
    reportStatus: report.status,
    pipeline: {
      status: progress.status,
      totalAgents: progress.totalAgents,
      completedAgents: progress.completedAgents,
      currentAgents: progress.currentAgents,
      percentComplete: progress.percentComplete,
    },
  });
}
