/**
 * Landing Page Tests (v2)
 *
 * Test IDs: PG-LAND-001 through PG-LAND-032
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

describe("Marketing Landing Page v2", () => {
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

    it("PG-LAND-003: renders center anchor links", () => {
      const nav = screen.getByRole("navigation");
      expect(within(nav).getByText("How It Works")).toBeInTheDocument();
      expect(within(nav).getByText("The Report")).toBeInTheDocument();
      expect(within(nav).getByText("Pricing")).toBeInTheDocument();
    });

    it("PG-LAND-004: anchor links point to correct section IDs", () => {
      const nav = screen.getByRole("navigation");
      const howItWorks = within(nav).getByText("How It Works");
      const theReport = within(nav).getByText("The Report");
      const pricing = within(nav).getByText("Pricing");
      expect(howItWorks.closest("a")).toHaveAttribute("href", "#how-it-works");
      expect(theReport.closest("a")).toHaveAttribute("href", "#the-report");
      expect(pricing.closest("a")).toHaveAttribute("href", "#pricing");
    });

    it("PG-LAND-005: renders Commission a Report CTA", () => {
      const nav = screen.getByRole("navigation");
      const cta = within(nav).getByText(/Commission a Report/i);
      expect(cta).toBeInTheDocument();
      expect(cta.closest("a")).toHaveAttribute("href", "/sign-up");
    });

    it("PG-LAND-005b: nav is rendered as a fixed element", () => {
      const nav = screen.getByRole("navigation");
      expect(nav).toHaveClass(/fixed/);
    });
  });

  // ─── PG-LAND-006–009: Hero Section ───
  describe("Hero Section", () => {
    it("PG-LAND-006: renders the eyebrow label", () => {
      const hero = screen.getByTestId("hero-section");
      expect(
        within(hero).getByText(/^Luxury Market Intelligence$/i)
      ).toBeInTheDocument();
    });

    it("PG-LAND-007: renders the v2 headline", () => {
      const hero = screen.getByTestId("hero-section");
      expect(
        within(hero).getByText(
          /Walk into the room as the advisor who brought the research/i
        )
      ).toBeInTheDocument();
    });

    it("PG-LAND-008: renders the subheadline about branded reports", () => {
      const hero = screen.getByTestId("hero-section");
      expect(
        within(hero).getByText(/branded to you, grounded in real transaction data/i)
      ).toBeInTheDocument();
    });

    it("PG-LAND-009: renders Commission Your First Report CTA linking to /create", () => {
      const hero = screen.getByTestId("hero-section");
      const cta = within(hero).getByRole("link", {
        name: /Commission Your First Report/i,
      });
      expect(cta).toHaveAttribute("href", "/sign-up");
    });

    it("PG-LAND-009b: renders See how it works link to #how-it-works", () => {
      const hero = screen.getByTestId("hero-section");
      const link = within(hero).getByText(/See how it works/i);
      expect(link.closest("a")).toHaveAttribute("href", "#how-it-works");
    });

    it("PG-LAND-009c: hero has a gold accent line", () => {
      const hero = screen.getByTestId("hero-section");
      const accentLine = within(hero).getByTestId("accent-line");
      expect(accentLine).toBeInTheDocument();
    });
  });

  // ─── PG-LAND-010: Mock Report Card ───
  describe("Mock Report Card", () => {
    it("PG-LAND-010: renders the report preview", () => {
      expect(screen.getByTestId("report-preview")).toBeInTheDocument();
    });

    it("PG-LAND-010b: shows Brian Knox advisor info", () => {
      const preview = screen.getByTestId("report-preview");
      expect(preview.textContent).toMatch(/Brian Knox/);
    });

    it("PG-LAND-010c: shows Knox Brothers and Compass", () => {
      // Knox Brothers · Compass rendered with middot
      const preview = screen.getByTestId("report-preview");
      expect(preview.textContent).toMatch(/Knox Brothers/);
      expect(preview.textContent).toMatch(/Compass/);
    });

    it("PG-LAND-010d: shows four dimension scores", () => {
      const preview = screen.getByTestId("report-preview");
      expect(within(preview).getByText("8.4")).toBeInTheDocument();
      expect(within(preview).getByText("Liquidity")).toBeInTheDocument();
      expect(within(preview).getByText("7.1")).toBeInTheDocument();
      expect(within(preview).getByText("Timing")).toBeInTheDocument();
      expect(within(preview).getByText("6.8")).toBeInTheDocument();
      expect(within(preview).getByText("7.6")).toBeInTheDocument();
    });

    it("PG-LAND-010e: shows segment grades in table", () => {
      const preview = screen.getByTestId("report-preview");
      expect(within(preview).getByText("A+")).toBeInTheDocument();
      expect(within(preview).getByText(/Waterfront SFH/)).toBeInTheDocument();
      expect(within(preview).getByText("B+")).toBeInTheDocument();
      expect(within(preview).getByText(/Golf Community/)).toBeInTheDocument();
    });
  });

  // ─── PG-LAND-011–012: Credibility Strip ───
  describe("Credibility Strip", () => {
    it("PG-LAND-011: renders four data callout figures", () => {
      const callouts = screen.getByTestId("data-callouts");
      const figures = within(callouts).getAllByTestId("data-callout");
      expect(figures).toHaveLength(4);
    });

    it("PG-LAND-012: displays the four product stats", () => {
      const strip = screen.getByTestId("data-callouts");
      expect(within(strip).getByText("31")).toBeInTheDocument();
      expect(within(strip).getByText(/Market indicators tracked/i)).toBeInTheDocument();
      expect(within(strip).getByText("8")).toBeInTheDocument();
      expect(within(strip).getByText(/Buyer personas with dedicated/i)).toBeInTheDocument();
      expect(within(strip).getByText("<2 min")).toBeInTheDocument();
      expect(within(strip).getByText(/From brief to finished report/i)).toBeInTheDocument();
      expect(within(strip).getByText("10")).toBeInTheDocument();
      expect(within(strip).getByText(/Sections of strategic intelligence/i)).toBeInTheDocument();
    });
  });

  // ─── PG-LAND-013–014: The Gap ───
  describe("The Gap", () => {
    it("PG-LAND-013: renders the gap headline", () => {
      expect(
        screen.getByText(/Your clients make \$1M decisions/i)
      ).toBeInTheDocument();
    });

    it("PG-LAND-014: renders column headers", () => {
      expect(
        screen.getByText(/What most agents deliver/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/What Modern Signal delivers/i)
      ).toBeInTheDocument();
    });

    it("PG-LAND-014b: renders contrast rows", () => {
      expect(
        screen.getByText(/A PDF of MLS stats any portal could generate/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Proprietary indexes no other agent/i)
      ).toBeInTheDocument();
    });
  });

  // ─── PG-LAND-015–016: How It Works ───
  describe("How It Works", () => {
    it("PG-LAND-015: renders three process steps with updated titles", () => {
      const process = screen.getByTestId("process-narrative");
      expect(within(process).getByText("01")).toBeInTheDocument();
      expect(within(process).getByText("02")).toBeInTheDocument();
      expect(within(process).getByText("03")).toBeInTheDocument();
      expect(
        within(process).getByText(/Brief your market and your client/i)
      ).toBeInTheDocument();
      expect(
        within(process).getByText(/AI agents synthesize the market/i)
      ).toBeInTheDocument();
      expect(
        within(process).getByText(/A publication with your name on the cover/i)
      ).toBeInTheDocument();
    });

    it("PG-LAND-016: section has id how-it-works for anchor scroll", () => {
      const process = screen.getByTestId("process-narrative");
      expect(process).toHaveAttribute("id", "how-it-works");
    });
  });

  // ─── PG-LAND-017–018: The Report ───
  describe("The Report", () => {
    it("PG-LAND-017: renders the v2 heading", () => {
      const breakdown = screen.getByTestId("report-breakdown");
      expect(
        within(breakdown).getByText(/Ten sections\. Zero filler\./i)
      ).toBeInTheDocument();
    });

    it("PG-LAND-018: lists all 10 report sections", () => {
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
      // Use getAllByText since "The Narrative" may match "Market Narrative" in report card
      expect(
        within(breakdown).getAllByText(/^The Narrative$/i).length
      ).toBeGreaterThanOrEqual(1);
      expect(
        within(breakdown).getByText(/Competitive Positioning/i)
      ).toBeInTheDocument();
      expect(
        within(breakdown).getByText(/Forward Outlook & Forecasts/i)
      ).toBeInTheDocument();
      expect(
        within(breakdown).getByText(/Strategic Summary/i)
      ).toBeInTheDocument();
      expect(
        within(breakdown).getByText(/Methodology & Data Sources/i)
      ).toBeInTheDocument();
      expect(
        within(breakdown).getByText(/About the Advisor/i)
      ).toBeInTheDocument();
    });

    it("PG-LAND-018b: section has id the-report for anchor scroll", () => {
      const breakdown = screen.getByTestId("report-breakdown");
      expect(breakdown).toHaveAttribute("id", "the-report");
    });
  });

  // ─── PG-LAND-019–020: Testimonials ───
  describe("Testimonials", () => {
    it("PG-LAND-019: renders the testimonials heading", () => {
      const section = screen.getByTestId("testimonials");
      expect(
        within(section).getByText(/The room changed/i)
      ).toBeInTheDocument();
    });

    it("PG-LAND-020: renders 3 testimonial quotes with names", () => {
      const section = screen.getByTestId("testimonials");
      expect(within(section).getByText(/Marcus Trevino/)).toBeInTheDocument();
      expect(within(section).getByText(/Jennifer Langford/)).toBeInTheDocument();
      expect(within(section).getByText(/David Kessler/)).toBeInTheDocument();
    });
  });

  // ─── PG-LAND-021–023: Pricing ───
  describe("Pricing", () => {
    it("PG-LAND-021: renders the pricing heading", () => {
      const section = screen.getByTestId("pricing");
      expect(
        within(section).getByText(/One report\. One relationship redefined\./i)
      ).toBeInTheDocument();
    });

    it("PG-LAND-022: displays $500 price", () => {
      const section = screen.getByTestId("pricing");
      expect(within(section).getByText("$500")).toBeInTheDocument();
      expect(within(section).getByText("per report")).toBeInTheDocument();
      expect(
        within(section).getByText(/no subscription required/i)
      ).toBeInTheDocument();
    });

    it("PG-LAND-023: shows what is included list", () => {
      const section = screen.getByTestId("pricing");
      expect(
        within(section).getByText(/Full 10-section intelligence report/i)
      ).toBeInTheDocument();
      expect(
        within(section).getByText(/Market Insights Index with confidence ratings/i)
      ).toBeInTheDocument();
    });

    it("PG-LAND-023b: shows founding advisor rate note", () => {
      expect(
        screen.getByText(/Founding advisor rate/i)
      ).toBeInTheDocument();
    });

    it("PG-LAND-023c: section has id pricing for anchor scroll", () => {
      const section = screen.getByTestId("pricing");
      expect(section).toHaveAttribute("id", "pricing");
    });

    it("PG-LAND-023d: renders Commission Your Report CTA", () => {
      const section = screen.getByTestId("pricing");
      const cta = within(section).getByRole("link", {
        name: /Commission Your Report/i,
      });
      expect(cta).toHaveAttribute("href", "/sign-up");
    });
  });

  // ─── PG-LAND-024–025: Final CTA ───
  describe("Final CTA", () => {
    it("PG-LAND-024: renders the closing headline", () => {
      const closing = screen.getByTestId("closing-statement");
      expect(
        within(closing).getByText(/Your market expertise is real/i)
      ).toBeInTheDocument();
      expect(
        within(closing).getByText(/Prove it in the room/i)
      ).toBeInTheDocument();
    });

    it("PG-LAND-025: renders Commission Your Intelligence Report CTA", () => {
      const closing = screen.getByTestId("closing-statement");
      const cta = within(closing).getByRole("link", {
        name: /Commission Your Intelligence Report/i,
      });
      expect(cta).toHaveAttribute("href", "/sign-up");
    });
  });

  // ─── PG-LAND-026: Footer ───
  describe("Footer", () => {
    it("PG-LAND-026: renders the footer with branding", () => {
      const footer = screen.getByRole("contentinfo");
      const allText = within(footer).getAllByText(/Modern Signal Advisory/i);
      expect(allText.length).toBeGreaterThanOrEqual(1);
      expect(within(footer).getByText(/2026/)).toBeInTheDocument();
    });
  });

  // ─── PG-LAND-027–029: Creative Brief Guardrails ───
  describe("Creative Brief Guardrails", () => {
    it("PG-LAND-027: page contains no exclamation points", () => {
      const main = screen.getByRole("main");
      expect(main.textContent).not.toMatch(/!/);
    });

    it("PG-LAND-028: page contains no magazine-quality language", () => {
      const main = screen.getByRole("main");
      expect(main.textContent).not.toMatch(/magazine.quality/i);
    });

    it("PG-LAND-029: page contains no complimentary or free language", () => {
      const main = screen.getByRole("main");
      expect(main.textContent).not.toMatch(/complimentary/i);
      expect(main.textContent).not.toMatch(/\bfree\b/i);
    });
  });

  // ─── PG-LAND-030–032: Removed sections (regression) ───
  describe("Removed sections (regression)", () => {
    it("PG-LAND-030: Editorial Showcase section no longer exists", () => {
      expect(screen.queryByText(/A publication, not a printout/i)).not.toBeInTheDocument();
    });

    it("PG-LAND-031: Intelligence Pillars section no longer exists", () => {
      expect(screen.queryByTestId("intelligence-pillars")).not.toBeInTheDocument();
    });

    it("PG-LAND-032: no Request Access or Get Started CTAs remain", () => {
      const hero = screen.getByTestId("hero-section");
      expect(
        within(hero).queryByText(/Request Access/i)
      ).not.toBeInTheDocument();
      expect(
        within(hero).queryByText(/^Get Started$/i)
      ).not.toBeInTheDocument();
    });
  });
});
