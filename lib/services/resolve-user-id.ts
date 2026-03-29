import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

/**
 * Resolve a Supabase auth ID to the internal users.id.
 * Also accepts an internal ID directly (passthrough).
 *
 * Used by services that have FKs to users.id but receive
 * auth IDs from API routes (via getAuthUserId()).
 *
 * Returns null if no matching user is found.
 */
export async function resolveUserId(
  authOrInternalId: string
): Promise<string | null> {
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
