/**
 * Share link management for a report.
 * POST — generate/refresh share link
 * DELETE — revoke share link
 */

import { getAuthUserId } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";
import {
  createShareLink,
  revokeShareLink,
} from "@/lib/services/report-sharing";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const result = await createShareLink(userId, id);
  if (!result) {
    return NextResponse.json(
      { error: "Report not found or access denied" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    shareToken: result.shareToken,
    shareTokenExpiresAt: result.shareTokenExpiresAt,
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const success = await revokeShareLink(userId, id);
  if (!success) {
    return NextResponse.json(
      { error: "Report not found or access denied" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
