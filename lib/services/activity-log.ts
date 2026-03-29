import { db, schema } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";
import { resolveUserId } from "./resolve-user-id";

export type ActivityEntry = typeof schema.userActivity.$inferSelect;

/**
 * Log a user activity. Fire-and-forget — never throws.
 * Accepts either a Supabase auth ID or internal users.id as userId.
 * Failures are logged to console but do not propagate.
 */
export async function logActivity(params: {
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const internalId = await resolveUserId(params.userId);
    if (!internalId) {
      console.warn("[activity log] No user found for id:", params.userId);
      return;
    }

    await db.insert(schema.userActivity).values({
      userId: internalId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? null,
      metadata: params.metadata ?? null,
    });
  } catch (err) {
    console.error("[activity log] Failed to insert activity:", err);
  }
}

/**
 * Get activity timeline for a user, newest first.
 * Used by admin user detail page (#113).
 */
export async function getActivityByUser(
  userId: string,
  options?: { limit?: number; offset?: number }
): Promise<ActivityEntry[]> {
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;

  return db
    .select()
    .from(schema.userActivity)
    .where(eq(schema.userActivity.userId, userId))
    .orderBy(desc(schema.userActivity.createdAt))
    .limit(limit)
    .offset(offset);
}

/**
 * Get activity for a specific entity (e.g., all actions on a report).
 */
export async function getActivityByEntity(
  entityType: string,
  entityId: string
): Promise<ActivityEntry[]> {
  return db
    .select()
    .from(schema.userActivity)
    .where(
      and(
        eq(schema.userActivity.entityType, entityType),
        eq(schema.userActivity.entityId, entityId)
      )
    )
    .orderBy(desc(schema.userActivity.createdAt))
    .limit(100)
    .offset(0);
}
