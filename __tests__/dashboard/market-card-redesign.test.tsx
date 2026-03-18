import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

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

import { MarketCard } from "@/components/dashboard/market-card";

interface MockMarket {
  id: string;
  name: string;
  geography: { city: string; state: string };
  luxuryTier: "luxury" | "high_luxury" | "ultra_luxury";
  priceFloor: number;
  priceCeiling: number | null;
  segments: string[] | null;
}

const makeMarket = (overrides: Partial<MockMarket> = {}): MockMarket => ({
  id: "market-1",
  name: "Los Angeles Luxury",
  geography: { city: "Los Angeles", state: "California" },
  luxuryTier: "ultra_luxury",
  priceFloor: 10000000,
  priceCeiling: null,
  segments: ["Waterfront"],
  ...overrides,
});

describe("Market Card Redesign (CMP-MC)", () => {
  describe("CMP-MC.01: City name display", () => {
    it("shows geography.city as the title, not market.name", () => {
      render(<MarketCard market={makeMarket()} />);
      expect(screen.getByText("Los Angeles")).toBeInTheDocument();
      // Should NOT show the full market.name with tier suffix
      expect(screen.queryByText("Los Angeles Luxury")).not.toBeInTheDocument();
    });

    it("renders city name in serif font", () => {
      render(<MarketCard market={makeMarket()} />);
      const title = screen.getByText("Los Angeles");
      expect(title.className).toMatch(/font-serif|font-\[family-name:var\(--font-serif\)\]/);
    });
  });

  describe("CMP-MC.02: Tier pill separate from title", () => {
    it("shows tier pill badge", () => {
      render(<MarketCard market={makeMarket()} />);
      expect(screen.getByText("ULTRA LUXURY")).toBeInTheDocument();
    });

    it("shows price floor", () => {
      render(<MarketCard market={makeMarket({ priceFloor: 10000000 })} />);
      expect(screen.getByText(/\$10M\+/)).toBeInTheDocument();
    });
  });

  describe("CMP-MC.03: Entire tile is clickable", () => {
    it("wraps the card in a link to report creation", () => {
      render(<MarketCard market={makeMarket()} />);
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/reports/create?marketId=market-1");
    });

    it("does NOT have a separate 'New Report' button inside", () => {
      render(<MarketCard market={makeMarket()} />);
      // The old standalone button text should be gone — replaced by hover overlay
      const links = screen.getAllByRole("link");
      // Should be exactly 1 link (the card itself), not 2
      expect(links).toHaveLength(1);
    });
  });

  describe("CMP-MC.04: Hover overlay", () => {
    it("has a hover overlay element with 'Generate New Report' text", () => {
      render(<MarketCard market={makeMarket()} />);
      const overlay = screen.getByTestId("market-card-hover-overlay");
      expect(overlay).toBeInTheDocument();
      expect(overlay).toHaveTextContent(/Generate New Report/i);
    });

    it("hover overlay starts hidden (opacity-0)", () => {
      render(<MarketCard market={makeMarket()} />);
      const overlay = screen.getByTestId("market-card-hover-overlay");
      expect(overlay.className).toMatch(/opacity-0/);
    });

    it("hover overlay has group-hover class for reveal", () => {
      render(<MarketCard market={makeMarket()} />);
      const overlay = screen.getByTestId("market-card-hover-overlay");
      expect(overlay.className).toMatch(/group-hover:opacity-100/);
    });
  });

  describe("CMP-MC.05: Photo and fallback", () => {
    it("renders photo with aria-hidden", () => {
      render(<MarketCard market={makeMarket()} />);
      const img = document.querySelector("img");
      expect(img).toHaveAttribute("aria-hidden", "true");
    });

    it("falls back to gradient when image errors", () => {
      render(<MarketCard market={makeMarket()} />);
      const img = document.querySelector("img");
      expect(img).toBeInTheDocument();
      fireEvent.error(img!);
      // After error, img should be gone, gradient should show
      expect(document.querySelector("img")).not.toBeInTheDocument();
    });
  });

  describe("CMP-MC.06: Fixed height", () => {
    it("has fixed 220px height", () => {
      render(<MarketCard market={makeMarket()} />);
      const link = screen.getByRole("link");
      expect(link.className).toMatch(/h-\[220px\]/);
    });
  });
});
