import { requireAdmin } from "@/lib/supabase/admin-auth";
import { NextResponse } from "next/server";
import { REPORT_EVAL_TEST_CASES } from "@/lib/eval/report-eval/test-cases";
import { REPORT_EVAL_FIXTURES } from "@/lib/eval/report-eval/fixtures";

export async function GET() {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const fixtureNames: Record<string, string> = {};
  for (const f of Object.values(REPORT_EVAL_FIXTURES)) {
    fixtureNames[f.id] = f.name;
  }

  return NextResponse.json({
    testCases: REPORT_EVAL_TEST_CASES,
    fixtureNames,
  });
}
