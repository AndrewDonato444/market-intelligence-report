import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

// Mock framer-motion
jest.mock("framer-motion", () => {
  const React = require("react");
  return {
    motion: {
      div: React.forwardRef(
        (
          { initial, animate, exit, variants, whileTap, ...props }: Record<string, unknown>,
          ref: React.Ref<HTMLDivElement>,
        ) => React.createElement("div", { ...props, ref }),
      ),
      button: React.forwardRef(
        (
          { initial, animate, exit, variants, whileTap, ...props }: Record<string, unknown>,
          ref: React.Ref<HTMLButtonElement>,
        ) => React.createElement("button", { ...props, ref }),
      ),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
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

import { DashboardWelcomeHero } from "@/components/dashboard/dashboard-welcome-hero";

describe("Dashboard Welcome Hero (CMP-WH)", () => {
  describe("CMP-WH.01: Personalized greeting", () => {
    it("shows time-of-day greeting with first name", () => {
      render(<DashboardWelcomeHero firstName="Jordan" hasReports={true} />);
      const hero = screen.getByTestId("welcome-hero");
      expect(hero).toHaveTextContent(/Jordan/);
      expect(hero).toHaveTextContent(/Good (morning|afternoon|evening)/);
    });

    it("renders greeting in serif font", () => {
      render(<DashboardWelcomeHero firstName="Jordan" hasReports={true} />);
      const greeting = screen.getByTestId("welcome-greeting");
      expect(greeting.className).toMatch(/font-serif|font-\[family-name:var\(--font-serif\)\]/);
    });
  });

  describe("CMP-WH.02: Name fallback", () => {
    it('shows "Welcome back." when firstName is empty', () => {
      render(<DashboardWelcomeHero firstName="" hasReports={true} />);
      const hero = screen.getByTestId("welcome-hero");
      expect(hero).toHaveTextContent(/Welcome back/);
    });

    it('shows "Welcome back." when firstName is undefined', () => {
      render(<DashboardWelcomeHero hasReports={true} />);
      const hero = screen.getByTestId("welcome-hero");
      expect(hero).toHaveTextContent(/Welcome back/);
    });
  });

  describe("CMP-WH.03: Tagline", () => {
    it("shows contextual tagline below greeting", () => {
      render(<DashboardWelcomeHero firstName="Jordan" hasReports={true} />);
      const tagline = screen.getByTestId("welcome-tagline");
      expect(tagline).toBeInTheDocument();
      expect(tagline.textContent?.length).toBeGreaterThan(0);
    });
  });

  describe("CMP-WH.04: First-time user (no reports)", () => {
    it("shows onboarding prompt for first-time users", () => {
      render(<DashboardWelcomeHero firstName="Marcus" hasReports={false} />);
      expect(screen.getByText(/first intelligence brief/i)).toBeInTheDocument();
    });

    it("shows CTA linking to report creation", () => {
      render(<DashboardWelcomeHero firstName="Marcus" hasReports={false} />);
      const cta = screen.getByRole("link", { name: /Generate Your First Report/i });
      expect(cta).toHaveAttribute("href", "/reports/create");
    });
  });

  describe("CMP-WH.05: Generate New Report CTA (returning users)", () => {
    it("shows Generate New Report CTA for returning users", () => {
      render(<DashboardWelcomeHero firstName="Jordan" hasReports={true} />);
      const ctas = screen.getAllByRole("link", { name: /Generate New Report/i });
      expect(ctas.length).toBeGreaterThanOrEqual(1);
      expect(ctas[0]).toHaveAttribute("href", "/reports/create");
    });
  });

  describe("CMP-WH.06: Time-of-day logic", () => {
    const renderWithHour = (hour: number) => {
      jest.spyOn(Date.prototype, "getHours").mockReturnValue(hour);
      const result = render(<DashboardWelcomeHero firstName="Jordan" hasReports={true} />);
      jest.restoreAllMocks();
      return result;
    };

    it('says "Good morning" before noon', () => {
      renderWithHour(9);
      expect(screen.getByTestId("welcome-greeting")).toHaveTextContent(/Good morning/);
    });

    it('says "Good afternoon" from 12-16', () => {
      renderWithHour(14);
      expect(screen.getByTestId("welcome-greeting")).toHaveTextContent(/Good afternoon/);
    });

    it('says "Good evening" from 17-23', () => {
      renderWithHour(20);
      expect(screen.getByTestId("welcome-greeting")).toHaveTextContent(/Good evening/);
    });
  });
});
