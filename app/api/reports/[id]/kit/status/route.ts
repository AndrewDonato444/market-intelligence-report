/**
 * GET /api/reports/[id]/kit/status
 *
 * Returns the current status of a social media kit for a report.
 * Used for polling during generation.
 */

import { getAuthUserId } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";
import { getSocialMediaKit } from "@/lib/services/social-media-kit";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: reportId } = await params;

  const kit = await getSocialMediaKit(reportId);
  if (!kit) {
    return NextResponse.json(
      { error: "Social media kit not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    kit: {
      id: kit.id,
      reportId: kit.reportId,
      status: kit.status,
      content: kit.content ?? null,
      errorMessage: kit.errorMessage ?? null,
      generatedAt: kit.generatedAt,
    },
  });
}
