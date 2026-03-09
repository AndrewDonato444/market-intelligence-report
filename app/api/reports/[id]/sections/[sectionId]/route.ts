/**
 * Update a single report section (title and/or content).
 */

import { getAuthUserId } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";
import { updateReportSection } from "@/lib/services/report";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, sectionId } = await params;

  let body: { title?: string; content?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!body.title && !body.content) {
    return NextResponse.json(
      { error: "At least one of title or content must be provided" },
      { status: 400 }
    );
  }

  const updated = await updateReportSection(userId, id, sectionId, body);
  if (!updated) {
    return NextResponse.json(
      { error: "Section not found or access denied" },
      { status: 404 }
    );
  }

  return NextResponse.json(updated);
}
