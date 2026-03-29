"use client";

import Link from "next/link";

interface DashboardWelcomeHeroProps {
  firstName?: string;
  hasReports: boolean;
}

function getTimeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const CTA_CLASSES =
  "inline-flex items-center justify-center px-4 py-2 bg-[var(--color-app-accent)] text-[var(--color-app-surface)] rounded-[var(--radius-sm)] font-[family-name:var(--font-body)] font-semibold text-sm hover:bg-[var(--color-app-accent-hover)] transition-colors";

export function DashboardWelcomeHero({
  firstName,
  hasReports,
}: DashboardWelcomeHeroProps) {
  const greeting = getTimeOfDayGreeting();
  const hasName = firstName && firstName.trim().length > 0;

  return (
    <div
      data-testid="welcome-hero"
      className="bg-[var(--color-app-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] p-[var(--spacing-6)] md:p-[var(--spacing-8)]"
    >
      {/* Greeting + CTA row */}
      <div className="flex items-start justify-between gap-[var(--spacing-4)]">
        <div>
          <h1
            data-testid="welcome-greeting"
            className="font-[family-name:var(--font-display)] text-[1.875rem] font-semibold text-[var(--color-app-text)] leading-tight"
          >
            {hasName ? `${greeting}, ${firstName}.` : "Welcome back."}
          </h1>
          <p
            data-testid="welcome-tagline"
            className="font-[family-name:var(--font-body)] text-base text-[var(--color-app-text-secondary)] mt-[var(--spacing-2)]"
          >
            {hasReports
              ? "Your markets are ready."
              : "Your first intelligence brief is one click away."}
          </p>
        </div>

        {hasReports ? (
          <Link
            href="/reports/create"
            className={`shrink-0 hidden sm:inline-flex whitespace-nowrap ${CTA_CLASSES}`}
          >
            Generate New Report
          </Link>
        ) : null}
      </div>

      {/* First-time user CTA */}
      {!hasReports && (
        <Link
          href="/reports/create"
          className={`mt-[var(--spacing-4)] w-full sm:w-auto ${CTA_CLASSES}`}
        >
          Generate Your First Report
        </Link>
      )}

      {/* Mobile CTA for returning users */}
      {hasReports && (
        <Link
          href="/reports/create"
          className={`sm:hidden mt-[var(--spacing-4)] w-full ${CTA_CLASSES}`}
        >
          Generate New Report
        </Link>
      )}
    </div>
  );
}
