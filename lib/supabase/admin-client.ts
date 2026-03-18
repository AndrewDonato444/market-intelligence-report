/**
 * Supabase Admin Client — uses the service role key to bypass RLS.
 * Only use for admin operations like creating auth users.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY env var.
 */

import { createClient } from "@supabase/supabase-js";

let adminInstance: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  if (!adminInstance) {
    adminInstance = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return adminInstance;
}
