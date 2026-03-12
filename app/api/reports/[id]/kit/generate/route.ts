/**
 * POST /api/reports/[id]/kit/generate
 *
 * Triggers social media kit generation for a completed report.
 * Returns 202 with status "generating" on success.
 * Fire-and-forget: the kit generation runs asynchronously.
 */

import { getAuthUserId } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";
import { getReport } from "@/lib/services/report";
import {
  generateSocialMediaKit,
  getSocialMediaKit,
  deleteSocialMediaKit,
} from "@/lib/services/social-media-kit";
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

  // Only allow kit generation for completed reports
  if (report.status !== "completed") {
    return NextResponse.json(
      { error: "Report is not completed. Cannot generate social media kit." },
      { status: 409 }
    );
  }

  // Check entitlement before generating kit
  const entitlement = await checkEntitlement(userId, "social_media_kits");
  if (!entitlement.allowed) {
    const error =
      entitlement.limit === 0
        ? "Social media kit not included in your plan"
        : "Social media kit limit reached";
    return NextResponse.json({ error, entitlement }, { status: 403 });
  }

  // Check for existing kit
  const existingKit = await getSocialMediaKit(reportId);
  if (existingKit) {
    // Block if currently generating
    if (existingKit.status === "generating") {
      return NextResponse.json(
        { error: "Kit is already being generated" },
        { status: 409 }
      );
    }

    // Delete completed, failed, or stale queued kits before regenerating
    await deleteSocialMediaKit(existingKit.id);
  }

  // Fire and forget — kit generation runs async
  generateSocialMediaKit(reportId, report.userId).catch((err) => {
    console.error(`Social media kit generation failed for report ${reportId}:`, err);
  });

  // Increment usage after successful generation start (fire-and-forget)
  incrementUsage(userId, "social_media_kits").catch((err) => {
    console.error("Failed to increment social_media_kits usage:", err);
  });

  return NextResponse.json(
    { reportId, status: "generating" },
    { status: 202 }
  );
}
