/**
 * POST /api/admin/reports/[id]/retry
 *
 * Admin endpoint to re-trigger a failed report's pipeline.
 * Uses prepareRetry() to reset status and preserve error history,
 * then fires executePipeline() asynchronously.
 */

export const maxDuration = 600; // 10 min — pipeline needs time for data fetch + Claude agents

import { after } from "next/server";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { prepareRetry } from "@/lib/services/report-error-tracking";
import { executePipeline } from "@/lib/services/pipeline-executor";
import { logActivity } from "@/lib/services/activity-log";

export interface RetryResponse {
  success: boolean;
  reportId: string;
  status: string;
  retriedAt: string;
  retriedBy: string;
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: reportId } = await params;

  try {
    // Fetch report to check current status
    const [report] = await db
      .select({
        id: schema.reports.id,
        status: schema.reports.status,
        title: schema.reports.title,
        userId: schema.reports.userId,
      })
      .from(schema.reports)
      .where(eq(schema.reports.id, reportId))
      .limit(1);

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Only allow retry from failed status
    if (report.status !== "failed") {
      return NextResponse.json(
        { error: `Report is not in a retryable state. Current status: ${report.status}` },
        { status: 409 }
      );
    }

    // Prepare retry — reset status to queued, preserve error history
    await prepareRetry(reportId, adminId);

    const retriedAt = new Date().toISOString();

    // Log activity (fire-and-forget)
    logActivity({
      userId: report.userId,
      action: "pipeline_retried",
      entityType: "report",
      entityId: reportId,
      metadata: {
        title: report.title,
        retriedBy: adminId,
      },
    });

    // Use after() to run pipeline after response — keeps function alive
    after(async () => {
      try {
        console.log(`[admin/retry] Starting pipeline for report ${reportId}`);
        await executePipeline(reportId);
        console.log(`[admin/retry] Pipeline completed for report ${reportId}`);
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error(`[admin/retry] Pipeline FAILED for report ${reportId}:`, error.message, error.stack);
      }
    });

    const response: RetryResponse = {
      success: true,
      reportId,
      status: "queued",
      retriedAt,
      retriedBy: adminId,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error retrying report pipeline:", error);
    return NextResponse.json(
      { error: "Failed to retry report pipeline" },
      { status: 500 }
    );
  }
}
