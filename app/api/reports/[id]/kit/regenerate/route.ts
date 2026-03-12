/**
 * POST /api/reports/[id]/kit/regenerate
 *
 * Regenerates a specific content type within an existing social media kit.
 * Body: { contentType: "postIdeas" | "captions" | "personaPosts" | "polls" | "conversationStarters" | "calendarSuggestions" | "statCallouts" }
 *
 * Returns 202 with { status: "regenerating", contentType } on success.
 * The regeneration runs asynchronously — the response returns immediately.
 */

import { getAuthUserId } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";
import { getReport } from "@/lib/services/report";
import {
  getSocialMediaKit,
  regenerateKitSection,
} from "@/lib/services/social-media-kit";
import { checkEntitlement } from "@/lib/services/entitlement-check";
import type { SocialMediaKitContent } from "@/lib/db/schema";

const VALID_CONTENT_TYPES: Array<keyof SocialMediaKitContent> = [
  "postIdeas",
  "captions",
  "personaPosts",
  "polls",
  "conversationStarters",
  "calendarSuggestions",
  "statCallouts",
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
  const entitlement = await checkEntitlement(userId, "social_media_kits");
  if (!entitlement.allowed) {
    const error =
      entitlement.limit === 0
        ? "Social media kit not included in your plan"
        : "Social media kit limit reached";
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

  // Check for existing kit
  const kit = await getSocialMediaKit(reportId);
  if (!kit) {
    return NextResponse.json(
      { error: "No social media kit found. Generate a kit first." },
      { status: 404 }
    );
  }

  // Block if currently generating (full kit generation in progress)
  if (kit.status === "generating") {
    return NextResponse.json(
      { error: "Kit is currently being generated. Please wait." },
      { status: 409 }
    );
  }

  // Validate persona posts have personas
  if (
    contentType === "personaPosts" &&
    kit.content &&
    kit.content.personaPosts.length === 0
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
  // Unlike full kit gen (fire-and-forget), per-section is fast enough to start
  // inline. Errors from the service are caught and returned as 500.
  try {
    regenerateKitSection(reportId, report.userId, contentType).catch(
      (err: unknown) => {
        console.error(
          `Kit section regeneration failed for report ${reportId}, section ${contentType}:`,
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
