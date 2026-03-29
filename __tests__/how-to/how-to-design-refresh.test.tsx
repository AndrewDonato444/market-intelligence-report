import "@testing-library/jest-dom";
import { render, screen, within, fireEvent } from "@testing-library/react";

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

import { HowToContent } from "@/components/how-to/how-to-content";

/**
 * How-To Page Design Refresh Tests
 *
 * Verifies that all How-To components (HowToContent, QuickStartChecklist,
 * StepCard, FaqAccordion) use the warm luxury palette (--color-app-*)
 * and updated typography (--font-display + --font-body).
 *
 * Test approach: check className strings for CSS variable names.
 * Same pattern used in Phase 1-6 design refresh tests.
 */

// ──────────────── Page Heading ────────────────

describe("How-To Design Refresh", () => {
  describe("Page heading uses warm display font", () => {
    it("h1 uses --font-display (Cormorant Garamond)", () => {
      render(<HowToContent hasMarkets={false} hasReports={false} />);
      const h1 = screen.getByRole("heading", { level: 1, name: /getting started/i });
      expect(h1.className).toContain("font-display");
    });

    it("h1 uses --color-app-text", () => {
      render(<HowToContent hasMarkets={false} hasReports={false} />);
      const h1 = screen.getByRole("heading", { level: 1, name: /getting started/i });
      expect(h1.className).toContain("color-app-text");
    });

    it("subtitle uses --font-body (DM Sans)", () => {
      render(<HowToContent hasMarkets={false} hasReports={false} />);
      const subtitle = screen.getByText(/guide to creating market intelligence/i);
      expect(subtitle.className).toContain("font-body");
    });

    it("subtitle uses --color-app-text-secondary", () => {
      render(<HowToContent hasMarkets={false} hasReports={false} />);
      const subtitle = screen.getByText(/guide to creating market intelligence/i);
      expect(subtitle.className).toContain("color-app-text-secondary");
    });
  });

  // ──────────────── QuickStartChecklist ────────────────

  describe("Quick-start checklist uses warm palette", () => {
    it("card background uses --color-app-surface", () => {
      render(<HowToContent hasMarkets={false} hasReports={false} />);
      const checklist = screen.getByTestId("quick-start-checklist");
      expect(checklist.className).toContain("color-app-surface");
    });

    it("card border uses --color-app-border", () => {
      render(<HowToContent hasMarkets={false} hasReports={false} />);
      const checklist = screen.getByTestId("quick-start-checklist");
      expect(checklist.className).toContain("color-app-border");
    });

    it("YOUR PROGRESS label uses --font-body", () => {
      render(<HowToContent hasMarkets={false} hasReports={false} />);
      const label = screen.getByText(/your progress/i);
      expect(label.className).toContain("font-body");
    });

    it("YOUR PROGRESS label uses --color-app-text-secondary", () => {
      render(<HowToContent hasMarkets={false} hasReports={false} />);
      const label = screen.getByText(/your progress/i);
      expect(label.className).toContain("color-app-text-secondary");
    });

    it("checklist item text uses --font-body", () => {
      render(<HowToContent hasMarkets={false} hasReports={false} />);
      const checklist = screen.getByTestId("quick-start-checklist");
      const items = within(checklist).getAllByRole("listitem");
      items.forEach((item) => {
        expect(item.className).toContain("font-body");
      });
    });

    it("completed items use gold checkmark with --color-app-accent", () => {
      render(<HowToContent hasMarkets={true} hasReports={false} />);
      const completeIcons = screen.getAllByTestId("checklist-complete");
      completeIcons.forEach((icon) => {
        expect(icon.className).toContain("color-app-accent");
      });
    });

    it("completed item labels use --color-app-text", () => {
      render(<HowToContent hasMarkets={true} hasReports={false} />);
      const checklist = screen.getByTestId("quick-start-checklist");
      // First item ("Define at least one market") should be complete
      const completeLabel = within(checklist).getByText(/define at least one market/i);
      expect(completeLabel.className).toContain("color-app-text");
    });

    it("incomplete items use muted circle with --color-app-text-secondary", () => {
      render(<HowToContent hasMarkets={false} hasReports={false} />);
      const incompleteIcons = screen.getAllByTestId("checklist-incomplete");
      incompleteIcons.forEach((icon) => {
        expect(icon.className).toContain("color-app-text-secondary");
      });
    });

    it("incomplete item labels use --color-app-text-secondary", () => {
      render(<HowToContent hasMarkets={false} hasReports={false} />);
      const checklist = screen.getByTestId("quick-start-checklist");
      const incompleteLabel = within(checklist).getByText(/generate your first report/i);
      expect(incompleteLabel.className).toContain("color-app-text-secondary");
    });
  });

  // ──────────────── StepCard ────────────────

  describe("Step cards use warm palette", () => {
    it("step card background uses --color-app-surface", () => {
      render(<HowToContent hasMarkets={false} hasReports={false} />);
      const step1 = screen.getByTestId("step-1");
      expect(step1.className).toContain("color-app-surface");
    });

    it("step card border uses --color-app-border", () => {
      render(<HowToContent hasMarkets={false} hasReports={false} />);
      const step1 = screen.getByTestId("step-1");
      expect(step1.className).toContain("color-app-border");
    });

    it("step number uses --font-display and --color-app-accent", () => {
      render(<HowToContent hasMarkets={false} hasReports={false} />);
      const step1 = screen.getByTestId("step-1");
      // The step number "1" is in a span
      const number = within(step1).getByText("1");
      expect(number.className).toContain("font-display");
      expect(number.className).toContain("color-app-accent");
    });

    it("step title uses --font-display and --color-app-text", () => {
      render(<HowToContent hasMarkets={false} hasReports={false} />);
      const step1 = screen.getByTestId("step-1");
      const title = within(step1).getByRole("heading", { name: /define your market/i });
      expect(title.className).toContain("font-display");
      expect(title.className).toContain("color-app-text");
    });

    it("step description uses --font-body and --color-app-text-secondary", () => {
      render(<HowToContent hasMarkets={false} hasReports={false} />);
      const step1 = screen.getByTestId("step-1");
      const desc = within(step1).getByText(/clearly defined territory/i);
      expect(desc.className).toContain("font-body");
      expect(desc.className).toContain("color-app-text-secondary");
    });
  });

  // ──────────────── Active CTA ────────────────

  describe("Active step CTA buttons use warm accent", () => {
    it("active CTA background uses --color-app-accent", () => {
      render(<HowToContent hasMarkets={false} hasReports={false} />);
      const step1 = screen.getByTestId("step-1");
      const cta = within(step1).getByRole("link");
      expect(cta.className).toContain("color-app-accent");
    });

    it("active CTA text uses --color-app-surface (warm white)", () => {
      render(<HowToContent hasMarkets={false} hasReports={false} />);
      const step1 = screen.getByTestId("step-1");
      const cta = within(step1).getByRole("link");
      expect(cta.className).toContain("color-app-surface");
    });

    it("active CTA uses --font-body", () => {
      render(<HowToContent hasMarkets={false} hasReports={false} />);
      const step1 = screen.getByTestId("step-1");
      const cta = within(step1).getByRole("link");
      expect(cta.className).toContain("font-body");
    });
  });

  // ──────────────── Disabled CTA ────────────────

  describe("Disabled step CTA uses warm muted state", () => {
    it("disabled CTA background uses --color-app-border", () => {
      render(<HowToContent hasMarkets={false} hasReports={false} />);
      const step3 = screen.getByTestId("step-3");
      const disabled = within(step3).getByText(/coming after your first report/i);
      expect(disabled.className).toContain("color-app-border");
    });

    it("disabled CTA text uses --color-app-text-secondary", () => {
      render(<HowToContent hasMarkets={false} hasReports={false} />);
      const step3 = screen.getByTestId("step-3");
      const disabled = within(step3).getByText(/coming after your first report/i);
      expect(disabled.className).toContain("color-app-text-secondary");
    });

    it("disabled CTA uses --font-body", () => {
      render(<HowToContent hasMarkets={false} hasReports={false} />);
      const step3 = screen.getByTestId("step-3");
      const disabled = within(step3).getByText(/coming after your first report/i);
      expect(disabled.className).toContain("font-body");
    });
  });

  // ──────────────── FAQ Section ────────────────

  describe("FAQ section uses warm palette", () => {
    it("section heading uses --font-body and --color-app-text", () => {
      render(<HowToContent hasMarkets={false} hasReports={false} />);
      const heading = screen.getByRole("heading", { name: /common questions/i });
      expect(heading.className).toContain("font-body");
      expect(heading.className).toContain("color-app-text");
    });

    it("divider borders use --color-app-border", () => {
      render(<HowToContent hasMarkets={false} hasReports={false} />);
      const faq = screen.getByTestId("faq-section");
      // The top border div and item dividers
      expect(faq.innerHTML).toContain("color-app-border");
    });

    it("question text uses --font-body and --color-app-text", () => {
      render(<HowToContent hasMarkets={false} hasReports={false} />);
      const faq = screen.getByTestId("faq-section");
      const buttons = within(faq).getAllByRole("button");
      buttons.forEach((btn) => {
        expect(btn.className).toContain("font-body");
        expect(btn.className).toContain("color-app-text");
      });
    });

    it("question hover state uses --color-app-accent", () => {
      render(<HowToContent hasMarkets={false} hasReports={false} />);
      const faq = screen.getByTestId("faq-section");
      const buttons = within(faq).getAllByRole("button");
      buttons.forEach((btn) => {
        expect(btn.className).toContain("color-app-accent");
      });
    });

    it("chevron uses --color-app-text-secondary", () => {
      render(<HowToContent hasMarkets={false} hasReports={false} />);
      const faq = screen.getByTestId("faq-section");
      // Chevron SVGs have color-app-text-secondary
      expect(faq.innerHTML).toContain("color-app-text-secondary");
    });

    it("answer text uses --font-body and --color-app-text-secondary", () => {
      render(<HowToContent hasMarkets={false} hasReports={false} />);
      const faq = screen.getByTestId("faq-section");
      // Open first FAQ to reveal answer
      const buttons = within(faq).getAllByRole("button");
      fireEvent.click(buttons[0]);
      const answers = within(faq).getAllByTestId("faq-answer");
      const visible = answers.find((a) => !a.hidden);
      expect(visible).toBeDefined();
      const answerP = visible!.querySelector("p");
      expect(answerP!.className).toContain("font-body");
      expect(answerP!.className).toContain("color-app-text-secondary");
    });
  });

  // ──────────────── Functionality Preserved ────────────────

  describe("All How-To functionality is preserved after warm refresh", () => {
    it("checklist shows complete/incomplete correctly with markets", () => {
      render(<HowToContent hasMarkets={true} hasReports={false} />);
      const checklist = screen.getByTestId("quick-start-checklist");
      expect(within(checklist).getAllByTestId("checklist-complete")).toHaveLength(1);
      expect(within(checklist).getAllByTestId("checklist-incomplete")).toHaveLength(2);
    });

    it("Step 1 CTA reads 'View Your Markets' when user has markets", () => {
      render(<HowToContent hasMarkets={true} hasReports={false} />);
      const step1 = screen.getByTestId("step-1");
      expect(within(step1).getByText(/view your markets/i)).toBeInTheDocument();
    });

    it("Step 2 CTA reads 'Create Another Report' when user has reports", () => {
      render(<HowToContent hasMarkets={true} hasReports={true} />);
      const step2 = screen.getByTestId("step-2");
      expect(within(step2).getByText(/create another report/i)).toBeInTheDocument();
    });

    it("Step 3 CTA enabled with 'View Social Media Kit' when user has reports", () => {
      render(<HowToContent hasMarkets={true} hasReports={true} />);
      const step3 = screen.getByTestId("step-3");
      const link = within(step3).getByRole("link");
      expect(link).toHaveTextContent(/view social media kit/i);
    });

    it("FAQ accordion opens and closes (one at a time)", () => {
      render(<HowToContent hasMarkets={false} hasReports={false} />);
      const faq = screen.getByTestId("faq-section");
      const buttons = within(faq).getAllByRole("button");

      // Open first
      fireEvent.click(buttons[0]);
      let visible = within(faq).getAllByTestId("faq-answer").filter((a) => !a.hidden);
      expect(visible).toHaveLength(1);

      // Open second — first should close
      fireEvent.click(buttons[1]);
      visible = within(faq).getAllByTestId("faq-answer").filter((a) => !a.hidden);
      expect(visible).toHaveLength(1);

      // Close second
      fireEvent.click(buttons[1]);
      visible = within(faq).getAllByTestId("faq-answer").filter((a) => !a.hidden);
      expect(visible).toHaveLength(0);
    });

    it("new user sees correct default state", () => {
      render(<HowToContent hasMarkets={false} hasReports={false} />);
      // All incomplete
      expect(screen.getAllByTestId("checklist-incomplete")).toHaveLength(3);
      // First-time CTAs (scoped to step cards to avoid matching checklist text)
      const step1 = screen.getByTestId("step-1");
      expect(within(step1).getByText(/define your first market/i)).toBeInTheDocument();
      const step2 = screen.getByTestId("step-2");
      expect(within(step2).getByText(/generate your first report/i)).toBeInTheDocument();
      // Step 3 disabled
      const step3 = screen.getByTestId("step-3");
      expect(within(step3).queryByRole("link")).toBeNull();
      expect(within(step3).getByText(/coming after your first report/i)).toBeInTheDocument();
    });
  });
});
