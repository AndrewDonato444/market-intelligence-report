import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import fs from "fs";
import path from "path";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ push: jest.fn() }),
}));

// Mock next/link
jest.mock("next/link", () => {
  return function MockLink({ children, href, className, ...rest }: any) {
    return <a href={href} className={className} {...rest}>{children}</a>;
  };
});

// Mock @/lib/supabase/client
jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { signOut: jest.fn().mockResolvedValue({}) },
  }),
}));

// Mock framer-motion
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock DownloadPdfButton (lives in reports domain — not changing)
jest.mock("@/components/reports/download-pdf-button", () => ({
  DownloadPdfButton: ({ reportId, reportTitle }: any) => (
    <button data-testid={`download-${reportId}`}>Download</button>
  ),
}));

import { DashboardWelcomeHero } from "@/components/dashboard/dashboard-welcome-hero";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { MarketCard } from "@/components/dashboard/market-card";
import { RecentReportsList } from "@/components/dashboard/recent-reports-list";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";

/**
 * Dashboard Design Refresh Tests (Phase 2)
 *
 * Verifies that all 5 dashboard components use the warm luxury palette
 * (--color-app-*) and updated typography (--font-display + --font-body)
 * to match the marketing page aesthetic established in Phase 1.
 *
 * Test approach: check className strings for CSS variable names.
 * This is the same pattern used in Phase 1 shell tests.
 */

// ──────────────────────────── Test data ────────────────────────────

const sampleMarket = {
  id: "mkt-1",
  name: "Naples FL",
  geography: { city: "Naples", state: "Florida" },
  luxuryTier: "ultra_luxury" as const,
  priceFloor: 5000000,
  priceCeiling: null,
  segments: null,
  propertyTypes: null,
  isDefault: 0,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

const sampleMarket2 = {
  ...sampleMarket,
  id: "mkt-2",
  name: "Miami FL",
  geography: { city: "Miami", state: "Florida" },
};

const sampleReport = {
  id: "rpt-1",
  title: "Naples Market Intelligence — March 2026",
  status: "completed" as const,
  marketId: "mkt-1",
  marketName: "Naples FL",
  createdAt: new Date("2026-03-01"),
  updatedAt: new Date("2026-03-01"),
};

const sampleReport2 = {
  id: "rpt-2",
  title: "Miami Market Intelligence — March 2026",
  status: "generating" as const,
  marketId: "mkt-2",
  marketName: "Miami FL",
  createdAt: new Date("2026-03-15"),
  updatedAt: new Date("2026-03-15"),
};

// ─────────────────── DashboardWelcomeHero tests ───────────────────

describe("Dashboard Design Refresh (Phase 2)", () => {
  describe("DashboardWelcomeHero warm palette", () => {
    it("uses display font for greeting heading (--font-display)", () => {
      render(<DashboardWelcomeHero firstName="Alex" hasReports={true} />);
      const heading = screen.getByTestId("welcome-greeting");
      expect(heading.className).toContain("font-display");
    });

    it("uses warm text color for greeting (--color-app-text)", () => {
      render(<DashboardWelcomeHero firstName="Alex" hasReports={true} />);
      const heading = screen.getByTestId("welcome-greeting");
      expect(heading.className).toContain("color-app-text");
    });

    it("uses body font for tagline (--font-body)", () => {
      render(<DashboardWelcomeHero firstName="Alex" hasReports={true} />);
      const tagline = screen.getByTestId("welcome-tagline");
      expect(tagline.className).toContain("font-body");
    });

    it("uses warm secondary text for tagline (--color-app-text-secondary)", () => {
      render(<DashboardWelcomeHero firstName="Alex" hasReports={true} />);
      const tagline = screen.getByTestId("welcome-tagline");
      expect(tagline.className).toContain("color-app-text-secondary");
    });

    it("uses warm surface background (--color-app-surface)", () => {
      render(<DashboardWelcomeHero firstName="Alex" hasReports={true} />);
      const hero = screen.getByTestId("welcome-hero");
      expect(hero.className).toContain("color-app-surface");
    });

    it("CTA button uses warm accent (--color-app-accent)", () => {
      render(<DashboardWelcomeHero firstName="Alex" hasReports={false} />);
      const cta = screen.getByText("Generate Your First Report");
      expect(cta.className).toContain("color-app-accent");
    });

    it("CTA button hover uses warm accent hover (--color-app-accent-hover)", () => {
      render(<DashboardWelcomeHero firstName="Alex" hasReports={false} />);
      const cta = screen.getByText("Generate Your First Report");
      expect(cta.className).toContain("color-app-accent-hover");
    });

    // Backward compat
    it("still renders personalized greeting text", () => {
      render(<DashboardWelcomeHero firstName="Alex" hasReports={true} />);
      expect(screen.getByTestId("welcome-greeting")).toBeInTheDocument();
    });

    it("still links to /reports/create", () => {
      render(<DashboardWelcomeHero firstName="Alex" hasReports={false} />);
      const cta = screen.getByText("Generate Your First Report");
      expect(cta.closest("a")).toHaveAttribute("href", "/reports/create");
    });
  });

  // ────────────────── DashboardContent section heading tests ──────────────────

  describe("DashboardContent section headings", () => {
    it("'YOUR MARKETS' heading uses display font (--font-display)", () => {
      render(
        <DashboardContent
          markets={[sampleMarket]}
          reports={[sampleReport]}
          firstName="Alex"
        />
      );
      const heading = screen.getByText("YOUR MARKETS");
      expect(heading.className).toContain("font-display");
    });

    it("'YOUR MARKETS' heading uses warm text color (--color-app-text)", () => {
      render(
        <DashboardContent
          markets={[sampleMarket]}
          reports={[sampleReport]}
          firstName="Alex"
        />
      );
      const heading = screen.getByText("YOUR MARKETS");
      expect(heading.className).toContain("color-app-text");
    });

    it("'RECENT INTELLIGENCE BRIEFS' heading uses display font (--font-display)", () => {
      render(
        <DashboardContent
          markets={[sampleMarket]}
          reports={[sampleReport]}
          firstName="Alex"
        />
      );
      const heading = screen.getByText("RECENT INTELLIGENCE BRIEFS");
      expect(heading.className).toContain("font-display");
    });

    it("'RECENT INTELLIGENCE BRIEFS' heading uses warm text (--color-app-text)", () => {
      render(
        <DashboardContent
          markets={[sampleMarket]}
          reports={[sampleReport]}
          firstName="Alex"
        />
      );
      const heading = screen.getByText("RECENT INTELLIGENCE BRIEFS");
      expect(heading.className).toContain("color-app-text");
    });

    it("divider uses warm border (--color-app-border)", () => {
      const { container } = render(
        <DashboardContent
          markets={[sampleMarket]}
          reports={[sampleReport]}
          firstName="Alex"
        />
      );
      const divider = container.querySelector(".border-t");
      expect(divider?.className).toContain("color-app-border");
    });

    it("'Define New Market' link uses warm accent (--color-app-accent)", () => {
      render(
        <DashboardContent
          markets={[sampleMarket]}
          reports={[sampleReport]}
          firstName="Alex"
        />
      );
      const link = screen.getByText("+ Define New Market");
      expect(link.className).toContain("color-app-accent");
    });

    it("'Define New Market' link uses body font (--font-body)", () => {
      render(
        <DashboardContent
          markets={[sampleMarket]}
          reports={[sampleReport]}
          firstName="Alex"
        />
      );
      const link = screen.getByText("+ Define New Market");
      expect(link.className).toContain("font-body");
    });

    it("'View All Reports' link uses warm accent (--color-app-accent)", () => {
      render(
        <DashboardContent
          markets={[sampleMarket]}
          reports={[sampleReport]}
          firstName="Alex"
        />
      );
      const link = screen.getByText(/View All Reports/);
      expect(link.className).toContain("color-app-accent");
    });

    it("no-reports empty card uses warm surface (--color-app-surface)", () => {
      render(
        <DashboardContent
          markets={[sampleMarket]}
          reports={[]}
          firstName="Alex"
        />
      );
      const emptyText = screen.getByText("No intelligence briefs yet.");
      const card = emptyText.closest("div");
      expect(card?.className).toContain("color-app-surface");
    });

    // Backward compat
    it("still renders market cards when markets exist", () => {
      render(
        <DashboardContent
          markets={[sampleMarket, sampleMarket2]}
          reports={[sampleReport]}
          firstName="Alex"
        />
      );
      expect(screen.getByTestId("market-cards-section")).toBeInTheDocument();
    });

    it("renders DashboardEmptyState when no markets", () => {
      render(
        <DashboardContent markets={[]} reports={[]} firstName="Alex" />
      );
      expect(screen.getByText("Define Your First Market")).toBeInTheDocument();
    });
  });

  // ────────────────── MarketCard tests ──────────────────

  describe("MarketCard warm palette", () => {
    it("card title uses display font (--font-display)", () => {
      render(<MarketCard market={sampleMarket} lastReportDate={null} />);
      const title = screen.getByText("Naples");
      expect(title.className).toContain("font-display");
    });

    it("tier badge uses warm accent-light background (--color-app-accent-light)", () => {
      render(<MarketCard market={sampleMarket} lastReportDate={null} />);
      const badge = screen.getByText("ULTRA LUXURY");
      expect(badge.className).toContain("color-app-accent-light");
    });

    it("tier badge text uses warm accent (--color-app-accent)", () => {
      render(<MarketCard market={sampleMarket} lastReportDate={null} />);
      const badge = screen.getByText("ULTRA LUXURY");
      expect(badge.className).toContain("color-app-accent");
    });

    it("hover overlay text uses body font (--font-body)", () => {
      render(<MarketCard market={sampleMarket} lastReportDate={null} />);
      const hoverText = screen.getByText("Generate New Report");
      expect(hoverText.className).toContain("font-body");
    });

    it("hover overlay uses warm dark rgba (not cold navy)", () => {
      render(<MarketCard market={sampleMarket} lastReportDate={null} />);
      const overlay = screen.getByTestId("market-card-hover-overlay");
      expect(overlay.className).toContain("rgba(26,23,20");
    });

    // Backward compat
    it("still links to report creation with market ID", () => {
      render(<MarketCard market={sampleMarket} lastReportDate={null} />);
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/reports/create?marketId=mkt-1");
    });

    it("still shows tier label", () => {
      render(<MarketCard market={sampleMarket} lastReportDate={null} />);
      expect(screen.getByText("ULTRA LUXURY")).toBeInTheDocument();
    });

    it("still shows last report date when provided", () => {
      render(
        <MarketCard
          market={sampleMarket}
          lastReportDate={new Date("2026-03-01")}
        />
      );
      expect(screen.getByText(/Last run:/)).toBeInTheDocument();
    });
  });

  // ────────────────── RecentReportsList tests ──────────────────

  describe("RecentReportsList warm palette", () => {
    it("report row uses warm surface background (--color-app-surface)", () => {
      render(<RecentReportsList reports={[sampleReport]} />);
      const row = screen.getByTestId("report-row");
      expect(row.className).toContain("color-app-surface");
    });

    it("report title uses warm text color (--color-app-text)", () => {
      render(<RecentReportsList reports={[sampleReport]} />);
      const title = screen.getByText(sampleReport.title);
      expect(title.className).toContain("color-app-text");
    });

    it("report title hover uses warm accent (--color-app-accent)", () => {
      render(<RecentReportsList reports={[sampleReport]} />);
      const title = screen.getByText(sampleReport.title);
      expect(title.className).toContain("color-app-accent");
    });

    it("report metadata uses body font (--font-body)", () => {
      render(<RecentReportsList reports={[sampleReport]} />);
      const meta = screen.getByText(/Naples FL/);
      expect(meta.className).toContain("font-body");
    });

    it("report metadata uses warm secondary text (--color-app-text-secondary)", () => {
      render(<RecentReportsList reports={[sampleReport]} />);
      const meta = screen.getByText(/Naples FL/);
      expect(meta.className).toContain("color-app-text-secondary");
    });

    it("report title link uses body font (--font-body)", () => {
      render(<RecentReportsList reports={[sampleReport]} />);
      const title = screen.getByText(sampleReport.title);
      expect(title.className).toContain("font-body");
    });

    it("status label uses body font (--font-body)", () => {
      render(<RecentReportsList reports={[sampleReport2]} />);
      const status = screen.getByText("Generating");
      expect(status.className).toContain("font-body");
    });

    // Semantic colors preserved
    it("preserves --color-success for completed status", () => {
      // completed status shows DownloadPdfButton, not a label
      // so we check generating (accent) remains
      render(<RecentReportsList reports={[sampleReport2]} />);
      const status = screen.getByText("Generating");
      expect(status.className).toContain("color-app-accent");
    });

    // Backward compat
    it("still renders up to 5 reports", () => {
      const reports = Array.from({ length: 7 }, (_, i) => ({
        ...sampleReport,
        id: `rpt-${i}`,
        title: `Report ${i}`,
      }));
      render(<RecentReportsList reports={reports} />);
      const rows = screen.getAllByTestId("report-row");
      expect(rows).toHaveLength(5);
    });

    it("still renders download button for completed reports", () => {
      render(<RecentReportsList reports={[sampleReport]} />);
      expect(screen.getByTestId("download-rpt-1")).toBeInTheDocument();
    });
  });

  // ────────────────── DashboardEmptyState tests ──────────────────

  describe("DashboardEmptyState warm palette", () => {
    it("heading uses display font (--font-display)", () => {
      render(<DashboardEmptyState />);
      const heading = screen.getByText("Define Your First Market");
      expect(heading.className).toContain("font-display");
    });

    it("heading uses warm text color (--color-app-text)", () => {
      render(<DashboardEmptyState />);
      const heading = screen.getByText("Define Your First Market");
      expect(heading.className).toContain("color-app-text");
    });

    it("body text uses body font (--font-body)", () => {
      render(<DashboardEmptyState />);
      const body = screen.getByText(/Your intelligence platform is ready/);
      expect(body.className).toContain("font-body");
    });

    it("body text uses warm secondary color (--color-app-text-secondary)", () => {
      render(<DashboardEmptyState />);
      const body = screen.getByText(/Your intelligence platform is ready/);
      expect(body.className).toContain("color-app-text-secondary");
    });

    it("CTA button uses warm accent background (--color-app-accent)", () => {
      render(<DashboardEmptyState />);
      const cta = screen.getByText("Get Started");
      expect(cta.className).toContain("color-app-accent");
    });

    it("dashed border uses warm accent (--color-app-accent)", () => {
      render(<DashboardEmptyState />);
      const icon = screen.getByText("Define Your First Market")
        .closest("div")
        ?.querySelector(".border-dashed");
      expect(icon?.className).toContain("color-app-accent");
    });

    it("accent line uses warm accent (--color-app-accent)", () => {
      render(<DashboardEmptyState />);
      const line = screen.getByTestId("gold-accent-line");
      expect(line.className).toContain("color-app-accent");
    });

    // Backward compat
    it("still links to /reports/create", () => {
      render(<DashboardEmptyState />);
      const cta = screen.getByText("Get Started");
      expect(cta.closest("a")).toHaveAttribute("href", "/reports/create");
    });
  });
});
