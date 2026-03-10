import { getAuthUserId } from "@/lib/supabase/auth";
import { getProfile } from "@/lib/services/profile";

/**
 * Check if the current user is an admin.
 * Returns the auth user ID if the user has admin role, null otherwise.
 */
export async function requireAdmin(): Promise<string | null> {
  const authId = await getAuthUserId();
  if (!authId) return null;

  const profile = await getProfile(authId);
  if (!profile || profile.role !== "admin") return null;

  return authId;
}
