import { getAuthUserId } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";
import {
  getReports,
  createReport,
  validateReportConfig,
} from "@/lib/services/report";
// setReportPersonas is called internally by createReport when personaIds are provided
import { setReportPersonas } from "@/lib/services/buyer-personas";
import { executePipeline } from "@/lib/services/pipeline-executor";
import { logActivity } from "@/lib/services/activity-log";
import { checkEntitlement } from "@/lib/services/entitlement-check";
import { incrementUsage } from "@/lib/services/usage-tracking";

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reports = await getReports(userId);
  return NextResponse.json({ reports });
}

export async function POST(request: Request) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const validation = validateReportConfig(body as any);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Validation failed", errors: validation.errors },
      { status: 422 }
    );
  }

  // Server-side entitlement check — authoritative gate
  const entitlement = await checkEntitlement(userId, "reports_per_month");
  if (!entitlement.allowed) {
    return NextResponse.json(
      { error: "Report limit reached", entitlement },
      { status: 403 }
    );
  }

  try {
    // Include personaIds from request body if provided
    const personaIds = Array.isArray(body.personaIds) ? body.personaIds as string[] : undefined;
    const reportData = { ...validation.data!, personaIds };
    const report = await createReport(userId, reportData);

    // Increment usage after successful creation (fire-and-forget)
    incrementUsage(userId, "reports_per_month").catch((err) => {
      console.error("[POST /api/reports] Failed to increment usage:", err);
    });

    // Log activity (fire-and-forget)
    logActivity({
      userId,
      action: "report_created",
      entityType: "report",
      entityId: report.id,
      metadata: { title: report.title },
    });

    // Fire-and-forget: trigger pipeline execution asynchronously
    executePipeline(report.id).catch((err) => {
      console.error(`Pipeline auto-trigger failed for report ${report.id}:`, err);
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (err: unknown) {
    // Extract the real Postgres/Drizzle error — Drizzle wraps the DB error
    const message =
      err instanceof Error ? err.message : "Failed to create report";
    const cause = err instanceof Error ? (err as any).cause : undefined;
    const code = (err as any)?.code ?? cause?.code;
    const detail = (err as any)?.detail ?? cause?.detail;
    const constraint = (err as any)?.constraint ?? cause?.constraint;

    console.error("[POST /api/reports] createReport failed:", {
      authId: userId,
      marketId: validation.data?.marketId,
      error: message,
      code,
      detail,
      constraint,
      cause: cause ? String(cause) : undefined,
      stack: err instanceof Error ? err.stack : undefined,
      // Log the full error object keys to find hidden properties
      errorKeys: err && typeof err === "object" ? Object.keys(err) : [],
    });
    return NextResponse.json(
      { error: message, code, detail },
      { status: 400 }
    );
  }
}
