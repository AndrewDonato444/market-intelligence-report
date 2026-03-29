"use client";

import Link from "next/link";

export function DashboardEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-[var(--spacing-16)] px-[var(--spacing-6)]">
      <div className="w-40 h-32 rounded-[var(--radius-md)] border-2 border-[var(--color-app-accent)] border-dashed flex items-center justify-center mb-[var(--spacing-8)]">
        <svg
          width="64"
          height="64"
          viewBox="0 0 64 64"
          fill="none"
          className="text-[var(--color-app-accent)]"
        >
          <path
            d="M8 48V16a4 4 0 0 1 4-4h40a4 4 0 0 1 4 4v32a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4z"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path d="M16 36l8-8 6 6 10-10 8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M20 20h24M20 26h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
        </svg>
      </div>

      <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--color-app-text)] text-center">
        Define Your First Market
      </h2>

      <p className="font-[family-name:var(--font-body)] text-base text-[var(--color-app-text-secondary)] text-center max-w-md mt-[var(--spacing-3)]">
        Your intelligence platform is ready. Start by telling us about the market you advise in.
      </p>

      <Link
        href="/reports/create"
        className="mt-[var(--spacing-6)] inline-flex items-center justify-center px-6 py-3 bg-[var(--color-app-accent)] text-[var(--color-app-surface)] font-[family-name:var(--font-body)] font-semibold rounded-[var(--radius-sm)] hover:bg-[var(--color-app-accent-hover)] transition-colors"
      >
        Get Started
      </Link>

      <div
        data-testid="gold-accent-line"
        className="w-48 h-0.5 bg-[var(--color-app-accent)] mt-[var(--spacing-6)]"
      />
    </div>
  );
}
