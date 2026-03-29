import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import fs from "fs";
import path from "path";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  usePathname: () => "/reports/create",
  useRouter: () => ({ push: jest.fn() }),
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
    div: ({ children, className, style, ...props }: any) => (
      <div className={className} style={style} {...props}>{children}</div>
    ),
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    button: ({ children, className, ...props }: any) => (
      <button className={className} {...props}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock fetch for components that call APIs
global.fetch = jest.fn().mockImplementation((url: string) => {
  if (url.includes("/api/buyer-personas")) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ personas: [] }),
    });
  }
  if (url.includes("/api/entitlements")) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ allowed: true, limit: 5, used: 1, remaining: 4 }),
    });
  }
  if (url.includes("/progress")) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        reportId: "r1",
        reportStatus: "generating",
        pipeline: { status: "running", totalAgents: 4, completedAgents: 0, currentAgents: ["data-fetch"], percentComplete: 10 },
      }),
    });
  }
  return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
}) as jest.Mock;

import { CreationFlowShell } from "@/components/reports/creation-flow-shell";
import { CreationStepIndicator } from "@/components/reports/creation-step-indicator";

/**
 * Report Creation Flow Design Refresh Tests (Phase 4)
 *
 * Spec: .specs/features/design-refresh/report-creation-flow-design-refresh.feature.md
 * Design tokens: .specs/design-system/tokens.md
 */

function readSource(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf-8");
}

function assertWarmTypography(source: string, fileName: string) {
  expect(source).toContain("--font-display");
  expect(source).toContain("--font-body");
  expect(source).not.toMatch(/var\(--font-serif\)/);
  expect(source).not.toMatch(/var\(--font-sans\)/);
}

function assertNoColdColorTokens(source: string, fileName: string) {
  const coldTokens = [
    "var(--color-primary)", "var(--color-surface)", "var(--color-border)",
    "var(--color-text)", "var(--color-text-secondary)", "var(--color-text-tertiary)",
    "var(--color-accent)", "var(--color-accent-hover)", "var(--color-accent-light)",
    "var(--color-background)", "var(--color-primary-light)", "var(--color-border-strong)",
  ];
  for (const token of coldTokens) {
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped.replace("var\\\\\\(--color-", "var\\(--color-(?!app-)"));
    if (source.match(regex)) {
      fail(fileName + " still uses cold token: " + token);
    }
  }
}

const SOURCE_FILES = {
  shell: "components/reports/creation-flow-shell.tsx",
  stepIndicator: "components/reports/creation-step-indicator.tsx",
  stepMarket: "components/reports/steps/step-your-market.tsx",
  stepTier: "components/reports/steps/step-your-tier.tsx",
  stepAudience: "components/reports/steps/step-your-audience.tsx",
  stepReview: "components/reports/steps/step-your-review.tsx",
  stepGenerating: "components/reports/steps/step-generating.tsx",
  autocomplete: "components/reports/steps/market-autocomplete.tsx",
  previewCard: "components/reports/steps/market-preview-card.tsx",
  personaCard: "components/reports/persona-card.tsx",
  personaPreview: "components/reports/persona-preview-panel.tsx",
};

describe("Report Creation Flow Design Refresh (Phase 4)", () => {
  describe("Scenario: Creation flow shell uses warm palette", () => {
    const src = readSource(SOURCE_FILES.shell);
    it("outer card uses --color-app-surface background", () => { expect(src).toContain("--color-app-surface"); });
    it("h1 uses --font-display and --color-app-text", () => { expect(src).toContain("--font-display"); expect(src).toContain("--color-app-text"); });
    it("accent line uses --color-app-accent", () => { expect(src).toContain("--color-app-accent"); });
    it("navigation border uses --color-app-border", () => { expect(src).toContain("--color-app-border"); });
    it("Back button uses --color-app-text-secondary", () => { expect(src).toContain("--color-app-text-secondary"); });
    it("Next button uses --color-app-accent bg", () => { expect(src).toContain("--color-app-accent"); });
    it("does not use cold typography tokens", () => { assertWarmTypography(src, "creation-flow-shell"); });
    it("does not use cold color tokens", () => { assertNoColdColorTokens(src, "creation-flow-shell"); });
  });

  describe("Scenario: Step indicator uses warm tokens", () => {
    const src = readSource(SOURCE_FILES.stepIndicator);
    it("active/completed circles use --color-app-accent", () => { expect(src).toContain("--color-app-accent"); });
    it("inactive circles use --color-app-border and --color-app-surface", () => { expect(src).toContain("--color-app-border"); expect(src).toContain("--color-app-surface"); });
    it("inactive numbers use --color-app-text-tertiary", () => { expect(src).toContain("--color-app-text-tertiary"); });
    it("labels use --font-body", () => { expect(src).toContain("--font-body"); });
    it("does not use cold tokens", () => { assertNoColdColorTokens(src, "creation-step-indicator"); });
  });

  describe("Scenario: Step 1 — Your Market uses warm palette", () => {
    const src = readSource(SOURCE_FILES.stepMarket);
    it("heading uses --font-display and --color-app-text", () => { expect(src).toContain("--font-display"); expect(src).toContain("--color-app-text"); });
    it("subtitle uses --font-body and --color-app-text-secondary", () => { expect(src).toContain("--font-body"); expect(src).toContain("--color-app-text-secondary"); });
    it("saved market cards use --color-app-surface and --color-app-border", () => { expect(src).toContain("--color-app-surface"); expect(src).toContain("--color-app-border"); });
    it("form inputs use --color-app-bg and --color-app-border", () => { expect(src).toContain("--color-app-bg"); expect(src).toContain("--color-app-border"); });
    it("input focus rings use --color-app-accent", () => { expect(src).toContain("--color-app-accent"); });
    it("placeholder text uses --color-app-text-tertiary", () => { expect(src).toContain("--color-app-text-tertiary"); });
    it("does not use cold tokens", () => { assertWarmTypography(src, "step-your-market"); assertNoColdColorTokens(src, "step-your-market"); });
  });

  describe("Scenario: Step 2 — Your Tier uses warm palette", () => {
    const src = readSource(SOURCE_FILES.stepTier);
    it("heading uses --font-display and --color-app-text", () => { expect(src).toContain("--font-display"); expect(src).toContain("--color-app-text"); });
    it("unselected cards use --color-app-surface and --color-app-border", () => { expect(src).toContain("--color-app-surface"); expect(src).toContain("--color-app-border"); });
    it("selected cards use --color-app-accent-light and --color-app-accent", () => { expect(src).toContain("--color-app-accent-light"); expect(src).toContain("--color-app-accent"); });
    it("tier range uses --font-display", () => { expect(src).toContain("--font-display"); });
    it("does not use cold tokens", () => { assertWarmTypography(src, "step-your-tier"); assertNoColdColorTokens(src, "step-your-tier"); });
  });

  describe("Scenario: Step 3 — Your Audience uses warm palette", () => {
    const src = readSource(SOURCE_FILES.stepAudience);
    it("heading uses --font-display and --color-app-text", () => { expect(src).toContain("--font-display"); expect(src).toContain("--color-app-text"); });
    it("unselected cards use --color-app-surface and --color-app-border", () => { expect(src).toContain("--color-app-surface"); expect(src).toContain("--color-app-border"); });
    it("selected cards use --color-app-accent-light and --color-app-accent", () => { expect(src).toContain("--color-app-accent-light"); expect(src).toContain("--color-app-accent"); });
    it("hover border uses --color-app-border-strong", () => { expect(src).toContain("--color-app-border-strong"); });
    it("selection badge uses --color-app-accent and --color-app-text", () => { expect(src).toContain("--color-app-accent"); expect(src).toContain("--color-app-text"); });
    it("qualifier options use --font-body and warm text", () => { expect(src).toContain("--font-body"); expect(src).toContain("--color-app-text-secondary"); });
    it("does not use cold tokens", () => { assertWarmTypography(src, "step-your-audience"); assertNoColdColorTokens(src, "step-your-audience"); });
  });

  describe("Scenario: Step 4 — Review uses warm palette", () => {
    const src = readSource(SOURCE_FILES.stepReview);
    it("heading uses --font-display and --color-app-text", () => { expect(src).toContain("--font-display"); expect(src).toContain("--color-app-text"); });
    it("review section cards use --color-app-surface and --color-app-border", () => { expect(src).toContain("--color-app-surface"); expect(src).toContain("--color-app-border"); });
    it("section labels use --color-app-text-tertiary", () => { expect(src).toContain("--color-app-text-tertiary"); });
    it("Edit links use --color-app-accent with hover --color-app-accent-hover", () => { expect(src).toContain("--color-app-accent"); expect(src).toContain("--color-app-accent-hover"); });
    it("persona tags use --color-app-active-bg", () => { expect(src).toContain("--color-app-active-bg"); });
    it("title char count uses --color-app-text-tertiary", () => { expect(src).toContain("--color-app-text-tertiary"); });
    it("What we're building heading uses --font-display", () => { expect(src).toContain("--font-display"); });
    it("Generate button uses --color-app-accent", () => { expect(src).toContain("--color-app-accent"); });
    it("does not use cold tokens", () => { assertWarmTypography(src, "step-your-review"); assertNoColdColorTokens(src, "step-your-review"); });
  });

  describe("Scenario: Entitlement UI uses warm palette", () => {
    const src = readSource(SOURCE_FILES.stepReview);
    it("loading skeleton uses --color-app-active-bg", () => { expect(src).toContain("--color-app-active-bg"); });
    it("usage indicator uses --color-app-active-bg or --color-app-accent-light", () => { expect(src).toContain("--color-app-active-bg"); expect(src).toContain("--color-app-accent-light"); });
    it("entitlement gate uses --color-app-surface and --color-app-border-strong", () => { expect(src).toContain("--color-app-surface"); expect(src).toContain("--color-app-border-strong"); });
    it("gate heading uses --font-display", () => { expect(src).toContain("--font-display"); });
    it("View Plans uses --color-app-accent", () => { expect(src).toContain("--color-app-accent"); });
    it("semantic colors remain unchanged", () => { expect(src).toContain("--color-warning"); expect(src).toContain("--color-error"); });
  });

  describe("Scenario: Step 5 — Generating uses warm palette", () => {
    const src = readSource(SOURCE_FILES.stepGenerating);
    it("heading uses --font-display and --color-app-text", () => { expect(src).toContain("--font-display"); expect(src).toContain("--color-app-text"); });
    it("subtitle uses --font-body and --color-app-text-secondary", () => { expect(src).toContain("--font-body"); expect(src).toContain("--color-app-text-secondary"); });
    it("progress bar track uses --color-app-border", () => { expect(src).toContain("--color-app-border"); });
    it("progress bar fill uses --color-app-accent", () => { expect(src).toContain("--color-app-accent"); });
    it("does not use cold tokens", () => { assertWarmTypography(src, "step-generating"); assertNoColdColorTokens(src, "step-generating"); });
  });

  describe("Scenario: Agent cards use warm palette", () => {
    const src = readSource(SOURCE_FILES.stepGenerating);
    it("pending cards use --color-app-surface and --color-app-border", () => { expect(src).toContain("--color-app-surface"); expect(src).toContain("--color-app-border"); });
    it("running cards use --color-app-accent-light and --color-app-accent", () => { expect(src).toContain("--color-app-accent-light"); expect(src).toContain("--color-app-accent"); });
    it("completed/failed use --color-success and --color-error", () => { expect(src).toContain("--color-success"); expect(src).toContain("--color-error"); });
    it("agent names use --font-body and --color-app-text", () => { expect(src).toContain("--font-body"); expect(src).toContain("--color-app-text"); });
    it("Pro badges use --color-app-accent-light and --color-app-accent-hover", () => { expect(src).toContain("--color-app-accent-light"); expect(src).toContain("--color-app-accent-hover"); });
    it("descriptions use warm secondary/tertiary", () => { expect(src).toContain("--color-app-text-secondary"); expect(src).toContain("--color-app-text-tertiary"); });
  });

  describe("Scenario: Activity log uses warm palette", () => {
    const src = readSource(SOURCE_FILES.stepGenerating);
    it("log container uses --color-app-surface and --color-app-border", () => { expect(src).toContain("--color-app-surface"); expect(src).toContain("--color-app-border"); });
    it("timestamps use --color-app-text-tertiary", () => { expect(src).toContain("--color-app-text-tertiary"); });
    it("log messages use --font-body and --color-app-text-secondary", () => { expect(src).toContain("--font-body"); expect(src).toContain("--color-app-text-secondary"); });
  });

  describe("Scenario: Completion and failure states", () => {
    const src = readSource(SOURCE_FILES.stepGenerating);
    it("View Report/Retry buttons use --color-app-accent", () => { expect(src).toContain("--color-app-accent"); });
    it("semantic colors remain for success/error", () => { expect(src).toContain("--color-success"); expect(src).toContain("--color-error"); });
  });

  describe("Scenario: Navigation and functionality preserved", () => {
    it("renders CreationFlowShell with heading", () => {
      render(<CreationFlowShell markets={[]} />);
      expect(screen.getByText("Create Your Intelligence Report")).toBeInTheDocument();
    });
    it("renders step indicator with 5 steps", () => {
      render(<CreationStepIndicator steps={["Your Market", "Your Tier", "Your Audience", "Review", "Generate"]} currentStep={0} />);
      expect(screen.getByText("Your Market")).toBeInTheDocument();
      expect(screen.getByText("Generate")).toBeInTheDocument();
    });
    it("renders step 0 content", () => {
      render(<CreationFlowShell markets={[]} />);
      expect(screen.getByText("Where do you operate?")).toBeInTheDocument();
    });
  });

  describe("Sub-components: MarketAutocomplete warm tokens", () => {
    const src = readSource(SOURCE_FILES.autocomplete);
    it("uses --color-app-bg and --color-app-border", () => { expect(src).toContain("--color-app-bg"); expect(src).toContain("--color-app-border"); });
    it("dropdown uses --color-app-surface", () => { expect(src).toContain("--color-app-surface"); });
    it("does not use cold tokens", () => { assertNoColdColorTokens(src, "market-autocomplete"); });
  });

  describe("Sub-components: MarketPreviewCard warm tokens", () => {
    const src = readSource(SOURCE_FILES.previewCard);
    it("uses --font-display and --color-app-text", () => { expect(src).toContain("--font-display"); expect(src).toContain("--color-app-text"); });
    it("uses --color-app-accent", () => { expect(src).toContain("--color-app-accent"); });
    it("does not use cold tokens", () => { assertNoColdColorTokens(src, "market-preview-card"); });
  });

  describe("Sub-components: PersonaCard warm tokens", () => {
    const src = readSource(SOURCE_FILES.personaCard);
    it("uses --font-display for persona name", () => { expect(src).toContain("--font-display"); });
    it("selection badge uses --color-app-accent and --color-app-text", () => { expect(src).toContain("--color-app-accent"); expect(src).toContain("--color-app-text"); });
    it("motivation tag uses --color-app-active-bg", () => { expect(src).toContain("--color-app-active-bg"); });
    it("does not use cold tokens", () => { assertWarmTypography(src, "persona-card"); assertNoColdColorTokens(src, "persona-card"); });
  });

  describe("Sub-components: PersonaPreviewPanel warm tokens", () => {
    const src = readSource(SOURCE_FILES.personaPreview);
    it("uses --font-display for heading", () => { expect(src).toContain("--font-display"); });
    it("uses --color-app-bg for background", () => { expect(src).toContain("--color-app-bg"); });
    it("vocabulary tags use --color-app-border", () => { expect(src).toContain("--color-app-border"); });
    it("talking point bg uses --color-app-surface", () => { expect(src).toContain("--color-app-surface"); });
    it("does not use cold tokens", () => { assertWarmTypography(src, "persona-preview-panel"); assertNoColdColorTokens(src, "persona-preview-panel"); });
  });
});
