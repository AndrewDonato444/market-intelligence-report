"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AnimatedContainer, StaggerItem } from "@/components/ui/animated-container";
import { DashboardEmptyState } from "./dashboard-empty-state";
import { DashboardWelcomeHero } from "./dashboard-welcome-hero";
import { MarketCard } from "./market-card";
import { RecentReportsList } from "./recent-reports-list";

interface Market {
  id: string;
  name: string;
  geography: { city: string; state: string };
  luxuryTier: "luxury" | "high_luxury" | "ultra_luxury";
  priceFloor: number;
  priceCeiling: number | null;
  segments: string[] | null;
  propertyTypes: string[] | null;
  isDefault: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Report {
  id: string;
  title: string;
  status: "queued" | "generating" | "completed" | "failed";
  marketId: string;
  marketName: string;
  createdAt: Date;
  updatedAt: Date;
}

interface DashboardContentProps {
  markets: Market[];
  reports: Report[];
  firstName?: string;
}

export function DashboardContent({ markets, reports, firstName }: DashboardContentProps) {
  const hasMarkets = markets.length > 0;

  // Only show successful/in-progress reports on the dashboard — hide failed ones
  const visibleReports = useMemo(
    () => reports.filter((r) => r.status !== "failed"),
    [reports]
  );
  const hasReports = visibleReports.length > 0;

  // Empty state: no markets at all
  if (!hasMarkets) {
    return <DashboardEmptyState />;
  }

  // Build a map of marketId → most recent report date
  const lastReportByMarket = useMemo(() => {
    const map = new Map<string, Date>();
    for (const r of visibleReports) {
      const existing = map.get(r.marketId);
      if (!existing || r.createdAt > existing) {
        map.set(r.marketId, r.createdAt);
      }
    }
    return map;
  }, [visibleReports]);

  return (
    <div className="space-y-[var(--spacing-8)]">
      {/* Welcome Hero — personalized greeting + CTA */}
      <AnimatedContainer variant="fade">
        <DashboardWelcomeHero
          firstName={firstName}
          hasReports={hasReports}
        />
      </AnimatedContainer>

      {/* Market Cards Section */}
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--color-app-text)] mb-[var(--spacing-4)]">
          YOUR MARKETS
        </h2>
        <AnimatedContainer variant="stagger">
          <div data-testid="market-cards-section" className="grid gap-[var(--spacing-4)] md:grid-cols-2">
            {markets.map((market) => (
              <StaggerItem key={market.id} variant="slide" direction="up">
                <MarketCard market={market} lastReportDate={lastReportByMarket.get(market.id)} />
              </StaggerItem>
            ))}
          </div>
        </AnimatedContainer>
        <Link
          href="/reports/create"
          className="inline-block mt-[var(--spacing-3)] font-[family-name:var(--font-body)] text-sm font-medium text-[var(--color-app-accent)] hover:underline"
        >
          + Define New Market
        </Link>
      </div>

      {/* Divider */}
      <div className="border-t border-[var(--color-app-border)]" />

      {/* Recent Intelligence Briefs */}
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--color-app-text)] mb-[var(--spacing-4)]">
          RECENT INTELLIGENCE BRIEFS
        </h2>

        {hasReports ? (
          <AnimatedContainer variant="fade">
            <div data-testid="recent-reports-section">
              <RecentReportsList reports={visibleReports} />
              <Link
                href="/reports"
                className="inline-block mt-[var(--spacing-4)] font-[family-name:var(--font-body)] text-sm font-medium text-[var(--color-app-accent)] hover:underline"
              >
                View All Reports &rarr;
              </Link>
            </div>
          </AnimatedContainer>
        ) : (
          <div className="bg-[var(--color-app-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] p-[var(--spacing-8)] text-center">
            <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-app-text-secondary)]">
              No intelligence briefs yet.
            </p>
            <p className="font-[family-name:var(--font-body)] text-xs text-[var(--color-app-text-tertiary)] mt-[var(--spacing-2)]">
              Generate your first report to see it here.
            </p>
            <Link
              href="/reports/create"
              className="inline-flex items-center justify-center mt-[var(--spacing-4)] px-4 py-2 bg-[var(--color-app-accent)] text-sm font-semibold text-[var(--color-app-surface)] rounded-[var(--radius-sm)] hover:bg-[var(--color-app-accent-hover)] transition-colors"
            >
              Generate Your First Report
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
