/**
 * MarketCreationShell Entitlement UI Tests
 *
 * Tests for #175: Client-side entitlement gating in the last step of market creation.
 * Covers:
 * - Usage indicator shown when quota remains
 * - No usage indicator for unlimited users
 * - Soft gate banner when cap is hit
 * - Last market warning
 * - Loading skeleton during entitlement check
 * - Fail-open when entitlement check fails
 * - Edit mode bypasses entitlement check
 * - Accessibility attributes
 *
 * Spec: .specs/features/subscription/entitlement-gating-market-creation.feature.md
 */

import "@testing-library/jest-dom";
import { render, screen, waitFor, act } from "@testing-library/react";
import React from "react";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

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
    }: {
      children: React.ReactNode;
    }) => React.createElement(React.Fragment, null, children),
  };
});

// Mock animations
jest.mock("@/lib/animations", () => ({
  pageTransition: () => ({
    initial: {},
    animate: {},
    exit: {},
  }),
  fadeVariant: {},
  staggerContainer: {},
}));

// Mock step components to avoid deep rendering
jest.mock("@/components/reports/steps/step-your-market", () => ({
  StepYourMarket: ({ onValidationChange }: any) => {
    React.useEffect(() => { onValidationChange?.(true); }, [onValidationChange]);
    return React.createElement("div", { "data-testid": "step-your-market" }, "Step Your Market");
  },
}));

jest.mock("@/components/reports/steps/step-your-tier", () => ({
  StepYourTier: ({ onValidationChange }: any) => {
    React.useEffect(() => { onValidationChange?.(true); }, [onValidationChange]);
    return React.createElement("div", { "data-testid": "step-your-tier" }, "Step Your Tier");
  },
}));

jest.mock("@/components/reports/creation-step-indicator", () => ({
  CreationStepIndicator: () => React.createElement("div", { "data-testid": "step-indicator" }),
}));

// Mock fetch globally
let mockFetchResponses: Record<string, { ok: boolean; json: () => Promise<unknown>; status: number }> = {};
let mockFetchShouldFail = false;

global.fetch = jest.fn(async (url: string | URL | Request) => {
  const urlStr = typeof url === "string" ? url : url instanceof URL ? url.toString() : url.url;

  if (mockFetchShouldFail && urlStr.includes("/api/entitlements/check")) {
    throw new Error("Network error");
  }

  for (const [pattern, response] of Object.entries(mockFetchResponses)) {
    if (urlStr.includes(pattern)) {
      return response as Response;
    }
  }

  return { ok: true, json: async () => ({}), status: 200 } as Response;
}) as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockFetchShouldFail = false;
  mockFetchResponses = {
    "/api/entitlements/check": {
      ok: true,
      json: async () => ({ allowed: true, limit: 3, used: 1, remaining: 2 }),
      status: 200,
    },
  };
});

describe("MarketCreationShell — Entitlement UI (#175)", () => {
  let MarketCreationShell: React.ComponentType<any>;

  beforeAll(async () => {
    const mod = await import("@/components/markets/market-creation-shell");
    MarketCreationShell = mod.MarketCreationShell;
  });

  // Helper: navigate to last step (step 2 — Your Tier)
  const navigateToLastStep = async () => {
    const { container } = render(<MarketCreationShell mode="create" />);
    // Click Next once to get to last step (Your Tier)
    const nextButtons = screen.getAllByRole("button", { name: /next/i });
    await act(async () => { nextButtons[0].click(); });
    return container;
  };

  describe("Usage indicator", () => {
    it("CMP-MG-01: shows usage indicator when quota remains on last step", async () => {
      mockFetchResponses["/api/entitlements/check"] = {
        ok: true,
        json: async () => ({ allowed: true, limit: 3, used: 1, remaining: 2 }),
        status: 200,
      };

      await navigateToLastStep();

      await waitFor(() => {
        expect(screen.getByText(/1 of 3 markets defined/i)).toBeInTheDocument();
      });
    });

    it("CMP-MG-02: no usage indicator for unlimited users", async () => {
      mockFetchResponses["/api/entitlements/check"] = {
        ok: true,
        json: async () => ({ allowed: true, limit: -1, used: 50, remaining: -1 }),
        status: 200,
      };

      await navigateToLastStep();

      await waitFor(() => {
        const saveBtn = screen.getByRole("button", { name: /save market/i });
        expect(saveBtn).not.toBeDisabled();
      });

      expect(screen.queryByText(/markets defined/i)).not.toBeInTheDocument();
    });

    it("CMP-MG-03: shows last market warning when remaining is 1", async () => {
      mockFetchResponses["/api/entitlements/check"] = {
        ok: true,
        json: async () => ({ allowed: true, limit: 3, used: 2, remaining: 1 }),
        status: 200,
      };

      await navigateToLastStep();

      await waitFor(() => {
        expect(screen.getByText(/2 of 3 markets defined/i)).toBeInTheDocument();
        expect(screen.getByText(/last available market/i)).toBeInTheDocument();
      });
    });
  });

  describe("Soft gate banner", () => {
    it("CMP-MG-04: shows soft gate banner when cap is hit", async () => {
      mockFetchResponses["/api/entitlements/check"] = {
        ok: true,
        json: async () => ({ allowed: false, limit: 1, used: 1, remaining: 0 }),
        status: 200,
      };

      await navigateToLastStep();

      await waitFor(() => {
        expect(screen.getByText(/You've Reached Your Market Limit/i)).toBeInTheDocument();
        expect(screen.getByText(/View Plans/i)).toBeInTheDocument();
        expect(screen.getByText(/Maybe Later/i)).toBeInTheDocument();
      });
    });

    it("CMP-MG-05: Save Market button is disabled when cap is hit", async () => {
      mockFetchResponses["/api/entitlements/check"] = {
        ok: true,
        json: async () => ({ allowed: false, limit: 1, used: 1, remaining: 0 }),
        status: 200,
      };

      await navigateToLastStep();

      await waitFor(() => {
        const btn = screen.getByRole("button", { name: /save market/i });
        expect(btn).toBeDisabled();
      });
    });

    it("CMP-MG-06: soft gate banner has role=alert for accessibility", async () => {
      mockFetchResponses["/api/entitlements/check"] = {
        ok: true,
        json: async () => ({ allowed: false, limit: 1, used: 1, remaining: 0 }),
        status: 200,
      };

      await navigateToLastStep();

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });
    });
  });

  describe("Loading state", () => {
    it("CMP-MG-07: shows loading skeleton while entitlement check is in progress", async () => {
      mockFetchResponses["/api/entitlements/check"] = {
        ok: true,
        json: () => new Promise(() => {}), // never resolves
        status: 200,
      };

      await navigateToLastStep();

      const loadingEl = screen.getByLabelText(/checking market availability/i);
      expect(loadingEl).toBeInTheDocument();
    });
  });

  describe("Fail-open", () => {
    it("CMP-MG-08: enables Save Market button when entitlement check fails (fail-open)", async () => {
      mockFetchShouldFail = true;

      await navigateToLastStep();

      await waitFor(() => {
        const btn = screen.getByRole("button", { name: /save market/i });
        expect(btn).not.toBeDisabled();
      });

      expect(screen.queryByText(/markets defined/i)).not.toBeInTheDocument();
    });
  });

  describe("Edit mode", () => {
    it("CMP-MG-09: edit mode does not fetch entitlement check", async () => {
      const fetchSpy = global.fetch as jest.Mock;

      await act(async () => {
        render(
          <MarketCreationShell
            mode="edit"
            marketId="market-1"
            initialData={{
              name: "Naples FL",
              geography: { city: "Naples", state: "FL" },
              luxuryTier: "luxury" as const,
              priceFloor: 1000000,
              priceCeiling: null,
            }}
          />
        );
      });

      // Navigate to last step
      await act(async () => {
        const nextBtn = screen.getByRole("button", { name: /next/i });
        nextBtn.click();
      });

      // Wait a tick for any potential fetch to fire
      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      // Should NOT have called entitlements check
      const entitlementCalls = fetchSpy.mock.calls.filter(
        (call: any[]) => String(call[0]).includes("/api/entitlements/check")
      );
      expect(entitlementCalls).toHaveLength(0);

      // Save Changes button should be enabled
      const saveBtn = screen.getByRole("button", { name: /save changes/i });
      expect(saveBtn).not.toBeDisabled();
    });
  });

  describe("Usage indicator accessibility", () => {
    it("CMP-MG-10: usage indicator has proper aria-label", async () => {
      mockFetchResponses["/api/entitlements/check"] = {
        ok: true,
        json: async () => ({ allowed: true, limit: 3, used: 1, remaining: 2 }),
        status: 200,
      };

      await navigateToLastStep();

      await waitFor(() => {
        const indicator = screen.getByLabelText(/market usage/i);
        expect(indicator).toBeInTheDocument();
      });
    });
  });
});
