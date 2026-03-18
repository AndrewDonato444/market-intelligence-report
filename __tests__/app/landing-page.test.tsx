/**
 * Landing Page Tests (v3 — Waitlist/Brand)
 *
 * Test IDs: PG-LAND-001 through PG-LAND-032
 * Spec: .specs/features/marketing/landing-page.feature.md
 *
 * Tests the public marketing landing page at app/page.tsx.
 * v3 shifts from product-led conversion to founding cohort waitlist acquisition.
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
    variable: "--font-playfair",
  }),
  Inter: () => ({
    className: "inter-mock",
    variable: "--font-inter",
  }),
  Cormorant_Garamond: () => ({
    className: "cormorant-mock",
    variable: "--font-display",
  }),
  DM_Sans: () => ({
    className: "dm-sans-mock",
    variable: "--font-body",
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

describe("Marketing Landing Page v3", () => {
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
      expect(nav.textContent).toMatch(/Modern/);
      expect(nav.textContent).toMatch(/Signal/);
      expect(nav.textContent).toMatch(/Advisory/);
    });

    it("PG-LAND-003: renders anchor links — Platform, How It Works, Proof", () => {
      const nav = screen.getByRole("navigation");
      expect(within(nav).getByText("Platform")).toBeInTheDocument();
      expect(within(nav).getByText("How It Works")).toBeInTheDocument();
      expect(within(nav).getByText("Proof")).toBeInTheDocument();
    });

    it("PG-LAND-004: anchor links point to correct section IDs", () => {
      const nav = screen.getByRole("navigation");
      expect(
        within(nav).getByText("Platform").closest("a")
      ).toHaveAttribute("href", "#platform");
      expect(
        within(nav).getByText("How It Works").closest("a")
      ).toHaveAttribute("href", "#flywheel");
      expect(
        within(nav).getByText("Proof").closest("a")
      ).toHaveAttribute("href", "#proof");
    });

    it("PG-LAND-005: renders Join the Waitlist CTA linking to /waitlist", () => {
      const nav = screen.getByRole("navigation");
      const cta = within(nav).getByText(/Join the Waitlist/i);
      expect(cta.closest("a")).toHaveAttribute("href", "/waitlist");
    });

    it("PG-LAND-005b: nav is rendered as a fixed element", () => {
      const nav = screen.getByRole("navigation");
      expect(nav).toHaveClass(/fixed/);
    });
  });

  // ─── PG-LAND-006–009: Hero Section ───
  describe("Hero Section", () => {
    it("PG-LAND-006: renders the overline", () => {
      const hero = screen.getByTestId("hero-section");
      expect(
        within(hero).getByText(/The Intelligence Era of Real Estate/i)
      ).toBeInTheDocument();
    });

    it("PG-LAND-007: renders the v3 headline", () => {
      const hero = screen.getByTestId("hero-section");
      expect(
        within(hero).getByText(/Your market tells a story/i)
      ).toBeInTheDocument();
    });

    it("PG-LAND-008: renders the subheadline about intelligence, voice, system", () => {
      const hero = screen.getByTestId("hero-section");
      expect(
        within(hero).getByText(/intelligence, the voice, and the system/i)
      ).toBeInTheDocument();
    });

    it("PG-LAND-009: renders Join the Waitlist link to /waitlist", () => {
      const hero = screen.getByTestId("hero-section");
      const cta = within(hero).getByRole("link", {
        name: /Join the Waitlist/i,
      });
      expect(cta).toHaveAttribute("href", "/waitlist");
    });

    it("PG-LAND-009b: shows founding cohort note with spots remaining", () => {
      const hero = screen.getByTestId("hero-section");
      expect(
        within(hero).getByText(/Founding cohort/i)
      ).toBeInTheDocument();
      expect(
        within(hero).getByText(/7 spots remaining/i)
      ).toBeInTheDocument();
    });
  });

  // ─── PG-LAND-010: Brand Statement ───
  describe("Brand Statement", () => {
    it("PG-LAND-010: renders the brand statement", () => {
      const section = screen.getByTestId("brand-statement");
      expect(section.textContent).toMatch(/The intelligence era is here/i);
      expect(section.textContent).toMatch(
        /you belong at the front of it/i
      );
    });
  });

  // ─── PG-LAND-011–012: The Opportunity ───
  describe("The Opportunity", () => {
    it("PG-LAND-011: renders the opportunity headline", () => {
      const section = screen.getByTestId("opportunity-section");
      expect(
        within(section).getByText(
          /The listing goes to the agent who can say what no one else can/i
        )
      ).toBeInTheDocument();
    });

    it("PG-LAND-012: renders three stat cards with survey source", () => {
      const section = screen.getByTestId("opportunity-section");
      expect(within(section).getByText("85%")).toBeInTheDocument();
      expect(within(section).getByText("60%")).toBeInTheDocument();
      expect(within(section).getByText("#1")).toBeInTheDocument();
      const sources = within(section).getAllByText(
        /Compass Luxury Agent Survey, 2026/i
      );
      expect(sources).toHaveLength(3);
    });
  });

  // ─── PG-LAND-013–014: The Platform ───
  describe("The Platform", () => {
    it("PG-LAND-013: renders platform headline", () => {
      const section = screen.getByTestId("platform-section");
      expect(
        within(section).getByText(/Intelligence\. Voice\. Proof\./i)
      ).toBeInTheDocument();
    });

    it("PG-LAND-014: renders Signal Report and Signal Voice cards", () => {
      const section = screen.getByTestId("platform-section");
      expect(
        within(section).getByText("Signal Report")
      ).toBeInTheDocument();
      expect(
        within(section).getByText(/The Proof Mechanism/i)
      ).toBeInTheDocument();
      expect(
        within(section).getByText("Signal Voice")
      ).toBeInTheDocument();
      expect(
        within(section).getByText(/The Reach Mechanism/i)
      ).toBeInTheDocument();
    });

    it("PG-LAND-014b: renders platform teaser about future products", () => {
      const section = screen.getByTestId("platform-section");
      expect(section.textContent).toMatch(
        /advisor training course and private community/i
      );
    });

    it("PG-LAND-014c: section has id platform for anchor scroll", () => {
      const section = screen.getByTestId("platform-section");
      expect(section).toHaveAttribute("id", "platform");
    });
  });

  // ─── PG-LAND-015–016: Growth Flywheel ───
  describe("Growth Flywheel", () => {
    it("PG-LAND-015: renders three flywheel stages", () => {
      const section = screen.getByTestId("flywheel-section");
      expect(within(section).getByText("01")).toBeInTheDocument();
      expect(within(section).getByText("Intelligence")).toBeInTheDocument();
      expect(within(section).getByText("02")).toBeInTheDocument();
      expect(within(section).getByText("Performance")).toBeInTheDocument();
      expect(within(section).getByText("03")).toBeInTheDocument();
      expect(within(section).getByText("Visibility")).toBeInTheDocument();
    });

    it("PG-LAND-016: renders flywheel headline", () => {
      const section = screen.getByTestId("flywheel-section");
      expect(
        within(section).getByText(
          /Not a subscription\. A compounding asset\./i
        )
      ).toBeInTheDocument();
    });

    it("PG-LAND-016b: section has id flywheel for anchor scroll", () => {
      const section = screen.getByTestId("flywheel-section");
      expect(section).toHaveAttribute("id", "flywheel");
    });
  });

  // ─── PG-LAND-017: Promise Section ───
  describe("Promise Section", () => {
    it("PG-LAND-017: renders the promise blockquote", () => {
      const section = screen.getByTestId("promise-section");
      expect(section.textContent).toMatch(/that doesn.t go away/i);
      expect(section.textContent).toMatch(
        /those belong to you forever/i
      );
    });
  });

  // ─── PG-LAND-018–019: Proof / Knox Brothers ───
  describe("Proof / Knox Brothers", () => {
    it("PG-LAND-018: renders proof headline and body", () => {
      const section = screen.getByTestId("proof-section");
      expect(
        within(section).getByText(
          /This platform was proven before it was productized/i
        )
      ).toBeInTheDocument();
    });

    it("PG-LAND-019: renders $117M and Top 1% stats", () => {
      const section = screen.getByTestId("proof-section");
      expect(within(section).getByText("$117M")).toBeInTheDocument();
      expect(within(section).getByText("Top 1%")).toBeInTheDocument();
    });

    it("PG-LAND-019b: renders Knox Brothers Precedent", () => {
      const section = screen.getByTestId("proof-section");
      expect(
        within(section).getByText(/The Knox Brothers Precedent/i)
      ).toBeInTheDocument();
    });

    it("PG-LAND-019c: section has id proof for anchor scroll", () => {
      const section = screen.getByTestId("proof-section");
      expect(section).toHaveAttribute("id", "proof");
    });
  });

  // ─── PG-LAND-020–021: Bottom CTA ───
  describe("Bottom CTA", () => {
    it("PG-LAND-020: renders the bottom CTA headline", () => {
      const section = screen.getByTestId("bottom-cta");
      expect(section.textContent).toMatch(/intelligence era/i);
    });

    it("PG-LAND-021: renders Reserve My Spot link to /waitlist", () => {
      const section = screen.getByTestId("bottom-cta");
      const cta = within(section).getByRole("link", {
        name: /Reserve My Spot/i,
      });
      expect(cta).toHaveAttribute("href", "/waitlist");
    });

    it("PG-LAND-021b: section has id join for anchor scroll", () => {
      const section = screen.getByTestId("bottom-cta");
      expect(section).toHaveAttribute("id", "join");
    });
  });

  // ─── PG-LAND-022: Waitlist links (no inline form) ───
  describe("Waitlist Links", () => {
    it("PG-LAND-022: both CTAs link to /waitlist page", () => {
      const waitlistLinks = screen.getAllByRole("link", {
        name: /Join the Waitlist|Reserve My Spot/i,
      });
      waitlistLinks.forEach((link) => {
        expect(link).toHaveAttribute("href", "/waitlist");
      });
    });
  });

  // ─── PG-LAND-023: Footer ───
  describe("Footer", () => {
    it("PG-LAND-023: renders the marketing footer with branding", () => {
      const footer = screen.getByTestId("marketing-footer");
      expect(footer.textContent).toMatch(/Modern/);
      expect(footer.textContent).toMatch(/Signal/);
      expect(footer.textContent).toMatch(/2026/);
      expect(footer.textContent).toMatch(/Confidential/);
    });
  });

  // ─── PG-LAND-024–026: Creative Brief Guardrails ───
  describe("Creative Brief Guardrails", () => {
    it("PG-LAND-024: page contains no exclamation points", () => {
      const main = screen.getByRole("main");
      expect(main.textContent).not.toMatch(/!/);
    });

    it("PG-LAND-025: page contains no smartest-person-in-the-room framing", () => {
      const main = screen.getByRole("main");
      expect(main.textContent).not.toMatch(/smartest/i);
    });

    it("PG-LAND-026: page contains no internal jargon (IDA)", () => {
      const main = screen.getByRole("main");
      expect(main.textContent).not.toMatch(/\bIDA\b/);
      expect(main.textContent).not.toMatch(
        /Intelligence.Driven Advisor/i
      );
    });
  });

  // ─── PG-LAND-027–032: Removed sections (regression from v2) ───
  describe("Removed v2 sections (regression)", () => {
    it("PG-LAND-027: mock report card no longer in hero", () => {
      expect(screen.queryByTestId("report-preview")).not.toBeInTheDocument();
    });

    it("PG-LAND-028: credibility strip no longer exists", () => {
      expect(screen.queryByTestId("data-callouts")).not.toBeInTheDocument();
    });

    it("PG-LAND-029: testimonials section no longer exists", () => {
      expect(screen.queryByTestId("testimonials")).not.toBeInTheDocument();
    });

    it("PG-LAND-030: pricing section no longer exists", () => {
      expect(screen.queryByTestId("pricing")).not.toBeInTheDocument();
      expect(screen.queryByText("$500")).not.toBeInTheDocument();
    });

    it("PG-LAND-031: no Commission CTAs remain", () => {
      expect(
        screen.queryByText(/Commission Your First Report/i)
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(/Commission Your Report/i)
      ).not.toBeInTheDocument();
    });

    it("PG-LAND-032: no Request Access or Get Started CTAs remain", () => {
      expect(
        screen.queryByText(/Request Access/i)
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(/^Get Started$/i)
      ).not.toBeInTheDocument();
    });
  });
});
