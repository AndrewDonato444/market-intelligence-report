import "@testing-library/jest-dom";
import { render, screen, within, fireEvent } from "@testing-library/react";
import fs from "fs";
import path from "path";

// --- Mocks ---

jest.mock("next/navigation", () => ({
  usePathname: () => "/how-to",
  useRouter: () => ({ push: jest.fn() }),
}));

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

// =====================================================
// PG-HOWTO: How To Guide Page Tests
// Covers: rendering, checklist, steps, FAQ, navigation
// Spec: .specs/features/dashboard/how-to-guide.feature.md
// =====================================================

describe("How To Guide Page", () => {
  // --- File structure ---

  describe("PG-HOWTO-01: File structure", () => {
    it("has how-to page file", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "app/(protected)/how-to/page.tsx")
        )
      ).toBe(true);
    });
  });

  // --- Page rendering (client component with props) ---

  describe("PG-HOWTO-02: Page heading and structure", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let HowToContent: any;

    beforeAll(async () => {
      const mod = await import(
        "@/components/how-to/how-to-content"
      );
      HowToContent = mod.HowToContent;
    });

    it("renders the page title", () => {
      render(<HowToContent hasMarkets={false} hasReports={false} hasKit={false} />);
      expect(
        screen.getByRole("heading", { level: 1, name: /getting started/i })
      ).toBeInTheDocument();
    });

    it("renders a subtitle describing the guide purpose", () => {
      render(<HowToContent hasMarkets={false} hasReports={false} hasKit={false} />);
      expect(
        screen.getByText(/guide to creating market intelligence/i)
      ).toBeInTheDocument();
    });
  });

  // --- Quick-start checklist ---

  describe("PG-HOWTO-03: Quick-start checklist", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let HowToContent: any;

    beforeAll(async () => {
      const mod = await import(
        "@/components/how-to/how-to-content"
      );
      HowToContent = mod.HowToContent;
    });

    it("renders a progress checklist section", () => {
      render(<HowToContent hasMarkets={false} hasReports={false} hasKit={false} />);
      expect(screen.getByTestId("quick-start-checklist")).toBeInTheDocument();
    });

    it("shows three checklist items", () => {
      render(<HowToContent hasMarkets={false} hasReports={false} hasKit={false} />);
      const checklist = screen.getByTestId("quick-start-checklist");
      const items = within(checklist).getAllByRole("listitem");
      expect(items).toHaveLength(3);
    });

    it("shows all items incomplete for new user", () => {
      render(<HowToContent hasMarkets={false} hasReports={false} hasKit={false} />);
      const checklist = screen.getByTestId("quick-start-checklist");
      const completedIcons = within(checklist).queryAllByTestId(
        "checklist-complete"
      );
      expect(completedIcons).toHaveLength(0);
    });

    it("shows market item complete when user has markets", () => {
      render(<HowToContent hasMarkets={true} hasReports={false} hasKit={false} />);
      const checklist = screen.getByTestId("quick-start-checklist");
      const completedIcons = within(checklist).getAllByTestId(
        "checklist-complete"
      );
      expect(completedIcons).toHaveLength(1);
    });

    it("shows market and report items complete when user has both", () => {
      render(<HowToContent hasMarkets={true} hasReports={true} hasKit={false} />);
      const checklist = screen.getByTestId("quick-start-checklist");
      const completedIcons = within(checklist).getAllByTestId(
        "checklist-complete"
      );
      expect(completedIcons).toHaveLength(2);
    });

    it("shows all three items complete when user has markets, reports, and kit", () => {
      render(<HowToContent hasMarkets={true} hasReports={true} hasKit={true} />);
      const checklist = screen.getByTestId("quick-start-checklist");
      const completedIcons = within(checklist).getAllByTestId(
        "checklist-complete"
      );
      expect(completedIcons).toHaveLength(3);
    });

    it("checklist item 3 says 'Explore your Content Studio'", () => {
      render(<HowToContent hasMarkets={false} hasReports={false} hasKit={false} />);
      const checklist = screen.getByTestId("quick-start-checklist");
      expect(
        within(checklist).getByText(/explore your content studio/i)
      ).toBeInTheDocument();
    });
  });

  // --- Three-step sections ---

  describe("PG-HOWTO-04: Step sections", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let HowToContent: any;

    beforeAll(async () => {
      const mod = await import(
        "@/components/how-to/how-to-content"
      );
      HowToContent = mod.HowToContent;
    });

    it("renders three step cards", () => {
      render(<HowToContent hasMarkets={false} hasReports={false} hasKit={false} />);
      expect(screen.getByTestId("step-1")).toBeInTheDocument();
      expect(screen.getByTestId("step-2")).toBeInTheDocument();
      expect(screen.getByTestId("step-3")).toBeInTheDocument();
    });

    it("step 1 is about defining your market", () => {
      render(<HowToContent hasMarkets={false} hasReports={false} hasKit={false} />);
      const step1 = screen.getByTestId("step-1");
      expect(
        within(step1).getByText(/define your market/i)
      ).toBeInTheDocument();
    });

    it("step 2 is about generating your report", () => {
      render(<HowToContent hasMarkets={false} hasReports={false} hasKit={false} />);
      const step2 = screen.getByTestId("step-2");
      expect(
        within(step2).getByText(/generate your report/i)
      ).toBeInTheDocument();
    });

    it("step 3 is about activating your Content Studio", () => {
      render(<HowToContent hasMarkets={false} hasReports={false} hasKit={false} />);
      const step3 = screen.getByTestId("step-3");
      expect(
        within(step3).getByText(/activate your content studio/i)
      ).toBeInTheDocument();
    });

    it("step 3 description mentions social content and email campaigns", () => {
      render(<HowToContent hasMarkets={false} hasReports={false} hasKit={false} />);
      const step3 = screen.getByTestId("step-3");
      const text = step3.textContent!.toLowerCase();
      expect(text).toContain("social");
      expect(text).toContain("email");
    });

    it("each step has a description explaining why it matters", () => {
      render(<HowToContent hasMarkets={false} hasReports={false} hasKit={false} />);
      const step1 = screen.getByTestId("step-1");
      const step2 = screen.getByTestId("step-2");
      const step3 = screen.getByTestId("step-3");
      expect(step1.textContent!.length).toBeGreaterThan(30);
      expect(step2.textContent!.length).toBeGreaterThan(30);
      expect(step3.textContent!.length).toBeGreaterThan(30);
    });
  });

  // --- Dynamic CTAs based on user state ---

  describe("PG-HOWTO-05: Dynamic CTA text and hrefs", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let HowToContent: any;

    beforeAll(async () => {
      const mod = await import(
        "@/components/how-to/how-to-content"
      );
      HowToContent = mod.HowToContent;
    });

    it("shows first-time CTAs for new users", () => {
      render(<HowToContent hasMarkets={false} hasReports={false} hasKit={false} />);
      const step1 = screen.getByTestId("step-1");
      const step2 = screen.getByTestId("step-2");
      expect(
        within(step1).getByText(/define your first market/i)
      ).toBeInTheDocument();
      expect(
        within(step2).getByText(/generate your first report/i)
      ).toBeInTheDocument();
    });

    it("step 1 CTA links to /markets/new for new users", () => {
      render(<HowToContent hasMarkets={false} hasReports={false} hasKit={false} />);
      const step1 = screen.getByTestId("step-1");
      const cta = within(step1).getByRole("link");
      expect(cta).toHaveAttribute("href", "/markets/new");
    });

    it("step 1 CTA links to /markets for returning users", () => {
      render(<HowToContent hasMarkets={true} hasReports={false} hasKit={false} />);
      const step1 = screen.getByTestId("step-1");
      const cta = within(step1).getByRole("link");
      expect(cta).toHaveAttribute("href", "/markets");
    });

    it("step 2 CTA links to /reports/create", () => {
      render(<HowToContent hasMarkets={false} hasReports={false} hasKit={false} />);
      const step2 = screen.getByTestId("step-2");
      const cta = within(step2).getByRole("link");
      expect(cta).toHaveAttribute("href", "/reports/create");
    });

    it("step 3 CTA is disabled when user has no reports", () => {
      render(<HowToContent hasMarkets={false} hasReports={false} hasKit={false} />);
      const step3 = screen.getByTestId("step-3");
      const link = within(step3).queryByRole("link");
      expect(link).toBeNull();
      expect(
        within(step3).getByText(/coming after your first report/i)
      ).toBeInTheDocument();
    });

    it("step 3 CTA links to /content-studio for returning users", () => {
      render(<HowToContent hasMarkets={true} hasReports={true} hasKit={false} />);
      const step3 = screen.getByTestId("step-3");
      const cta = within(step3).getByRole("link");
      expect(cta).toHaveAttribute("href", "/content-studio");
    });

    it("step 3 CTA says 'Open Content Studio' for returning users", () => {
      render(<HowToContent hasMarkets={true} hasReports={true} hasKit={false} />);
      const step3 = screen.getByTestId("step-3");
      expect(
        within(step3).getByText(/open content studio/i)
      ).toBeInTheDocument();
    });

    it("shows returning-user CTAs when user has markets and reports", () => {
      render(<HowToContent hasMarkets={true} hasReports={true} hasKit={false} />);
      expect(screen.getByText(/view your markets/i)).toBeInTheDocument();
      expect(
        screen.getByText(/create another report/i)
      ).toBeInTheDocument();
    });
  });

  // --- FAQ accordion ---

  describe("PG-HOWTO-06: FAQ section", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let HowToContent: any;

    beforeAll(async () => {
      const mod = await import(
        "@/components/how-to/how-to-content"
      );
      HowToContent = mod.HowToContent;
    });

    it("renders a Common Questions section", () => {
      render(<HowToContent hasMarkets={false} hasReports={false} hasKit={false} />);
      expect(
        screen.getByRole("heading", { name: /common questions/i })
      ).toBeInTheDocument();
    });

    it("renders at least 5 FAQ items", () => {
      render(<HowToContent hasMarkets={false} hasReports={false} hasKit={false} />);
      const faqSection = screen.getByTestId("faq-section");
      const buttons = within(faqSection).getAllByRole("button");
      expect(buttons.length).toBeGreaterThanOrEqual(5);
    });

    it("includes a question about Content Studio", () => {
      render(<HowToContent hasMarkets={false} hasReports={false} hasKit={false} />);
      const faqSection = screen.getByTestId("faq-section");
      expect(
        within(faqSection).getByText(/what is the content studio/i)
      ).toBeInTheDocument();
    });

    it("FAQ answers are initially hidden", () => {
      render(<HowToContent hasMarkets={false} hasReports={false} hasKit={false} />);
      const faqSection = screen.getByTestId("faq-section");
      const answers = within(faqSection).queryAllByTestId("faq-answer");
      answers.forEach((answer) => {
        expect(answer).not.toBeVisible();
      });
    });

    it("clicking a question reveals its answer", () => {
      render(<HowToContent hasMarkets={false} hasReports={false} hasKit={false} />);
      const faqSection = screen.getByTestId("faq-section");
      const buttons = within(faqSection).getAllByRole("button");
      fireEvent.click(buttons[0]);
      const visibleAnswers = within(faqSection)
        .getAllByTestId("faq-answer")
        .filter((el) => el.style.display !== "none" && !el.hidden);
      expect(visibleAnswers.length).toBeGreaterThanOrEqual(1);
    });

    it("only one answer is visible at a time (accordion)", () => {
      render(<HowToContent hasMarkets={false} hasReports={false} hasKit={false} />);
      const faqSection = screen.getByTestId("faq-section");
      const buttons = within(faqSection).getAllByRole("button");

      fireEvent.click(buttons[0]);
      fireEvent.click(buttons[1]);

      const allAnswers = within(faqSection).getAllByTestId("faq-answer");
      const visibleCount = allAnswers.filter(
        (el) =>
          !el.hidden &&
          el.getAttribute("aria-hidden") !== "true" &&
          getComputedStyle(el).display !== "none"
      ).length;
      expect(visibleCount).toBe(1);
    });
  });

  // --- Sidebar navigation ---

  describe("PG-HOWTO-07: Sidebar integration", () => {
    it("sidebar includes How To link", () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { Sidebar } = require("@/components/layout/sidebar");
      render(<Sidebar />);
      expect(screen.getByText("How To")).toBeInTheDocument();
    });

    it("How To link has correct href", () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { Sidebar } = require("@/components/layout/sidebar");
      render(<Sidebar />);
      const link = screen.getByText("How To").closest("a");
      expect(link).toHaveAttribute("href", "/how-to");
    });
  });

  // --- Content guardrails (persona-informed) ---

  describe("PG-HOWTO-08: Content guardrails", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let HowToContent: any;

    beforeAll(async () => {
      const mod = await import(
        "@/components/how-to/how-to-content"
      );
      HowToContent = mod.HowToContent;
    });

    it("does not use tech jargon (AI, agents, algorithm)", () => {
      const { container } = render(
        <HowToContent hasMarkets={false} hasReports={false} hasKit={false} />
      );
      const text = container.textContent!.toLowerCase();
      expect(text).not.toContain("ai agent");
      expect(text).not.toContain("algorithm");
      expect(text).not.toContain("machine learning");
      expect(text).not.toContain("llm");
    });

    it("uses professional advisory vocabulary", () => {
      const { container } = render(
        <HowToContent hasMarkets={false} hasReports={false} hasKit={false} />
      );
      const text = container.textContent!.toLowerCase();
      const advisoryTerms = [
        "intelligence",
        "market",
        "analysis",
        "report",
      ];
      const matchCount = advisoryTerms.filter((t) =>
        text.includes(t)
      ).length;
      expect(matchCount).toBeGreaterThanOrEqual(3);
    });

    it("does not use casual onboarding language", () => {
      const { container } = render(
        <HowToContent hasMarkets={false} hasReports={false} hasKit={false} />
      );
      const text = container.textContent!.toLowerCase();
      expect(text).not.toMatch(/let's get started/i);
      expect(text).not.toMatch(/welcome!/i);
      expect(text).not.toMatch(/you're all set/i);
    });
  });
});
