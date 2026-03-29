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
    <header className="h-16 bg-[var(--color-app-nav-bg)] text-[var(--color-app-text-tertiary)] px-[var(--spacing-6)] flex items-center justify-between shrink-0">
      <div className="flex items-center gap-[var(--spacing-3)]">
        <span className="font-[family-name:var(--font-display)] text-lg font-bold text-white">
          Modern <span className="text-[var(--color-app-accent)]">Signal</span> Advisory
        </span>
        <div className="w-px h-5 bg-[var(--color-app-text-tertiary)] opacity-40" />
        <span className="font-[family-name:var(--font-body)] text-xs text-[var(--color-app-text-tertiary)] tracking-wider uppercase">
          Intelligence Platform
        </span>
      </div>
      <button
        onClick={handleSignOut}
        className="font-[family-name:var(--font-body)] text-sm text-[var(--color-app-text-tertiary)] hover:text-white transition-colors"
      >
        Sign Out
      </button>
    </header>
  );
}
