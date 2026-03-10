import { requireAdmin } from "@/lib/supabase/admin-auth";
import { NextResponse } from "next/server";
import { runSingleTestCase } from "@/lib/eval/runner";

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
    const result = await runSingleTestCase(body.testCaseId);
    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || "Eval run failed" },
      { status: 500 }
    );
  }
}
