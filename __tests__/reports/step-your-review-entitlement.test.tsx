/**
 * StepYourReview Entitlement UI Tests
 *
 * Tests for #174: Client-side entitlement gating in Step 5 (Review & Generate).
 * Covers:
 * - Usage indicator shown when quota remains
 * - No usage indicator for unlimited users
 * - Soft gate banner when cap is hit
 * - Last report warning
 * - Loading skeleton during entitlement check
 * - Fail-open when entitlement check fails
 * - Accessibility attributes
 *
 * Spec: .specs/features/subscription/entitlement-gating-report-creation.feature.md
 */

import "@testing-library/jest-dom";
import { render, screen, waitFor, act } from "@testing-library/react";
import React from "react";

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

  // Default: return ok with empty
  return { ok: true, json: async () => ({}), status: 200 } as Response;
}) as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockFetchShouldFail = false;
  mockFetchResponses = {
    "/api/entitlements/check": {
      ok: true,
      json: async () => ({ allowed: true, limit: 10, used: 6, remaining: 4 }),
      status: 200,
    },
    "/api/buyer-personas": {
      ok: true,
      json: async () => ({ personas: [] }),
      status: 200,
    },
  };
});

const defaultProps = {
  marketData: {
    city: "Naples",
    state: "FL",
    county: "",
    region: "",
    isNewMarket: false,
    existingMarketId: "market-1",
    marketName: "Naples FL",
  },
  tierData: {
    luxuryTier: "luxury" as const,
    priceFloor: 1000000,
    priceCeiling: undefined,
  },
  focusData: {
    segments: ["waterfront"],
    propertyTypes: ["single_family"],
  },
  audienceData: {
    personaIds: [],
  },
  onStepComplete: jest.fn(),
  onValidationChange: jest.fn(),
  onNavigateToStep: jest.fn(),
};

describe("StepYourReview — Entitlement UI (#174)", () => {
  let StepYourReview: React.ComponentType<typeof defaultProps>;

  beforeAll(async () => {
    const mod = await import(
      "@/components/reports/steps/step-your-review"
    );
    StepYourReview = mod.StepYourReview;
  });

  describe("Usage indicator", () => {
    it("CMP-EG-01: shows usage indicator when quota remains", async () => {
      mockFetchResponses["/api/entitlements/check"] = {
        ok: true,
        json: async () => ({ allowed: true, limit: 10, used: 6, remaining: 4 }),
        status: 200,
      };

      await act(async () => {
        render(<StepYourReview {...defaultProps} />);
      });

      await waitFor(() => {
        expect(screen.getByText(/6 of 10 reports used this month/i)).toBeInTheDocument();
      });
    });

    it("CMP-EG-02: no usage indicator for unlimited users", async () => {
      mockFetchResponses["/api/entitlements/check"] = {
        ok: true,
        json: async () => ({ allowed: true, limit: -1, used: 50, remaining: -1 }),
        status: 200,
      };

      await act(async () => {
        render(<StepYourReview {...defaultProps} />);
      });

      await waitFor(() => {
        // Generate button should be enabled
        const btn = screen.getByRole("button", { name: /generate report/i });
        expect(btn).not.toBeDisabled();
      });

      // No usage indicator text
      expect(screen.queryByText(/reports used this month/i)).not.toBeInTheDocument();
    });

    it("CMP-EG-03: shows last report warning when remaining is 1", async () => {
      mockFetchResponses["/api/entitlements/check"] = {
        ok: true,
        json: async () => ({ allowed: true, limit: 2, used: 1, remaining: 1 }),
        status: 200,
      };

      await act(async () => {
        render(<StepYourReview {...defaultProps} />);
      });

      await waitFor(() => {
        expect(screen.getByText(/1 of 2 reports used this month/i)).toBeInTheDocument();
        expect(screen.getByText(/last report this month/i)).toBeInTheDocument();
      });
    });
  });

  describe("Soft gate banner", () => {
    it("CMP-EG-04: shows soft gate banner when cap is hit", async () => {
      mockFetchResponses["/api/entitlements/check"] = {
        ok: true,
        json: async () => ({ allowed: false, limit: 2, used: 2, remaining: 0 }),
        status: 200,
      };

      await act(async () => {
        render(<StepYourReview {...defaultProps} />);
      });

      await waitFor(() => {
        expect(screen.getByText(/You've used 2 of 2 reports this month/i)).toBeInTheDocument();
        expect(screen.getByText(/View Plans/i)).toBeInTheDocument();
        expect(screen.getByText(/Maybe Later/i)).toBeInTheDocument();
      });
    });

    it("CMP-EG-05: Generate button is disabled when cap is hit", async () => {
      mockFetchResponses["/api/entitlements/check"] = {
        ok: true,
        json: async () => ({ allowed: false, limit: 2, used: 2, remaining: 0 }),
        status: 200,
      };

      await act(async () => {
        render(<StepYourReview {...defaultProps} />);
      });

      await waitFor(() => {
        const btn = screen.getByRole("button", { name: /generate report/i });
        expect(btn).toBeDisabled();
      });
    });

    it("CMP-EG-06: soft gate banner has role=alert for accessibility", async () => {
      mockFetchResponses["/api/entitlements/check"] = {
        ok: true,
        json: async () => ({ allowed: false, limit: 2, used: 2, remaining: 0 }),
        status: 200,
      };

      await act(async () => {
        render(<StepYourReview {...defaultProps} />);
      });

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });
    });
  });

  describe("Loading state", () => {
    it("CMP-EG-07: shows loading skeleton while entitlement check is in progress", async () => {
      // Make the fetch hang
      mockFetchResponses["/api/entitlements/check"] = {
        ok: true,
        json: () => new Promise(() => {}), // never resolves
        status: 200,
      };

      await act(async () => {
        render(<StepYourReview {...defaultProps} />);
      });

      // Should show loading state
      const loadingEl = screen.getByLabelText(/checking report availability/i);
      expect(loadingEl).toBeInTheDocument();
    });
  });

  describe("Fail-open", () => {
    it("CMP-EG-08: enables Generate button when entitlement check fails (fail-open)", async () => {
      mockFetchShouldFail = true;

      await act(async () => {
        render(<StepYourReview {...defaultProps} />);
      });

      await waitFor(() => {
        const btn = screen.getByRole("button", { name: /generate report/i });
        expect(btn).not.toBeDisabled();
      });

      // No usage indicator shown on failure
      expect(screen.queryByText(/reports used this month/i)).not.toBeInTheDocument();
    });
  });

  describe("Usage indicator accessibility", () => {
    it("CMP-EG-09: usage indicator has proper aria-label", async () => {
      mockFetchResponses["/api/entitlements/check"] = {
        ok: true,
        json: async () => ({ allowed: true, limit: 10, used: 6, remaining: 4 }),
        status: 200,
      };

      await act(async () => {
        render(<StepYourReview {...defaultProps} />);
      });

      await waitFor(() => {
        const indicator = screen.getByLabelText(/report usage/i);
        expect(indicator).toBeInTheDocument();
      });
    });
  });
});
