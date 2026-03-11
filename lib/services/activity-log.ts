import { db, schema } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";

export type ActivityEntry = typeof schema.userActivity.$inferSelect;

/**
 * Resolve a Supabase auth ID to the internal users.id.
 * Also accepts an internal ID directly (passthrough).
 */
async function resolveUserId(authOrInternalId: string): Promise<string | null> {
  // Try as auth_id first (most common from API routes)
  const [byAuth] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.authId, authOrInternalId))
    .limit(1);
  if (byAuth) return byAuth.id;

  // Fall back to checking if it's already an internal id
  const [byId] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.id, authOrInternalId))
    .limit(1);
  return byId?.id ?? null;
}

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
