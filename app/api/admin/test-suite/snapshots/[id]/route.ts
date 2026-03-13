/**
 * PATCH  /api/admin/test-suite/snapshots/[id] — update snapshot (rename, toggle golden)
 * DELETE /api/admin/test-suite/snapshots/[id] — delete snapshot (blocked if golden)
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const [existing] = await db
    .select()
    .from(schema.pipelineSnapshots)
    .where(eq(schema.pipelineSnapshots.id, id))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.isGolden !== undefined) updates.isGolden = body.isGolden;

  const [updated] = await db
    .update(schema.pipelineSnapshots)
    .set(updates)
    .where(eq(schema.pipelineSnapshots.id, id))
    .returning();

  return NextResponse.json({ snapshot: updated });
}

export async function DELETE(req: Request, { params }: Params) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [existing] = await db
    .select()
    .from(schema.pipelineSnapshots)
    .where(eq(schema.pipelineSnapshots.id, id))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
  }

  if (existing.isGolden) {
    return NextResponse.json(
      { error: "Cannot delete a golden snapshot. Remove golden status first." },
      { status: 409 }
    );
  }

  await db
    .delete(schema.pipelineSnapshots)
    .where(eq(schema.pipelineSnapshots.id, id));

  return NextResponse.json({ deleted: true });
}
