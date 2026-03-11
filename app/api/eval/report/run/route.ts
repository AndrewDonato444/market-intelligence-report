import { requireAdmin } from "@/lib/supabase/admin-auth";
import { NextResponse } from "next/server";
import { runSingleReportTestCase } from "@/lib/eval/report-eval/runner";

export async function POST(request: Request) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { testCaseId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.testCaseId || typeof body.testCaseId !== "string") {
    return NextResponse.json(
      { error: "testCaseId is required" },
      { status: 422 }
    );
  }

  try {
    const result = await runSingleReportTestCase(body.testCaseId);
    // Strip the full report from the response to avoid huge payloads
    const { report, ...resultWithoutReport } = result;
    return NextResponse.json({
      ...resultWithoutReport,
      reportSectionCount: report.sections.length,
      reportConfidence: report.metadata.confidence.level,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || "Report eval run failed" },
      { status: 500 }
    );
  }
}
