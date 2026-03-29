import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import fs from "fs";
import path from "path";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
  usePathname: () => "/markets",
}));

// Mock next/link
jest.mock("next/link", () => {
  return function MockLink({ children, href, className, ...rest }: any) {
    return <a href={href} className={className} {...rest}>{children}</a>;
  };
});

// Mock framer-motion
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock pageTransition
jest.mock("@/lib/animations", () => ({
  pageTransition: () => ({
    initial: {},
    animate: {},
    exit: {},
  }),
}));

// Mock CreationStepIndicator
jest.mock("@/components/reports/creation-step-indicator", () => ({
  CreationStepIndicator: ({ steps, currentStep }: any) => (
    <div data-testid="step-indicator">{steps[currentStep]}</div>
  ),
}));

// Mock step components
jest.mock("@/components/reports/steps/step-your-market", () => ({
  StepYourMarket: ({ onValidationChange }: any) => {
    return <div data-testid="step-market">Market Step</div>;
  },
}));

jest.mock("@/components/reports/steps/step-your-tier", () => ({
  StepYourTier: ({ onValidationChange }: any) => {
    return <div data-testid="step-tier">Tier Step</div>;
  },
}));

import { MarketCreationShell } from "@/components/markets/market-creation-shell";
import { DeleteMarketButton } from "@/components/markets/delete-market-button";
import { PeerMarketForm } from "@/components/markets/peer-market-form";

/**
 * Markets Design Refresh Tests (Phase 5)
 *
 * Verifies that all Markets domain components use the warm luxury palette
 * (--color-app-*) and updated typography (--font-display + --font-body).
 *
 * Server components (MarketsPage, PeerMarketsPage) are tested via source
 * file content checks. Client components are tested via render + className.
 */

describe("Markets Design Refresh (Phase 5)", () => {
  describe("MarketsPage (server component) uses warm tokens in source", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "app/(protected)/markets/page.tsx"),
      "utf8"
    );

    it("page heading uses --font-display (not --font-serif)", () => {
      expect(source).toContain("--font-display");
      expect(source).not.toContain("--font-serif");
    });

    it("uses --font-body for body text (not --font-sans)", () => {
      expect(source).toContain("--font-body");
      expect(source).not.toContain("--font-sans");
    });

    it("uses --color-app-text (not --color-primary for text)", () => {
      expect(source).toContain("--color-app-text");
      expect(source).not.toContain("--color-primary");
    });

    it("uses --color-app-surface (not --color-surface)", () => {
      expect(source).toContain("--color-app-surface");
      expect(source).not.toContain("var(--color-surface)");
    });

    it("uses --color-app-accent (not --color-accent)", () => {
      expect(source).toContain("--color-app-accent");
      expect(source).not.toMatch(/var\(--color-accent\)/);
    });

    it("uses --color-app-border (not --color-border)", () => {
      expect(source).toContain("--color-app-border");
      expect(source).not.toMatch(/var\(--color-border\)/);
    });

    it("uses --color-app-text-secondary", () => {
      expect(source).toContain("--color-app-text-secondary");
      expect(source).not.toMatch(/var\(--color-text-secondary\)/);
    });

    it("uses --color-app-text-tertiary", () => {
      expect(source).toContain("--color-app-text-tertiary");
      expect(source).not.toMatch(/var\(--color-text-tertiary\)/);
    });

    it("uses --color-app-accent-light for Default badge", () => {
      expect(source).toContain("--color-app-accent-light");
    });

    it("still has links to /markets/new", () => {
      expect(source).toContain('href="/markets/new"');
    });
  });

  describe("PeerMarketsPage (server component) uses warm tokens in source", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "app/(protected)/markets/[id]/peers/page.tsx"),
      "utf8"
    );

    it("uses --font-display for heading", () => {
      expect(source).toContain("--font-display");
      expect(source).not.toContain("--font-serif");
    });

    it("uses --font-body for body text", () => {
      expect(source).toContain("--font-body");
      expect(source).not.toContain("--font-sans");
    });

    it("uses --color-app-text (not --color-primary)", () => {
      expect(source).toContain("--color-app-text");
      expect(source).not.toContain("--color-primary");
    });

    it("uses --color-app-accent for accent line", () => {
      expect(source).toContain("--color-app-accent");
      expect(source).not.toMatch(/var\(--color-accent\)/);
    });
  });

  // ──────────────── MarketCreationShell (client component) ────────────────

  describe("MarketCreationShell warm palette", () => {
    it("heading uses display font (--font-display)", () => {
      render(<MarketCreationShell />);
      const heading = screen.getByText("Define Your Market");
      expect(heading.className).toContain("font-display");
    });

    it("heading uses warm text color (--color-app-text)", () => {
      render(<MarketCreationShell />);
      const heading = screen.getByText("Define Your Market");
      expect(heading.className).toContain("color-app-text");
    });

    it("subtitle uses body font (--font-body)", () => {
      render(<MarketCreationShell />);
      const subtitle = screen.getByText(/Set up the market/);
      expect(subtitle.className).toContain("font-body");
    });

    it("subtitle uses warm secondary text (--color-app-text-secondary)", () => {
      render(<MarketCreationShell />);
      const subtitle = screen.getByText(/Set up the market/);
      expect(subtitle.className).toContain("color-app-text-secondary");
    });

    it("form card uses warm surface (--color-app-surface)", () => {
      const { container } = render(<MarketCreationShell />);
      const card = container.firstElementChild?.firstElementChild;
      expect(card?.className).toContain("color-app-surface");
    });

    it("Next button uses warm accent (--color-app-accent)", () => {
      render(<MarketCreationShell />);
      const btn = screen.getByText("Next");
      expect(btn.className).toContain("color-app-accent");
    });

    it("Next button uses body font (--font-body)", () => {
      render(<MarketCreationShell />);
      const btn = screen.getByText("Next");
      expect(btn.className).toContain("font-body");
    });

    it("navigation border uses warm border (--color-app-border)", () => {
      const { container } = render(<MarketCreationShell />);
      const navBorder = container.querySelector(".border-t");
      expect(navBorder?.className).toContain("color-app-border");
    });

    it("edit mode heading says 'Edit Your Market'", () => {
      render(<MarketCreationShell mode="edit" marketId="test-1" initialData={{
        name: "Naples FL",
        geography: { city: "Naples", state: "Florida" },
        luxuryTier: "ultra_luxury",
        priceFloor: 5000000,
      }} />);
      expect(screen.getByText("Edit Your Market")).toBeInTheDocument();
    });
  });

  // ──────────────── DeleteMarketButton (client component) ────────────────

  describe("DeleteMarketButton warm palette", () => {
    it("idle button uses body font (--font-body)", () => {
      render(
        <DeleteMarketButton marketId="mkt-1" marketName="Naples" reportCount={0} />
      );
      const btn = screen.getByText("Remove");
      expect(btn.className).toContain("font-body");
    });

    it("idle button uses warm tertiary text (--color-app-text-tertiary)", () => {
      render(
        <DeleteMarketButton marketId="mkt-1" marketName="Naples" reportCount={0} />
      );
      const btn = screen.getByText("Remove");
      expect(btn.className).toContain("color-app-text-tertiary");
    });

    it("idle button uses warm border (--color-app-border)", () => {
      render(
        <DeleteMarketButton marketId="mkt-1" marketName="Naples" reportCount={0} />
      );
      const btn = screen.getByText("Remove");
      expect(btn.className).toContain("color-app-border");
    });

    it("preserves semantic --color-error on hover", () => {
      render(
        <DeleteMarketButton marketId="mkt-1" marketName="Naples" reportCount={0} />
      );
      const btn = screen.getByText("Remove");
      expect(btn.className).toContain("color-error");
    });

    it("confirm state text uses warm secondary (--color-app-text-secondary)", () => {
      render(
        <DeleteMarketButton marketId="mkt-1" marketName="Naples" reportCount={0} />
      );
      fireEvent.click(screen.getByText("Remove"));
      const confirmText = screen.getByText("Remove this market?");
      expect(confirmText.className).toContain("color-app-text-secondary");
    });

    it("cancel button uses warm border (--color-app-border)", () => {
      render(
        <DeleteMarketButton marketId="mkt-1" marketName="Naples" reportCount={0} />
      );
      fireEvent.click(screen.getByText("Remove"));
      const cancelBtn = screen.getByText("Cancel");
      expect(cancelBtn.className).toContain("color-app-border");
    });

    it("confirm button preserves semantic error color", () => {
      render(
        <DeleteMarketButton marketId="mkt-1" marketName="Naples" reportCount={0} />
      );
      fireEvent.click(screen.getByText("Remove"));
      const confirmBtn = screen.getByText("Confirm");
      expect(confirmBtn.className).toContain("color-error");
    });
  });

  // ──────────────── PeerMarketForm (client component) ────────────────

  describe("PeerMarketForm warm palette", () => {
    it("heading uses display font (--font-display)", () => {
      render(<PeerMarketForm marketId="mkt-1" initialPeers={[]} />);
      const heading = screen.getByText("Peer Markets");
      expect(heading.className).toContain("font-display");
    });

    it("heading uses warm text (--color-app-text)", () => {
      render(<PeerMarketForm marketId="mkt-1" initialPeers={[]} />);
      const heading = screen.getByText("Peer Markets");
      expect(heading.className).toContain("color-app-text");
    });

    it("subtitle uses body font (--font-body)", () => {
      render(<PeerMarketForm marketId="mkt-1" initialPeers={[]} />);
      const sub = screen.getByText(/Add comparable luxury markets/);
      expect(sub.className).toContain("font-body");
    });

    it("subtitle uses warm secondary text (--color-app-text-secondary)", () => {
      render(<PeerMarketForm marketId="mkt-1" initialPeers={[]} />);
      const sub = screen.getByText(/Add comparable luxury markets/);
      expect(sub.className).toContain("color-app-text-secondary");
    });

    it("form background uses warm surface (--color-app-surface)", () => {
      const { container } = render(
        <PeerMarketForm marketId="mkt-1" initialPeers={[]} />
      );
      const form = container.firstElementChild;
      expect(form?.className).toContain("color-app-surface");
    });

    it("Add button uses warm border (--color-app-border)", () => {
      render(<PeerMarketForm marketId="mkt-1" initialPeers={[]} />);
      const addBtn = screen.getByText("+ Add Peer Market");
      expect(addBtn.className).toContain("color-app-border");
    });

    it("Add button hover uses warm accent (--color-app-accent)", () => {
      render(<PeerMarketForm marketId="mkt-1" initialPeers={[]} />);
      const addBtn = screen.getByText("+ Add Peer Market");
      expect(addBtn.className).toContain("color-app-accent");
    });

    it("Save button uses warm accent bg (--color-app-accent)", () => {
      render(<PeerMarketForm marketId="mkt-1" initialPeers={[]} />);
      const saveBtn = screen.getByText("Save Peer Markets");
      expect(saveBtn.className).toContain("color-app-accent");
    });

    it("empty state text uses warm tertiary (--color-app-text-tertiary)", () => {
      render(<PeerMarketForm marketId="mkt-1" initialPeers={[]} />);
      const empty = screen.getByText(/No peer markets added yet/);
      expect(empty.className).toContain("color-app-text-tertiary");
    });

    it("preserves --color-success for success messages", () => {
      const source = fs.readFileSync(
        path.join(process.cwd(), "components/markets/peer-market-form.tsx"),
        "utf8"
      );
      expect(source).toContain("--color-success");
    });

    it("preserves --color-error for error messages", () => {
      const source = fs.readFileSync(
        path.join(process.cwd(), "components/markets/peer-market-form.tsx"),
        "utf8"
      );
      expect(source).toContain("--color-error");
    });
  });
});
