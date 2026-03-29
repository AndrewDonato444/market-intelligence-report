import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import fs from "fs";
import path from "path";

// Mock framer-motion
jest.mock("framer-motion", () => {
  const React = require("react");
  return {
    motion: {
      div: React.forwardRef(
        (
          {
            initial,
            animate,
            exit,
            variants,
            whileTap,
            ...props
          }: Record<string, unknown>,
          ref: React.Ref<HTMLDivElement>,
        ) => React.createElement("div", { ...props, ref }),
      ),
      button: React.forwardRef(
        (
          {
            initial,
            animate,
            exit,
            variants,
            whileTap,
            ...props
          }: Record<string, unknown>,
          ref: React.Ref<HTMLButtonElement>,
        ) => React.createElement("button", { ...props, ref }),
      ),
    },
    AnimatePresence: ({
      children,
    }: {
      children: React.ReactNode;
    }) => React.createElement(React.Fragment, null, children),
  };
});

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => "/dashboard",
}));

jest.mock("next/link", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: React.forwardRef(
      (
        { href, children, ...props }: { href: string; children: React.ReactNode },
        ref: React.Ref<HTMLAnchorElement>,
      ) => React.createElement("a", { ...props, href, ref }, children),
    ),
  };
});

interface MockMarket {
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

interface MockReport {
  id: string;
  title: string;
  status: "queued" | "generating" | "completed" | "failed";
  marketId: string;
  marketName: string;
  createdAt: Date;
  updatedAt: Date;
}

import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { MarketCard } from "@/components/dashboard/market-card";
import { RecentReportsList } from "@/components/dashboard/recent-reports-list";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

const makeMarket = (overrides: Partial<MockMarket> = {}): MockMarket => ({
  id: "market-1",
  name: "Naples, FL",
  geography: { city: "Naples", state: "Florida" },
  luxuryTier: "ultra_luxury",
  priceFloor: 10000000,
  priceCeiling: null,
  segments: ["Waterfront", "Golf Course"],
  propertyTypes: null,
  isDefault: 1,
  createdAt: new Date("2026-01-15"),
  updatedAt: new Date("2026-01-15"),
  ...overrides,
});

const makeReport = (overrides: Partial<MockReport> = {}): MockReport => ({
  id: "report-1",
  title: "Naples Ultra-Luxury Q1 2026",
  status: "completed",
  marketId: "market-1",
  marketName: "Naples, FL",
  createdAt: new Date("2026-03-08"),
  updatedAt: new Date("2026-03-08"),
  ...overrides,
});

describe("Dashboard Redesign (#159)", () => {
  describe("CMP-159.01: File structure", () => {
    it("has dashboard page", () => {
      expect(fs.existsSync(path.join(process.cwd(), "app/(protected)/dashboard/page.tsx"))).toBe(true);
    });
    it("has DashboardContent component", () => {
      expect(fs.existsSync(path.join(process.cwd(), "components/dashboard/dashboard-content.tsx"))).toBe(true);
    });
    it("has DashboardEmptyState component", () => {
      expect(fs.existsSync(path.join(process.cwd(), "components/dashboard/dashboard-empty-state.tsx"))).toBe(true);
    });
    it("has DashboardWelcomeHero component", () => {
      expect(fs.existsSync(path.join(process.cwd(), "components/dashboard/dashboard-welcome-hero.tsx"))).toBe(true);
    });
    it("has MarketCard component", () => {
      expect(fs.existsSync(path.join(process.cwd(), "components/dashboard/market-card.tsx"))).toBe(true);
    });
    it("has RecentReportsList component", () => {
      expect(fs.existsSync(path.join(process.cwd(), "components/dashboard/recent-reports-list.tsx"))).toBe(true);
    });
  });

  describe("CMP-159.02: Empty state - no markets, no reports", () => {
    it("shows welcoming empty state with headline", () => {
      render(<DashboardEmptyState />);
      expect(screen.getByText("Define Your First Market")).toBeInTheDocument();
    });
    it("shows inviting subtext", () => {
      render(<DashboardEmptyState />);
      expect(screen.getByText(/Your intelligence platform is ready/)).toBeInTheDocument();
    });
    it("has a Get Started button linking to creation flow Step 1", () => {
      render(<DashboardEmptyState />);
      const link = screen.getByRole("link", { name: /Get Started/i });
      expect(link).toHaveAttribute("href", "/reports/create");
    });
    it("shows gold accent line", () => {
      render(<DashboardEmptyState />);
      expect(screen.getByTestId("gold-accent-line")).toBeInTheDocument();
    });
    it("renders DashboardContent with empty state when no markets/reports", () => {
      render(<DashboardContent markets={[]} reports={[]} />);
      expect(screen.getByText("Define Your First Market")).toBeInTheDocument();
      expect(screen.queryByTestId("dashboard-stats")).not.toBeInTheDocument();
      expect(screen.queryByTestId("market-cards-section")).not.toBeInTheDocument();
    });
  });

  describe("CMP-159.03: Markets exist, no reports", () => {
    const markets = [makeMarket()];
    it("shows market cards section", () => {
      render(<DashboardContent markets={markets} reports={[]} />);
      expect(screen.getByTestId("market-cards-section")).toBeInTheDocument();
    });
    it("shows welcome hero with onboarding prompt", () => {
      render(<DashboardContent markets={markets} reports={[]} />);
      expect(screen.getByTestId("welcome-hero")).toBeInTheDocument();
    });
    it("shows empty reports state with CTA", () => {
      render(<DashboardContent markets={markets} reports={[]} />);
      expect(screen.getByText(/No intelligence briefs yet/i)).toBeInTheDocument();
      const ctas = screen.getAllByRole("link", { name: /Generate Your First Report/i });
      expect(ctas.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("CMP-159.04: Markets and reports - full dashboard", () => {
    const markets = [
      makeMarket(),
      makeMarket({ id: "market-2", name: "Aspen, CO", geography: { city: "Aspen", state: "Colorado" }, luxuryTier: "high_luxury", priceFloor: 5000000, segments: ["Ski-in/Ski-out"] }),
    ];
    const reports = [
      makeReport(),
      makeReport({ id: "report-2", title: "Aspen Mountain Estates Market Brief", status: "generating", marketId: "market-2", marketName: "Aspen, CO", createdAt: new Date("2026-03-11") }),
      makeReport({ id: "report-3", title: "Naples Q4 2025", status: "failed", marketId: "market-1", marketName: "Naples, FL", createdAt: new Date("2025-12-20") }),
    ];

    it("shows welcome hero", () => {
      render(<DashboardContent markets={markets} reports={reports} />);
      expect(screen.getByTestId("welcome-hero")).toBeInTheDocument();
    });
    it("shows market cards with market name and tier badge", () => {
      render(<DashboardContent markets={markets} reports={reports} />);
      // Cards now show geography.city, not market.name
      expect(screen.getByText("Naples")).toBeInTheDocument();
      expect(screen.getByText("ULTRA LUXURY")).toBeInTheDocument();
      expect(screen.getByText("Aspen")).toBeInTheDocument();
      expect(screen.getByText("HIGH LUXURY")).toBeInTheDocument();
    });
    it("shows recent reports with titles", () => {
      render(<DashboardContent markets={markets} reports={reports} />);
      expect(screen.getByText("Naples Ultra-Luxury Q1 2026")).toBeInTheDocument();
      expect(screen.getByText("Aspen Mountain Estates Market Brief")).toBeInTheDocument();
    });
    it('shows "View All Reports" link', () => {
      render(<DashboardContent markets={markets} reports={reports} />);
      const link = screen.getByRole("link", { name: /View All Reports/i });
      expect(link).toHaveAttribute("href", "/reports");
    });
  });

  describe("CMP-159.05: MarketCard - clickable tile", () => {
    it("entire tile links to creation flow with marketId", () => {
      render(<MarketCard market={makeMarket()} />);
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/reports/create?marketId=market-1");
    });
    it("shows city name from geography", () => {
      render(<MarketCard market={makeMarket()} />);
      expect(screen.getByText("Naples")).toBeInTheDocument();
    });
    it("shows luxury tier badge", () => {
      render(<MarketCard market={makeMarket()} />);
      expect(screen.getByText("ULTRA LUXURY")).toBeInTheDocument();
    });
    it("shows price floor info", () => {
      render(<MarketCard market={makeMarket({ priceFloor: 10000000 })} />);
      expect(screen.getByText(/\$10M\+/)).toBeInTheDocument();
    });
  });

  describe("CMP-159.06: RecentReportsList - report links", () => {
    it("links each report to /reports/{reportId}", () => {
      render(<RecentReportsList reports={[makeReport({ id: "report-abc" })]} />);
      const link = screen.getByRole("link", { name: /Naples Ultra-Luxury Q1 2026/i });
      expect(link).toHaveAttribute("href", "/reports/report-abc");
    });
    it("shows market name on each report row", () => {
      render(<RecentReportsList reports={[makeReport()]} />);
      expect(screen.getByText(/Naples, FL/)).toBeInTheDocument();
    });
    it("limits displayed reports to 5", () => {
      const reports = Array.from({ length: 7 }, (_, i) =>
        makeReport({ id: `report-${i}`, title: `Report ${i}`, createdAt: new Date(2026, 2, 10 - i) }),
      );
      render(<RecentReportsList reports={reports} />);
      const links = screen.getAllByTestId("report-row");
      expect(links).toHaveLength(5);
    });
  });

  describe("CMP-159.07: Report status badges", () => {
    it('shows "Download PDF" button for completed reports instead of badge', () => {
      render(<RecentReportsList reports={[makeReport({ status: "completed" })]} />);
      // Completed reports show a Download PDF button instead of a status badge
      expect(screen.getByText("Download PDF")).toBeInTheDocument();
      expect(screen.queryByText("Completed")).not.toBeInTheDocument();
    });
    it('shows "Generating" badge in gold with pulse', () => {
      render(<RecentReportsList reports={[makeReport({ status: "generating" })]} />);
      const badge = screen.getByText("Generating");
      expect(badge).toBeInTheDocument();
      expect(badge.className).toMatch(/color-accent|accent|gold/);
    });
    it('shows "Failed" badge in red', () => {
      render(<RecentReportsList reports={[makeReport({ status: "failed" })]} />);
      const badge = screen.getByText("Failed");
      expect(badge).toBeInTheDocument();
      expect(badge.className).toMatch(/color-error|error|red/);
    });
    it('shows "Queued" badge', () => {
      render(<RecentReportsList reports={[makeReport({ status: "queued" })]} />);
      expect(screen.getByText("Queued")).toBeInTheDocument();
    });
  });

  describe("CMP-159.08: Dashboard entrance animations", () => {
    it("wraps welcome hero in an AnimatedContainer", () => {
      render(<DashboardContent markets={[makeMarket()]} reports={[makeReport()]} />);
      const hero = screen.getByTestId("welcome-hero");
      const container = hero.closest('[data-testid="animated-container"]');
      expect(container).toBeInTheDocument();
    });
    it("wraps market cards in a stagger container", () => {
      render(<DashboardContent markets={[makeMarket()]} reports={[makeReport()]} />);
      const section = screen.getByTestId("market-cards-section");
      const container = section.closest('[data-variant="stagger"]');
      expect(container).toBeInTheDocument();
    });
    it("wraps recent reports in an AnimatedContainer", () => {
      render(<DashboardContent markets={[makeMarket()]} reports={[makeReport()]} />);
      const section = screen.getByTestId("recent-reports-section");
      const container = section.closest('[data-testid="animated-container"]');
      expect(container).toBeInTheDocument();
    });
  });

  describe("CMP-159.09: Returning agent with all markets removed", () => {
    it("shows the same empty state as a new agent", () => {
      render(<DashboardContent markets={[]} reports={[]} />);
      expect(screen.getByText("Define Your First Market")).toBeInTheDocument();
    });
  });


  describe("CMP-159.11: Define New Market link", () => {
    it("shows a link to define new market when markets exist", () => {
      render(<DashboardContent markets={[makeMarket()]} reports={[makeReport()]} />);
      const link = screen.getByRole("link", { name: /Define New Market/i });
      expect(link).toHaveAttribute("href", "/reports/create");
    });
  });

  describe("CMP-159.12: Section headings use persona vocabulary", () => {
    it('uses "YOUR MARKETS" heading', () => {
      render(<DashboardContent markets={[makeMarket()]} reports={[makeReport()]} />);
      expect(screen.getByText(/YOUR MARKETS/)).toBeInTheDocument();
    });
    it('uses "RECENT INTELLIGENCE BRIEFS" heading', () => {
      render(<DashboardContent markets={[makeMarket()]} reports={[makeReport()]} />);
      expect(screen.getByText(/RECENT INTELLIGENCE BRIEFS/)).toBeInTheDocument();
    });
  });

  describe("CMP-159.13: Download PDF for completed reports", () => {
    it("shows Download PDF button for completed reports", () => {
      render(<RecentReportsList reports={[makeReport({ status: "completed" })]} />);
      expect(screen.getByText("Download PDF")).toBeInTheDocument();
    });
    it("does not show Download PDF for generating reports", () => {
      render(<RecentReportsList reports={[makeReport({ status: "generating" })]} />);
      expect(screen.queryByText("Download PDF")).not.toBeInTheDocument();
    });
  });
});
