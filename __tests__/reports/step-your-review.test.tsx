import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import React from "react";
import fs from "fs";
import path from "path";

// Mock framer-motion
jest.mock("framer-motion", () => {
  const React = require("react");
  return {
    motion: {
      div: React.forwardRef(({ initial, animate, exit, variants, whileTap, ...props }: Record<string, unknown>, ref: React.Ref<HTMLDivElement>) => React.createElement("div", { ...props, ref })),
      button: React.forwardRef(({ initial, animate, exit, variants, whileTap, ...props }: Record<string, unknown>, ref: React.Ref<HTMLButtonElement>) => React.createElement("button", { ...props, ref })),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
  };
});

// Mock next/navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// --- Test data ---

const MOCK_MARKET_DATA = {
  city: "Naples",
  state: "FL",
  marketName: "Naples FL Luxury",
  isNewMarket: false,
  existingMarketId: "market-123",
};

const MOCK_NEW_MARKET_DATA = {
  city: "Miami",
  state: "FL",
  marketName: "Miami FL Ultra Luxury",
  isNewMarket: true,
  county: "Miami-Dade",
};

const MOCK_TIER_DATA = {
  luxuryTier: "luxury" as const,
  priceFloor: 1000000,
  priceCeiling: 6000000,
};

const MOCK_FOCUS_DATA = {
  segments: ["waterfront", "golf course"],
  propertyTypes: ["single_family", "estate"],
};

const MOCK_AUDIENCE_DATA = {
  personaIds: ["p1", "p2"],
};

const MOCK_EMPTY_AUDIENCE = {
  personaIds: [] as string[],
};

const MOCK_PERSONAS = [
  { id: "p1", slug: "the-business-mogul", name: "The Business Mogul", tagline: "Real estate as a strategic asset class", primaryMotivation: "Status + Asset Strategy", profileOverview: "Analytical", whatWinsThem: "Data", biggestFear: "Overpaying", displayOrder: 1 },
  { id: "p2", slug: "the-legacy-builder", name: "The Legacy Builder", tagline: "Creating a lasting family legacy", primaryMotivation: "Meaning + Legacy", profileOverview: "Family-oriented", whatWinsThem: "Story", biggestFear: "Loss", displayOrder: 2 },
  { id: "p3", slug: "the-coastal-escape-seeker", name: "The Coastal Escape Seeker", tagline: "Waterfront retreat", primaryMotivation: "Lifestyle", profileOverview: "Lifestyle", whatWinsThem: "Views", biggestFear: "Insurance", displayOrder: 3 },
];

function mockFetchSuccess() {
  global.fetch = jest.fn((url: string | URL | Request, opts?: RequestInit) => {
    const urlStr = typeof url === "string" ? url : url.toString();

    if (urlStr.includes("/api/buyer-personas") && (!opts || opts.method !== "POST")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ personas: MOCK_PERSONAS }) } as Response);
    }

    if (urlStr.includes("/api/markets") && opts?.method === "POST") {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ market: { id: "new-market-456" } }) } as Response);
    }

    if (urlStr.includes("/api/reports") && opts?.method === "POST") {
      return Promise.resolve({ ok: true, status: 201, json: () => Promise.resolve({ report: { id: "report-789" } }) } as Response);
    }

    return Promise.resolve({ ok: false, json: () => Promise.resolve({ error: "Not found" }) } as Response);
  }) as jest.Mock;
}

function mockFetchReportError() {
  global.fetch = jest.fn((url: string | URL | Request, opts?: RequestInit) => {
    const urlStr = typeof url === "string" ? url : url.toString();

    if (urlStr.includes("/api/buyer-personas")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ personas: MOCK_PERSONAS }) } as Response);
    }

    if (urlStr.includes("/api/reports") && opts?.method === "POST") {
      return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({ error: "Internal server error" }) } as Response);
    }

    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response);
  }) as jest.Mock;
}

describe("Step 5: Review & Generate (#156)", () => {
  describe("File structure", () => {
    it("CMP-156-01: has StepYourReview component", () => {
      expect(fs.existsSync(path.join(process.cwd(), "components/reports/steps/step-your-review.tsx"))).toBe(true);
    });

    it("CMP-156-02: has spec file", () => {
      expect(fs.existsSync(path.join(process.cwd(), ".specs/features/ux-redesign/step-5-review-and-generate.feature.md"))).toBe(true);
    });
  });

  describe("StepYourReview", () => {
    let StepYourReview: React.ComponentType<{
      marketData: typeof MOCK_MARKET_DATA | null;
      tierData: typeof MOCK_TIER_DATA | null;
      focusData: typeof MOCK_FOCUS_DATA | null;
      audienceData: typeof MOCK_AUDIENCE_DATA | null;
      onStepComplete: (data: { reportId: string; title: string }) => void;
      onValidationChange?: (valid: boolean) => void;
      onNavigateToStep: (stepIndex: number) => void;
    }>;

    beforeAll(async () => {
      const mod = await import("@/components/reports/steps/step-your-review");
      StepYourReview = mod.StepYourReview;
    });

    afterEach(() => {
      jest.restoreAllMocks();
      mockPush.mockClear();
    });

    function renderReview(overrides: Record<string, unknown> = {}) {
      mockFetchSuccess();
      const defaultProps = {
        marketData: MOCK_MARKET_DATA,
        tierData: MOCK_TIER_DATA,
        focusData: MOCK_FOCUS_DATA,
        audienceData: MOCK_AUDIENCE_DATA,
        onStepComplete: jest.fn(),
        onValidationChange: jest.fn(),
        onNavigateToStep: jest.fn(),
      };
      const props = { ...defaultProps, ...overrides };
      return { ...render(React.createElement(StepYourReview, props as any)), props };
    }

    it("CMP-156-03: renders heading", async () => {
      renderReview();
      expect(screen.getByText("Review Your Report")).toBeInTheDocument();
    });

    it("CMP-156-04: renders helper text", async () => {
      renderReview();
      expect(screen.getByText(/Everything look right/)).toBeInTheDocument();
    });

    it("CMP-156-05: renders accent divider", async () => {
      renderReview();
      expect(document.querySelector(".bg-\\[var\\(--color-accent\\)\\]")).toBeInTheDocument();
    });

    it("CMP-156-06: shows Your Market section with city, state", async () => {
      renderReview();
      expect(screen.getByText("Your Market")).toBeInTheDocument();
      expect(screen.getByText(/Naples/)).toBeInTheDocument();
    });

    it("CMP-156-07: shows Your Tier section with label and price range", async () => {
      renderReview();
      expect(screen.getByText("Your Tier")).toBeInTheDocument();
      expect(screen.getByText(/Luxury/)).toBeInTheDocument();
      expect(screen.getByText(/\$1,000,000/)).toBeInTheDocument();
    });

    it("CMP-156-08: shows Your Focus section with segment and property type tags", async () => {
      renderReview();
      expect(screen.getByText("Your Focus")).toBeInTheDocument();
      expect(screen.getByText("Waterfront")).toBeInTheDocument();
      expect(screen.getByText("Golf Course")).toBeInTheDocument();
      expect(screen.getByText("Single Family")).toBeInTheDocument();
      expect(screen.getByText("Estate")).toBeInTheDocument();
    });

    it("CMP-156-09: shows Your Audience section with persona names", async () => {
      await act(async () => { renderReview(); });
      await waitFor(() => {
        expect(screen.getByText("Your Audience")).toBeInTheDocument();
      });
      await waitFor(() => {
        expect(screen.getByText("The Business Mogul")).toBeInTheDocument();
        expect(screen.getByText("The Legacy Builder")).toBeInTheDocument();
      });
    });

    it("CMP-156-10: shows fallback when no personas selected", async () => {
      await act(async () => { renderReview({ audienceData: MOCK_EMPTY_AUDIENCE }); });
      await waitFor(() => {
        expect(screen.getByText(/No buyer personas selected/)).toBeInTheDocument();
      });
    });

    it("CMP-156-11: Edit links navigate back to steps", async () => {
      const { props } = renderReview();
      const editButtons = screen.getAllByText("Edit");
      expect(editButtons.length).toBeGreaterThanOrEqual(4);
      fireEvent.click(editButtons[0]);
      expect(props.onNavigateToStep).toHaveBeenCalledWith(0);
      fireEvent.click(editButtons[1]);
      expect(props.onNavigateToStep).toHaveBeenCalledWith(1);
      fireEvent.click(editButtons[2]);
      expect(props.onNavigateToStep).toHaveBeenCalledWith(2);
      fireEvent.click(editButtons[3]);
      expect(props.onNavigateToStep).toHaveBeenCalledWith(3);
    });

    it("CMP-156-12: auto-generates title from market and tier", async () => {
      renderReview();
      const titleInput = screen.getByLabelText("Report title") as HTMLInputElement;
      expect(titleInput.value).toBe("Naples Luxury Market Intelligence Report");
    });

    it("CMP-156-13: title is editable", async () => {
      renderReview();
      const titleInput = screen.getByLabelText("Report title") as HTMLInputElement;
      fireEvent.change(titleInput, { target: { value: "Custom Title" } });
      expect(titleInput.value).toBe("Custom Title");
    });

    it("CMP-156-14: shows character count", async () => {
      renderReview();
      expect(screen.getByText(/\/ 500/)).toBeInTheDocument();
    });

    it("CMP-156-15: shows estimated generation time", async () => {
      renderReview();
      expect(screen.getByText(/Estimated generation time: 2-4 minutes/)).toBeInTheDocument();
    });

    it("CMP-156-16: shows Generate Report button", async () => {
      renderReview();
      expect(screen.getByRole("button", { name: /Generate Report/i })).toBeInTheDocument();
    });

    it("CMP-156-17: Generate button disabled when title empty", async () => {
      renderReview();
      const titleInput = screen.getByLabelText("Report title");
      fireEvent.change(titleInput, { target: { value: "" } });
      const btn = screen.getByRole("button", { name: /Generate Report/i });
      expect(btn).toBeDisabled();
    });

    it("CMP-156-18: shows validation message when title empty", async () => {
      renderReview();
      const titleInput = screen.getByLabelText("Report title");
      fireEvent.change(titleInput, { target: { value: "" } });
      expect(screen.getByText("Report title is required")).toBeInTheDocument();
    });

    it("CMP-156-19: clicking Generate creates report and navigates", async () => {
      renderReview();
      const btn = screen.getByRole("button", { name: /Generate Report/i });
      await act(async () => { fireEvent.click(btn); });
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/reports/report-789");
      });
    });

    it("CMP-156-20: new market created before report for isNewMarket", async () => {
      mockFetchSuccess();
      renderReview({ marketData: MOCK_NEW_MARKET_DATA });
      const btn = screen.getByRole("button", { name: /Generate Report/i });
      await act(async () => { fireEvent.click(btn); });
      await waitFor(() => {
        const calls = (global.fetch as jest.Mock).mock.calls;
        const marketCall = calls.find((c: unknown[]) => {
          const url = typeof c[0] === "string" ? c[0] : "";
          const opts = c[1] as RequestInit | undefined;
          return url.includes("/api/markets") && opts?.method === "POST";
        });
        expect(marketCall).toBeTruthy();
      });
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/reports/report-789");
      });
    });

    it("CMP-156-21: shows error on API failure", async () => {
      renderReview();
      // Override fetch after render so persona load uses success mock but report POST fails
      mockFetchReportError();
      const btn = screen.getByRole("button", { name: /Generate Report/i });
      await act(async () => { fireEvent.click(btn); });
      await waitFor(() => {
        expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
      });
      expect(btn).not.toBeDisabled();
    });

    it("CMP-156-22: calls onValidationChange(true) on mount", async () => {
      const { props } = renderReview();
      expect(props.onValidationChange).toHaveBeenCalledWith(true);
    });

    it("CMP-156-23: shows loading state on generate click", async () => {
      global.fetch = jest.fn((url: string | URL | Request, opts?: RequestInit) => {
        const urlStr = typeof url === "string" ? url : url.toString();
        if (urlStr.includes("/api/buyer-personas")) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({ personas: MOCK_PERSONAS }) } as Response);
        }
        if (urlStr.includes("/api/reports") && opts?.method === "POST") {
          return new Promise((resolve) => setTimeout(() => resolve({ ok: true, status: 201, json: () => Promise.resolve({ report: { id: "r-1" } }) } as Response), 100));
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response);
      }) as jest.Mock;

      renderReview();
      const btn = screen.getByRole("button", { name: /Generate Report/i });
      await act(async () => { fireEvent.click(btn); });
      expect(screen.getByText(/Generating/)).toBeInTheDocument();
    });
  });
});
