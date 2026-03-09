"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function TopNav() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/sign-in");
  }

  return (
    <header className="h-14 bg-[var(--color-primary)] text-[var(--color-text-inverse)] px-[var(--spacing-6)] flex items-center justify-between shrink-0">
      <div className="flex items-center gap-[var(--spacing-3)]">
        <span className="font-[family-name:var(--font-serif)] text-lg font-bold">
          Modern Signal Advisory
        </span>
        <div className="w-px h-5 bg-[var(--color-text-tertiary)]" />
        <span className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-tertiary)] tracking-wider uppercase">
          Intelligence Platform
        </span>
      </div>
      <button
        onClick={handleSignOut}
        className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-inverse)] transition-colors"
      >
        Sign Out
      </button>
    </header>
  );
}
