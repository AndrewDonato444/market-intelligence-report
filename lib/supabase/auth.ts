import { createClient } from "./server";

/**
 * Get the authenticated user's ID from a server context (API route, server component).
 * Returns null if not authenticated.
 */
export async function getAuthUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/**
 * Get the authenticated user's email from a server context.
 * Returns null if not authenticated.
 */
export async function getAuthUserEmail(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.email ?? null;
}

/**
 * Get both user ID and email. Useful for profile upsert.
 */
export async function getAuthUser(): Promise<{
  id: string;
  email: string;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { id: user.id, email: user.email ?? "" };
}
