/**
 * Test IDs: CMP-CFP-001 through CMP-CFP-006
 * Spec: .specs/features/reports/pre-populated-report-creation.feature.md
 */
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";

// --- Mocks ---

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
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => "/reports/create",
  useSearchParams: () => new URLSearchParams(),
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

// Mock draft persistence to isolate tests
jest.mock("@/lib/hooks/use-flow-persistence", () => ({
  loadDraft: jest.fn(() => null),
  saveDraft: jest.fn(),
  clearDraft: jest.fn(),
}));

// Mock step components to keep tests focused on shell behavior
jest.mock("@/components/reports/steps/step-your-market", () => ({
  StepYourMarket: ({ markets }: { markets: unknown[] }) => (
    <div data-testid="step-your-market">Step: Your Market ({markets.length} markets)</div>
  ),
}));

jest.mock("@/components/reports/steps/step-your-tier", () => ({
  StepYourTier: () => <div data-testid="step-your-tier">Step: Your Tier</div>,
}));

jest.mock("@/components/reports/steps/step-your-audience", () => ({
  StepYourAudience: () => (
    <div data-testid="step-your-audience">Step: Your Audience</div>
  ),
}));

jest.mock("@/components/reports/steps/step-your-review", () => ({
  StepYourReview: () => (
    <div data-testid="step-your-review">Step: Review</div>
  ),
}));

jest.mock("@/components/reports/steps/step-generating", () => ({
  StepGenerating: () => (
    <div data-testid="step-generating">Step: Generating</div>
  ),
}));

jest.mock("@/components/reports/creation-step-indicator", () => ({
  CreationStepIndicator: ({ currentStep }: { currentStep: number }) => (
    <div data-testid="step-indicator">Current step: {currentStep}</div>
  ),
}));

jest.mock("@/lib/animations", () => ({
  pageTransition: () => ({}),
}));

import { CreationFlowShell } from "@/components/reports/creation-flow-shell";

// --- Test Helpers ---

const makeMarket = (overrides: Partial<{
  id: string;
  name: string;
  geography: { city: string; state: string };
  luxuryTier: string;
  isDefault: number;
}> = {}) => ({
  id: "mkt-la",
  name: "Los Angeles Luxury",
  geography: { city: "Los Angeles", state: "California" },
  luxuryTier: "luxury",
  isDefault: 0,
  ...overrides,
});

// --- Tests ---

describe("CreationFlowShell — pre-populated marketId", () => {
  // CMP-CFP-001
  it("auto-skips to Audience step when preselectedMarketId matches a saved market", async () => {
    const markets = [makeMarket()];
    render(
      <CreationFlowShell markets={markets} preselectedMarketId="mkt-la" />
    );

    await waitFor(() => {
      expect(screen.getByTestId("step-your-audience")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("step-your-market")).not.toBeInTheDocument();
  });

  // CMP-CFP-002
  it("starts at step 1 when no preselectedMarketId is provided", () => {
    const markets = [makeMarket()];
    render(<CreationFlowShell markets={markets} />);

    expect(screen.getByTestId("step-your-market")).toBeInTheDocument();
    expect(screen.queryByTestId("step-your-audience")).not.toBeInTheDocument();
  });

  // CMP-CFP-003
  it("starts at step 1 when preselectedMarketId does not match any market", () => {
    const markets = [makeMarket()];
    render(
      <CreationFlowShell markets={markets} preselectedMarketId="nonexistent-id" />
    );

    expect(screen.getByTestId("step-your-market")).toBeInTheDocument();
    expect(screen.queryByTestId("step-your-audience")).not.toBeInTheDocument();
  });

  // CMP-CFP-004
  it("preselectedMarketId takes priority over saved draft", async () => {
    const { loadDraft } = require("@/lib/hooks/use-flow-persistence");
    loadDraft.mockReturnValueOnce({
      currentStep: 1,
      marketData: { city: "Miami", state: "Florida", marketName: "Miami Luxury" },
      tierData: { luxuryTier: "luxury", priceFloor: 1_000_000 },
      audienceData: null,
      savedAt: new Date().toISOString(),
    });

    const markets = [makeMarket()];
    render(
      <CreationFlowShell markets={markets} preselectedMarketId="mkt-la" />
    );

    await waitFor(() => {
      expect(screen.getByTestId("step-your-audience")).toBeInTheDocument();
    });
  });

  // CMP-CFP-005
  it("sets correct tier defaults for ultra_luxury market", async () => {
    const markets = [
      makeMarket({
        id: "mkt-naples",
        name: "Naples Ultra Luxury",
        luxuryTier: "ultra_luxury",
        geography: { city: "Naples", state: "Florida" },
      }),
    ];
    const { saveDraft } = require("@/lib/hooks/use-flow-persistence");

    render(
      <CreationFlowShell markets={markets} preselectedMarketId="mkt-naples" />
    );

    await waitFor(() => {
      expect(screen.getByTestId("step-your-audience")).toBeInTheDocument();
    });

    // saveDraft should have been called with ultra_luxury tier defaults
    expect(saveDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        currentStep: 2,
        tierData: expect.objectContaining({
          luxuryTier: "ultra_luxury",
          priceFloor: 10_000_000,
        }),
      })
    );
  });

  // CMP-CFP-006
  it("sets correct tier defaults for high_luxury market", async () => {
    const markets = [
      makeMarket({
        id: "mkt-bh",
        name: "Beverly Hills High Luxury",
        luxuryTier: "high_luxury",
        geography: { city: "Beverly Hills", state: "California" },
      }),
    ];
    const { saveDraft } = require("@/lib/hooks/use-flow-persistence");

    render(
      <CreationFlowShell markets={markets} preselectedMarketId="mkt-bh" />
    );

    await waitFor(() => {
      expect(screen.getByTestId("step-your-audience")).toBeInTheDocument();
    });

    expect(saveDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        currentStep: 2,
        tierData: expect.objectContaining({
          luxuryTier: "high_luxury",
          priceFloor: 6_000_000,
        }),
      })
    );
  });
});
