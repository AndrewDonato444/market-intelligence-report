import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { registry } from "@/lib/services/data-source-registry";

/**
 * GET /api/admin/data-sources
 * Returns all registered data sources with their current health snapshots.
 */
export async function GET() {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ sources: registry.toJSON() });
}

/**
 * POST /api/admin/data-sources
 * Actions: "health-check" — runs health checks on all connectors.
 */
export async function POST(request: Request) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();

  if (body.action === "health-check") {
    const results = await registry.checkAllHealth();

    // Convert Date objects for JSON serialization
    const serialized: Record<string, unknown> = {};
    for (const [name, health] of Object.entries(results)) {
      serialized[name] = {
        ...health,
        lastChecked: health.lastChecked.toISOString(),
      };
    }

    return NextResponse.json({
      results: serialized,
      sources: registry.toJSON(),
    });
  }

  return NextResponse.json(
    { error: "Unknown action. Supported: health-check" },
    { status: 400 }
  );
}
