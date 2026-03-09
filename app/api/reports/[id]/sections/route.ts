import { getAuthUserId } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";
import { getReportSections } from "@/lib/services/report";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const sections = await getReportSections(userId, id);
  if (!sections) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  return NextResponse.json({ sections });
}
