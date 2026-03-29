import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import fs from "fs";
import path from "path";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  usePathname: () => "/reports",
  useRouter: () => ({ push: jest.fn() }),
}));

// Mock next/link
jest.mock("next/link", () => {
  return function MockLink({ children, href, className, ...rest }: any) {
    return <a href={href} className={className} {...rest}>{children}</a>;
  };
});

// Mock market image util
jest.mock("@/lib/utils/market-image", () => ({
  getMarketImageUrl: (city: string, state: string) =>
    city ? `https://example.com/${city}.jpg` : null,
}));

// Mock DownloadPdfButton (PDF pipeline — not changing)
jest.mock("@/components/reports/download-pdf-button", () => ({
  DownloadPdfButton: ({ reportId, reportTitle }: any) => (
    <button data-testid={`download-${reportId}`}>Download PDF</button>
  ),
}));

import { ReportTileGrid } from "@/components/reports/report-tile-grid";

/**
 * Reports List Design Refresh Tests (Phase 3)
 *
 * Spec: .specs/features/design-refresh/reports-list-design-refresh.feature.md
 * Design tokens: .specs/design-system/tokens.md
 */

function makeReport(overrides: Partial<{
  id: string;
  title: string;
  status: "queued" | "generating" | "completed" | "failed";
  marketId: string;
  marketName: string;
  marketCity: string;
  marketState: string;
}> = {}) {
  return {
    id: overrides.id ?? "r1",
    title: overrides.title ?? "Naples Luxury Q1 2026",
    status: overrides.status ?? "completed",
    marketId: overrides.marketId ?? "m1",
    marketName: overrides.marketName ?? "Naples Ultra Luxury",
    marketCity: overrides.marketCity ?? "Naples",
    marketState: overrides.marketState ?? "FL",
    createdAt: new Date("2026-03-15"),
    updatedAt: new Date("2026-03-15"),
  };
}

describe("Reports List Design Refresh (Phase 3)", () => {
  describe("CSS token definitions", () => {
    const css = fs.readFileSync(path.join(process.cwd(), "app", "globals.css"), "utf-8");

    it("defines --color-app-text-tertiary warm stone token", () => {
      expect(css).toContain("--color-app-text-tertiary:");
    });

    it("defines --color-app-accent antique gold token", () => {
      expect(css).toContain("--color-app-accent:");
    });

    it("defines --color-app-surface warm white token", () => {
      expect(css).toContain("--color-app-surface:");
    });

    it("defines --color-app-border warm sand token", () => {
      expect(css).toContain("--color-app-border:");
    });
  });

  describe("ReportsPage header warm palette", () => {
    const pageSource = fs.readFileSync(
      path.join(process.cwd(), "app", "(protected)", "reports", "page.tsx"), "utf-8"
    );

    it("heading uses display font (--font-display)", () => {
      expect(pageSource).toContain("--font-display");
    });

    it("heading uses warm text color (--color-app-text)", () => {
      expect(pageSource).toContain("--color-app-text");
    });

    it("subtitle uses body font (--font-body)", () => {
      expect(pageSource).toContain("--font-body");
    });

    it("subtitle uses warm secondary text (--color-app-text-secondary)", () => {
      expect(pageSource).toContain("--color-app-text-secondary");
    });

    it("Generate New Report button uses warm accent (--color-app-accent)", () => {
      expect(pageSource).toContain("--color-app-accent");
    });

    it("button text is white (not --color-primary navy)", () => {
      expect(pageSource).toContain("text-white");
    });

    it("empty state uses warm surface (--color-app-surface)", () => {
      expect(pageSource).toContain("--color-app-surface");
    });

    it("does NOT use cold --font-serif or --font-sans", () => {
      expect(pageSource).not.toContain("--font-serif");
      expect(pageSource).not.toContain("--font-sans");
    });
  });

  describe("Market group headings warm palette", () => {
    it("heading uses display font (--font-display)", () => {
      render(<ReportTileGrid reports={[makeReport()]} />);
      const heading = screen.getByText("Naples");
      expect(heading.className).toContain("--font-display");
    });

    it("heading uses warm text color (--color-app-text)", () => {
      render(<ReportTileGrid reports={[makeReport()]} />);
      const heading = screen.getByText("Naples");
      expect(heading.className).toContain("--color-app-text");
    });

    it("heading accent underline uses warm accent (--color-app-accent)", () => {
      render(<ReportTileGrid reports={[makeReport()]} />);
      const heading = screen.getByText("Naples");
      expect(heading.className).toContain("--color-app-accent");
    });
  });

  describe("Report tile warm palette", () => {
    it("report title link uses body font (--font-body)", () => {
      render(<ReportTileGrid reports={[makeReport()]} />);
      const link = screen.getByText("Naples Luxury Q1 2026");
      expect(link.className).toContain("--font-body");
    });

    it("status pill uses body font (--font-body)", () => {
      render(<ReportTileGrid reports={[makeReport({ id: "r2" })]} />);
      const pill = screen.getByTestId("status-pill-r2");
      expect(pill.className).toContain("--font-body");
    });

    it("tile overlay uses warm dark rgba (not cold navy)", () => {
      const src = fs.readFileSync(
        path.join(process.cwd(), "components", "reports", "report-tile-grid.tsx"), "utf-8"
      );
      expect(src).toContain("rgba(26,23,20,");
      expect(src).not.toContain("rgba(15,23,42,");
    });

    it("fallback gradient uses warm dark (--color-app-nav-bg)", () => {
      const src = fs.readFileSync(
        path.join(process.cwd(), "components", "reports", "report-tile-grid.tsx"), "utf-8"
      );
      expect(src).toContain("--color-app-nav-bg");
      expect(src).toContain("#2C2825");
    });

    it("Content Studio button uses warm accent (--color-app-accent)", () => {
      render(<ReportTileGrid reports={[makeReport({ status: "completed" })]} />);
      const link = screen.getByText("Content Studio");
      expect(link.className).toContain("--color-app-accent");
    });

    it("Content Studio button text is white", () => {
      render(<ReportTileGrid reports={[makeReport({ status: "completed" })]} />);
      const link = screen.getByText("Content Studio");
      expect(link.className).toContain("text-white");
    });
  });

  describe("Status pill colors", () => {
    const src = fs.readFileSync(
      path.join(process.cwd(), "components", "reports", "report-tile-grid.tsx"), "utf-8"
    );

    it("Ready pill preserves --color-success", () => {
      expect(src).toMatch(/completed.*color-success/s);
    });

    it("Generating pill uses warm accent (--color-app-accent)", () => {
      expect(src).toMatch(/generating.*color-app-accent/s);
    });

    it("Queued pill uses warm tertiary (--color-app-text-tertiary)", () => {
      expect(src).toMatch(/queued.*color-app-text-tertiary/s);
    });
  });

  describe("Failed reports section warm palette", () => {
    const failedReport = makeReport({ id: "f1", status: "failed", title: "Failed Report" });
    const completedReport = makeReport({ id: "c1", status: "completed" });

    it("toggle uses body font (--font-body)", () => {
      render(<ReportTileGrid reports={[completedReport, failedReport]} />);
      const toggle = screen.getByTestId("failed-reports-toggle");
      expect(toggle.className).toContain("--font-body");
    });

    it("toggle uses warm secondary color (--color-app-text-secondary)", () => {
      render(<ReportTileGrid reports={[completedReport, failedReport]} />);
      const toggle = screen.getByTestId("failed-reports-toggle");
      expect(toggle.className).toContain("--color-app-text-secondary");
    });

    it("border uses warm sand (--color-app-border)", () => {
      const src = fs.readFileSync(
        path.join(process.cwd(), "components", "reports", "report-tile-grid.tsx"), "utf-8"
      );
      expect(src).toContain("--color-app-border");
    });

    it("failed report rows use warm surface (--color-app-surface)", () => {
      const src = fs.readFileSync(
        path.join(process.cwd(), "components", "reports", "report-tile-grid.tsx"), "utf-8"
      );
      // Failed report rows should use --color-app-surface
      expect(src).toMatch(/failed[\s\S]*color-app-surface/);
    });

    it("failed report text uses warm text (--color-app-text)", () => {
      const src = fs.readFileSync(
        path.join(process.cwd(), "components", "reports", "report-tile-grid.tsx"), "utf-8"
      );
      // Failed report text should use --color-app-text
      expect(src).toMatch(/failed-reports-list[\s\S]*color-app-text/);
    });
  });

  describe("No cold tokens remaining", () => {
    it("report-tile-grid.tsx has no --font-serif or --font-sans", () => {
      const src = fs.readFileSync(
        path.join(process.cwd(), "components", "reports", "report-tile-grid.tsx"), "utf-8"
      );
      expect(src).not.toContain("--font-serif");
      expect(src).not.toContain("--font-sans");
    });

    it("report-tile-grid.tsx has no cold --color-primary", () => {
      const src = fs.readFileSync(
        path.join(process.cwd(), "components", "reports", "report-tile-grid.tsx"), "utf-8"
      );
      expect(src).not.toContain("--color-primary");
    });

    it("reports/page.tsx has no cold --color-accent", () => {
      const src = fs.readFileSync(
        path.join(process.cwd(), "app", "(protected)", "reports", "page.tsx"), "utf-8"
      );
      const coldAccent = src.match(/--color-accent(?!-)/g);
      expect(coldAccent).toBeNull();
    });
  });
});
