/**
 * GET /api/reports/[id]/email-campaign/status
 *
 * Returns the current status of an email campaign for a report.
 * Used for polling during generation.
 */

import { getAuthUserId } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";
import { getEmailCampaign } from "@/lib/services/email-campaign";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: reportId } = await params;

  const campaign = await getEmailCampaign(reportId);
  if (!campaign) {
    return NextResponse.json(
      { error: "Email campaign not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    campaign: {
      id: campaign.id,
      reportId: campaign.reportId,
      status: campaign.status,
      content: campaign.content ?? null,
      errorMessage: campaign.errorMessage ?? null,
      generatedAt: campaign.generatedAt,
    },
  });
}
