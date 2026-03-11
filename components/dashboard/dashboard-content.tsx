"use client";

import Link from "next/link";
import { AnimatedContainer, StaggerItem } from "@/components/ui/animated-container";
import { DashboardEmptyState } from "./dashboard-empty-state";
import { DashboardStats } from "./dashboard-stats";
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
  focusAreas: string[] | null;
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
}

export function DashboardContent({ markets, reports }: DashboardContentProps) {
  const hasMarkets = markets.length > 0;
  const hasReports = reports.length > 0;

  // Empty state: no markets at all
  if (!hasMarkets) {
    return <DashboardEmptyState />;
  }

  // Compute stats
  const lastReportDate = hasReports ? reports[0].createdAt : null;

  return (
    <div className="space-y-[var(--spacing-8)]">
      {/* Stats Row — only shown when reports exist */}
      {hasReports && (
        <AnimatedContainer variant="fade">
          <DashboardStats
            totalReports={reports.length}
            lastReportDate={lastReportDate}
            activeMarkets={markets.length}
          />
        </AnimatedContainer>
      )}

      {/* Market Cards Section */}
      <div>
        <h2 className="font-[family-name:var(--font-serif)] text-xl font-semibold text-[var(--color-primary)] mb-[var(--spacing-4)]">
          YOUR MARKETS
        </h2>
        <AnimatedContainer variant="stagger">
          <div data-testid="market-cards-section" className="grid gap-[var(--spacing-4)] md:grid-cols-2">
            {markets.map((market) => (
              <StaggerItem key={market.id} variant="slide" direction="up">
                <MarketCard market={market} />
              </StaggerItem>
            ))}
          </div>
        </AnimatedContainer>
        <Link
          href="/reports/create"
          className="inline-block mt-[var(--spacing-3)] font-[family-name:var(--font-sans)] text-sm font-medium text-[var(--color-accent)] hover:underline"
        >
          + Define New Market
        </Link>
      </div>

      {/* Divider */}
      <div className="border-t border-[var(--color-border)]" />

      {/* Recent Intelligence Briefs */}
      <div>
        <h2 className="font-[family-name:var(--font-serif)] text-xl font-semibold text-[var(--color-primary)] mb-[var(--spacing-4)]">
          RECENT INTELLIGENCE BRIEFS
        </h2>

        {hasReports ? (
          <AnimatedContainer variant="fade">
            <div data-testid="recent-reports-section">
              <RecentReportsList reports={reports} />
              <Link
                href="/reports"
                className="inline-block mt-[var(--spacing-4)] font-[family-name:var(--font-sans)] text-sm font-medium text-[var(--color-accent)] hover:underline"
              >
                View All Reports &rarr;
              </Link>
            </div>
          </AnimatedContainer>
        ) : (
          <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] p-[var(--spacing-8)] text-center">
            <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)]">
              No intelligence briefs yet.
            </p>
            <p className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-tertiary)] mt-[var(--spacing-2)]">
              Generate your first report to see it here.
            </p>
            <Link
              href="/reports/create"
              className="inline-flex items-center justify-center mt-[var(--spacing-4)] px-4 py-2 bg-[var(--color-accent)] text-sm font-semibold text-[var(--color-primary)] rounded-[var(--radius-sm)] hover:bg-[var(--color-accent-hover)] transition-colors"
            >
              Generate Your First Report
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
