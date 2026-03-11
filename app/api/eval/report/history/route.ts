import { requireAdmin } from "@/lib/supabase/admin-auth";
import { NextResponse } from "next/server";
import {
  saveEvalResult,
  getEvalHistory,
  groupByRun,
  detectRegression,
} from "@/lib/eval/report-eval/history";

export async function GET(request: Request) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") ?? "90", 10);

  if (isNaN(days) || days < 1 || days > 365) {
    return NextResponse.json(
      { error: "days must be between 1 and 365" },
      { status: 422 }
    );
  }

  try {
    const records = await getEvalHistory(days);
    const summaries = groupByRun(records);
    const regression = detectRegression(summaries);

    return NextResponse.json({
      runs: summaries,
      regression,
      totalRecords: records.length,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || "Failed to fetch eval history" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    runId?: string;
    testCaseId?: string;
    criterion?: string;
    score?: number;
    breakdown?: Record<string, number>;
    judgeReason?: string;
    durationMs?: number;
    error?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    !body.runId ||
    !body.testCaseId ||
    !body.criterion ||
    typeof body.score !== "number" ||
    !body.breakdown
  ) {
    return NextResponse.json(
      {
        error:
          "Required fields: runId, testCaseId, criterion, score, breakdown",
      },
      { status: 422 }
    );
  }

  try {
    await saveEvalResult({
      runId: body.runId,
      testCaseId: body.testCaseId,
      criterion: body.criterion,
      score: body.score,
      breakdown: body.breakdown as any,
      judgeReason: body.judgeReason,
      durationMs: body.durationMs,
      error: body.error,
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || "Failed to save eval result" },
      { status: 500 }
    );
  }
}
