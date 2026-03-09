"use client";

import { UserButton } from "@clerk/nextjs";

export function TopNav() {
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
      <UserButton
        appearance={{
          elements: {
            avatarBox: "w-8 h-8",
          },
        }}
      />
    </header>
  );
}
