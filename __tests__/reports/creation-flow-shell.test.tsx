import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import fs from "fs";
import path from "path";

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

const STEP_NAMES = [
  "Your Market",
  "Your Tier",
  "Your Audience",
  "Review",
  "Generate",
];

describe("Unified Creation Flow Shell (#151)", () => {
  beforeEach(() => {
    localStorage.clear();
    // Mock fetch for entitlement check + persona endpoints used by step components
    global.fetch = jest.fn((url: string | URL | Request) => {
      const urlStr = typeof url === "string" ? url : url instanceof URL ? url.toString() : url.url;
      if (urlStr.includes("/api/entitlements/check")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ allowed: true, limit: 10, used: 3, remaining: 7 }) } as Response);
      }
      if (urlStr.includes("/api/buyer-personas")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ personas: [] }) } as Response);
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response);
    }) as jest.Mock;
  });

  describe("File structure", () => {
    it("has creation flow route page", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "app/(protected)/reports/create/page.tsx")
        )
      ).toBe(true);
    });

    it("has CreationFlowShell component", () => {
      expect(
        fs.existsSync(
          path.join(
            process.cwd(),
            "components/reports/creation-flow-shell.tsx"
          )
        )
      ).toBe(true);
    });

    it("has CreationStepIndicator component", () => {
      expect(
        fs.existsSync(
          path.join(
            process.cwd(),
            "components/reports/creation-step-indicator.tsx"
          )
        )
      ).toBe(true);
    });
  });

  describe("CreationStepIndicator", () => {
    let CreationStepIndicator: React.ComponentType<{
      steps: string[];
      currentStep: number;
    }>;

    beforeAll(async () => {
      const mod = await import(
        "@/components/reports/creation-step-indicator"
      );
      CreationStepIndicator = mod.CreationStepIndicator;
    });

    it("renders all 5 step names", () => {
      render(
        React.createElement(CreationStepIndicator, {
          steps: STEP_NAMES,
          currentStep: 0,
        })
      );

      for (const name of STEP_NAMES) {
        expect(screen.getByText(name)).toBeInTheDocument();
      }
    });

    it("highlights the current step with accent styling", () => {
      render(
        React.createElement(CreationStepIndicator, {
          steps: STEP_NAMES,
          currentStep: 2,
        })
      );

      const audienceStep = screen.getByText("Your Audience");
      expect(audienceStep.className).toContain("font-semibold");
    });

    it("shows checkmark on completed steps", () => {
      const { container } = render(
        React.createElement(CreationStepIndicator, {
          steps: STEP_NAMES,
          currentStep: 3,
        })
      );

      const checkmarks = container.querySelectorAll(
        '[data-testid="step-check"]'
      );
      expect(checkmarks.length).toBe(3);
    });

    it("dims future steps", () => {
      render(
        React.createElement(CreationStepIndicator, {
          steps: STEP_NAMES,
          currentStep: 1,
        })
      );

      const futureStep = screen.getByText("Your Audience");
      expect(futureStep.className).toContain("text-[var(--color-app-text-tertiary)]");
    });
  });

  describe("CreationFlowShell", () => {
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
    ];

    beforeAll(async () => {
      const mod = await import("@/components/reports/creation-flow-shell");
      CreationFlowShell = mod.CreationFlowShell;
    });

    it("renders the flow title", () => {
      render(
        React.createElement(CreationFlowShell, { markets: mockMarkets })
      );

      expect(
        screen.getByText("Create Your Intelligence Report")
      ).toBeInTheDocument();
    });

    it("shows all 5 step names in the indicator", () => {
      render(
        React.createElement(CreationFlowShell, { markets: mockMarkets })
      );

      for (const name of STEP_NAMES) {
        const matches = screen.getAllByText(name);
        expect(matches.length).toBeGreaterThanOrEqual(1);
      }
    });

    it("starts on step 1 with placeholder content", () => {
      render(
        React.createElement(CreationFlowShell, { markets: mockMarkets })
      );

      expect(screen.getByTestId("step-content-0")).toBeInTheDocument();
    });

    it("renders Next button on step 1", () => {
      render(
        React.createElement(CreationFlowShell, { markets: mockMarkets })
      );

      expect(
        screen.getByRole("button", { name: /next/i })
      ).toBeInTheDocument();
    });

    it("does not render Back button on step 1", () => {
      render(
        React.createElement(CreationFlowShell, { markets: mockMarkets })
      );

      expect(
        screen.queryByRole("button", { name: /^back$/i })
      ).not.toBeInTheDocument();
    });

    it("advances to step 2 when Next is clicked", () => {
      render(
        React.createElement(CreationFlowShell, { markets: mockMarkets })
      );

      fireEvent.click(screen.getByRole("button", { name: /next/i }));

      expect(screen.getByTestId("step-content-1")).toBeInTheDocument();
    });

    it("shows Back button on step 2", () => {
      render(
        React.createElement(CreationFlowShell, { markets: mockMarkets })
      );

      fireEvent.click(screen.getByRole("button", { name: /next/i }));

      expect(
        screen.getByRole("button", { name: /^back$/i })
      ).toBeInTheDocument();
    });

    it("goes back to step 1 when Back is clicked", () => {
      render(
        React.createElement(CreationFlowShell, { markets: mockMarkets })
      );

      fireEvent.click(screen.getByRole("button", { name: /next/i }));
      fireEvent.click(screen.getByRole("button", { name: /^back$/i }));

      expect(screen.getByTestId("step-content-0")).toBeInTheDocument();
    });

    it("navigates through steps 0-3, step 3 (Review) has Generate Report button", () => {
      render(
        React.createElement(CreationFlowShell, { markets: mockMarkets })
      );

      // Navigate through steps 0-2 using Next button
      for (let i = 0; i < 3; i++) {
        expect(screen.getByTestId(`step-content-${i}`)).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: /next/i }));
      }

      // Step 3 (Review) renders with its own Generate Report CTA
      expect(screen.getByTestId("step-content-3")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /generate report/i })
      ).toBeInTheDocument();
      // Shell's Next button is hidden on step 3
      expect(
        screen.queryByRole("button", { name: /^next$/i })
      ).not.toBeInTheDocument();
    });

    it("shows Generate Report button on step 3 (Review) instead of Next", () => {
      render(
        React.createElement(CreationFlowShell, { markets: mockMarkets })
      );

      for (let i = 0; i < 3; i++) {
        fireEvent.click(screen.getByRole("button", { name: /next/i }));
      }

      expect(
        screen.getByRole("button", { name: /generate report/i })
      ).toBeInTheDocument();
    });

    it("still shows Back button on step 3", () => {
      render(
        React.createElement(CreationFlowShell, { markets: mockMarkets })
      );

      for (let i = 0; i < 3; i++) {
        fireEvent.click(screen.getByRole("button", { name: /next/i }));
      }

      expect(
        screen.getByRole("button", { name: /^back$/i })
      ).toBeInTheDocument();
    });

    it("step 0 shows StepYourMarket content, step 1 shows StepYourTier content", () => {
      render(
        React.createElement(CreationFlowShell, { markets: mockMarkets })
      );

      // Step 0 now renders the real StepYourMarket component
      const step1 = screen.getByTestId("step-content-0");
      expect(step1.textContent).toContain("Where do you operate?");

      fireEvent.click(screen.getByRole("button", { name: /next/i }));
      const step2 = screen.getByTestId("step-content-1");
      expect(step2.textContent).toContain("Which tier defines your clientele?");
    });
  });
});
