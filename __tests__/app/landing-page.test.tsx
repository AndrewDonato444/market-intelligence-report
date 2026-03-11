/**
 * Landing Page Tests
 *
 * Test IDs: PG-LAND-001 through PG-LAND-026
 * Spec: .specs/features/marketing/landing-page.feature.md
 *
 * Tests the public marketing landing page at app/page.tsx.
 * Validates all sections render with correct content, design token usage,
 * responsive behavior, navigation, and creative brief guardrails.
 */

import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock window.matchMedia (not available in JSDOM)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock next/font/google before any component imports
jest.mock("next/font/google", () => ({
  Playfair_Display: () => ({
    className: "playfair-mock",
    variable: "--font-serif",
  }),
  Inter: () => ({
    className: "inter-mock",
    variable: "--font-sans",
  }),
}));

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Mock next/link
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import Home from "@/app/page";

describe("Marketing Landing Page", () => {
  beforeEach(() => {
    render(<Home />);
  });

  // ─── PG-LAND-001: Page renders without crashing ───
  describe("PG-LAND-001: Basic rendering", () => {
    it("renders the page without crashing", () => {
      expect(screen.getByRole("main")).toBeInTheDocument();
    });
  });

  // ─── PG-LAND-002–005: Navigation ───
  describe("Navigation", () => {
    it("PG-LAND-002: renders the Modern Signal Advisory wordmark", () => {
      const nav = screen.getByRole("navigation");
      expect(
        within(nav).getByText(/Modern Signal Advisory/i)
      ).toBeInTheDocument();
    });

    it("PG-LAND-003: renders a Sign In link pointing to /sign-in", () => {
      const nav = screen.getByRole("navigation");
      const signIn = within(nav).getByText(/Sign In/i);
      expect(signIn).toBeInTheDocument();
      expect(signIn.closest("a")).toHaveAttribute("href", "/sign-in");
    });

    it("PG-LAND-004: renders a Get Started link pointing to /sign-up", () => {
      const nav = screen.getByRole("navigation");
      const getStarted = within(nav).getByText(/Get Started/i);
      expect(getStarted).toBeInTheDocument();
      expect(getStarted.closest("a")).toHaveAttribute("href", "/sign-up");
    });

    it("PG-LAND-005: nav is rendered as a fixed element", () => {
      const nav = screen.getByRole("navigation");
      expect(nav).toHaveClass(/fixed/);
    });
  });

  // ─── PG-LAND-006–009: Hero Section ───
  describe("Hero Section", () => {
    it("PG-LAND-006: renders the headline about market reports clients will read", () => {
      const hero = screen.getByTestId("hero-section");
      expect(
        within(hero).getByText(/The market report your clients/i)
      ).toBeInTheDocument();
    });

    it("PG-LAND-007: renders a subheadline about AI-powered intelligence reports", () => {
      const hero = screen.getByTestId("hero-section");
      expect(
        within(hero).getByText(/transform raw market data into strategic narrative/i)
      ).toBeInTheDocument();
    });

    it("PG-LAND-008: renders a 'See How It Works' CTA linking to #how-it-works", () => {
      const hero = screen.getByTestId("hero-section");
      const cta = within(hero).getByRole("link", {
        name: /See How It Works/i,
      });
      expect(cta).toBeInTheDocument();
      expect(cta).toHaveAttribute("href", "#how-it-works");
    });

    it("PG-LAND-008b: renders a 'Request Access' ghost CTA linking to /sign-up", () => {
      const hero = screen.getByTestId("hero-section");
      const cta = within(hero).getByRole("link", {
        name: /Request Access/i,
      });
      expect(cta).toBeInTheDocument();
      expect(cta).toHaveAttribute("href", "/sign-up");
    });

    it("PG-LAND-009: hero section has a gold accent line", () => {
      const hero = screen.getByTestId("hero-section");
      const accentLine = within(hero).getByTestId("accent-line");
      expect(accentLine).toBeInTheDocument();
    });
  });

  // ─── PG-LAND-010–012: Credibility Bar ───
  describe("Credibility Bar", () => {
    it("PG-LAND-010: renders three data callout figures", () => {
      const callouts = screen.getByTestId("data-callouts");
      const figures = within(callouts).getAllByTestId("data-callout");
      expect(figures).toHaveLength(3);
    });

    it("PG-LAND-011: displays 2,234 for transactions analyzed", () => {
      expect(screen.getByText("2,234")).toBeInTheDocument();
      expect(
        screen.getByText(/Transactions analyzed per report/i)
      ).toBeInTheDocument();
    });

    it("PG-LAND-012: displays $6.58B for luxury volume modeled", () => {
      expect(screen.getByText("$6.58B")).toBeInTheDocument();
      expect(
        screen.getByText(/In luxury volume modeled/i)
      ).toBeInTheDocument();
    });

    it("PG-LAND-012b: displays 31 for market indicators tracked", () => {
      expect(screen.getByText("31")).toBeInTheDocument();
      expect(
        screen.getByText(/Market indicators tracked/i)
      ).toBeInTheDocument();
    });
  });

  // ─── PG-LAND-013–014: Editorial Showcase ───
  describe("Editorial Showcase", () => {
    it("PG-LAND-013: renders the editorial headline", () => {
      // "A publication" appears in multiple places; check for the specific heading combo
      expect(
        screen.getByText(/not a printout/i)
      ).toBeInTheDocument();
    });

    it("PG-LAND-014: renders a report preview element", () => {
      expect(screen.getByTestId("report-preview")).toBeInTheDocument();
    });

    it("PG-LAND-014b: report preview shows Naples Intelligence Report header", () => {
      expect(
        screen.getByText(/Naples Intelligence Report/i)
      ).toBeInTheDocument();
    });
  });

  // ─── PG-LAND-015–016: Intelligence Pillars ───
  describe("Intelligence Pillars", () => {
    it("PG-LAND-015: renders exactly three pillars", () => {
      const pillars = screen.getByTestId("intelligence-pillars");
      const items = within(pillars).getAllByTestId("pillar");
      expect(items).toHaveLength(3);
    });

    it("PG-LAND-016: pillars use advisor vocabulary", () => {
      expect(
        screen.getByText(/conviction-grade/i)
      ).toBeInTheDocument();
    });
  });

  // ─── PG-LAND-017–018: How It Works (Process) ───
  describe("How It Works", () => {
    it("PG-LAND-017: renders the section heading", () => {
      expect(
        screen.getByText(/From raw data to finished publication/i)
      ).toBeInTheDocument();
    });

    it("PG-LAND-018: renders three process steps", () => {
      const process = screen.getByTestId("process-narrative");
      expect(within(process).getByText("01")).toBeInTheDocument();
      expect(within(process).getByText("02")).toBeInTheDocument();
      expect(within(process).getByText("03")).toBeInTheDocument();
    });

    it("PG-LAND-018b: section has id how-it-works for anchor scroll", () => {
      const process = screen.getByTestId("process-narrative");
      expect(process).toHaveAttribute("id", "how-it-works");
    });
  });

  // ─── PG-LAND-019–020: Report Breakdown ───
  describe("Report Breakdown", () => {
    it("PG-LAND-019: renders the section heading on dark background", () => {
      const breakdown = screen.getByTestId("report-breakdown");
      expect(
        within(breakdown).getByText(/Ten sections of strategic intelligence/i)
      ).toBeInTheDocument();
    });

    it("PG-LAND-020: lists all 8 report sections", () => {
      const breakdown = screen.getByTestId("report-breakdown");
      expect(
        within(breakdown).getByText(/Strategic Overview & Insights Index/i)
      ).toBeInTheDocument();
      expect(
        within(breakdown).getByText(/Executive Summary & Market Matrix/i)
      ).toBeInTheDocument();
      expect(
        within(breakdown).getByText(/Key Market Drivers/i)
      ).toBeInTheDocument();
      expect(
        within(breakdown).getByText(/Neighborhood Intelligence/i)
      ).toBeInTheDocument();
      expect(
        within(breakdown).getByText(/The Narrative/i)
      ).toBeInTheDocument();
      expect(
        within(breakdown).getByText(/Competitive Positioning/i)
      ).toBeInTheDocument();
      expect(
        within(breakdown).getByText(/Forward Outlook & Forecasts/i)
      ).toBeInTheDocument();
      expect(
        within(breakdown).getByText(/Strategic Summary/i)
      ).toBeInTheDocument();
    });
  });

  // ─── PG-LAND-021–022: Closing Statement ───
  describe("Closing Statement", () => {
    it("PG-LAND-021: renders a closing headline", () => {
      expect(
        screen.getByText(/Your market knowledge is the edge/i)
      ).toBeInTheDocument();
    });

    it("PG-LAND-022: renders a closing CTA linking to signup", () => {
      const closing = screen.getByTestId("closing-statement");
      const cta = within(closing).getByRole("link", {
        name: /Get Started/i,
      });
      expect(cta).toHaveAttribute("href", "/sign-up");
    });
  });

  // ─── PG-LAND-023: Footer ───
  describe("Footer", () => {
    it("PG-LAND-023: renders the footer with branding", () => {
      const footer = screen.getByRole("contentinfo");
      const allText = within(footer).getAllByText(/Modern Signal Advisory/i);
      expect(allText.length).toBeGreaterThanOrEqual(1);
      expect(within(footer).getByText(/2026/)).toBeInTheDocument();
    });
  });

  // ─── PG-LAND-024: Creative Brief Guardrails ───
  describe("Creative Brief Guardrails", () => {
    it("PG-LAND-024: page contains no exclamation points", () => {
      const main = screen.getByRole("main");
      expect(main.textContent).not.toMatch(/!/);
    });

    it("PG-LAND-025: page contains no 'magazine-quality' language", () => {
      const main = screen.getByRole("main");
      expect(main.textContent).not.toMatch(/magazine.quality/i);
    });

    it("PG-LAND-026: page contains no 'complimentary' or 'free' language", () => {
      const main = screen.getByRole("main");
      expect(main.textContent).not.toMatch(/complimentary/i);
      expect(main.textContent).not.toMatch(/\bfree\b/i);
    });
  });
});
