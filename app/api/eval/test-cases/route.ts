import { requireAdmin } from "@/lib/supabase/admin-auth";
import { NextResponse } from "next/server";
import { EVAL_TEST_CASES } from "@/lib/eval/test-cases";
import { EVAL_FIXTURES } from "@/lib/eval/fixtures";

export async function GET() {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const fixtureNames: Record<string, string> = {};
  for (const f of Object.values(EVAL_FIXTURES)) {
    fixtureNames[f.id] = f.name;
  }

  return NextResponse.json({ testCases: EVAL_TEST_CASES, fixtureNames });
}
