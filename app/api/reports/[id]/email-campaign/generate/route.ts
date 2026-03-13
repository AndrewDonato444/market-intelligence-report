/**
 * POST /api/reports/[id]/email-campaign/generate
 *
 * Triggers email campaign generation for a completed report.
 * Returns 202 with status "generating" on success.
 * Fire-and-forget: the campaign generation runs asynchronously.
 */

import { getAuthUserId } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";
import { getReport } from "@/lib/services/report";
import {
  generateEmailCampaign,
  getEmailCampaign,
  deleteEmailCampaign,
} from "@/lib/services/email-campaign";
import { checkEntitlement } from "@/lib/services/entitlement-check";
import { incrementUsage } from "@/lib/services/usage-tracking";

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

  // Only allow campaign generation for completed reports
  if (report.status !== "completed") {
    return NextResponse.json(
      { error: "Report is not completed. Cannot generate email campaign." },
      { status: 409 }
    );
  }

  // Check entitlement before generating campaign
  const entitlement = await checkEntitlement(userId, "email_campaigns");
  if (!entitlement.allowed) {
    const error =
      entitlement.limit === 0
        ? "Email campaigns not included in your plan"
        : "Email campaign limit reached";
    return NextResponse.json({ error, entitlement }, { status: 403 });
  }

  // Check for existing campaign
  const existingCampaign = await getEmailCampaign(reportId);
  if (existingCampaign) {
    // Block if currently generating
    if (existingCampaign.status === "generating") {
      return NextResponse.json(
        { error: "Email campaign is already being generated" },
        { status: 409 }
      );
    }

    // Delete completed, failed, or stale queued campaigns before regenerating
    await deleteEmailCampaign(existingCampaign.id);
  }

  // Fire and forget — campaign generation runs async
  generateEmailCampaign(reportId, report.userId).catch((err) => {
    console.error(`Email campaign generation failed for report ${reportId}:`, err);
  });

  // Increment usage after successful generation start (fire-and-forget)
  incrementUsage(userId, "email_campaigns").catch((err) => {
    console.error("Failed to increment email_campaigns usage:", err);
  });

  return NextResponse.json(
    { reportId, status: "generating" },
    { status: 202 }
  );
}
