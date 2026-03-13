/**
 * POST /api/reports/[id]/email-campaign/regenerate
 *
 * Regenerates a specific content type within an existing email campaign.
 * Body: { contentType: "dripSequence" | "newsletter" | "personaEmails" | "subjectLines" | "ctaBlocks" | "reEngagementEmails" }
 *
 * Returns 202 with { status: "regenerating", contentType } on success.
 * The regeneration runs asynchronously — the response returns immediately.
 */

import { getAuthUserId } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";
import { getReport } from "@/lib/services/report";
import {
  getEmailCampaign,
  regenerateCampaignSection,
} from "@/lib/services/email-campaign";
import { checkEntitlement } from "@/lib/services/entitlement-check";
import type { EmailCampaignContent } from "@/lib/db/schema";

const VALID_CONTENT_TYPES: Array<keyof EmailCampaignContent> = [
  "dripSequence",
  "newsletter",
  "personaEmails",
  "subjectLines",
  "ctaBlocks",
  "reEngagementEmails",
];

export async function POST(
  request: Request,
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

  // Check entitlement before allowing regeneration
  const entitlement = await checkEntitlement(userId, "email_campaigns");
  if (!entitlement.allowed) {
    const error =
      entitlement.limit === 0
        ? "Email campaigns not included in your plan"
        : "Email campaign limit reached";
    return NextResponse.json({ error, entitlement }, { status: 403 });
  }

  // Parse request body
  const body = await request.json();
  const { contentType } = body;

  // Validate content type
  if (!VALID_CONTENT_TYPES.includes(contentType)) {
    return NextResponse.json(
      { error: "Invalid content type" },
      { status: 400 }
    );
  }

  // Check for existing campaign
  const campaign = await getEmailCampaign(reportId);
  if (!campaign) {
    return NextResponse.json(
      { error: "No email campaign found. Generate a campaign first." },
      { status: 404 }
    );
  }

  // Block if currently generating (full campaign generation in progress)
  if (campaign.status === "generating") {
    return NextResponse.json(
      { error: "Campaign is currently being generated. Please wait." },
      { status: 409 }
    );
  }

  // Validate persona emails have personas
  if (
    contentType === "personaEmails" &&
    campaign.content &&
    campaign.content.personaEmails.length === 0
  ) {
    return NextResponse.json(
      {
        error:
          "No personas were selected for this report. Nothing to regenerate.",
      },
      { status: 400 }
    );
  }

  // Kick off per-section regeneration and return 202.
  try {
    regenerateCampaignSection(reportId, report.userId, contentType).catch(
      (err: unknown) => {
        console.error(
          `Campaign section regeneration failed for report ${reportId}, section ${contentType}:`,
          err
        );
      }
    );

    return NextResponse.json(
      { status: "regenerating", contentType },
      { status: 202 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Regeneration failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
