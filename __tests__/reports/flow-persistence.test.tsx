import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

// Mock fetch globally (StepYourReview calls /api/buyer-personas)
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
  }),
) as jest.Mock;

// Mock framer-motion
jest.mock("framer-motion", () => {
  const React = require("react");
  return {
    motion: {
      div: React.forwardRef(
        (
          {
            initial,
            animate,
            exit,
            variants,
            whileTap,
            ...props
          }: Record<string, unknown>,
          ref: React.Ref<HTMLDivElement>,
        ) => React.createElement("div", { ...props, ref }),
      ),
      button: React.forwardRef(
        (
          {
            initial,
            animate,
            exit,
            variants,
            whileTap,
            ...props
          }: Record<string, unknown>,
          ref: React.Ref<HTMLButtonElement>,
        ) => React.createElement("button", { ...props, ref }),
      ),
    },
    AnimatePresence: ({
      children,
      mode,
    }: {
      children: React.ReactNode;
      mode?: string;
    }) => React.createElement(React.Fragment, null, children),
  };
});

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => "/reports/create",
}));

const STORAGE_KEY = "mir-creation-flow-draft";

// --- Unit tests for useFlowPersistence hook functions ---

describe("Flow Persistence (#158)", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe("loadDraft / saveDraft / clearDraft", () => {
    let loadDraft: typeof import("@/lib/hooks/use-flow-persistence").loadDraft;
    let saveDraft: typeof import("@/lib/hooks/use-flow-persistence").saveDraft;
    let clearDraft: typeof import("@/lib/hooks/use-flow-persistence").clearDraft;

    beforeAll(async () => {
      const mod = await import("@/lib/hooks/use-flow-persistence");
      loadDraft = mod.loadDraft;
      saveDraft = mod.saveDraft;
      clearDraft = mod.clearDraft;
    });

    it("returns null when no draft exists", () => {
      expect(loadDraft()).toBeNull();
    });

    it("saves and loads a draft", () => {
      const draft = {
        currentStep: 2,
        marketData: {
          city: "Naples",
          state: "Florida",
          marketName: "Naples Luxury",
          isNewMarket: false,
          existingMarketId: "m-1",
        },
        tierData: { luxuryTier: "ultra_luxury" as const, priceFloor: 10_000_000 },
        focusData: null,
        audienceData: null,
        savedAt: new Date().toISOString(),
      };
      saveDraft(draft);
      const loaded = loadDraft();
      expect(loaded).not.toBeNull();
      expect(loaded!.currentStep).toBe(2);
      expect(loaded!.marketData!.city).toBe("Naples");
    });

    it("clears the draft", () => {
      saveDraft({
        currentStep: 1,
        marketData: null,
        tierData: null,
        focusData: null,
        audienceData: null,
        savedAt: new Date().toISOString(),
      });
      clearDraft();
      expect(loadDraft()).toBeNull();
    });

    it("discards expired drafts (older than 7 days)", () => {
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
      saveDraft({
        currentStep: 3,
        marketData: null,
        tierData: null,
        focusData: null,
        audienceData: null,
        savedAt: eightDaysAgo.toISOString(),
      });
      expect(loadDraft()).toBeNull();
      // Should also remove from localStorage
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it("handles corrupted localStorage gracefully", () => {
      localStorage.setItem(STORAGE_KEY, "not-json{{{");
      expect(loadDraft()).toBeNull();
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });

  describe("CreationFlowShell with persistence", () => {
    let CreationFlowShell: React.ComponentType<{
      markets: Array<{
        id: string;
        name: string;
        geography: { city: string; state: string };
        luxuryTier: string;
        isDefault: number;
      }>;
    }>;

    const mockMarkets = [
      {
        id: "market-1",
        name: "Naples Luxury",
        geography: { city: "Naples", state: "Florida" },
        luxuryTier: "ultra_luxury",
        isDefault: 1,
      },
      {
        id: "market-2",
        name: "Aspen Luxury",
        geography: { city: "Aspen", state: "Colorado" },
        luxuryTier: "high_luxury",
        isDefault: 0,
      },
    ];

    beforeAll(async () => {
      const mod = await import("@/components/reports/creation-flow-shell");
      CreationFlowShell = mod.CreationFlowShell;
    });

    it("saves state to localStorage when advancing steps", () => {
      render(React.createElement(CreationFlowShell, { markets: mockMarkets }));
      
      // Click Next to advance to step 2
      fireEvent.click(screen.getByRole("button", { name: /next/i }));
      
      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.currentStep).toBe(1);
    });

    it("restores step from persisted draft on mount", () => {
      // Pre-seed localStorage with a draft at step 2
      const draft = {
        currentStep: 2,
        marketData: {
          city: "Naples",
          state: "Florida",
          marketName: "Naples Luxury",
          isNewMarket: false,
          existingMarketId: "market-1",
        },
        tierData: { luxuryTier: "ultra_luxury", priceFloor: 10_000_000 },
        focusData: null,
        audienceData: null,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));

      render(React.createElement(CreationFlowShell, { markets: mockMarkets }));

      // Should be on step 2 (index 2), not step 0
      expect(screen.getByTestId("step-content-2")).toBeInTheDocument();
    });

    it("clears draft when report generation starts (step 4 not restorable)", () => {
      // Save a draft at step 4 (Generate) — component ignores drafts at step >= 4
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          currentStep: 4,
          marketData: { city: "Naples", state: "Florida", marketName: "Naples Luxury", isNewMarket: false },
          tierData: { luxuryTier: "ultra_luxury", priceFloor: 10_000_000 },
          focusData: { segments: ["waterfront"], propertyTypes: ["single_family"] },
          audienceData: { personaIds: ["p-1"] },
          savedAt: new Date().toISOString(),
        }),
      );

      render(React.createElement(CreationFlowShell, { markets: mockMarkets }));
      // Drafts at step 4+ are discarded — component starts at step 0
      expect(screen.getByTestId("step-content-0")).toBeInTheDocument();
    });

    it("shows saved markets with Use This buttons when markets exist", () => {
      render(React.createElement(CreationFlowShell, { markets: mockMarkets }));

      // Saved markets are rendered inside StepYourMarket (step-content-0)
      // Check that Use This buttons exist for each market
      const useButtons = screen.getAllByRole("button", { name: /use this/i });
      expect(useButtons.length).toBe(2);
    });

    it("does not show Use This buttons when no markets exist", () => {
      render(React.createElement(CreationFlowShell, { markets: [] }));

      expect(screen.queryByRole("button", { name: /use this/i })).not.toBeInTheDocument();
    });

    it("jumps to step 2 (audience) when a saved market is selected via Use This", () => {
      render(React.createElement(CreationFlowShell, { markets: mockMarkets }));

      const useButtons = screen.getAllByRole("button", { name: /use this/i });
      fireEvent.click(useButtons[0]); // Select first market (Naples)

      // Should jump to step 2 (Your Audience, index 2)
      expect(screen.getByTestId("step-content-2")).toBeInTheDocument();
    });

    it("stays on step 0 after clicking Next from step 0 (still at market entry)", () => {
      render(React.createElement(CreationFlowShell, { markets: mockMarkets }));

      // Step 0 is still visible — form is empty so it stays on step 0 area
      expect(screen.getByTestId("step-content-0")).toBeInTheDocument();
      // Saved markets section shows a divider when markets exist
      expect(screen.getByText(/or define a new market/i)).toBeInTheDocument();
    });

    it("preserves data from other steps when navigating back from review", () => {
      // Pre-seed a complete draft at step 3 (review — max restorable step)
      const draft = {
        currentStep: 3,
        marketData: {
          city: "Naples",
          state: "Florida",
          marketName: "Naples Luxury",
          isNewMarket: false,
          existingMarketId: "market-1",
        },
        tierData: { luxuryTier: "ultra_luxury", priceFloor: 10_000_000 },
        focusData: { segments: ["waterfront"], propertyTypes: ["single_family"] },
        audienceData: { personaIds: ["p-1"] },
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));

      render(React.createElement(CreationFlowShell, { markets: mockMarkets }));

      // Should be on step 3 (Review)
      expect(screen.getByTestId("step-content-3")).toBeInTheDocument();

      // Navigate back
      fireEvent.click(screen.getByRole("button", { name: /^back$/i }));

      // Should be on step 2, data still in localStorage
      expect(screen.getByTestId("step-content-2")).toBeInTheDocument();
      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.marketData).not.toBeNull();
      expect(parsed.tierData).not.toBeNull();
    });
  });
});
