import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export type UserAccountStatus = "active" | "suspended" | "deleted";

/**
 * Get a user's current account status by their auth ID.
 * Returns the status string or null if user not found.
 */
export async function getUserStatus(
  authId: string
): Promise<UserAccountStatus | null> {
  const [user] = await db
    .select({ status: schema.users.status })
    .from(schema.users)
    .where(eq(schema.users.authId, authId))
    .limit(1);

  return user?.status ?? null;
}

/**
 * Suspend a user account. Sets status to 'suspended' and records suspendedAt.
 */
export async function suspendUser(userId: string) {
  const [updated] = await db
    .update(schema.users)
    .set({
      status: "suspended",
      suspendedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, userId))
    .returning();

  return updated ?? null;
}

/**
 * Unsuspend a user account. Sets status back to 'active' and clears suspendedAt.
 */
export async function unsuspendUser(userId: string) {
  const [updated] = await db
    .update(schema.users)
    .set({
      status: "active",
      suspendedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, userId))
    .returning();

  return updated ?? null;
}

/**
 * Soft-delete a user account. Sets status to 'deleted' and records deletedAt.
 * Reports are NOT cascade-deleted — they become orphaned for analytics.
 */
export async function softDeleteUser(userId: string) {
  const [updated] = await db
    .update(schema.users)
    .set({
      status: "deleted",
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, userId))
    .returning();

  return updated ?? null;
}

/**
 * Update the lastLoginAt timestamp for a user.
 * Called from auth callback after successful authentication.
 */
export async function updateLastLogin(authId: string) {
  const [updated] = await db
    .update(schema.users)
    .set({
      lastLoginAt: new Date(),
    })
    .where(eq(schema.users.authId, authId))
    .returning();

  return updated ?? null;
}

/**
 * Query users filtered by account status.
 * Used by admin user management page.
 */
export async function getUsersByStatus(status: UserAccountStatus) {
  return db
    .select()
    .from(schema.users)
    .where(eq(schema.users.status, status));
}
