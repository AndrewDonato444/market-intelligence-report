import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import fs from "fs";
import path from "path";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ push: jest.fn() }),
}));

// Mock @/lib/supabase/client
jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { signOut: jest.fn().mockResolvedValue({}) },
  }),
}));

import { TopNav } from "@/components/layout/top-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { PageShell } from "@/components/layout/page-shell";
import { Footer } from "@/components/layout/footer";

/**
 * Shell Design Refresh Tests
 *
 * Verifies that the app shell (TopNav, Sidebar, PageShell, Footer) uses
 * the warm luxury palette (--color-app-*) and updated typography
 * (Cormorant Garamond + DM Sans) to match the marketing page aesthetic.
 *
 * Spec: .specs/features/design-refresh/backend-design-refresh.feature.md
 */
describe("Shell Design Refresh (Phase 1)", () => {
  describe("CSS token definitions", () => {
    const css = fs.readFileSync(
      path.join(process.cwd(), "app/globals.css"),
      "utf8"
    );

    it("defines --color-app-bg warm ivory token", () => {
      expect(css).toContain("--color-app-bg:");
    });

    it("defines --color-app-surface warm white token", () => {
      expect(css).toContain("--color-app-surface:");
    });

    it("defines --color-app-border warm sand token", () => {
      expect(css).toContain("--color-app-border:");
    });

    it("defines --color-app-text warm charcoal token", () => {
      expect(css).toContain("--color-app-text:");
    });

    it("defines --color-app-text-secondary warm gray token", () => {
      expect(css).toContain("--color-app-text-secondary:");
    });

    it("defines --color-app-text-tertiary warm stone token", () => {
      expect(css).toContain("--color-app-text-tertiary:");
    });

    it("defines --color-app-nav-bg warm dark token", () => {
      expect(css).toContain("--color-app-nav-bg:");
    });

    it("defines --color-app-accent antique gold token", () => {
      expect(css).toContain("--color-app-accent:");
    });

    it("defines --color-app-accent-hover token", () => {
      expect(css).toContain("--color-app-accent-hover:");
    });

    it("defines --color-app-accent-light token", () => {
      expect(css).toContain("--color-app-accent-light:");
    });

    it("defines --color-app-active-bg gold tint token", () => {
      expect(css).toContain("--color-app-active-bg:");
    });

    it("defines .app-fade-in animation class", () => {
      expect(css).toContain(".app-fade-in");
    });

    it("preserves existing --color-primary token (no destructive changes)", () => {
      expect(css).toContain("--color-primary:");
    });

    it("preserves existing --color-accent token (no destructive changes)", () => {
      expect(css).toContain("--color-accent:");
    });

    it("preserves existing --color-mkt-* tokens (marketing untouched)", () => {
      expect(css).toContain("--color-mkt-bg:");
      expect(css).toContain("--color-mkt-accent:");
    });
  });

  describe("TopNav warm palette", () => {
    it("renders brand name with display font (Cormorant Garamond)", () => {
      render(<TopNav />);
      const brand = screen.queryByText(/Modern Signal Advisory/i)?.closest("span")
        ?? screen.getByText(/Modern/i).closest("span");
      expect(brand).toBeTruthy();
      expect(brand?.className || brand?.parentElement?.className)
        .toMatch(/font-display|font-\[family-name:var\(--font-display\)\]/);
    });

    it("renders 'Signal' in accent gold", () => {
      render(<TopNav />);
      const signalSpan = screen.getByText("Signal");
      expect(signalSpan).toBeInTheDocument();
      // The word "Signal" should be a separate element with accent color
      expect(signalSpan.className || signalSpan.getAttribute("style"))
        .toMatch(/app-accent|B8975A/i);
    });

    it("uses warm dark background (--color-app-nav-bg)", () => {
      render(<TopNav />);
      const header = document.querySelector("header");
      expect(header?.className).toContain("color-app-nav-bg");
    });

    it("uses body font for subtitle", () => {
      render(<TopNav />);
      const subtitle = screen.getByText("Intelligence Platform");
      const container = subtitle.closest("span");
      expect(container?.className).toMatch(/font-body|font-\[family-name:var\(--font-body\)\]/);
    });

    it("still renders Sign Out button", () => {
      render(<TopNav />);
      expect(screen.getByText("Sign Out")).toBeInTheDocument();
    });

    it("still renders brand name text", () => {
      render(<TopNav />);
      // Check that the full brand is present (may be split across elements now)
      const header = document.querySelector("header");
      expect(header?.textContent).toContain("Modern");
      expect(header?.textContent).toContain("Signal");
      expect(header?.textContent).toContain("Advisory");
    });
  });

  describe("Sidebar warm palette", () => {
    it("uses warm sidebar background (--color-app-sidebar-bg)", () => {
      render(<Sidebar />);
      const aside = document.querySelector("aside");
      expect(aside?.className).toContain("color-app-sidebar-bg");
    });

    it("uses warm border color (--color-app-border)", () => {
      render(<Sidebar />);
      const aside = document.querySelector("aside");
      expect(aside?.className).toContain("color-app-border");
    });

    it("uses body font for nav labels (--font-body)", () => {
      render(<Sidebar />);
      const dashboardLink = screen.getByText("Dashboard").closest("a");
      expect(dashboardLink?.className).toMatch(/font-body|font-\[family-name:var\(--font-body\)\]/);
    });

    it("active nav item uses warm gold tint background (--color-app-active-bg)", () => {
      render(<Sidebar />);
      // Dashboard is active (mocked pathname is /dashboard)
      const dashboardLink = screen.getByText("Dashboard").closest("a");
      expect(dashboardLink?.className).toContain("color-app-active-bg");
    });

    it("still renders all nav items", () => {
      render(<Sidebar />);
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Reports")).toBeInTheDocument();
      expect(screen.getByText("Markets")).toBeInTheDocument();
      expect(screen.getByText("Settings")).toBeInTheDocument();
      expect(screen.getByText("How To")).toBeInTheDocument();
    });

    it("still shows Admin link when isAdmin is true", () => {
      render(<Sidebar isAdmin={true} />);
      expect(screen.getByText("Admin")).toBeInTheDocument();
    });

    it("still has correct href for nav items", () => {
      render(<Sidebar />);
      expect(screen.getByText("Dashboard").closest("a")).toHaveAttribute("href", "/dashboard");
      expect(screen.getByText("Reports").closest("a")).toHaveAttribute("href", "/reports");
      expect(screen.getByText("Markets").closest("a")).toHaveAttribute("href", "/markets");
    });
  });

  describe("PageShell warm palette", () => {
    it("uses warm ivory background (--color-app-bg)", () => {
      render(<PageShell><p>Test</p></PageShell>);
      const main = document.querySelector("main");
      expect(main?.className).toContain("color-app-bg");
    });

    it("still renders children", () => {
      render(<PageShell><p>Hello world</p></PageShell>);
      expect(screen.getByText("Hello world")).toBeInTheDocument();
    });

    it("still has overflow-auto for scrolling", () => {
      render(<PageShell><p>Test</p></PageShell>);
      const main = document.querySelector("main");
      expect(main?.className).toContain("overflow-auto");
    });
  });

  describe("Footer warm palette", () => {
    it("uses warm dark background (--color-app-nav-bg)", () => {
      render(<Footer />);
      const footer = screen.getByTestId("copyright-footer");
      expect(footer.className).toContain("color-app-nav-bg");
    });

    it("uses body font (--font-body)", () => {
      render(<Footer />);
      const text = screen.getByText(/Modern Signal Advisory/);
      expect(text.className).toMatch(/font-body|font-\[family-name:var\(--font-body\)\]/);
    });

    it("still renders copyright text with year", () => {
      render(<Footer />);
      const year = new Date().getFullYear();
      expect(
        screen.getByText(`© ${year} Modern Signal Advisory`)
      ).toBeInTheDocument();
    });

    it("still has data-testid", () => {
      render(<Footer />);
      expect(screen.getByTestId("copyright-footer")).toBeInTheDocument();
    });
  });

  describe("No destructive changes", () => {
    it("does not modify report PDF tokens in globals.css", () => {
      const css = fs.readFileSync(
        path.join(process.cwd(), "app/globals.css"),
        "utf8"
      );
      // Report tokens must still exist unchanged
      expect(css).toContain("--color-report-bg:");
      expect(css).toContain("--color-report-accent-line:");
      expect(css).toContain("--color-confidence-fill:");
    });

    it("protected layout still uses TopNav, Sidebar, PageShell, Footer", () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), "app/(protected)/layout.tsx"),
        "utf8"
      );
      expect(content).toContain("TopNav");
      expect(content).toContain("Sidebar");
      expect(content).toContain("PageShell");
      expect(content).toContain("Footer");
    });
  });
});
