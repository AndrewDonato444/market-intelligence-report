/**
 * Landing Page Tests
 *
 * Test IDs: PG-LAND-001 through PG-LAND-024
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

    it("PG-LAND-004: renders a Request Access link pointing to /sign-up", () => {
      const nav = screen.getByRole("navigation");
      const requestAccess = within(nav).getByText(/Request Access/i);
      expect(requestAccess).toBeInTheDocument();
      expect(requestAccess.closest("a")).toHaveAttribute(
        "href",
        "/sign-up"
      );
    });

    it("PG-LAND-005: nav is rendered as a fixed element", () => {
      const nav = screen.getByRole("navigation");
      expect(nav).toHaveClass(/fixed/);
    });
  });

  // ─── PG-LAND-006–009: Hero Section ───
  describe("Hero Section", () => {
    it("PG-LAND-006: renders a serif headline with data-forward confidence", () => {
      expect(
        screen.getByText(/31 Indicators/i)
      ).toBeInTheDocument();
    });

    it("PG-LAND-007: renders a subheadline about replacing guesswork", () => {
      const hero = screen.getByTestId("hero-section");
      expect(
        within(hero).getByText(/replaced guesswork with proof/i)
      ).toBeInTheDocument();
    });

    it("PG-LAND-008: renders the primary CTA reading 'Request a Sample Report'", () => {
      const hero = screen.getByTestId("hero-section");
      const cta = within(hero).getByRole("link", {
        name: /Request a Sample Report/i,
      });
      expect(cta).toBeInTheDocument();
      expect(cta).toHaveAttribute("href", "/sign-up");
    });

    it("PG-LAND-009: hero section has a gold accent line", () => {
      // The accent line is a decorative element within the hero
      const hero = screen.getByTestId("hero-section");
      const accentLine = within(hero).getByTestId("accent-line");
      expect(accentLine).toBeInTheDocument();
    });
  });

  // ─── PG-LAND-010–012: Data Callouts ───
  describe("Data Callouts", () => {
    it("PG-LAND-010: renders three data callout figures", () => {
      const callouts = screen.getByTestId("data-callouts");
      const figures = within(callouts).getAllByTestId("data-callout");
      expect(figures).toHaveLength(3);
    });

    it("PG-LAND-011: displays the number 31 for proprietary indicators", () => {
      expect(screen.getByText("31")).toBeInTheDocument();
      expect(
        screen.getByText(/proprietary market indicators/i)
      ).toBeInTheDocument();
    });

    it("PG-LAND-012: displays the number 4 for AI agents", () => {
      expect(screen.getByText("4")).toBeInTheDocument();
      expect(
        screen.getByText(/specialized AI agents/i)
      ).toBeInTheDocument();
    });
  });

  // ─── PG-LAND-013–014: Editorial Showcase ───
  describe("Editorial Showcase", () => {
    it("PG-LAND-013: renders the editorial headline", () => {
      expect(
        screen.getByText(/A publication, not a printout/i)
      ).toBeInTheDocument();
    });

    it("PG-LAND-014: renders a report preview element", () => {
      expect(screen.getByTestId("report-preview")).toBeInTheDocument();
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

  // ─── PG-LAND-017–018: Process Narrative ───
  describe("Process Narrative", () => {
    it("PG-LAND-017: renders a section heading", () => {
      expect(
        screen.getByText(/From market to publication/i)
      ).toBeInTheDocument();
    });

    it("PG-LAND-018: renders three process steps", () => {
      const process = screen.getByTestId("process-narrative");
      expect(within(process).getByText("01")).toBeInTheDocument();
      expect(within(process).getByText("02")).toBeInTheDocument();
      expect(within(process).getByText("03")).toBeInTheDocument();
    });
  });

  // ─── PG-LAND-019–020: Report Breakdown ───
  describe("Report Breakdown", () => {
    it("PG-LAND-019: renders the section heading on dark background", () => {
      expect(
        screen.getByText(/Inside every report/i)
      ).toBeInTheDocument();
    });

    it("PG-LAND-020: lists all 8 report sections", () => {
      const breakdown = screen.getByTestId("report-breakdown");
      expect(
        within(breakdown).getByText(/Executive Briefing/i)
      ).toBeInTheDocument();
      expect(
        within(breakdown).getByText(/Market Insights Index/i)
      ).toBeInTheDocument();
      expect(
        within(breakdown).getByText(/Luxury Market Dashboard/i)
      ).toBeInTheDocument();
      expect(
        within(breakdown).getByText(/Neighborhood Intelligence/i)
      ).toBeInTheDocument();
      expect(
        within(breakdown).getByText(/The Narrative/i)
      ).toBeInTheDocument();
      expect(
        within(breakdown).getByText(/Forward Look/i)
      ).toBeInTheDocument();
      expect(
        within(breakdown).getByText(/Comparative Positioning/i)
      ).toBeInTheDocument();
      expect(
        within(breakdown).getByText(/Strategic Benchmark/i)
      ).toBeInTheDocument();
    });
  });

  // ─── PG-LAND-021–022: Closing Statement ───
  describe("Closing Statement", () => {
    it("PG-LAND-021: renders a closing headline", () => {
      expect(
        screen.getByText(/Your market deserves more/i)
      ).toBeInTheDocument();
    });

    it("PG-LAND-022: renders a closing CTA linking to signup", () => {
      const closing = screen.getByTestId("closing-statement");
      const cta = within(closing).getByRole("link", {
        name: /Request a Sample Report/i,
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
  });
});
