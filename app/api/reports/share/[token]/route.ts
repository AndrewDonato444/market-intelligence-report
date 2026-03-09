/**
 * Public share endpoint — retrieve report metadata by share token.
 * No authentication required.
 */

import { NextResponse } from "next/server";
import { getReportByShareToken } from "@/lib/services/report-sharing";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!token || token.length < 32) {
    return NextResponse.json(
      { error: "Invalid share token" },
      { status: 400 }
    );
  }

  const report = await getReportByShareToken(token);
  if (!report) {
    return NextResponse.json(
      { error: "This share link has expired or is invalid" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    id: report.id,
    title: report.title,
    status: report.status,
    marketName: report.marketName,
    generatedAt: report.generationCompletedAt,
  });
}
