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
  "Your Focus",
  "Your Audience",
  "Review",
  "Generate",
];

describe("Unified Creation Flow Shell (#151)", () => {
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

    it("renders all 6 step names", () => {
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

      const focusStep = screen.getByText("Your Focus");
      expect(focusStep.className).toContain("font-semibold");
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

      const futureStep = screen.getByText("Your Focus");
      expect(futureStep.className).toContain("text-[var(--color-text-tertiary)]");
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

    it("shows all 6 step names in the indicator", () => {
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

    it("navigates through all 6 steps", () => {
      render(
        React.createElement(CreationFlowShell, { markets: mockMarkets })
      );

      for (let i = 0; i < 5; i++) {
        expect(screen.getByTestId(`step-content-${i}`)).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: /next/i }));
      }

      expect(screen.getByTestId("step-content-5")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /generate report/i })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /^next$/i })
      ).not.toBeInTheDocument();
    });

    it("shows Generate Report button on last step instead of Next", () => {
      render(
        React.createElement(CreationFlowShell, { markets: mockMarkets })
      );

      for (let i = 0; i < 5; i++) {
        fireEvent.click(screen.getByRole("button", { name: /next/i }));
      }

      expect(
        screen.getByRole("button", { name: /generate report/i })
      ).toBeInTheDocument();
    });

    it("still shows Back button on last step", () => {
      render(
        React.createElement(CreationFlowShell, { markets: mockMarkets })
      );

      for (let i = 0; i < 5; i++) {
        fireEvent.click(screen.getByRole("button", { name: /next/i }));
      }

      expect(
        screen.getByRole("button", { name: /^back$/i })
      ).toBeInTheDocument();
    });

    it("each step placeholder shows the step name", () => {
      render(
        React.createElement(CreationFlowShell, { markets: mockMarkets })
      );

      const step1 = screen.getByTestId("step-content-0");
      expect(step1.textContent).toContain("Your Market");

      fireEvent.click(screen.getByRole("button", { name: /next/i }));
      const step2 = screen.getByTestId("step-content-1");
      expect(step2.textContent).toContain("Your Tier");
    });
  });
});
